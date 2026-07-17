const { getDb } = require('../db/connection');

const DELIVERY_TYPES = ['Retiro Providencia', 'Retiro Vitacura', 'Despacho a Domicilio RM'];
const DISPATCH_FEE = 3990;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class OrderError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Valida un RUT chileno (formato + dígito verificador módulo 11). */
function isValidRut(rutRaw) {
  const rut = String(rutRaw || '').replace(/\./g, '').replace(/-/g, '').toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(rut)) return false;

  const body = rut.slice(0, -1);
  const dv = rut.slice(-1);
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  const expectedDv = remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder);
  return dv === expectedDv;
}

const DOCUMENT_TYPES = ['boleta', 'factura'];

function validateOrderPayload(body) {
  const errors = [];
  const customer = body.customer || {};

  if (!customer.name || !customer.name.trim()) errors.push('El nombre es obligatorio.');
  if (!isValidRut(customer.rut)) errors.push('El RUT no tiene un formato válido (ej: 12345678-9).');
  if (!customer.email || !EMAIL_REGEX.test(customer.email.trim())) errors.push('El email no es válido.');
  if (!customer.phone || !customer.phone.trim()) errors.push('El teléfono es obligatorio.');
  if (!DELIVERY_TYPES.includes(body.delivery_type)) errors.push('El tipo de entrega no es válido.');

  // billing es opcional: sin él, la orden se emite como boleta.
  const billing = body.billing || { document_type: 'boleta' };
  if (!DOCUMENT_TYPES.includes(billing.document_type)) {
    errors.push('El tipo de documento debe ser "boleta" o "factura".');
  } else if (billing.document_type === 'factura') {
    if (!isValidRut(billing.rut)) errors.push('El RUT de facturación no es válido (ej: 76543210-K).');
    if (!billing.razon_social || !billing.razon_social.trim()) errors.push('La razón social es obligatoria para factura.');
    if (!billing.giro || !billing.giro.trim()) errors.push('El giro comercial es obligatorio para factura.');
    if (!billing.address || !billing.address.trim()) errors.push('La dirección de facturación es obligatoria para factura.');
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push('El carrito está vacío.');
  } else {
    const hasInvalidItem = body.items.some(
      (item) => !Number.isInteger(item.product_id) || !Number.isInteger(item.quantity) || item.quantity <= 0
    );
    if (hasInvalidItem) errors.push('Uno de los productos del carrito tiene datos inválidos.');
  }

  return errors;
}

/**
 * Determina de qué sucursal se descuenta el stock según el tipo de entrega.
 * Retiro: siempre de la sucursal elegida. Despacho: regla básica, se despacha
 * desde la sucursal con más stock disponible de ese producto.
 */
function pickBranch(deliveryType, stockByBranch) {
  if (deliveryType === 'Retiro Providencia') return 'Providencia';
  if (deliveryType === 'Retiro Vitacura') return 'Vitacura';

  const providencia = stockByBranch.Providencia ?? 0;
  const vitacura = stockByBranch.Vitacura ?? 0;
  return providencia >= vitacura ? 'Providencia' : 'Vitacura';
}

// La conexión SQLite es una única conexión compartida por todo el proceso.
// Si dos checkouts llegan al mismo tiempo, sus BEGIN/COMMIT pueden intercalarse
// sobre esa misma conexión ("cannot start a transaction within a transaction").
// Esta cola serializa las transacciones de escritura para que corran una a la vez;
// el UPDATE condicional de más abajo sigue siendo la garantía real anti-sobreventa.
let writeQueue = Promise.resolve();

function runExclusive(task) {
  const run = writeQueue.then(task);
  writeQueue = run.catch(() => {});
  return run;
}

/**
 * Ejecuta la transacción de creación de orden: valida stock y lo descuenta con
 * un UPDATE condicional (stock >= cantidad) para evitar sobreventa si dos
 * checkouts concurrentes compiten por las mismas unidades; si el UPDATE no
 * afecta filas, se aborta toda la transacción con 409.
 */
async function placeOrder({ customer, deliveryType, items, billing }) {
  const db = await getDb();

  try {
    await db.exec('BEGIN IMMEDIATE TRANSACTION');

    const branches = await db.all('SELECT id, name FROM branches');
    const branchIdByName = Object.fromEntries(branches.map((b) => [b.name, b.id]));

    const resolvedItems = [];
    let itemsTotal = 0;

    for (const item of items) {
      const product = await db.get('SELECT id, name, price FROM products WHERE id = ?', item.product_id);
      if (!product) {
        throw new OrderError(400, `El producto con id ${item.product_id} ya no existe en el catálogo.`);
      }

      const stockRows = await db.all(
        `SELECT b.name AS branch, i.stock
         FROM inventory i
         JOIN branches b ON b.id = i.branch_id
         WHERE i.product_id = ?`,
        product.id
      );
      const stockByBranch = Object.fromEntries(stockRows.map((row) => [row.branch, row.stock]));

      const branch = pickBranch(deliveryType, stockByBranch);
      const branchId = branchIdByName[branch];

      // UPDATE condicional: solo descuenta si aún queda stock suficiente en ESE
      // instante. Si otra orden ya se lo llevó, "changes" será 0.
      const updateResult = await db.run(
        `UPDATE inventory
         SET stock = stock - ?, updated_at = datetime('now')
         WHERE product_id = ? AND branch_id = ? AND stock >= ?`,
        item.quantity,
        product.id,
        branchId,
        item.quantity
      );

      if (updateResult.changes === 0) {
        const available = stockByBranch[branch] ?? 0;
        throw new OrderError(
          409,
          `Sin stock suficiente de "${product.name}" en ${branch} (disponible: ${available}, solicitado: ${item.quantity}). ` +
            'Es posible que otro cliente lo haya comprado recién; revisa tu carrito e intenta nuevamente.'
        );
      }

      resolvedItems.push({
        product_id: product.id,
        quantity: item.quantity,
        price: product.price,
        branch_deducted: branch,
      });
      itemsTotal += product.price * item.quantity;
    }

    const dispatchFee = deliveryType === 'Despacho a Domicilio RM' ? DISPATCH_FEE : 0;
    const totalAmount = itemsTotal + dispatchFee;

    const isFactura = billing.document_type === 'factura';
    const orderResult = await db.run(
      `INSERT INTO orders (
         customer_name, rut, email, phone, delivery_type, total_amount, status,
         document_type, billing_rut, billing_razon_social, billing_giro, billing_address
       )
       VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, ?)`,
      customer.name.trim(),
      customer.rut.trim(),
      customer.email.trim(),
      customer.phone.trim(),
      deliveryType,
      totalAmount,
      billing.document_type,
      isFactura ? billing.rut.trim() : null,
      isFactura ? billing.razon_social.trim() : null,
      isFactura ? billing.giro.trim() : null,
      isFactura ? billing.address.trim() : null
    );
    const orderId = orderResult.lastID;

    for (const item of resolvedItems) {
      await db.run(
        `INSERT INTO order_items (order_id, product_id, quantity, price, branch_deducted)
         VALUES (?, ?, ?, ?, ?)`,
        orderId,
        item.product_id,
        item.quantity,
        item.price,
        item.branch_deducted
      );
    }

    await db.exec('COMMIT');

    return {
      id: orderId,
      status: 'confirmed',
      delivery_type: deliveryType,
      document_type: billing.document_type,
      total_amount: totalAmount,
      items: resolvedItems,
    };
  } catch (err) {
    await db.exec('ROLLBACK').catch(() => {});
    throw err;
  }
}

/**
 * POST /api/orders
 * Valida el payload y delega la transacción a placeOrder(), serializada por
 * runExclusive() para que solo un checkout escriba a la vez.
 */
async function createOrder(req, res, next) {
  const validationErrors = validateOrderPayload(req.body);
  if (validationErrors.length) {
    return res.status(400).json({ error: 'Datos de la orden inválidos', details: validationErrors });
  }

  const { customer, delivery_type: deliveryType, items } = req.body;
  const billing = req.body.billing || { document_type: 'boleta' };

  try {
    const order = await runExclusive(() => placeOrder({ customer, deliveryType, items, billing }));
    res.status(201).json({ order });
  } catch (err) {
    if (err instanceof OrderError) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
}

module.exports = { createOrder, isValidRut };

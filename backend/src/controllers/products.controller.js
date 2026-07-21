const { getDb } = require('../db/connection');
const { fuzzySearch } = require('../utils/textSearch');

/**
 * GET /api/products
 * Lista todos los productos junto con su stock desglosado por sucursal.
 * Filtros opcionales por querystring: ?category=&brand=
 */
async function getAllProducts(req, res, next) {
  try {
    const db = await getDb();
    const { category, brand } = req.query;

    const conditions = [];
    const params = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    if (brand) {
      conditions.push('brand = ?');
      params.push(brand);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const products = await db.all(
      `SELECT id, sku, name, description, price, category, brand, image_url
       FROM products
       ${whereClause}
       ORDER BY name ASC`,
      ...params
    );

    const productIds = products.map((p) => p.id);
    let stockByProduct = {};

    if (productIds.length) {
      const placeholders = productIds.map(() => '?').join(', ');
      const stockRows = await db.all(
        `SELECT i.product_id, b.name AS branch, i.stock
         FROM inventory i
         JOIN branches b ON b.id = i.branch_id
         WHERE i.product_id IN (${placeholders})`,
        ...productIds
      );

      stockByProduct = stockRows.reduce((acc, row) => {
        (acc[row.product_id] ??= {})[row.branch] = row.stock;
        return acc;
      }, {});
    }

    const productsWithStock = products.map((p) => ({
      ...p,
      stock: stockByProduct[p.id] || {},
    }));

    res.json({ count: productsWithStock.length, products: productsWithStock });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/search?q=texto
 * Autocompletado predictivo y tolerante a typos: normaliza tildes/mayúsculas
 * y aplica coincidencia difusa por token (Levenshtein acotado) sobre nombre,
 * marca y categoría. `approximate: true` en la respuesta indica que todos los
 * resultados vienen de coincidencia difusa (probable error de tipeo).
 */
async function searchProducts(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json({ count: 0, products: [], approximate: false });
    }

    const db = await getDb();
    const allProducts = await db.all('SELECT id, name, category, brand, price, image_url FROM products');

    const { results, approximate } = fuzzySearch(allProducts, q, 8);

    res.json({ count: results.length, products: results, approximate });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/:id
 * Detalle de un producto puntual.
 */
async function getProductById(req, res, next) {
  try {
    const db = await getDb();
    const product = await db.get('SELECT * FROM products WHERE id = ?', req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ product });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/:id/stock
 * Stock en tiempo real de un producto, desglosado por sucursal.
 * Soporta ?branch=Providencia para filtrar a una sola sucursal.
 */
async function getProductStock(req, res, next) {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { branch } = req.query;

    const product = await db.get('SELECT id, name FROM products WHERE id = ?', id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const params = [id];
    let branchFilter = '';
    if (branch) {
      branchFilter = 'AND b.name = ?';
      params.push(branch);
    }

    const stockByBranch = await db.all(
      `SELECT b.name AS branch, COALESCE(i.stock, 0) AS stock, i.updated_at
       FROM branches b
       LEFT JOIN inventory i ON i.branch_id = b.id AND i.product_id = ?
       WHERE 1 = 1 ${branchFilter}
       ORDER BY b.name ASC`,
      ...params
    );

    if (branch && stockByBranch.length === 0) {
      return res.status(404).json({ error: `Sucursal "${branch}" no existe` });
    }

    res.json({
      product: { id: product.id, name: product.name },
      stock: stockByBranch,
    });
  } catch (err) {
    next(err);
  }
}

const EDITABLE_BRANCHES = ['Providencia', 'Vitacura'];

/**
 * PUT /api/products/:id
 * Edición rápida desde el panel admin: precio y/o stock por sucursal. Ambos
 * campos son opcionales (se puede mandar solo uno), pero al menos uno debe
 * venir en el body.
 */
async function updateProduct(req, res, next) {
  try {
    const db = await getDb();
    const { id } = req.params;

    const product = await db.get('SELECT id FROM products WHERE id = ?', id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const { price, stock } = req.body;
    const errors = [];

    if (price === undefined && stock === undefined) {
      errors.push('Debes enviar "price" y/o "stock" para actualizar.');
    }
    if (price !== undefined && (!Number.isFinite(price) || price < 0)) {
      errors.push('El precio debe ser un número mayor o igual a 0.');
    }
    if (stock !== undefined) {
      if (typeof stock !== 'object' || stock === null || Array.isArray(stock)) {
        errors.push('El stock debe ser un objeto { Providencia, Vitacura }.');
      } else {
        for (const [branch, qty] of Object.entries(stock)) {
          if (!EDITABLE_BRANCHES.includes(branch)) {
            errors.push(`Sucursal desconocida: "${branch}".`);
          } else if (!Number.isInteger(qty) || qty < 0) {
            errors.push(`El stock de ${branch} debe ser un número entero mayor o igual a 0.`);
          }
        }
      }
    }

    if (errors.length) {
      return res.status(400).json({ error: 'Datos inválidos', details: errors });
    }

    if (price !== undefined) {
      await db.run('UPDATE products SET price = ? WHERE id = ?', Math.round(price), id);
    }

    if (stock !== undefined) {
      const branches = await db.all('SELECT id, name FROM branches');
      const branchIdByName = Object.fromEntries(branches.map((b) => [b.name, b.id]));

      for (const [branch, qty] of Object.entries(stock)) {
        await db.run(
          `UPDATE inventory SET stock = ?, updated_at = datetime('now') WHERE product_id = ? AND branch_id = ?`,
          qty,
          id,
          branchIdByName[branch]
        );
      }
    }

    const updated = await db.get('SELECT id, sku, name, description, price, category, brand, image_url FROM products WHERE id = ?', id);
    const stockRows = await db.all(
      `SELECT b.name AS branch, i.stock
       FROM inventory i
       JOIN branches b ON b.id = i.branch_id
       WHERE i.product_id = ?`,
      id
    );
    updated.stock = Object.fromEntries(stockRows.map((row) => [row.branch, row.stock]));

    res.json({ product: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllProducts,
  searchProducts,
  getProductById,
  getProductStock,
  updateProduct,
};

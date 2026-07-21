// En desarrollo, vite.config.js reenvía /api/* a http://localhost:4000, así que
// una ruta relativa alcanza. Para builds de producción servidos aparte del
// backend, definir VITE_API_BASE_URL (ej. en un .env.production).
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Clave opcional del backend (ADMIN_API_KEY / X-Admin-Key), independiente del
// login simulado del panel: si el servidor la exige, se guarda una vez en
// este navegador (AdminSidebar) y todas las llamadas admin la reutilizan.
export const ADMIN_KEY_STORAGE = 'garachena_admin_key';

function adminHeaders() {
  const key = localStorage.getItem(ADMIN_KEY_STORAGE);
  return key ? { 'X-Admin-Key': key } : {};
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function fetchProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/products${query ? `?${query}` : ''}`);
  if (!response.ok) throw new Error('No se pudo cargar el catálogo');
  const data = await response.json();
  return data.products;
}

export async function searchProducts(q) {
  const response = await fetch(`${API_BASE_URL}/products/search?q=${encodeURIComponent(q)}`);
  if (!response.ok) throw new Error('Error en la búsqueda');
  const data = await response.json();
  return { products: data.products, approximate: Boolean(data.approximate) };
}

export async function fetchProductWithStock(id) {
  const [detailRes, stockRes] = await Promise.all([
    fetch(`${API_BASE_URL}/products/${id}`),
    fetch(`${API_BASE_URL}/products/${id}/stock`),
  ]);
  if (!detailRes.ok || !stockRes.ok) throw new Error('Producto no encontrado');

  const { product } = await detailRes.json();
  const { stock } = await stockRes.json();
  const stockMap = stock.reduce((acc, row) => {
    acc[row.branch] = row.stock;
    return acc;
  }, {});
  return { ...product, stock: stockMap };
}

/**
 * Crea una orden. Devuelve { ok, status, order? , error?, details? } en vez de
 * lanzar, porque el checkout necesita distinguir errores de validación (400)
 * de stock insuficiente (409) para mostrar el mensaje correcto sin romper el
 * flujo de UI.
 */
export async function createOrder(payload) {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonSafe(response);

  if (!response.ok) {
    const message = Array.isArray(data.details) ? data.details.join(' ') : data.error || 'No se pudo procesar el pedido.';
    return { ok: false, status: response.status, error: message };
  }
  return { ok: true, order: data.order };
}

/** GET /api/admin/summary — KPIs del dashboard admin. */
export async function fetchAdminSummary() {
  const response = await fetch(`${API_BASE_URL}/admin/summary`, { headers: adminHeaders() });
  const data = await parseJsonSafe(response);
  if (!response.ok) throw new Error(data.error || 'No se pudo cargar el resumen.');
  return data;
}

/** GET /api/orders — listado de pedidos para el panel admin. */
export async function fetchOrders() {
  const response = await fetch(`${API_BASE_URL}/orders`, { headers: adminHeaders() });
  const data = await parseJsonSafe(response);
  if (!response.ok) throw new Error(data.error || 'No se pudieron cargar los pedidos.');
  return data.orders;
}

/** PATCH /api/orders/:id/status */
export async function updateOrderStatus(id, status) {
  const response = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...adminHeaders() },
    body: JSON.stringify({ status }),
  });
  const data = await parseJsonSafe(response);
  if (!response.ok) return { ok: false, error: data.error || 'No se pudo actualizar el estado.' };
  return { ok: true, order: data.order };
}

/** PUT /api/products/:id — edición rápida de precio/stock desde el catálogo admin. */
export async function updateProduct(id, payload) {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...adminHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    const message = Array.isArray(data.details) ? data.details.join(' ') : data.error || 'No se pudo actualizar el producto.';
    return { ok: false, error: message };
  }
  return { ok: true, product: data.product };
}

export async function importProducts(file, adminKey) {
  const formData = new FormData();
  formData.append('file', file);

  const headers = {};
  if (adminKey) headers['X-Admin-Key'] = adminKey;

  const response = await fetch(`${API_BASE_URL}/products/import`, {
    method: 'POST',
    headers,
    body: formData,
  });
  const data = await parseJsonSafe(response);

  if (!response.ok) {
    const message = Array.isArray(data.details) ? data.details.join(' ') : data.error || 'No se pudo procesar el archivo.';
    return { ok: false, status: response.status, error: message };
  }
  return { ok: true, data };
}

const { getDb } = require('../db/connection');

// Mismo umbral que usa la UI del catálogo (ProductCard/StockPill) para marcar
// stock "bajo" en ámbar.
const LOW_STOCK_THRESHOLD = 5;
const RECENT_ORDERS_LIMIT = 5;
const LOW_STOCK_SAMPLE_LIMIT = 5;

/**
 * GET /api/admin/summary
 * KPIs para el Bento Grid del dashboard: pedidos pendientes, ventas del día,
 * alerta de stock bajo (con una muestra de productos) y los últimos pedidos.
 */
async function getSummary(req, res, next) {
  try {
    const db = await getDb();

    const pending = await db.get(`SELECT COUNT(*) AS count FROM orders WHERE status = 'pendiente'`);

    const todaySales = await db.get(
      `SELECT COALESCE(SUM(total_amount), 0) AS total, COUNT(*) AS count
       FROM orders
       WHERE date(created_at) = date('now')`
    );

    const lowStockCount = await db.get(
      `SELECT COUNT(*) AS count FROM (
         SELECT p.id, COALESCE(SUM(i.stock), 0) AS total_stock
         FROM products p
         LEFT JOIN inventory i ON i.product_id = p.id
         GROUP BY p.id
         HAVING total_stock <= ?
       )`,
      LOW_STOCK_THRESHOLD
    );

    const lowStockItems = await db.all(
      `SELECT p.id, p.name, COALESCE(SUM(i.stock), 0) AS total_stock
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id
       GROUP BY p.id
       HAVING total_stock <= ?
       ORDER BY total_stock ASC, p.name ASC
       LIMIT ?`,
      LOW_STOCK_THRESHOLD,
      LOW_STOCK_SAMPLE_LIMIT
    );

    const recentOrders = await db.all(
      `SELECT id, customer_name, total_amount, status, document_type, created_at
       FROM orders
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
      RECENT_ORDERS_LIMIT
    );

    res.json({
      pending_orders: pending.count,
      today_sales: { total: todaySales.total, count: todaySales.count },
      low_stock: { count: lowStockCount.count, threshold: LOW_STOCK_THRESHOLD, items: lowStockItems },
      recent_orders: recentOrders,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary };

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
      `SELECT id, name, description, price, category, brand, image_url
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

module.exports = {
  getAllProducts,
  searchProducts,
  getProductById,
  getProductStock,
};

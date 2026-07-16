const { getDb } = require('../db/connection');

/**
 * GET /api/products
 * Lista todos los productos, con stock total agregado (todas las sucursales).
 * Filtros opcionales por querystring: ?category=&brand=
 */
async function getAllProducts(req, res, next) {
  try {
    const db = await getDb();
    const { category, brand } = req.query;

    const conditions = [];
    const params = [];

    if (category) {
      conditions.push('p.category = ?');
      params.push(category);
    }
    if (brand) {
      conditions.push('p.brand = ?');
      params.push(brand);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const products = await db.all(
      `SELECT
         p.id, p.name, p.description, p.price, p.category, p.brand, p.image_url,
         COALESCE(SUM(i.stock), 0) AS total_stock
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id
       ${whereClause}
       GROUP BY p.id
       ORDER BY p.name ASC`,
      ...params
    );

    res.json({ count: products.length, products });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/search?q=texto
 * Autocompletado: coincidencias por nombre, categoría o marca.
 * Prioriza resultados que empiezan con el término buscado.
 */
async function searchProducts(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json({ count: 0, products: [] });
    }

    const db = await getDb();
    const like = `%${q}%`;
    const startsWith = `${q}%`;

    const products = await db.all(
      `SELECT id, name, category, brand, price, image_url
       FROM products
       WHERE name LIKE ? OR category LIKE ? OR brand LIKE ?
       ORDER BY
         CASE WHEN name LIKE ? THEN 0 ELSE 1 END,
         name ASC
       LIMIT 8`,
      like,
      like,
      like,
      startsWith
    );

    res.json({ count: products.length, products });
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

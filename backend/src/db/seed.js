const { getDb } = require('./connection');
const { initDb } = require('./init');

const BRANCHES = ['Providencia', 'Vitacura'];

const PRODUCTS = [
  {
    name: 'Látex Extra Cubriente Profesional (Galón)',
    description: 'Pintura látex de fórmula propia Garachena, alto poder cubriente y secado rápido.',
    price: 18990,
    category: 'Pinturas & Tintometría',
    brand: 'Garachena Paints',
    image_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=600',
    stock: { Providencia: 24, Vitacura: 12 },
  },
  {
    name: 'Rodillo de Felpa Profesional 9" Antigota',
    description: 'Rodillo de felpa de alta absorción, diseño antigota para acabados prolijos.',
    price: 4490,
    category: 'Herramientas Manuales',
    brand: 'Herramientas Garachena',
    image_url: 'https://images.unsplash.com/photo-1605264964521-310849226a81?auto=format&fit=crop&q=80&w=600',
    stock: { Providencia: 40, Vitacura: 35 },
  },
  {
    name: 'Taladro Percutor Eléctrico Profesional 650W',
    description: 'Taladro percutor de 650W con mandril de 13mm, ideal para uso profesional e intensivo.',
    price: 32990,
    category: 'Línea Construcción',
    brand: 'Sipa Chile',
    image_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=600',
    stock: { Providencia: 8, Vitacura: 0 },
  },
  {
    name: 'Sellador Acrílico Multiuso Soudal 300ml',
    description: 'Sellador acrílico de uso general para interior y exterior, pintable.',
    price: 3990,
    category: 'Aseo y Químicos',
    brand: 'Soudal Profesional',
    image_url: 'https://images.unsplash.com/photo-1620912189876-3e199b9a94a1?auto=format&fit=crop&q=80&w=600',
    stock: { Providencia: 15, Vitacura: 20 },
  },
];

async function seed() {
  await initDb();
  const db = await getDb();

  const branchIdByName = {};
  for (const name of BRANCHES) {
    await db.run('INSERT OR IGNORE INTO branches (name) VALUES (?)', name);
    const row = await db.get('SELECT id FROM branches WHERE name = ?', name);
    branchIdByName[name] = row.id;
  }

  const { count } = await db.get('SELECT COUNT(*) AS count FROM products');
  if (count > 0) {
    console.log('La base de datos ya contiene productos; se omite el seed.');
    return;
  }

  for (const product of PRODUCTS) {
    const result = await db.run(
      `INSERT INTO products (name, description, price, category, brand, image_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      product.name,
      product.description,
      product.price,
      product.category,
      product.brand,
      product.image_url
    );
    const productId = result.lastID;

    for (const [branchName, stock] of Object.entries(product.stock)) {
      await db.run(
        'INSERT INTO inventory (product_id, branch_id, stock) VALUES (?, ?, ?)',
        productId,
        branchIdByName[branchName],
        stock
      );
    }
  }

  console.log(`Seed completado: ${PRODUCTS.length} productos y ${BRANCHES.length} sucursales.`);
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error al ejecutar el seed:', err);
      process.exit(1);
    });
}

module.exports = { seed };

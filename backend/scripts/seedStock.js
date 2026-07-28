/**
 * Poblado de stock para el catálogo importado de Sisgen.
 *
 * Los productos cargados por import-familia-pinturas.js quedan con stock 0
 * en ambas sucursales (el import no trae cantidades reales). Este script les
 * asigna stock aleatorio pero coherente —entre 5 y 50 unidades por
 * producto— repartido entre Providencia y Vitacura con una proporción
 * también aleatoria (30%-70%), para que el catálogo quede disponible para
 * agregar al carrito y probar compras reales de punta a punta.
 *
 * Alcance: solo productos con internal_code (es decir, los importados desde
 * el Excel de Sisgen vía CODIGOPROD). No toca los 4 productos demo
 * sembrados por seed.js, que ya tienen stock curado a mano.
 *
 * Uso: node scripts/seedStock.js
 */
const { getDb } = require('../src/db/connection');
const { initDb } = require('../src/db/init');

const MIN_TOTAL_STOCK = 5;
const MAX_TOTAL_STOCK = 50;
const MIN_PROVIDENCIA_SHARE = 0.3;
const MAX_PROVIDENCIA_SHARE = 0.7;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function splitStock(total) {
  const share = MIN_PROVIDENCIA_SHARE + Math.random() * (MAX_PROVIDENCIA_SHARE - MIN_PROVIDENCIA_SHARE);
  const providencia = Math.max(1, Math.round(total * share));
  const vitacura = Math.max(1, total - providencia);
  return { providencia, vitacura };
}

async function run() {
  await initDb();
  const db = await getDb();

  const branches = await db.all('SELECT id, name FROM branches');
  const branchIdByName = Object.fromEntries(branches.map((b) => [b.name, b.id]));
  if (!branchIdByName.Providencia || !branchIdByName.Vitacura) {
    throw new Error('Faltan sucursales base (Providencia/Vitacura) en la base de datos.');
  }

  const products = await db.all('SELECT id, name FROM products WHERE internal_code IS NOT NULL');
  console.log(`${products.length} productos importados encontrados (con internal_code).`);

  let updated = 0;
  let totalUnitsAssigned = 0;

  try {
    await db.exec('BEGIN IMMEDIATE TRANSACTION');

    for (const product of products) {
      const total = randomInt(MIN_TOTAL_STOCK, MAX_TOTAL_STOCK);
      const { providencia, vitacura } = splitStock(total);

      await db.run(
        `UPDATE inventory SET stock = ?, updated_at = datetime('now') WHERE product_id = ? AND branch_id = ?`,
        providencia,
        product.id,
        branchIdByName.Providencia
      );
      await db.run(
        `UPDATE inventory SET stock = ?, updated_at = datetime('now') WHERE product_id = ? AND branch_id = ?`,
        vitacura,
        product.id,
        branchIdByName.Vitacura
      );

      updated++;
      totalUnitsAssigned += providencia + vitacura;
    }

    await db.exec('COMMIT');
  } catch (err) {
    await db.exec('ROLLBACK').catch(() => {});
    throw err;
  }

  console.log('\n=== Resultado del poblado de stock ===');
  console.log(`Productos actualizados: ${updated}`);
  console.log(`Unidades totales asignadas: ${totalUnitsAssigned}`);
  console.log(`Promedio por producto: ${updated ? (totalUnitsAssigned / updated).toFixed(1) : 0} unidades`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error al poblar el stock:', err);
    process.exit(1);
  });

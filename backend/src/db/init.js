const fs = require('fs');
const path = require('path');
const { getDb } = require('./connection');

/**
 * Migración defensiva para bases de datos creadas antes de que existiera la
 * columna "sku" (usada por la importación masiva). SQLite no soporta
 * "ALTER TABLE ... ADD COLUMN IF NOT EXISTS", así que se verifica a mano;
 * si la tabla es nueva, schema.sql ya la crea con la columna incluida.
 */
async function migrateAddSkuColumn(db) {
  const table = await db.get("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'products'");
  if (!table) return;

  const columns = await db.all('PRAGMA table_info(products)');
  const hasSku = columns.some((col) => col.name === 'sku');
  if (!hasSku) {
    await db.exec('ALTER TABLE products ADD COLUMN sku TEXT');
  }
}

async function initDb() {
  const db = await getDb();
  await migrateAddSkuColumn(db);
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await db.exec(schema);
  return db;
}

if (require.main === module) {
  initDb()
    .then(() => {
      console.log('Base de datos inicializada correctamente.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error al inicializar la base de datos:', err);
      process.exit(1);
    });
}

module.exports = { initDb };

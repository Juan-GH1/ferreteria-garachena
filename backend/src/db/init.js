const fs = require('fs');
const path = require('path');
const { getDb } = require('./connection');

/**
 * Migraciones defensivas para bases creadas con esquemas anteriores. SQLite
 * no soporta "ALTER TABLE ... ADD COLUMN IF NOT EXISTS", así que se verifica
 * a mano; en tablas nuevas, schema.sql ya incluye estas columnas.
 */
async function addMissingColumns(db, tableName, columns) {
  const table = await db.get("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?", tableName);
  if (!table) return;

  const existing = await db.all(`PRAGMA table_info(${tableName})`);
  const existingNames = new Set(existing.map((col) => col.name));

  for (const [name, definition] of Object.entries(columns)) {
    if (!existingNames.has(name)) {
      await db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${name} ${definition}`);
    }
  }
}

async function runMigrations(db) {
  await addMissingColumns(db, 'products', { sku: 'TEXT', internal_code: 'TEXT' });
  await addMissingColumns(db, 'orders', {
    document_type: "TEXT NOT NULL DEFAULT 'boleta'",
    billing_rut: 'TEXT',
    billing_razon_social: 'TEXT',
    billing_giro: 'TEXT',
    billing_address: 'TEXT',
  });
}

async function initDb() {
  const db = await getDb();
  await runMigrations(db);
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

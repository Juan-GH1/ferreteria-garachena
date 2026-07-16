const fs = require('fs');
const path = require('path');
const { getDb } = require('./connection');

async function initDb() {
  const db = await getDb();
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

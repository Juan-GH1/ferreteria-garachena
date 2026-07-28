require('dotenv').config();

const app = require('./app');
const { initDb } = require('./db/init');
const { seed } = require('./db/seed');

const PORT = process.env.PORT || 4000;

async function start() {
  await initDb();
  await seed();

  app.listen(PORT, () => {
    console.log(`Servidor de Ferretería Garachena escuchando en http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('No se pudo iniciar el servidor:', err);
  process.exit(1);
});

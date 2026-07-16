const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const DB_FILE = process.env.DB_FILE || path.join(__dirname, '../../data/garachena.db');

let dbPromise = null;

/**
 * Devuelve una única conexión (singleton) a la base de datos SQLite,
 * abierta con la API basada en promesas de "sqlite".
 */
function getDb() {
  if (!dbPromise) {
    dbPromise = open({ filename: DB_FILE, driver: sqlite3.Database }).then(async (db) => {
      await db.exec('PRAGMA foreign_keys = ON');
      return db;
    });
  }
  return dbPromise;
}

module.exports = { getDb, DB_FILE };

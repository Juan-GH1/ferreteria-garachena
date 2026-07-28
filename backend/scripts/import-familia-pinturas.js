/**
 * Seeding del catálogo real de pinturas desde FAMILIA_PINTURAS.xlsx.
 *
 * Uso:
 *   node scripts/import-familia-pinturas.js [ruta/al/archivo.xlsx]
 *   (por defecto lee data/FAMILIA_PINTURAS.xlsx)
 *
 * Mapeo de columnas:
 *   DESCRIPCIO -> name (con trim: las celdas traen espacios de relleno)
 *   PRECIODEVE -> price
 *   CODIGODEBA -> sku (código de barras, identificador único de upsert)
 *   CODIGOPROD -> internal_code (ID interno del ERP)
 *
 * Reglas:
 *   - Upsert por SKU: si existe, actualiza nombre/precio/internal_code;
 *     si no, lo crea en la categoría "Pinturas" con imagen por defecto y
 *     stock 0 en ambas sucursales (el stock real llega por otra vía).
 *   - ~44% de las filas no traen código de barras: para esas se usa el SKU
 *     de respaldo "PROD-<CODIGOPROD>", que sí está presente en todas.
 *   - Filas sin descripción o con precio inválido se omiten y reportan.
 */
const path = require('path');
const ExcelJS = require('exceljs');
const { getDb } = require('../src/db/connection');
const { initDb } = require('../src/db/init');

const DEFAULT_FILE = path.join(__dirname, '../data/FAMILIA_PINTURAS.xlsx');
const CATEGORY = 'Pinturas';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=600';
const BRANCHES = ['Providencia', 'Vitacura'];

function cellText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && value.text !== undefined) return String(value.text);
  return String(value);
}

async function readRows(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('El archivo no contiene hojas.');

  let headerIndex = {};
  const rows = [];

  sheet.eachRow((row, rowNumber) => {
    const values = row.values.slice(1).map(cellText);
    if (rowNumber === 1) {
      values.forEach((header, i) => {
        headerIndex[header.trim().toUpperCase()] = i;
      });
      for (const required of ['CODIGOPROD', 'DESCRIPCIO', 'PRECIODEVE', 'CODIGODEBA']) {
        if (!(required in headerIndex)) throw new Error(`Falta la columna ${required} en el archivo.`);
      }
      return;
    }
    rows.push({
      rowNumber,
      codigoProd: values[headerIndex.CODIGOPROD]?.trim() ?? '',
      descripcion: values[headerIndex.DESCRIPCIO]?.trim() ?? '',
      precio: row.values[headerIndex.PRECIODEVE + 1],
      codigoBarra: values[headerIndex.CODIGODEBA]?.trim() ?? '',
    });
  });

  return rows;
}

async function run() {
  const filePath = process.argv[2] || DEFAULT_FILE;
  console.log(`Leyendo ${filePath}...`);

  const rows = await readRows(filePath);
  console.log(`${rows.length} filas de datos encontradas.`);

  await initDb();
  const db = await getDb();

  const branchIds = [];
  for (const name of BRANCHES) {
    await db.run('INSERT OR IGNORE INTO branches (name) VALUES (?)', name);
    const row = await db.get('SELECT id FROM branches WHERE name = ?', name);
    branchIds.push(row.id);
  }

  let created = 0;
  let updated = 0;
  let fallbackSkus = 0;
  const skipped = [];
  const seenSkus = new Set();

  try {
    await db.exec('BEGIN IMMEDIATE TRANSACTION');

    for (const row of rows) {
      const priceValue = typeof row.precio === 'number' ? Math.round(row.precio) : NaN;

      if (!row.descripcion) {
        skipped.push(`Fila ${row.rowNumber}: descripción vacía.`);
        continue;
      }
      if (!Number.isFinite(priceValue) || priceValue < 0) {
        skipped.push(`Fila ${row.rowNumber}: precio inválido (${JSON.stringify(row.precio)}).`);
        continue;
      }
      if (!row.codigoProd) {
        skipped.push(`Fila ${row.rowNumber}: sin CODIGOPROD.`);
        continue;
      }

      let sku = row.codigoBarra;
      if (!sku) {
        sku = `PROD-${row.codigoProd}`;
        fallbackSkus++;
      }

      if (seenSkus.has(sku)) {
        skipped.push(`Fila ${row.rowNumber}: SKU duplicado dentro del archivo (${sku}).`);
        continue;
      }
      seenSkus.add(sku);

      const existing = await db.get('SELECT id FROM products WHERE sku = ?', sku);

      if (existing) {
        await db.run(
          'UPDATE products SET name = ?, price = ?, internal_code = ? WHERE id = ?',
          row.descripcion,
          priceValue,
          row.codigoProd,
          existing.id
        );
        updated++;
      } else {
        const result = await db.run(
          `INSERT INTO products (sku, internal_code, name, price, category, image_url)
           VALUES (?, ?, ?, ?, ?, ?)`,
          sku,
          row.codigoProd,
          row.descripcion,
          priceValue,
          CATEGORY,
          DEFAULT_IMAGE
        );
        for (const branchId of branchIds) {
          await db.run('INSERT OR IGNORE INTO inventory (product_id, branch_id, stock) VALUES (?, ?, 0)', result.lastID, branchId);
        }
        created++;
      }
    }

    await db.exec('COMMIT');
  } catch (err) {
    await db.exec('ROLLBACK').catch(() => {});
    throw err;
  }

  console.log('\n=== Resultado de la importación ===');
  console.log(`Productos creados:      ${created}`);
  console.log(`Productos actualizados: ${updated}`);
  console.log(`SKU de respaldo usado:  ${fallbackSkus} (filas sin código de barras -> PROD-<CODIGOPROD>)`);
  console.log(`Filas omitidas:         ${skipped.length}`);
  skipped.forEach((reason) => console.log(`  - ${reason}`));
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error en la importación:', err);
    process.exit(1);
  });

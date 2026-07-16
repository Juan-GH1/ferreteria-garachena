const multer = require('multer');
const ExcelJS = require('exceljs');
const { parse } = require('csv-parse/sync');
const { getDb } = require('../db/connection');

const REQUIRED_HEADERS = ['sku', 'nombre', 'precio', 'stock_total'];
const MAX_ROW_ERRORS_RETURNED = 50;
const DEFAULT_IMPORT_CATEGORY = 'Importado Sisgen';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB: suficiente para varios miles de filas
  fileFilter: (req, file, cb) => {
    if (!/\.(csv|xlsx|xls)$/i.test(file.originalname)) {
      return cb(new Error('Formato no soportado. Sube un archivo .csv, .xlsx o .xls.'));
    }
    cb(null, true);
  },
});

function normalizeHeader(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes (tras NFD): "código" -> "codigo"
    .replace(/\s+/g, '_');
}

/** Acepta alias comunes de exportación (Sisgen u otros ERP) para cada columna esperada. */
const HEADER_ALIASES = {
  sku: ['sku', 'codigo', 'codigo_interno', 'cod_interno', 'codigo_sisgen'],
  nombre: ['nombre', 'producto', 'descripcion', 'nombre_producto'],
  precio: ['precio', 'precio_venta', 'valor'],
  stock_total: ['stock_total', 'stock', 'existencia', 'cantidad'],
};

function mapToCanonicalHeaders(rawHeaders) {
  const normalized = rawHeaders.map(normalizeHeader);
  const canonicalByIndex = normalized.map((header) => {
    const match = Object.entries(HEADER_ALIASES).find(([, aliases]) => aliases.includes(header));
    return match ? match[0] : header;
  });
  return canonicalByIndex;
}

function parseCsvBuffer(buffer) {
  const rawRecords = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });
  if (!rawRecords.length) return [];

  const rawHeaders = Object.keys(rawRecords[0]);
  const canonicalHeaders = mapToCanonicalHeaders(rawHeaders);

  return rawRecords.map((row) => {
    const record = {};
    rawHeaders.forEach((rawHeader, index) => {
      record[canonicalHeaders[index]] = row[rawHeader];
    });
    return record;
  });
}

async function parseXlsxBuffer(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  let canonicalHeaders = [];
  const records = [];

  sheet.eachRow((row, rowNumber) => {
    // row.values es 1-indexado por ExcelJS; el índice 0 queda vacío.
    const values = row.values.slice(1).map((cell) => (cell && cell.text !== undefined ? cell.text : cell));

    if (rowNumber === 1) {
      canonicalHeaders = mapToCanonicalHeaders(values);
      return;
    }

    const record = {};
    canonicalHeaders.forEach((header, index) => {
      const value = values[index];
      record[header] = value === undefined || value === null ? '' : value;
    });
    records.push(record);
  });

  return records;
}

function validateHeaders(records) {
  if (!records.length) return 'El archivo no contiene filas de datos.';
  const headers = Object.keys(records[0]);
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length) {
    return `Faltan columnas obligatorias: ${missing.join(', ')}. Se esperan: ${REQUIRED_HEADERS.join(', ')}.`;
  }
  return null;
}

/**
 * Convierte a entero tolerando formato chileno (punto de miles, coma decimal)
 * y celdas numéricas que ExcelJS ya entrega como number. CLP no usa decimales,
 * así que cualquier separador se trata como ruido y se descarta.
 */
function parseInteger(raw) {
  if (typeof raw === 'number') return Math.round(raw);
  const str = String(raw ?? '').trim();
  if (!str) return NaN;
  const cleaned = str.replace(/[.,]/g, '').replace(/[^\d-]/g, '');
  return cleaned ? Number(cleaned) : NaN;
}

/**
 * POST /api/products/import
 * Carga masiva desde Sisgen (o cualquier export .csv/.xlsx con las columnas
 * SKU, nombre, precio, stock_total). Upsert por SKU: si existe, actualiza
 * precio y stock; si no, crea el producto. El stock_total llega unificado
 * (sin distinguir sucursal), así que se reparte en partes iguales entre
 * Providencia y Vitacura para no romper el modelo de stock por sucursal que
 * ya usa el resto de la app — es una aproximación transitoria hasta que la
 * integración real con Sisgen entregue el desglose por sucursal.
 */
async function importProducts(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: 'Debes adjuntar un archivo .csv, .xlsx o .xls.' });
  }

  let records;
  try {
    records = /\.csv$/i.test(req.file.originalname)
      ? parseCsvBuffer(req.file.buffer)
      : await parseXlsxBuffer(req.file.buffer);
  } catch (err) {
    return res.status(400).json({ error: `No se pudo leer el archivo: ${err.message}` });
  }

  const headerError = validateHeaders(records);
  if (headerError) {
    return res.status(400).json({ error: headerError });
  }

  const db = await getDb();
  const branches = await db.all('SELECT id, name FROM branches');
  const branchIdByName = Object.fromEntries(branches.map((b) => [b.name, b.id]));

  if (!branchIdByName.Providencia || !branchIdByName.Vitacura) {
    return next(new Error('Faltan sucursales base (Providencia/Vitacura) en la base de datos.'));
  }

  let created = 0;
  let updated = 0;
  const rowErrors = [];

  try {
    await db.exec('BEGIN IMMEDIATE TRANSACTION');

    for (let i = 0; i < records.length; i++) {
      const rowNumber = i + 2; // +1 por encabezado, +1 por índice base 1
      const record = records[i];

      const sku = String(record.sku ?? '').trim().toUpperCase();
      const name = String(record.nombre ?? '').trim();
      const price = parseInteger(record.precio);
      const stockTotal = parseInteger(record.stock_total);

      const rowMessages = [];
      if (!sku) rowMessages.push('SKU vacío.');
      if (!name) rowMessages.push('Nombre vacío.');
      if (!Number.isFinite(price) || price < 0) rowMessages.push('Precio inválido.');
      if (!Number.isFinite(stockTotal) || stockTotal < 0) rowMessages.push('Stock total inválido.');

      if (rowMessages.length) {
        rowErrors.push(`Fila ${rowNumber}: ${rowMessages.join(' ')}`);
        continue;
      }

      const existing = await db.get('SELECT id FROM products WHERE sku = ?', sku);

      let productId;
      if (existing) {
        await db.run('UPDATE products SET name = ?, price = ? WHERE id = ?', name, price, existing.id);
        productId = existing.id;
        updated++;
      } else {
        const insertResult = await db.run(
          `INSERT INTO products (sku, name, price, category)
           VALUES (?, ?, ?, ?)`,
          sku,
          name,
          price,
          DEFAULT_IMPORT_CATEGORY
        );
        productId = insertResult.lastID;
        created++;
      }

      // stock_total llega unificado: se reparte parejo entre ambas sucursales
      // (ver nota en el docstring de la función) y se reemplaza por completo.
      const providenciaStock = Math.ceil(stockTotal / 2);
      const vitacuraStock = stockTotal - providenciaStock;

      await db.run(
        `INSERT INTO inventory (product_id, branch_id, stock, updated_at)
         VALUES (?, ?, ?, datetime('now'))
         ON CONFLICT(product_id, branch_id) DO UPDATE SET stock = excluded.stock, updated_at = excluded.updated_at`,
        productId,
        branchIdByName.Providencia,
        providenciaStock
      );
      await db.run(
        `INSERT INTO inventory (product_id, branch_id, stock, updated_at)
         VALUES (?, ?, ?, datetime('now'))
         ON CONFLICT(product_id, branch_id) DO UPDATE SET stock = excluded.stock, updated_at = excluded.updated_at`,
        productId,
        branchIdByName.Vitacura,
        vitacuraStock
      );
    }

    await db.exec('COMMIT');
  } catch (err) {
    await db.exec('ROLLBACK').catch(() => {});
    return next(err);
  }

  res.json({
    total_rows: records.length,
    created,
    updated,
    skipped: rowErrors.length,
    errors: rowErrors.slice(0, MAX_ROW_ERRORS_RETURNED),
  });
}

module.exports = { importProducts, upload };

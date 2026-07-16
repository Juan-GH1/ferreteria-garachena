-- Esquema relacional de Ferretería Garachena
-- Compatible con SQLite (local) y fácilmente portable a PostgreSQL.

CREATE TABLE IF NOT EXISTS branches (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  description TEXT,
  price       INTEGER NOT NULL,
  category    TEXT NOT NULL,
  brand       TEXT,
  image_url   TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Stock diferenciado por sucursal: una fila por combinación producto/sucursal.
CREATE TABLE IF NOT EXISTS inventory (
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  branch_id  INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  stock      INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (product_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

CREATE TABLE IF NOT EXISTS orders (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name  TEXT NOT NULL,
  rut            TEXT NOT NULL,
  email          TEXT NOT NULL,
  phone          TEXT NOT NULL,
  delivery_type  TEXT NOT NULL,
  total_amount   INTEGER NOT NULL,
  status         TEXT NOT NULL DEFAULT 'confirmed',
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Detalle de cada orden. branch_deducted registra de qué sucursal se descontó
-- el stock para ese ítem, según la regla de negocio aplicada en el checkout.
CREATE TABLE IF NOT EXISTS order_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id        INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      INTEGER NOT NULL REFERENCES products(id),
  quantity        INTEGER NOT NULL,
  price           INTEGER NOT NULL,
  branch_deducted TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

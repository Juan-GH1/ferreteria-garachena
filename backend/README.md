# Ferretería Garachena — Backend

API REST en Node.js + Express que sirve el catálogo de productos y el stock
diferenciado por sucursal (Providencia y Vitacura). Usa SQLite como base de
datos para el entorno local; el esquema es fácilmente portable a PostgreSQL
para producción.

## Estructura

```
backend/
├── package.json
├── .env.example
├── data/                     # archivo .db de SQLite (se genera solo)
└── src/
    ├── app.js                # configuración de Express (middlewares, rutas)
    ├── server.js             # punto de entrada: inicializa DB y levanta el servidor
    ├── db/
    │   ├── schema.sql        # definición de tablas
    │   ├── connection.js     # conexión singleton a SQLite
    │   ├── init.js           # crea las tablas si no existen
    │   └── seed.js           # datos de ejemplo (productos + stock)
    ├── controllers/
    │   ├── products.controller.js
    │   └── orders.controller.js
    └── routes/
        ├── products.routes.js
        └── orders.routes.js
```

## Modelo de datos

- **products**: `id, name, description, price, category, brand, image_url, created_at`
- **branches**: `id, name` (Providencia, Vitacura)
- **inventory**: `product_id, branch_id, stock, updated_at` — clave compuesta
  que permite llevar el stock de cada producto **por sucursal**.
- **orders**: `id, customer_name, rut, email, phone, delivery_type, total_amount, status, created_at`
- **order_items**: `id, order_id, product_id, quantity, price, branch_deducted` —
  registra de qué sucursal se descontó el stock de cada línea.

## Instalación e inicialización

```bash
cd backend
npm install
cp .env.example .env   # ajustar PORT si es necesario
npm start               # crea las tablas, carga datos de ejemplo y levanta el servidor
```

El servidor queda disponible en `http://localhost:4000` (o el `PORT` definido
en `.env`).

Para desarrollo con recarga automática:

```bash
npm run dev
```

También puedes ejecutar la inicialización y el seed por separado:

```bash
npm run db:init   # crea las tablas
npm run db:seed   # carga productos y stock de ejemplo (no duplica si ya existen)
```

## Endpoints

| Método | Ruta                                   | Descripción                                             |
|--------|-----------------------------------------|----------------------------------------------------------|
| GET    | `/api/health`                           | Health check                                             |
| GET    | `/api/products`                         | Todos los productos (filtros opcionales `?category=` `?brand=`) |
| GET    | `/api/products/search?q=texto`          | Autocompletado para el buscador (máx. 8 resultados)      |
| GET    | `/api/products/:id`                     | Detalle de un producto                                   |
| GET    | `/api/products/:id/stock`               | Stock por sucursal (todas). Filtrar con `?branch=Vitacura` |
| POST   | `/api/orders`                           | Crea una orden y descuenta stock de forma transaccional  |

### Ejemplos

```bash
curl http://localhost:4000/api/products
curl "http://localhost:4000/api/products/search?q=taladro"
curl http://localhost:4000/api/products/1/stock
curl "http://localhost:4000/api/products/1/stock?branch=Providencia"

curl -X POST http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
        "customer": {"name": "Juan Pérez", "rut": "12345678-5", "email": "juan@test.cl", "phone": "+56911112222"},
        "delivery_type": "Retiro Providencia",
        "items": [{"product_id": 1, "quantity": 2}]
      }'
```

### Checkout: reglas de negocio y manejo de errores

- `delivery_type` debe ser uno de: `Retiro Providencia`, `Retiro Vitacura`,
  `Despacho a Domicilio RM` (este último suma $3.990 al total).
- El RUT se valida con el algoritmo de dígito verificador módulo 11, no solo el formato.
- **De qué sucursal se descuenta el stock:**
  - `Retiro Providencia` / `Retiro Vitacura` → siempre de esa sucursal.
  - `Despacho a Domicilio RM` → regla básica: se descuenta de la sucursal con
    más stock disponible para ese producto.
- **Anti-sobreventa:** cada descuento de stock usa un `UPDATE ... WHERE stock >= cantidad`
  dentro de una transacción (`BEGIN IMMEDIATE`); si el `UPDATE` no afecta ninguna
  fila (porque el stock cambió entre que el cliente armó su carrito y confirmó el
  pedido), toda la orden se revierte con `ROLLBACK` y la API responde `409` con
  un mensaje indicando el producto, la sucursal y las unidades disponibles reales.
  Como la conexión SQLite es compartida por todo el proceso, las transacciones de
  checkout además se serializan en una cola interna para evitar que dos compras
  simultáneas intercalen sus `BEGIN/COMMIT` sobre la misma conexión.
- Errores de validación (RUT, email, carrito vacío, tipo de entrega inválido) devuelven `400`.

## Migrar a PostgreSQL en producción

El esquema en `src/db/schema.sql` usa tipos estándar compatibles con
PostgreSQL. Para migrar:

1. Instalar el driver: `npm install pg`
2. Reemplazar `src/db/connection.js` por un pool de `pg` (`new Pool({ connectionString: process.env.DATABASE_URL })`).
3. Ajustar `AUTOINCREMENT` → `SERIAL`/`GENERATED ALWAYS AS IDENTITY` y `datetime('now')` → `now()` en `schema.sql`.
4. El resto de controladores y rutas no requiere cambios, ya que las consultas SQL usadas son compatibles con ambos motores.

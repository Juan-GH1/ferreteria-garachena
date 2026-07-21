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
    │   ├── orders.controller.js
    │   └── import.controller.js
    ├── middleware/
    │   └── requireAdminKey.js
    └── routes/
        ├── products.routes.js
        └── orders.routes.js
```

## Modelo de datos

- **products**: `id, sku, name, description, price, category, brand, image_url, created_at`
  — `sku` es el código de Sisgen, único cuando no es `NULL` (los productos
  cargados a mano no lo tienen).
- **branches**: `id, name` (Providencia, Vitacura)
- **inventory**: `product_id, branch_id, stock, updated_at` — clave compuesta
  que permite llevar el stock de cada producto **por sucursal**.
- **orders**: `id, customer_name, rut, email, phone, delivery_type, total_amount, status, document_type, billing_rut, billing_razon_social, billing_giro, billing_address, created_at`
  — `document_type` es `boleta` (default) o `factura`; los campos `billing_*`
  solo se llenan para facturas.
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
| GET    | `/api/products/search?q=texto`          | Autocompletado difuso: tolera typos y tildes (máx. 8 resultados) |
| GET    | `/api/products/:id`                     | Detalle de un producto                                   |
| GET    | `/api/products/:id/stock`               | Stock por sucursal (todas). Filtrar con `?branch=Vitacura` |
| PUT    | `/api/products/:id`                     | 🔒 Edición rápida de precio y/o stock por sucursal (panel admin) |
| POST   | `/api/orders`                           | Crea una orden y descuenta stock de forma transaccional  |
| GET    | `/api/orders`                           | 🔒 Lista todos los pedidos, más recientes primero (panel admin) |
| PATCH  | `/api/orders/:id/status`                | 🔒 Actualiza el estado de un pedido (`pendiente`/`despachado`/`entregado`) |
| GET    | `/api/admin/summary`                    | 🔒 KPIs del dashboard: pedidos pendientes, ventas del día, alerta de stock bajo, últimos pedidos |
| POST   | `/api/products/import`                  | 🔒 Carga masiva de catálogo/stock desde .csv/.xlsx/.xls (ver abajo) |

🔒 = protegido por `requireAdminKey` (exige `X-Admin-Key` si `ADMIN_API_KEY` está definida en `.env`; sin definir, queda abierto para desarrollo/demo).

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

### Búsqueda difusa

`GET /api/products/search?q=` normaliza tildes y mayúsculas ("latex" →
"Látex") y aplica coincidencia difusa por token con distancia de Levenshtein
acotada (1 error para tokens de ≤4 letras, 2 para más largos), así "taldro"
encuentra "Taladro". El ranking prioriza prefijo exacto > substring en nombre >
substring en marca/categoría > coincidencia difusa. La respuesta incluye
`approximate: true` cuando todos los resultados provienen de coincidencia
difusa (probable typo), lo que el frontend usa para mostrar el hint de
"resultados aproximados". Implementado en `src/utils/textSearch.js` sin
dependencias; el scoring corre en JS sobre el catálogo completo por request,
suficiente hasta unos ~20-30k productos — pasado ese punto, migrar a SQLite
FTS5 con índice de trigramas.

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
- **Boleta o factura:** el payload acepta un objeto `billing` opcional. Sin él
  (o con `{"document_type": "boleta"}`) la orden se emite como boleta. Con
  `{"document_type": "factura", "rut", "razon_social", "giro", "address"}` los
  cuatro campos son obligatorios y el RUT de la empresa se valida con el mismo
  algoritmo módulo 11 que el RUT del cliente.
- **Estado del pedido:** toda orden nace en `pendiente` y avanza por
  `pendiente → despachado → entregado` desde el panel admin
  (`PATCH /api/orders/:id/status`, ver `frontend/README.md`).

### Importación masiva de inventario (puente hacia Sisgen)

Mientras se construye la integración en tiempo real con el ERP/CRM (Sisgen),
`POST /api/products/import` permite sincronizar el catálogo diariamente desde
un archivo exportado manualmente. Panel de uso: `admin.html` en la raíz del
repo (arrastrar y soltar o seleccionar archivo).

```bash
curl -X POST http://localhost:4000/api/products/import \
  -H "X-Admin-Key: $ADMIN_API_KEY" \
  -F "file=@inventario_sisgen.csv"
```

- **Formato esperado**: `.csv`, `.xlsx` o `.xls` con columnas `SKU`, `nombre`,
  `precio`, `stock_total` (también acepta alias comunes: `codigo`, `producto`,
  `stock`, etc. — ver `HEADER_ALIASES` en `import.controller.js`).
- **Upsert por SKU**: si el SKU ya existe, se actualiza `name` y `price` (la
  `category` original no se toca); si no existe, se crea un producto nuevo con
  categoría `"Importado Sisgen"`.
- **`stock_total` unificado → modelo por sucursal**: el archivo de Sisgen no
  distingue Providencia/Vitacura, pero el resto de la app sí. Para no romper
  esa parte del sistema (catálogo, carrito, checkout), el stock recibido se
  reparte en partes iguales entre ambas sucursales (`stock_total / 2`,
  redondeando el impar hacia Providencia) y **reemplaza** el stock previo de
  ambas. Es una aproximación transitoria — cuando la integración real con
  Sisgen entregue el desglose por sucursal, este reparto 50/50 se reemplaza
  por los valores reales.
- **Errores por fila no abortan el archivo completo**: una fila con SKU/nombre
  vacío o precio/stock inválido se omite y se reporta en `errors` (máx. 50 en
  la respuesta), pero el resto de filas válidas sí se procesan.
- **Protección básica**: si se define `ADMIN_API_KEY` en `.env`, el endpoint
  exige el header `X-Admin-Key` con ese valor (`401` si falta o no coincide).
  Sin la variable definida, el endpoint queda abierto — pensado solo para
  desarrollo/demo local; en producción hay que definirla o poner el endpoint
  detrás de autenticación real.

## Catálogo real de pinturas y poblado de stock

Además del seed de demo (`npm run db:seed`, 4 productos curados), el
repositorio incluye dos scripts para levantar un catálogo realista de punta a
punta a partir del Excel de Sisgen:

```bash
npm run db:import:pinturas   # scripts/import-familia-pinturas.js
npm run db:seed:stock        # scripts/seedStock.js
```

- **`db:import:pinturas`**: lee `data/FAMILIA_PINTURAS.xlsx` (columnas
  `DESCRIPCIO`, `PRECIODEVE`, `CODIGODEBA`, `CODIGOPROD`) y hace upsert por
  SKU (`CODIGODEBA`, con fallback `PROD-<CODIGOPROD>` para filas sin código de
  barra) contra la tabla `products`, con categoría `"Pinturas"` y una foto
  genérica de relleno para los productos nuevos. Requiere el servidor
  arrancado al menos una vez antes (para que existan las sucursales base).
- **`db:seed:stock`**: los productos recién importados quedan en 0 stock (el
  Excel no trae cantidades reales). Este script les asigna stock aleatorio
  pero coherente —entre 5 y 50 unidades por producto— repartido entre
  Providencia y Vitacura en una proporción también aleatoria (30%-70%).
  Alcance: solo productos con `internal_code` (es decir, importados desde
  Sisgen); no toca los 4 productos demo, que ya tienen stock curado a mano.

Orden recomendado desde cero: `npm start` (crea tablas + sucursales + seed
demo) → `npm run db:import:pinturas` → `npm run db:seed:stock`.

## Migrar a PostgreSQL en producción

El esquema en `src/db/schema.sql` usa tipos estándar compatibles con
PostgreSQL. Para migrar:

1. Instalar el driver: `npm install pg`
2. Reemplazar `src/db/connection.js` por un pool de `pg` (`new Pool({ connectionString: process.env.DATABASE_URL })`).
3. Ajustar `AUTOINCREMENT` → `SERIAL`/`GENERATED ALWAYS AS IDENTITY` y `datetime('now')` → `now()` en `schema.sql`.
4. El resto de controladores y rutas no requiere cambios, ya que las consultas SQL usadas son compatibles con ambos motores.

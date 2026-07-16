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
    │   └── products.controller.js
    └── routes/
        └── products.routes.js
```

## Modelo de datos

- **products**: `id, name, description, price, category, brand, image_url, created_at`
- **branches**: `id, name` (Providencia, Vitacura)
- **inventory**: `product_id, branch_id, stock, updated_at` — clave compuesta
  que permite llevar el stock de cada producto **por sucursal**.

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

### Ejemplos

```bash
curl http://localhost:4000/api/products
curl "http://localhost:4000/api/products/search?q=taladro"
curl http://localhost:4000/api/products/1/stock
curl "http://localhost:4000/api/products/1/stock?branch=Providencia"
```

## Migrar a PostgreSQL en producción

El esquema en `src/db/schema.sql` usa tipos estándar compatibles con
PostgreSQL. Para migrar:

1. Instalar el driver: `npm install pg`
2. Reemplazar `src/db/connection.js` por un pool de `pg` (`new Pool({ connectionString: process.env.DATABASE_URL })`).
3. Ajustar `AUTOINCREMENT` → `SERIAL`/`GENERATED ALWAYS AS IDENTITY` y `datetime('now')` → `now()` en `schema.sql`.
4. El resto de controladores y rutas no requiere cambios, ya que las consultas SQL usadas son compatibles con ambos motores.

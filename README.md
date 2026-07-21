# Ferretería Garachena

E-commerce de Ferretería Garachena: catálogo con stock por sucursal
(Providencia y Vitacura), carrito, checkout con transacción de stock, e
importación masiva de inventario desde Sisgen.

## Estructura del repositorio

```
backend/    API REST (Node.js + Express + SQLite) — ver backend/README.md
frontend/   SPA (React + Vite + Tailwind CSS + Framer Motion) — ver frontend/README.md
```

## Levantar el proyecto localmente

```bash
# Terminal 1: backend
cd backend
npm install
cp .env.example .env
npm start                # API en http://localhost:4000

# Terminal 2: frontend
cd frontend
npm install
npm run dev              # SPA en http://localhost:5173
```

La SPA sirve dos rutas: `/` (tienda) y `/admin` (importación masiva de
inventario). Detalles de cada parte en el README de su carpeta.

## Sprint: Producción / E-Commerce Profesional

Con el catálogo real de Sisgen ya cargado (1013 productos de pinturas), se
llevó el proyecto a un estado más comercial en cinco frentes:

1. **Home comercial** (`frontend/src/components/Hero.jsx`,
   `CategoryGrid.jsx`): hero con propuesta de valor y CTAs, y accesos rápidos
   a las 4 categorías del catálogo; el Simulador de Pintura se reubicó más
   abajo para no bloquear la compra.
2. **Placeholders vectoriales** (`ProductImage.jsx`): reemplaza la foto
   genérica repetida en los productos importados por una ilustración
   determinística por categoría (tarro de pintura o ícono estilizado), en vez
   de mostrar la misma foto mil veces.
3. **Poblado de stock realista** (`backend/scripts/seedStock.js`): asigna
   stock aleatorio pero coherente (5-50 unidades, repartidas entre
   Providencia y Vitacura) a los 1013 productos importados, que antes estaban
   todos en 0.
4. **Simulador conectado al catálogo** (`PaintSimulator.jsx`): cada muestra de
   color busca su producto real vía `/api/products/search` y ofrece un CTA
   directo a su ficha para comprarlo.
5. **Suite E2E oficial** (`frontend/tests/e2e/`, `@playwright/test`): un test
   de punta a punta que recorre Home → filtro por categoría → simulador →
   búsqueda con typo → carrito → checkout con factura → confirmación de
   pedido, corriendo contra el backend y la base de datos reales.

Ver el detalle de cada parte en `backend/README.md` y `frontend/README.md`.

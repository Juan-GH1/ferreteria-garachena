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

La SPA sirve la tienda en `/` y el panel de administración (dashboard,
pedidos, catálogo editable, importación masiva) bajo `/admin/*`. Detalles de
cada parte en el README de su carpeta.

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

## Sprint: Funcionalidades Avanzadas (B2B, Calculadora y Cross-Selling)

Tres herramientas orientadas a subir el ticket promedio y atender al
segmento B2B (maestros y constructoras):

1. **Calculadora de Pintura por Superficie** (`PaintCalculatorModal.jsx`,
   `frontend/src/utils/paint.js`): a partir de ancho, alto, aberturas a
   descontar y manos de pintura, calcula cuántos galones comprar (redondeo
   siempre hacia arriba) y los agrega al carrito con un clic. Accesible desde
   la ficha de cualquier producto de Pinturas y desde el Simulador.
2. **Venta cruzada inteligente** (`CrossSellRecommendations.jsx`,
   `frontend/src/utils/crossSell.js`): recomienda accesorios reales del
   catálogo según la categoría del producto (pintura → rodillo/brocha/cinta/
   plástico; herramienta eléctrica → brocas/extensión/lentes), resueltos por
   búsqueda contra el catálogo real — sin inventar productos que no existen
   en el inventario. Se muestra en la ficha de producto y en el carrito.
3. **Cotización B2B en PDF** (`B2BQuoteModal.jsx`,
   `frontend/src/utils/generateQuotePdf.js`): genera un PDF formal con
   membrete, datos del cliente, tabla de productos y desglose de IVA,
   descargable desde el carrito y desde el checkout.

Ver el detalle técnico de cada una en `frontend/README.md`.

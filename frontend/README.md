# Ferretería Garachena — Frontend

SPA en React 19 + Vite + Tailwind CSS v4, con Framer Motion para las
animaciones (drawer del carrito, modales, transiciones de la grilla) y
lucide-react para los íconos. Reemplaza los antiguos `index.html` / `admin.html`
estáticos de la raíz del repo.

## Estructura

```
frontend/
├── index.html              # shell de Vite (monta src/main.jsx)
├── vite.config.js          # plugin de Tailwind + proxy /api -> :4000
├── .env.example
└── src/
    ├── main.jsx             # BrowserRouter + ToastProvider
    ├── App.jsx               # rutas: "/" -> Catalog, "/admin" -> AdminPanel
    ├── index.css             # @import "tailwindcss" + tema de marca (@theme)
    ├── api.js                 # todas las llamadas a la API del backend
    ├── utils/
    │   ├── format.js          # formatPrice, stock por sucursal
    │   └── rut.js              # validación de RUT chileno (dígito verificador)
    ├── hooks/
    │   ├── useCart.js          # estado del carrito + persistencia en localStorage
    │   ├── useDebouncedValue.js
    │   └── useToast.js
    ├── context/
    │   └── ToastContext.jsx    # notificaciones flotantes globales
    └── components/
        ├── Catalog.jsx         # página de la tienda (equivalente al index.html original)
        ├── Header.jsx           # logo, buscador con autocompletado, botones de carrito
        ├── Hero.jsx              # hero comercial de la Home (CTAs a catálogo/herramientas)
        ├── CategoryGrid.jsx      # accesos rápidos a las 4 categorías destacadas
        ├── Sidebar.jsx
        ├── ProductGrid.jsx / ProductCard.jsx
        ├── ProductImage.jsx      # foto real o ilustración vectorial de fallback (ver abajo)
        ├── PaintSimulator.jsx    # simulador de color, conectado a productos reales del catálogo
        ├── Footer.jsx / WhatsappButton.jsx
        ├── CartDrawer.jsx       # panel lateral animado
        ├── CheckoutModal.jsx    # formulario de 2 pasos + confirmación
        ├── SuccessModal.jsx
        └── AdminPanel.jsx       # equivalente al admin.html original, en /admin

tests/e2e/                       # suite E2E con @playwright/test (ver más abajo)
playwright.config.js
```

### ProductImage: fallback vectorial inteligente

Los 1013 productos importados desde Sisgen (`backend/scripts/import-familia-pinturas.js`)
comparten una misma foto genérica de relleno. `ProductImage.jsx` detecta esa
URL compartida y, en vez de repetirla mil veces, genera una ilustración
determinística por categoría (mismo SKU/nombre → mismo resultado siempre):
un tarro de pintura con el tono derivado del producto para "Pinturas", o un
ícono de la categoría sobre fondo pastel con la marca Garachena de fondo para
el resto. Se usa en la grilla, la ficha de producto y el carrito.

### PaintSimulator: del color a la venta

Cada muestra del simulador (`PAINT_COLORS` en `PaintSimulator.jsx`) tiene un
`searchTerm` curado que se resuelve contra `/api/products/search` al montar
el componente, enlazando la muestra con un producto real del catálogo. El CTA
bajo el selector cambia según el match: "Comprar este color en 1 Galón" si el
producto es un formato en galón, o "Ver ficha del producto" en caso
contrario, y navega directo a `/producto/:id`.

## Instalación y desarrollo

Requiere el backend corriendo (ver `../backend/README.md`):

```bash
cd backend && npm install && npm start   # API en :4000
```

En otra terminal:

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

`vite.config.js` reenvía `/api/*` a `http://localhost:4000` en desarrollo, así
que `src/api.js` llama a rutas relativas (`/api/products`, etc.) sin necesidad
de configurar nada más. Para un build servido desde un host distinto al
backend, definir `VITE_API_BASE_URL` (ver `.env.example`).

## Build de producción

```bash
npm run build     # genera dist/
npm run preview   # sirve el build localmente para probarlo
```

## Rutas

| Ruta             | Página                                                        |
|------------------|----------------------------------------------------------------|
| `/`              | Catálogo, buscador, filtros, carrito y checkout (cliente final)|
| `/producto/:id`  | Ficha de producto con meta-tags dinámicos (SEO/OG)             |
| `/admin`         | Importación masiva de inventario vía CSV/XLSX (uso interno)    |

## SEO y rendimiento

- Las fichas de producto (`/producto/:id`) fijan título, meta description y
  OpenGraph (`og:title/description/image/url`, `og:type=product`) vía el hook
  `useMeta`; el catálogo restaura los suyos al navegar de vuelta.
- **Limitación conocida de SPA**: los meta-tags se inyectan client-side.
  Google los indexa (ejecuta JS), pero la mayoría de los scrapers de redes
  sociales no — al compartir un link de producto en redes se verán los OG por
  defecto de `index.html`. Para OG por producto en redes se necesita SSR o
  prerender (p. ej. migrar a un framework con SSR o prerenderizar rutas en el
  build); se dejó fuera de alcance a propósito.
- Las imágenes de la grilla y del carrito usan `loading="lazy"` +
  `decoding="async"`; la imagen principal de la ficha es eager con
  `fetchPriority="high"` por ser el LCP de esa página.

## Pruebas E2E (Playwright)

```bash
npm run test:e2e   # requiere backend (:4000) y frontend (:5173) — playwright.config.js los levanta si no están corriendo
```

`tests/e2e/full-purchase-flow.spec.js` simula el recorrido completo de un
cliente sobre el catálogo real (no mocks): Home → filtrar por categoría
"Pinturas" → probar el Simulador de Pintura → buscar con un typo ("taldro")
y confirmar que la búsqueda difusa resuelve "Taladro" → agregar al carrito →
checkout con Factura y RUT válido (dígito verificador módulo 11) → confirmar
el pedido y verificar el modal de éxito.

`playwright.config.js` apunta `launchOptions.executablePath` al Chromium ya
instalado en el entorno (`/opt/pw-browsers/chromium`) en vez de descargar uno
nuevo, y declara ambos servidores (`backend` vía `npm start`, `frontend` vía
`vite --port 5173`) en `webServer` con `reuseExistingServer: true`, así el
comando funciona tanto en CI como reutilizando servidores ya levantados en
desarrollo.

## Notas de la migración

- Toda la lógica que antes vivía en `<script>` inline (fetch al catálogo,
  estado del carrito con `localStorage`, debounce del buscador, validación de
  RUT, drag & drop del import) se portó a hooks de React sin cambiar las
  reglas de negocio.
- El carrito y el checkout tienen la misma validación de stock combinado
  (Providencia + Vitacura) y el mismo manejo de errores (409 por stock
  insuficiente, 400 por validación) que la versión estática.
- El botón "Confirmar Pedido" es `type="button"` con `onClick` explícito, no
  `type="submit"` de un `<form onSubmit>`: al testear se encontró que
  reemplazar un botón `type="button"` por uno `type="submit"` en la misma
  posición del DOM durante su propio evento de clic podía hacer que el
  navegador disparara el submit nativo sobre el botón nuevo, saltándose el
  paso de revisión. El formulario ya no depende del evento `submit` nativo.

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
    │   ├── rut.js              # validación de RUT chileno (dígito verificador)
    │   ├── pricing.js          # tramos de descuento por volumen (ver abajo)
    │   └── delivery.js         # insignias de ETA de retiro/despacho (ver abajo)
    ├── hooks/
    │   ├── useCart.js          # estado del carrito + persistencia en localStorage
    │   ├── useDebouncedValue.js
    │   ├── useDeliveryPreference.js  # preferencia de retiro/despacho, localStorage
    │   └── useToast.js
    ├── context/
    │   └── ToastContext.jsx    # notificaciones flotantes globales
    └── components/
        ├── Catalog.jsx         # página de la tienda (equivalente al index.html original)
        ├── Header.jsx           # logo, buscador con autocompletado, botones de carrito
        ├── Hero.jsx              # hero con switcher B2C/B2B (ver abajo)
        ├── QuickToolsHub.jsx     # 3 tarjetas bento: calculadora, cotizador, despacho
        ├── TrustBadges.jsx       # 4 badges de confianza
        ├── CategoryGrid.jsx      # bento de categorías con disponibilidad real
        ├── Sidebar.jsx
        ├── ProductGrid.jsx / ProductCard.jsx
        ├── ProductImage.jsx      # foto real o ilustración vectorial de fallback (ver abajo)
        ├── PaintSimulator.jsx    # simulador de color, conectado a productos reales del catálogo
        ├── Footer.jsx / WhatsappButton.jsx
        ├── CartDrawer.jsx       # panel lateral animado
        ├── DeliveryLocationSelector.jsx  # retiro en tienda / despacho express (ver abajo)
        ├── CheckoutModal.jsx    # formulario de 2 pasos + confirmación
        ├── SuccessModal.jsx
        ├── PaintCalculatorModal.jsx     # calculadora de superficie -> galones (ver abajo)
        ├── CrossSellRecommendations.jsx # venta cruzada inteligente (ver abajo)
        ├── B2BQuoteModal.jsx            # datos del cliente para la cotización B2B (ver abajo)
        └── admin/                # Panel de Administración, ver sección propia más abajo
            ├── AdminLayout.jsx / AdminSidebar.jsx / AdminLogin.jsx
            ├── AdminDashboard.jsx
            ├── AdminOrders.jsx
            ├── AdminCatalog.jsx / AdminProductEditModal.jsx
            └── AdminImport.jsx   # equivalente al admin.html original

tests/e2e/                       # suite E2E con @playwright/test (ver más abajo)
playwright.config.js
```

### Sistema de diseño editorial (Header/Hero/CategoryGrid/ProductCard/Catalog)

Dirección de arte minimalista y editorial (inspirada en nikola.cl): neutros
profundos (`--color-ink-950: #0d0d0e`) y superficies claras
(`--color-surface-50: #f8f9fa`, tokens en `index.css`, agregados sin tocar
`navy-*`/`brand-*` para no afectar componentes fuera de este rediseño, p. ej.
el panel admin). Tipografía `tracking-tight` con pesos `font-medium`/
`font-semibold` en vez de `font-black`, bordes finos `border-neutral-100/200`
en vez de sombras pesadas, y animaciones Framer Motion con `ease: 'easeOut'`
en vez de springs para las transiciones de layout.

- **`Header.jsx`**: nav flotante de una sola fila en todos los breakpoints —
  `rounded-full bg-white/80 backdrop-blur-md border border-neutral-200/50`.
  Buscador y carrito son exactamente la misma lógica de antes, solo cambia el
  chrome.
- **`ProductCard.jsx`**: borde fino, sin sombra pesada; un único badge de
  disponibilidad flotante sobre la imagen (reemplaza las 2 pills de
  sucursal); el whileHover ya no escala/levanta toda la tarjeta, solo la
  imagen hace zoom sutil (`group-hover:scale-105`, también aplicado al
  fallback vectorial en `ProductImage.jsx` para los productos sin foto real).
- **`CategoryGrid.jsx`**: mismo fondo neutro desaturado en las 4 categorías
  (antes cada una tenía un tinte de color distinto); el conteo/disponibilidad
  sigue siendo `aria-hidden` para que el nombre accesible del botón siga
  siendo solo la categoría (p. ej. "Pinturas"), tanto para lectores de
  pantalla como para que los selectores de Playwright
  (`getByRole('button', { name: 'Pinturas', exact: true })`) sigan
  funcionando.

### Homepage: switcher B2C/B2B

No existe un `Home.jsx` separado: la landing vive en `Catalog.jsx` (que también
maneja el carrito, la búsqueda y los filtros de la página "/"), compuesta por
varias secciones:

1. **`Hero.jsx`**: composición asimétrica (texto + panel de estadísticas
   reales del catálogo desplazado) sobre fondo `ink-950`. Switcher "Proyectos
   del Hogar" / "Contratistas y Constructoras" con un indicador animado
   (`layoutId`, mismo patrón que `AdminSidebar`). En modo B2B cambia el copy,
   destaca el botón "Generar Cotización en PDF" (abre `B2BQuoteModal` con el
   carrito actual) y agrega una búsqueda rápida por código SKU sobre el
   catálogo ya cargado por `Catalog.jsx` (sin pegarle otra vez al backend).
2. **`QuickToolsHub.jsx`**: píldoras de acción flotantes (`rounded-full
   shadow-sm border-neutral-200`) sobre el borde del Hero — Calculadora de
   Pintura (abre `PaintCalculatorModal` sin producto vinculado), Cotizador
   B2B Express (abre `B2BQuoteModal`) y una píldora informativa de cobertura
   de despacho.
3. **`TrustBadges.jsx`**: 4 badges de garantía ferretera.
4. **`CategoryGrid.jsx`**: ver sección de sistema de diseño arriba.

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

### Calculadora de Pintura por Superficie

`PaintCalculatorModal.jsx` calcula cuántos galones se necesitan a partir de
ancho, alto, número de puertas/ventanas a descontar y manos de pintura
(`utils/paint.js#computeGallonsNeeded`): superficie neta = (ancho × alto) −
(aberturas × 1,8 m² promedio cada una), multiplicada por las manos, dividida
por un rendimiento de ~37,5 m²/galón (punto medio del rango 35-40) y
redondeada siempre hacia arriba. Accesible desde:

- **La ficha de un producto de Pinturas** (`ProductDetail.jsx`): el botón
  usa el producto de la página.
- **El Simulador de Pintura** (`PaintSimulator.jsx`): usa el producto
  vinculado a la muestra de color seleccionada.

En ambos casos el botón "Añadir X Galones al Carrito" resuelve el stock
vigente justo antes de agregar (`fetchProductWithStock`) y usa
`useCart#addMany`, una variante de `add()` pensada para agregar una cantidad
específica de una sola vez — `add()` no sirve para esto porque llamarlo N
veces seguidas en el mismo ciclo de evento solo agrega 1 unidad (cada llamada
parte del mismo `items` desactualizado de React).

### Venta cruzada inteligente (Cross-Selling)

`CrossSellRecommendations.jsx` recomienda accesorios reales del catálogo
según la categoría del producto (`utils/crossSell.js`):

| Producto ancla                          | Accesorios recomendados                                              |
|------------------------------------------|------------------------------------------------------------------------|
| Pintura                                   | Rodillo Antigota, Brocha 2", Cinta Masking 24mm, Plástico Protector    |
| Herramienta eléctrica (categoría "Línea Construcción" o nombre con ELÉCTRIC/TALADRO/SIERRA/etc.) | Set de Brocas, Extensión Eléctrica 10m, Lentes de Seguridad |

Cada accesorio se resuelve contra `/api/products/search` por keyword al
montar el componente; **si un rubro no existe todavía en el catálogo
importado de Sisgen (p. ej. cinta masking, extensión eléctrica o lentes de
seguridad — el import es casi enteramente de pinturas), esa tarjeta
simplemente no se muestra** en vez de inventar un producto o dejar una
tarjeta vacía. Se usa en `ProductDetail.jsx` (basado en el producto de la
ficha) y en `CartDrawer.jsx` (basado en el primer ítem del carrito para el
que exista una receta, `pickCrossSellAnchor`). El botón "Añadir +$X.XXX"
resuelve el stock vigente al hacer clic antes de agregar al carrito.

### Cotización B2B en PDF

Pensado para maestros y constructoras que compran con el carrito ya armado.
`B2BQuoteModal.jsx` pide datos opcionales del cliente (nombre/empresa, RUT,
email — no se validan, son solo para personalizar el documento) y
`utils/generateQuotePdf.js` arma el PDF con `jspdf` + `jspdf-autotable`:
encabezado con los datos de la empresa y número/fecha de cotización, datos
del cliente, tabla de productos (SKU/descripción/cantidad/precio
unitario/subtotal) y el desglose Subtotal Neto/IVA (19%)/Total General. El
botón **"Descargar Cotización B2B (PDF)"** está en `CartDrawer.jsx` y en el
paso 2 (resumen) de `CheckoutModal.jsx`.

`jspdf`/`jspdf-autotable` arrastran dependencias opcionales pesadas
(html2canvas, DOMPurify — ~380 kB minificados) que no hacen falta para este
uso. `generateQuotePdf.js` las importa con `import()` dinámico, así ese peso
queda en un chunk aparte que solo se descarga cuando alguien abre el
generador de cotizaciones, no en el bundle principal de la tienda.

### Precios por tramos de volumen (B2B)

`utils/pricing.js` define una única tabla de tramos (`VOLUME_TIERS`), que se
usa **idéntica en frontend y backend** — el backend tiene su propia copia
CommonJS en `backend/src/utils/pricing.js`, mismos tramos:

| Cantidad     | Descuento |
|--------------|-----------|
| 1-4 unidades | 0%        |
| 5-19 unidades| 10%       |
| 20+ unidades | 18%       |

- **`ProductDetail.jsx`**: un `QuantityStepper` (+/-) controla la cantidad a
  comprar; una mini-tabla (`VolumeTierTable`) muestra los 3 tramos con precio
  unitario y el ahorro estimado en tiempo real, resaltando el tramo activo. El
  botón "Añadir al carro" usa `useCart#addMany` con la cantidad elegida.
- **`CartDrawer.jsx` / `CheckoutModal.jsx`**: cada línea muestra el precio
  tachado (precio base) junto al precio con descuento y un badge `-X%` cuando
  aplica; el footer suma una fila "Ahorro por volumen" con el ahorro total.
- **`useCart.js`**: `totalPrice` se calcula con `computeLineTotal()` en vez de
  `qty * price` — el ítem del carrito siempre guarda el precio **base** (nunca
  se muta), así el descuento se recalcula solo si la cantidad cambia.
- **Backend (`orders.controller.js`)**: `placeOrder` recalcula el precio por
  tramos con `getTieredUnitPrice(product.price, item.quantity)` usando el
  precio real de la BD, nunca un precio o descuento que venga del cliente —
  es la única fuente de verdad de lo que efectivamente se cobra, y es lo que
  queda guardado en `order_items.price`.

### Logística omnicanal: retiro y despacho express

`useDeliveryPreference.js` (hook, localStorage) y `utils/delivery.js`
(`getDeliveryEta`) sostienen una preferencia de entrega compartida entre
`Header.jsx`, `CartDrawer.jsx` y `CheckoutModal.jsx`, gestionada por
`Catalog.jsx` y expuesta vía `DeliveryLocationSelector.jsx`:

- **Retiro Gratis en Tienda**: Sucursal Vitacura o Sucursal Providencia —
  insignia siempre "Listo para retiro hoy en 30 mins en {sucursal}".
- **Despacho Express Sector Oriente**: Providencia, Vitacura, Las Condes o Lo
  Barnechea — insignia "Entrega Hoy comprando antes de las 14:00" antes del
  corte horario (`DELIVERY_CUTOFF_HOUR = 14`) o "Entrega mañana" después.

`DeliveryLocationSelector.jsx` es un dropdown `rounded-full` con
`AnimatePresence`, visible en el Header (desktop) y arriba del listado de
ítems en `CartDrawer.jsx`. `CheckoutModal.jsx` no repite el selector: al
abrirse, precarga su propio radio "Tipo de entrega" (paso 1) a partir de la
preferencia elegida (`mapPreferenceToDeliveryType`), sin quitarle al cliente
la libertad de cambiarlo ahí mismo.

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

| Ruta               | Página                                                        |
|--------------------|------------------------------------------------------------------|
| `/`                | Catálogo, buscador, filtros, carrito y checkout (cliente final)  |
| `/producto/:id`    | Ficha de producto con meta-tags dinámicos (SEO/OG)                |
| `/admin`           | Panel de administración: Resumen (dashboard/KPIs)                 |
| `/admin/pedidos`   | Gestión de pedidos (estado pendiente/despachado/entregado)        |
| `/admin/catalogo`  | Catálogo completo con edición rápida de precio y stock             |
| `/admin/importar`  | Importación masiva de inventario vía CSV/XLSX                      |

## Panel de Administración (`/admin`)

Todas las rutas `/admin/*` viven bajo `AdminLayout.jsx`, que actúa como
guardia de acceso: si no hay sesión, muestra `AdminLogin.jsx` (contraseña
`garachena2026`) en vez del contenido. Es un **login simulado** — solo
controla qué se muestra en este navegador (`useAdminAuth`, `localStorage`) y
es independiente de la protección real del backend, la clave opcional
`ADMIN_API_KEY` (ver `backend/README.md`). Esa clave del servidor se
configura una sola vez desde un campo en `AdminSidebar.jsx` y la reutilizan
todas las páginas del panel (`X-Admin-Key` en cada llamada admin de `api.js`).

- **Resumen** (`AdminDashboard.jsx`): Bento Grid con pedidos pendientes,
  ventas del día, alerta de stock bajo (≤ 5 unidades) y los últimos 5
  pedidos, desde `GET /api/admin/summary`.
- **Pedidos** (`AdminOrders.jsx`): tabla con documento (boleta/factura + RUT)
  y un selector de estado por fila que llama a `PATCH /api/orders/:id/status`
  con actualización optimista.
- **Catálogo** (`AdminCatalog.jsx`): tabla de los ~1017 productos con
  buscador por SKU/nombre (filtro cliente) y paginación de 20 en 20; el lápiz
  de cada fila abre `AdminProductEditModal.jsx`, que edita precio y stock por
  sucursal vía `PUT /api/products/:id`.
- **Importar** (`AdminImport.jsx`): la herramienta de carga masiva original,
  reubicada dentro del layout del panel.

La transición entre pestañas del sidebar usa un indicador animado con
`layoutId` de Framer Motion, y el contenido de cada página hace fade/slide al
cambiar de ruta (`AnimatePresence` en `AdminLayout.jsx`).

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

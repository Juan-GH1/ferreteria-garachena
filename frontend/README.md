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
        ├── Sidebar.jsx
        ├── ProductGrid.jsx / ProductCard.jsx
        ├── Footer.jsx / WhatsappButton.jsx
        ├── CartDrawer.jsx       # panel lateral animado
        ├── CheckoutModal.jsx    # formulario de 2 pasos + confirmación
        ├── SuccessModal.jsx
        └── AdminPanel.jsx       # equivalente al admin.html original, en /admin
```

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

| Ruta      | Página                                                        |
|-----------|----------------------------------------------------------------|
| `/`       | Catálogo, buscador, carrito y checkout (cliente final)         |
| `/admin`  | Importación masiva de inventario vía CSV/XLSX (uso interno)    |

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

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

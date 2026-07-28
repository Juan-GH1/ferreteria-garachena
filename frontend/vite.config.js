import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // En desarrollo, el frontend llama a rutas relativas /api/... y Vite las
    // reenvía al backend Express. Así el código no necesita conocer el host
    // del backend salvo que se sobreescriba con VITE_API_BASE_URL.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})

import { defineConfig, devices } from '@playwright/test';

// El sandbox trae Chromium preinstalado en /opt/pw-browsers (no hace falta
// `playwright install`); apuntamos ahí directo para evitar una descarga que
// no está permitida por la política de red.
const CHROMIUM_PATH = '/opt/pw-browsers/chromium';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    launchOptions: {
      executablePath: CHROMIUM_PATH,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // El backend (puerto 4000) y el frontend (puerto 5173) son dos servidores
  // separados; ambos se levantan aquí para que `npm run test:e2e` funcione
  // de punta a punta sin pasos manuales previos.
  webServer: [
    {
      command: 'npm start',
      cwd: '../backend',
      url: 'http://localhost:4000/api/products',
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});

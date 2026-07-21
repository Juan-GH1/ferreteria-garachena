import { test, expect } from '@playwright/test';

// Flujo de compra de punta a punta sobre el catálogo real (backend + SQLite):
// Home -> filtrar por Pinturas -> probar el Simulador -> buscar con typo
// ("taldro") -> agregar al carro -> checkout con Factura (RUT válido) ->
// confirmar pedido. Cubre las 5 épicas del sprint en un solo recorrido.
test('compra completa: catálogo, simulador, búsqueda con typo y checkout con factura', async ({ page }) => {
  await page.goto('/');

  // El catálogo real trae 1000+ productos; esperamos a que la primera tanda
  // de tarjetas esté renderizada antes de interactuar.
  await expect(page.locator('button[title="Añadir al carro"]').first()).toBeVisible({ timeout: 15_000 });

  // --- Home -> filtrar por Pinturas (CategoryGrid) ---
  await page.getByRole('button', { name: 'Pinturas', exact: true }).click();
  await expect(page.getByText(/de \d+ productos/)).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /^Pinturas \d/ })).toBeChecked();

  // --- Probar el Simulador de Pintura ---
  await page.getByRole('heading', { name: 'Simulador de Pintura' }).scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Grafito Urbano' }).click();
  await expect(page.getByText('Grafito Urbano')).toBeVisible();
  await expect(page.getByText(/Comprar este color en 1 Galón|Ver ficha del producto/)).toBeVisible({ timeout: 10_000 });

  // --- Buscar con un typo ("taldro" en vez de "taladro") ---
  const searchInput = page.getByPlaceholder(/¿Qué herramienta o pintura buscas hoy/);
  await searchInput.fill('taldro');
  await expect(page.getByText(/Mostrando resultados aproximados/)).toBeVisible({ timeout: 10_000 });
  const firstResult = page.locator('ul.divide-y.divide-slate-100 li button').first();
  const resultName = await firstResult.locator('span.font-bold').innerText();
  await firstResult.click();

  // Al elegir un resultado la grilla se reduce al producto seleccionado.
  await expect(page.getByRole('heading', { name: resultName, exact: true })).toBeVisible();

  // --- Agregar al carrito ---
  await page.locator('button[title="Añadir al carro"]').first().click();

  // --- Ir al checkout ---
  await page.locator('[title="Ver carrito"]:visible').first().click();
  await page.getByRole('button', { name: 'Proceder al Pago' }).click();

  // --- Paso 1: datos del cliente ---
  await page.locator('form input[type="text"]').first().fill('Juan Pérez');
  await page.getByPlaceholder('12345678-9').fill('12345678-5');
  await page.locator('form input[type="email"]').fill('juan.perez@example.com');
  await page.getByPlaceholder('+56 9 1234 5678').fill('+56 9 1234 5678');

  // Documento tributario: Factura, con RUT de empresa válido
  await page.getByRole('button', { name: 'Factura', exact: true }).click();
  await page.getByPlaceholder('76543210-3').fill('76543210-3');
  await page.getByPlaceholder('Construcción').fill('Construcción');
  await page.getByPlaceholder('Empresa SpA').fill('Ferretería Garachena Test SpA');
  await page.getByPlaceholder('Av. Providencia 1234, Of. 56').fill('Av. Providencia 1234, Of. 56');

  await page.getByRole('button', { name: 'Continuar' }).click();

  // --- Paso 2: resumen y confirmación ---
  await expect(page.getByText(/Factura · Ferretería Garachena Test SpA/)).toBeVisible();
  await page.getByRole('button', { name: /Confirmar Pedido/ }).click();

  // --- Pedido confirmado ---
  await expect(page.getByText(/¡Pedido #\d+ confirmado!/)).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Aceptar' }).click();
});

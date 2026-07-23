// Tabla de tramos de descuento por volumen (B2B). El mismo esquema vive
// espejado en backend/src/utils/pricing.js: el frontend lo usa para mostrar
// precios/ahorros en tiempo real en la ficha de producto y el carrito; el
// backend lo usa para cobrar el monto real al crear la orden (nunca confía
// en un precio calculado en el cliente).
export const VOLUME_TIERS = [
  { min: 1, max: 4, discount: 0, label: '1-4 unidades' },
  { min: 5, max: 19, discount: 0.1, label: '5-19 unidades' },
  { min: 20, max: Infinity, discount: 0.18, label: '20+ unidades' },
];

export function getTierForQuantity(qty) {
  return VOLUME_TIERS.find((tier) => qty >= tier.min && qty <= tier.max) || VOLUME_TIERS[0];
}

/** Precio unitario con el descuento del tramo aplicado (redondeado al peso). */
export function getTieredUnitPrice(basePrice, qty) {
  const tier = getTierForQuantity(qty);
  return Math.round(basePrice * (1 - tier.discount));
}

/** Desglose completo de una línea de carrito/pedido para una cantidad dada. */
export function computeLineTotal(basePrice, qty) {
  const tier = getTierForQuantity(qty);
  const unitPrice = getTieredUnitPrice(basePrice, qty);
  const lineTotal = unitPrice * qty;
  const fullTotal = basePrice * qty;
  return { tier, unitPrice, lineTotal, fullTotal, savings: fullTotal - lineTotal };
}

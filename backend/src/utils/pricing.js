// Tabla de tramos de descuento por volumen (B2B). Espejo exacto de
// frontend/src/utils/pricing.js: el frontend la usa para mostrar
// precios/ahorros en tiempo real, este archivo es la fuente de verdad para
// el monto realmente cobrado al crear una orden (orders.controller.js). El
// precio nunca se toma del cliente, solo la cantidad — el descuento se
// recalcula aquí de forma determinística a partir del precio real en BD.
const VOLUME_TIERS = [
  { min: 1, max: 4, discount: 0 },
  { min: 5, max: 19, discount: 0.1 },
  { min: 20, max: Infinity, discount: 0.18 },
];

function getTierForQuantity(qty) {
  return VOLUME_TIERS.find((tier) => qty >= tier.min && qty <= tier.max) || VOLUME_TIERS[0];
}

/** Precio unitario con el descuento del tramo aplicado (redondeado al peso). */
function getTieredUnitPrice(basePrice, qty) {
  const tier = getTierForQuantity(qty);
  return Math.round(basePrice * (1 - tier.discount));
}

module.exports = { VOLUME_TIERS, getTierForQuantity, getTieredUnitPrice };

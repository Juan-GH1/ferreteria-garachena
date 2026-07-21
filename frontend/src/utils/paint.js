// Utilidades compartidas por todo lo relacionado a pintura: el Simulador, la
// Calculadora y el fallback vectorial de ProductImage usan la misma noción de
// "categoría pintura" y el mismo patrón para detectar formato galón.
export function isPaintCategory(category) {
  return category === 'Pinturas' || category === 'Pinturas & Tintometría';
}

export const GALON_REGEX = /GLN|GAL[OÓ]N/i;

// Rendimiento promedio de una pintura de calidad media (35-40 m² por galón a
// una mano); se usa el punto medio. Área promedio a descontar por cada
// puerta o ventana estándar.
const YIELD_PER_GALLON_M2 = 37.5;
const AVG_OPENING_AREA_M2 = 1.8;

/**
 * Calcula cuántos galones de pintura se necesitan para cubrir una superficie.
 * Redondea siempre hacia arriba (no se puede comprar medio galón) y nunca
 * baja de 1 galón si hay superficie neta que cubrir.
 */
export function computeGallonsNeeded({ width, height, openings, coats }) {
  const grossArea = Math.max(0, Number(width) || 0) * Math.max(0, Number(height) || 0);
  const discountArea = Math.max(0, Number(openings) || 0) * AVG_OPENING_AREA_M2;
  const netArea = Math.max(0, grossArea - discountArea);
  const effectiveCoats = Math.max(1, Math.round(Number(coats) || 1));
  const areaToCoat = netArea * effectiveCoats;
  const gallonsExact = areaToCoat / YIELD_PER_GALLON_M2;
  const gallonsToBuy = netArea > 0 ? Math.max(1, Math.ceil(gallonsExact)) : 0;

  return { grossArea, discountArea, netArea, areaToCoat, gallonsExact, gallonsToBuy, coats: effectiveCoats };
}

export { YIELD_PER_GALLON_M2, AVG_OPENING_AREA_M2 };

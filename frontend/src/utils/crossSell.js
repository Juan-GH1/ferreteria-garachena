import { isPaintCategory } from './paint';

// Términos de búsqueda verificados contra el catálogo real (ver notas del
// sprint): algunos rubros (cinta masking, extensión eléctrica, lentes de
// seguridad) no existen todavía en el catálogo importado de Sisgen —
// CrossSellRecommendations simplemente omite cualquier accesorio sin match
// real en vez de inventar un producto o mostrar una tarjeta vacía.
const PAINT_ACCESSORIES = [
  { label: 'Rodillo Antigota', searchTerm: 'RODILLO' },
  { label: 'Brocha 2"', searchTerm: 'BROCHA 2' },
  { label: 'Cinta Masking 24mm', searchTerm: 'CINTA MASKING' },
  { label: 'Plástico Protector', searchTerm: 'PROTECTOR PLASTICO' },
];

const POWER_TOOL_ACCESSORIES = [
  { label: 'Set de Brocas', searchTerm: 'JUEGO BROCA' },
  { label: 'Extensión Eléctrica 10m', searchTerm: 'EXTENSION ELECTRICA' },
  { label: 'Lentes de Seguridad', searchTerm: 'LENTES SEGURIDAD' },
];

const POWER_TOOL_REGEX = /EL[ÉE]CTRIC|TALADRO|ROTOMARTILLO|ESMERIL|LIJADORA|SIERRA|ATORNILLADOR|COMPRESOR/i;

function isPowerTool(product) {
  return product.category === 'Línea Construcción' || POWER_TOOL_REGEX.test(product.name || '');
}

/** Devuelve la receta de accesorios recomendados para un producto, o null si no aplica ninguna. */
export function crossSellRecipeFor(product) {
  if (!product) return null;
  if (isPaintCategory(product.category)) return PAINT_ACCESSORIES;
  if (isPowerTool(product)) return POWER_TOOL_ACCESSORIES;
  return null;
}

/** Elige, dentro de una lista de ítems del carrito, el primero para el que exista una receta de cross-sell. */
export function pickCrossSellAnchor(items) {
  return items.find((item) => crossSellRecipeFor(item) !== null) || null;
}

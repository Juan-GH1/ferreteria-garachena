/**
 * Utilidades de búsqueda difusa para el buscador del catálogo.
 * Sin dependencias: a la escala actual (cientos a miles de productos) el
 * scoring en JS por request es más simple y suficiente. Si el catálogo
 * supera ~20-30k productos, migrar a SQLite FTS5 (ver README).
 */

/** Minúsculas + sin tildes: "Látex" -> "latex". */
function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Distancia de Levenshtein acotada: retorna Infinity apenas se sabe que la
 * distancia superará maxDistance, para no pagar el costo completo en tokens
 * que claramente no coinciden.
 */
function boundedLevenshtein(a, b, maxDistance) {
  if (Math.abs(a.length - b.length) > maxDistance) return Infinity;
  if (a === b) return 0;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      if (current[j] < rowMin) rowMin = current[j];
    }
    if (rowMin > maxDistance) return Infinity;
    previous = current;
  }

  return previous[b.length] <= maxDistance ? previous[b.length] : Infinity;
}

/** Tolerancia de tipeo según largo del token: corta = 1 error, larga = 2. */
function toleranceFor(token) {
  return token.length <= 4 ? 1 : 2;
}

/**
 * Mejor distancia entre un token de la consulta y un token del producto.
 * Compara contra el token completo y contra su prefijo del mismo largo, para
 * que una palabra a medio escribir ("talad") también calce con "taladro".
 */
function tokenDistance(queryToken, productToken) {
  const tolerance = toleranceFor(queryToken);
  const direct = boundedLevenshtein(queryToken, productToken, tolerance);
  if (direct === 0) return 0;

  if (productToken.length > queryToken.length) {
    const prefix = productToken.slice(0, queryToken.length);
    return Math.min(direct, boundedLevenshtein(queryToken, prefix, tolerance));
  }
  return direct;
}

/**
 * Puntúa un producto contra la consulta. Retorna { score, fuzzy } o null si
 * no hay coincidencia. Capas (mayor a menor):
 *   100 prefijo exacto del nombre
 *    80 substring en el nombre
 *    60 substring en marca o categoría
 *    40- todos los tokens de la consulta calzan fuzzy con algún token del
 *        producto (se descuenta la distancia acumulada)
 */
function scoreProduct(product, normalizedQuery, queryTokens) {
  const name = normalizeText(product.name);
  const brand = normalizeText(product.brand);
  const category = normalizeText(product.category);

  if (name.startsWith(normalizedQuery)) return { score: 100, fuzzy: false };
  if (name.includes(normalizedQuery)) return { score: 80, fuzzy: false };
  if (brand.includes(normalizedQuery) || category.includes(normalizedQuery)) return { score: 60, fuzzy: false };

  const productTokens = `${name} ${brand} ${category}`.split(/\s+/).filter(Boolean);

  let totalDistance = 0;
  for (const queryToken of queryTokens) {
    let best = Infinity;
    for (const productToken of productTokens) {
      const distance = tokenDistance(queryToken, productToken);
      if (distance < best) best = distance;
      if (best === 0) break;
    }
    if (best === Infinity) return null; // un token sin match = producto descartado
    totalDistance += best;
  }

  return { score: 40 - totalDistance * 5, fuzzy: true };
}

/**
 * Busca en la lista de productos y retorna hasta `limit` resultados ordenados
 * por relevancia, junto con el flag `approximate` (true si TODOS los
 * resultados provienen de coincidencia fuzzy, es decir, hubo typo probable).
 */
function fuzzySearch(products, query, limit = 8) {
  const normalizedQuery = normalizeText(query).trim();
  if (!normalizedQuery) return { results: [], approximate: false };

  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

  const scored = [];
  for (const product of products) {
    const match = scoreProduct(product, normalizedQuery, queryTokens);
    if (match) scored.push({ product, ...match });
  }

  scored.sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, 'es'));

  const top = scored.slice(0, limit);
  const approximate = top.length > 0 && top.every((entry) => entry.fuzzy);

  return { results: top.map((entry) => entry.product), approximate };
}

module.exports = { fuzzySearch, normalizeText, boundedLevenshtein };

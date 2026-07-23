// Hora límite para prometer despacho el mismo día en el sector oriente.
const DELIVERY_CUTOFF_HOUR = 14;

/**
 * Insignia de tiempo estimado según la preferencia de logística actual.
 * Retiro: siempre "hoy" (tiempo de preparación corto, independiente de la
 * hora). Despacho: se evalúa contra la hora real del navegador — antes del
 * corte promete entrega hoy, después promete para el día siguiente.
 */
export function getDeliveryEta(preference) {
  if (preference.type === 'pickup') {
    return { label: `Listo para retiro hoy en 30 min en ${preference.branch}`, tone: 'success' };
  }

  const isBeforeCutoff = new Date().getHours() < DELIVERY_CUTOFF_HOUR;
  if (isBeforeCutoff) {
    return { label: `Entrega hoy comprando antes de las ${DELIVERY_CUTOFF_HOUR}:00`, tone: 'success' };
  }
  return { label: 'Entrega mañana antes de las 18:00', tone: 'neutral' };
}

export { DELIVERY_CUTOFF_HOUR };

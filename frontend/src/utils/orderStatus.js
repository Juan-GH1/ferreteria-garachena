// Pipeline de gestión de pedidos del panel admin (ver backend/src/controllers/orders.controller.js).
export const ORDER_STATUSES = ['pendiente', 'despachado', 'entregado'];

export const STATUS_LABELS = {
  pendiente: 'Pendiente',
  despachado: 'Despachado',
  entregado: 'Entregado',
};

export const STATUS_STYLES = {
  pendiente: 'bg-amber-50 text-amber-700 ring-amber-100',
  despachado: 'bg-sky-50 text-sky-700 ring-sky-100',
  entregado: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
};

// Pedidos creados antes del pipeline admin pueden traer valores legados
// (p. ej. 'confirmed'); se tratan visualmente como "Pendiente".
export function statusLabel(status) {
  return STATUS_LABELS[status] || STATUS_LABELS.pendiente;
}

export function statusStyle(status) {
  return STATUS_STYLES[status] || STATUS_STYLES.pendiente;
}

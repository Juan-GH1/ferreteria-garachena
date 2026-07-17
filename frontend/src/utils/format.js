const priceFormatter = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' });

export const formatPrice = (value) => priceFormatter.format(value);

export function totalStockOf(product) {
  const stock = product?.stock || {};
  return (stock.Providencia ?? 0) + (stock.Vitacura ?? 0);
}

export function stockTone(qty) {
  if (qty <= 0) return { label: 'Agotado', className: 'text-red-600 font-bold' };
  if (qty <= 5) return { label: `${qty} unid. (pocas)`, className: 'text-amber-600 font-bold' };
  return { label: `${qty} unid.`, className: 'text-emerald-600 font-bold' };
}

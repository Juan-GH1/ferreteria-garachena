import { AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';

export default function ProductGrid({
  products,
  matchCount,
  totalCount,
  loading,
  error,
  isFiltered,
  filtersActive,
  onClearFilters,
  onClearFilter,
  onShowMore,
  onAdd,
}) {
  const countLabel =
    filtersActive && totalCount > matchCount
      ? `${matchCount} de ${totalCount} productos`
      : `${matchCount} producto${matchCount === 1 ? '' : 's'}`;
  const hasMore = products.length < matchCount;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-card">
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500 font-semibold">
            Mostrando <span className="text-brand-blue">{loading ? '...' : countLabel}</span>
          </p>
          {isFiltered && (
            <button type="button" onClick={onClearFilter} className="text-xs font-bold text-brand-blue hover:underline">
              Ver todo el catálogo
            </button>
          )}
        </div>
        <select className="text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-brand-blue">
          <option>Ordenar por: Destacados</option>
          <option>Precio: Menor a Mayor</option>
          <option>Precio: Mayor a Menor</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading && <p className="col-span-full text-center text-slate-400 font-semibold py-12">Cargando productos...</p>}

        {!loading && error && <p className="col-span-full text-center text-red-500 font-semibold py-12">{error}</p>}

        {!loading && !error && matchCount === 0 && (
          <div className="col-span-full text-center py-12 space-y-2">
            <p className="text-slate-400 font-semibold">
              {filtersActive ? 'Ningún producto coincide con los filtros seleccionados.' : 'No se encontraron productos.'}
            </p>
            {filtersActive && (
              <button type="button" onClick={onClearFilters} className="text-sm font-bold text-brand-blue hover:underline">
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {!loading && !error && (
          <AnimatePresence mode="popLayout">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={onAdd} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {!loading && !error && hasMore && (
        <div className="text-center">
          <button
            type="button"
            onClick={onShowMore}
            className="px-6 py-3 rounded-xl border-2 border-brand-blue text-brand-blue font-bold text-sm hover:bg-brand-blueLight transition-colors"
          >
            Mostrar más ({matchCount - products.length} restantes)
          </button>
        </div>
      )}
    </section>
  );
}

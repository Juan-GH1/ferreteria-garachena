import { AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';

export default function ProductGrid({ products, loading, error, isFiltered, onClearFilter, onAdd }) {
  const count = products.length;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500 font-semibold">
            Mostrando <span className="text-brand-blue">{loading ? '...' : `${count} producto${count === 1 ? '' : 's'}`}</span>
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

        {!loading && !error && count === 0 && (
          <p className="col-span-full text-center text-slate-400 font-semibold py-12">No se encontraron productos.</p>
        )}

        {!loading && !error && (
          <AnimatePresence mode="popLayout">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={onAdd} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}

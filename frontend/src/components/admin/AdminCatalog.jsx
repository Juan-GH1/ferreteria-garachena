import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronLeft, ChevronRight, Pencil, Search } from 'lucide-react';
import { fetchProducts } from '../../api';
import { formatPrice } from '../../utils/format';
import { useToast } from '../../hooks/useToast';
import ProductImage from '../ProductImage';
import AdminProductEditModal from './AdminProductEditModal';

const PAGE_SIZE = 20;

function StockCell({ qty }) {
  const tone = qty <= 0 ? 'text-rose-600' : qty <= 5 ? 'text-amber-600' : 'text-slate-700';
  return <span className={`font-bold tabular-nums ${tone}`}>{qty}</span>;
}

export default function AdminCatalog() {
  const showToast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => setError('No se pudo cargar el catálogo. Verifica que el backend esté corriendo.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (product) => product.name.toLowerCase().includes(term) || (product.sku || '').toLowerCase().includes(term)
    );
  }, [products, query]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSaved(updatedProduct) {
    setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p)));
    showToast(`"${updatedProduct.name}" actualizado correctamente.`);
    setEditingProduct(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-navy-900">Catálogo</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {loading ? 'Cargando...' : `${filtered.length} de ${products.length} productos`}
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por SKU o nombre..."
            className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
      </div>

      {loading && <p className="text-sm text-slate-400 font-semibold py-12 text-center">Cargando catálogo...</p>}

      {!loading && error && (
        <div className="bg-white rounded-2xl shadow-soft ring-1 ring-slate-900/5 p-6 flex items-start gap-3 text-rose-600">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-soft ring-1 ring-slate-900/5 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-2xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Producto</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Categoría</th>
                  <th className="px-5 py-3">Precio</th>
                  <th className="px-5 py-3">Providencia</th>
                  <th className="px-5 py-3">Vitacura</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageItems.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 max-w-xs">
                        <ProductImage product={product} loading="lazy" className="w-10 h-10 rounded-lg shrink-0" />
                        <span className="font-semibold text-slate-700 truncate">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400 font-mono text-xs whitespace-nowrap">{product.sku || '—'}</td>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{product.category}</td>
                    <td className="px-5 py-3 font-bold text-slate-800 tabular-nums whitespace-nowrap">{formatPrice(product.price)}</td>
                    <td className="px-5 py-3">
                      <StockCell qty={product.stock?.Providencia ?? 0} />
                    </td>
                    <td className="px-5 py-3">
                      <StockCell qty={product.stock?.Vitacura ?? 0} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingProduct(product)}
                        title="Editar precio y stock"
                        className="p-2 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blueLight transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400 font-semibold">
                      Ningún producto coincide con "{query}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-400">
                Página {page} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      <AdminProductEditModal product={editingProduct} onClose={() => setEditingProduct(null)} onSaved={handleSaved} />
    </div>
  );
}

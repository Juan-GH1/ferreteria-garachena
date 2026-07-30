import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Sparkles } from 'lucide-react';
import { fetchProductWithStock, searchProducts } from '../api';
import { formatPrice, totalStockOf } from '../utils/format';
import { crossSellRecipeFor } from '../utils/crossSell';
import ProductImage from './ProductImage';

/**
 * Venta cruzada inteligente: dado un producto "ancla" (una pintura o una
 * herramienta eléctrica), resuelve accesorios reales del catálogo por
 * keyword y ofrece agregarlos al carrito con un clic. El stock se resuelve
 * recién al hacer clic en "Añadir" (los resultados de búsqueda no lo
 * incluyen), así el carrito siempre valida contra disponibilidad real.
 */
export default function CrossSellRecommendations({ product, onAdd, excludeIds = [] }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);

  const recipe = crossSellRecipeFor(product);
  const recipeKey = recipe ? recipe.map((entry) => entry.searchTerm).join('|') : '';

  useEffect(() => {
    if (!recipe) {
      setItems([]);
      return;
    }
    let cancelled = false;
    const exclude = new Set(excludeIds);
    setLoading(true);

    Promise.all(
      recipe.map((entry) =>
        searchProducts(entry.searchTerm)
          .then(({ products }) => products.find((p) => !exclude.has(p.id)) || null)
          .catch(() => null)
      )
    ).then((resolved) => {
      if (cancelled) return;
      setItems(resolved.filter(Boolean));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recipeKey/excludeIds derivan de product, no hace falta trackear los objetos completos
  }, [recipeKey, product?.id]);

  if (!recipe) return null;
  if (!loading && items.length === 0) return null;

  async function handleAdd(item) {
    setAddingId(item.id);
    try {
      const fresh = await fetchProductWithStock(item.id);
      onAdd({ ...fresh, stock: totalStockOf(fresh) });
    } catch {
      // El toast de error ya lo maneja useCart/api en el flujo normal; aquí
      // simplemente dejamos que el usuario reintente si la red falló.
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5">
      <h3 className="text-sm font-black tracking-tight text-navy-900 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-brand-blue" /> Complementa tu compra
      </h3>

      <div className="flex gap-3 mt-4 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {loading && items.length === 0
          ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="shrink-0 w-32 h-40 rounded-xl bg-slate-100 animate-pulse" />)
          : items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0 w-32 snap-start bg-slate-50 rounded-xl border border-slate-100 p-2.5 flex flex-col"
              >
                <ProductImage product={item} loading="lazy" className="aspect-square rounded-lg" />
                <p className="text-2xs font-bold text-slate-700 leading-snug mt-2 line-clamp-2 min-h-[2.2em]">{item.name}</p>
                <button
                  type="button"
                  onClick={() => handleAdd(item)}
                  disabled={addingId === item.id}
                  className="mt-auto pt-2 w-full flex items-center justify-center gap-1 text-10 font-bold text-brand-blue bg-brand-blueLight hover:bg-blue-100 rounded-lg py-2 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-brand-blue"
                >
                  <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                  {addingId === item.id ? 'Agregando...' : `Añadir +${formatPrice(item.price)}`}
                </button>
              </motion.div>
            ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Store, Truck } from 'lucide-react';
import { fetchProductWithStock } from '../api';
import { formatPrice, stockTone, totalStockOf } from '../utils/format';
import { useCart } from '../hooks/useCart';
import { useMeta } from '../hooks/useMeta';
import { useToast } from '../hooks/useToast';
import Footer from './Footer';
import WhatsappButton from './WhatsappButton';

function BranchStockRow({ branch, qty }) {
  const tone = stockTone(qty);
  return (
    <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-600">
        <Store className="w-4 h-4 text-brand-blue" /> {branch}
      </span>
      <span className={`text-sm ${tone.className}`}>{tone.label}</span>
    </div>
  );
}

/**
 * Ficha de producto con ruta propia (/producto/:id): título, descripción y
 * OpenGraph dinámicos vía useMeta. El carrito se comparte con el catálogo a
 * través de localStorage (useCart lee el estado al montar).
 */
export default function ProductDetail() {
  const { id } = useParams();
  const showToast = useToast();
  const cart = useCart(showToast);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchProductWithStock(id)
      .then((data) => {
        if (!cancelled) setProduct(data);
      })
      .catch(() => {
        if (!cancelled) setError('No se encontró el producto solicitado.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useMeta({
    title: product ? `${product.name} · Ferretería Garachena` : undefined,
    description: product
      ? `${product.description || product.name} Precio: ${formatPrice(product.price)} IVA incluido. Retiro en Providencia y Vitacura o despacho express en Santiago.`
      : undefined,
    image: product?.image_url,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    type: 'product',
  });

  const stock = product ? totalStockOf(product) : 0;
  const outOfStock = stock <= 0;

  return (
    <div className="bg-brand-light text-slate-800 font-sans antialiased flex flex-col min-h-screen">
      <header className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-bold text-brand-blue hover:underline">
            <ArrowLeft className="w-4 h-4" /> Volver al catálogo
          </Link>
          <Link to="/" className="relative p-2 text-slate-600 hover:text-brand-blue" title="Ver carrito en el catálogo">
            <ShoppingCart className="w-5 h-5" />
            {cart.totalQty > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                {cart.totalQty}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 flex-grow w-full">
        {loading && <p className="text-center text-slate-400 font-semibold py-16">Cargando producto...</p>}

        {!loading && error && (
          <div className="text-center py-16 space-y-3">
            <p className="text-red-500 font-semibold">{error}</p>
            <Link to="/" className="inline-block text-sm font-bold text-brand-blue hover:underline">
              Volver al catálogo
            </Link>
          </div>
        )}

        {!loading && product && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start"
          >
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm aspect-square flex items-center justify-center p-10">
              {/* Imagen principal: eager + fetchpriority alta, es el LCP de la página */}
              <img
                src={product.image_url || ''}
                alt={product.name}
                fetchPriority="high"
                decoding="async"
                className="object-contain max-h-full max-w-full"
              />
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{product.brand || ''}</p>
                <h1 className="text-2xl font-black text-brand-dark mt-1">{product.name}</h1>
                <p className="text-sm text-slate-500 font-semibold mt-1">{product.category}</p>
              </div>

              {product.description && <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>}

              <div>
                <span className="text-3xl font-black text-brand-dark">{formatPrice(product.price)}</span>
                <p className="text-xs text-slate-400 font-bold">Incluye IVA</p>
              </div>

              <div className="space-y-2">
                <BranchStockRow branch="Providencia" qty={product.stock?.Providencia ?? 0} />
                <BranchStockRow branch="Vitacura" qty={product.stock?.Vitacura ?? 0} />
              </div>

              <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                <Truck className="w-4 h-4" /> Despacho Express en Santiago · Retiro en tienda gratis
              </div>

              <motion.button
                type="button"
                whileHover={outOfStock ? undefined : { scale: 1.02 }}
                whileTap={{ scale: outOfStock ? 1 : 0.97 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                disabled={outOfStock}
                onClick={() => cart.add({ ...product, stock })}
                className="w-full flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blueDark text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-brand-blue"
              >
                <ShoppingCart className="w-5 h-5" />
                {outOfStock ? 'Sin stock disponible' : 'Añadir al carro'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
      <WhatsappButton />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Truck } from 'lucide-react';
import { fetchProductWithStock } from '../api';
import { formatPrice, totalStockOf } from '../utils/format';
import { useCart } from '../hooks/useCart';
import { useMeta } from '../hooks/useMeta';
import { useToast } from '../hooks/useToast';
import Footer from './Footer';
import WhatsappButton from './WhatsappButton';

function StockBadge({ branch, qty }) {
  const tone =
    qty <= 0
      ? { pill: 'bg-rose-50 text-rose-600 ring-rose-100', dot: 'bg-rose-400', label: 'Agotado' }
      : qty <= 5
        ? { pill: 'bg-amber-50 text-amber-700 ring-amber-100', dot: 'bg-amber-400', label: `${qty} unidades` }
        : { pill: 'bg-emerald-50 text-emerald-700 ring-emerald-100', dot: 'bg-emerald-400', label: `${qty} unidades` };

  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm font-semibold text-slate-600">{branch}</span>
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${tone.pill}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
        {tone.label}
      </span>
    </div>
  );
}

/** Skeleton elegante mientras llega el producto: misma estructura, pulso suave. */
function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start animate-pulse" data-testid="detail-skeleton">
      <div className="bg-slate-100 rounded-3xl aspect-square" />
      <div className="space-y-5 pt-2">
        <div className="h-3 w-24 bg-slate-100 rounded-full" />
        <div className="space-y-2">
          <div className="h-7 w-4/5 bg-slate-100 rounded-lg" />
          <div className="h-7 w-3/5 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-4 w-32 bg-slate-100 rounded-full" />
        <div className="h-10 w-40 bg-slate-100 rounded-lg" />
        <div className="h-24 w-full bg-slate-100 rounded-2xl" />
        <div className="h-13 w-full bg-slate-100 rounded-2xl" />
      </div>
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
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setImageLoaded(false);
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
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
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
        {loading && <DetailSkeleton />}

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
            <div className="relative bg-gradient-to-b from-white to-slate-50 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] aspect-square flex items-center justify-center p-10 overflow-hidden">
              {/* Skeleton de la imagen hasta que termina de descargar */}
              {!imageLoaded && <div className="absolute inset-6 rounded-2xl bg-slate-100 animate-pulse" aria-hidden />}
              {/* Imagen principal: eager + fetchpriority alta, es el LCP de la página */}
              <motion.img
                src={product.image_url || ''}
                alt={product.name}
                fetchPriority="high"
                decoding="async"
                onLoad={() => setImageLoaded(true)}
                initial={false}
                animate={{ opacity: imageLoaded ? 1 : 0, scale: imageLoaded ? 1 : 0.97 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="relative object-contain max-h-full max-w-full drop-shadow-sm"
              />
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.16em]">{product.brand || 'Garachena'}</p>
                <h1 className="text-[26px] leading-tight font-black tracking-tight text-slate-900 mt-1.5">{product.name}</h1>
                <p className="text-sm text-slate-400 font-medium mt-1">{product.category}</p>
              </div>

              {product.description && <p className="text-[15px] text-slate-600 leading-relaxed">{product.description}</p>}

              <div className="flex items-baseline gap-2">
                <span className="text-[34px] font-black tracking-tight text-slate-900 tabular-nums">{formatPrice(product.price)}</span>
                <span className="text-xs text-slate-400 font-semibold">IVA incluido</span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-soft px-5 divide-y divide-slate-100">
                <StockBadge branch="Sucursal Providencia" qty={product.stock?.Providencia ?? 0} />
                <StockBadge branch="Sucursal Vitacura" qty={product.stock?.Vitacura ?? 0} />
              </div>

              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">
                <Truck className="w-4 h-4 text-brand-blue" />
                Despacho Express en Santiago · Retiro en tienda gratis
              </div>

              <motion.button
                type="button"
                whileHover={outOfStock ? undefined : { scale: 1.02, y: -1 }}
                whileTap={{ scale: outOfStock ? 1 : 0.97 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                disabled={outOfStock}
                onClick={() => cart.add({ ...product, stock })}
                className="w-full flex items-center justify-center gap-2.5 bg-brand-blue hover:bg-brand-blueDark text-white font-bold tracking-tight py-4 rounded-2xl shadow-lg shadow-brand-blue/25 hover:shadow-xl hover:shadow-brand-blue/30 transition-all duration-300 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
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

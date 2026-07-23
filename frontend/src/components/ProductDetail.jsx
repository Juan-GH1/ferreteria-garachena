import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calculator, Layers, Minus, Plus, ShoppingCart, Truck } from 'lucide-react';
import { fetchProductWithStock } from '../api';
import { formatPrice, totalStockOf } from '../utils/format';
import { isPaintCategory } from '../utils/paint';
import { VOLUME_TIERS, computeLineTotal } from '../utils/pricing';
import { useCart } from '../hooks/useCart';
import { useMeta } from '../hooks/useMeta';
import { useToast } from '../hooks/useToast';
import CrossSellRecommendations from './CrossSellRecommendations';
import Footer from './Footer';
import PaintCalculatorModal from './PaintCalculatorModal';
import ProductImage from './ProductImage';
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

/** Stepper de cantidad acotado por stock, mismo lenguaje visual que el del carrito. */
function QuantityStepper({ qty, onChange, max }) {
  return (
    <div className="inline-flex items-center rounded-full bg-neutral-100 ring-1 ring-inset ring-neutral-200/70">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, qty - 1))}
        disabled={qty <= 1}
        title="Restar unidad"
        className="w-9 h-9 flex items-center justify-center rounded-full text-neutral-500 hover:text-brand-blue disabled:opacity-30 disabled:hover:text-neutral-500 transition-colors"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="text-[14px] font-semibold w-10 text-center tabular-nums">{qty}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, qty + 1))}
        disabled={qty >= max}
        title="Sumar unidad"
        className="w-9 h-9 flex items-center justify-center rounded-full text-neutral-500 hover:text-brand-blue disabled:opacity-30 disabled:hover:text-neutral-500 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/**
 * Mini-tabla de precios por volumen (motor de descuentos B2B): 3 tramos con
 * el precio unitario resultante, resaltando el tramo en el que cae la
 * cantidad seleccionada. El ahorro se calcula con la misma función que usa
 * el carrito (utils/pricing.js), así los números coinciden en todo el sitio.
 */
function VolumeTierTable({ basePrice, qty }) {
  const { unitPrice, savings, tier } = computeLineTotal(basePrice, qty);

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100">
        <p className="text-[13px] font-semibold text-neutral-900 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-brand-blue" /> Precio por volumen
        </p>
      </div>
      <ul className="divide-y divide-neutral-100">
        {VOLUME_TIERS.map((t) => {
          const tierUnitPrice = Math.round(basePrice * (1 - t.discount));
          const active = t.label === tier.label;
          return (
            <li key={t.label} className={`flex items-center justify-between px-4 py-2.5 text-[13px] ${active ? 'bg-brand-blueLight' : ''}`}>
              <span className={`font-medium ${active ? 'text-brand-blue' : 'text-neutral-600'}`}>{t.label}</span>
              <span className="flex items-center gap-2">
                {t.discount > 0 && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    -{Math.round(t.discount * 100)}%
                  </span>
                )}
                <span className={`font-semibold tabular-nums ${active ? 'text-brand-blue' : 'text-neutral-900'}`}>{formatPrice(tierUnitPrice)}</span>
              </span>
            </li>
          );
        })}
      </ul>
      {savings > 0 && (
        <p className="px-4 py-2.5 text-[12px] font-medium text-emerald-700 bg-emerald-50 border-t border-emerald-100">
          Ahorras {formatPrice(savings)} comprando {qty} unidades ({Math.round(tier.discount * 100)}% de descuento) · {formatPrice(unitPrice)} c/u
        </p>
      )}
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
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setQty(1);
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
            {/* Imagen principal: eager + fetchpriority alta, es el LCP de la página */}
            <ProductImage
              product={product}
              loading="eager"
              fetchPriority="high"
              skeleton
              className="aspect-square rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            />

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

              {!outOfStock && <VolumeTierTable basePrice={product.price} qty={qty} />}

              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Cantidad</span>
                <QuantityStepper qty={qty} onChange={setQty} max={Math.max(1, stock)} />
              </div>

              <motion.button
                type="button"
                whileHover={outOfStock ? undefined : { scale: 1.02, y: -1 }}
                whileTap={{ scale: outOfStock ? 1 : 0.97 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                disabled={outOfStock}
                onClick={() => cart.addMany({ ...product, stock }, qty)}
                className="w-full flex items-center justify-center gap-2.5 bg-brand-blue hover:bg-brand-blueDark text-white font-bold tracking-tight py-4 rounded-2xl shadow-lg shadow-brand-blue/25 hover:shadow-xl hover:shadow-brand-blue/30 transition-all duration-300 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                {outOfStock ? 'Sin stock disponible' : qty > 1 ? `Añadir ${qty} unidades al carro` : 'Añadir al carro'}
              </motion.button>

              {isPaintCategory(product.category) && (
                <button
                  type="button"
                  onClick={() => setCalculatorOpen(true)}
                  className="w-full flex items-center justify-center gap-2 text-[13px] font-bold text-brand-blue bg-brand-blueLight hover:bg-blue-100 py-3 rounded-xl transition-colors"
                >
                  <Calculator className="w-4 h-4" /> ¿Cuánta pintura necesito? Calcula por m²
                </button>
              )}

              <CrossSellRecommendations product={product} onAdd={cart.add} excludeIds={[product.id]} />
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
      <WhatsappButton />

      <PaintCalculatorModal open={calculatorOpen} onClose={() => setCalculatorOpen(false)} product={product} onAdd={cart.addMany} />
    </div>
  );
}

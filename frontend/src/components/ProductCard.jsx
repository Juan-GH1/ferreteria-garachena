import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { formatPrice, totalStockOf } from '../utils/format';

function StockPill({ label, qty }) {
  const tone =
    qty <= 0
      ? 'bg-rose-50 text-rose-600 ring-rose-100'
      : qty <= 5
        ? 'bg-amber-50 text-amber-700 ring-amber-100'
        : 'bg-emerald-50 text-emerald-700 ring-emerald-100';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${tone}`}>
      {label} · {qty <= 0 ? 'Agotado' : `${qty} un.`}
    </span>
  );
}

export default function ProductCard({ product, onAdd }) {
  const stock = totalStockOf(product);
  const outOfStock = stock <= 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileHover={{ scale: 1.03, y: -5 }}
      whileTap={{ scale: 0.97 }}
      transition={{
        opacity: { duration: 0.25 },
        // spring solo en los gestos: la entrada/salida mantiene su fade corto
        scale: { type: 'spring', stiffness: 300, damping: 20 },
        y: { type: 'spring', stiffness: 300, damping: 20 },
      }}
      className="bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-lift transition-shadow duration-300 overflow-hidden flex flex-col group justify-between"
    >
      <div>
        <Link to={`/producto/${product.id}`} className="relative bg-gradient-to-b from-slate-50 to-slate-100/60 aspect-square overflow-hidden flex items-center justify-center p-6">
          {/* Lazy loading: las tarjetas fuera del viewport no descargan su imagen */}
          <img
            src={product.image_url || ''}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="object-contain max-h-full max-w-full group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        <div className="p-5 space-y-2.5">
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.14em]">{product.brand || 'Garachena'}</p>
          <h3 className="font-bold tracking-tight text-slate-900 text-[15px] leading-snug group-hover:text-brand-blue transition-colors">
            <Link to={`/producto/${product.id}`}>{product.name}</Link>
          </h3>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            <StockPill label="Providencia" qty={product.stock?.Providencia ?? 0} />
            <StockPill label="Vitacura" qty={product.stock?.Vitacura ?? 0} />
          </div>
        </div>
      </div>
      <div className="p-5 pt-1 flex items-end justify-between gap-4">
        <div>
          <span className="text-xl font-black tracking-tight text-slate-900 tabular-nums">{formatPrice(product.price)}</span>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">IVA incluido</p>
        </div>
        <motion.button
          type="button"
          whileHover={outOfStock ? undefined : { scale: 1.08 }}
          whileTap={{ scale: outOfStock ? 1 : 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          disabled={outOfStock}
          onClick={() => onAdd({ ...product, stock })}
          title={outOfStock ? 'Sin stock disponible' : 'Añadir al carro'}
          className="bg-brand-blue hover:bg-brand-blueDark text-white p-3 rounded-xl shadow-md shadow-brand-blue/20 hover:shadow-lg hover:shadow-brand-blue/30 transition-all duration-300 disabled:opacity-35 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:bg-brand-blue"
        >
          <ShoppingCart className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

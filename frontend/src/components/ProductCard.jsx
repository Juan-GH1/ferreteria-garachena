import { motion } from 'framer-motion';
import { ShoppingCart, Store } from 'lucide-react';
import { formatPrice, stockTone, totalStockOf } from '../utils/format';

function StockLine({ stock = {} }) {
  const providencia = stockTone(stock.Providencia ?? 0);
  const vitacura = stockTone(stock.Vitacura ?? 0);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500 pt-1">
      <span className="flex items-center gap-1">
        <Store className="w-3.5 h-3.5 text-brand-blue" />
        Providencia: <span className={providencia.className}>{providencia.label}</span>
      </span>
      <span className="flex items-center gap-1">
        <Store className="w-3.5 h-3.5 text-brand-blue" />
        Vitacura: <span className={vitacura.className}>{vitacura.label}</span>
      </span>
    </div>
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
      transition={{ duration: 0.25 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col group justify-between"
    >
      <div>
        <div className="relative bg-slate-50 aspect-square overflow-hidden flex items-center justify-center p-6">
          <img
            src={product.image_url || ''}
            alt={product.name}
            className="object-contain max-h-full max-w-full group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-5 space-y-2">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{product.brand || ''}</p>
          <h3 className="font-extrabold text-slate-800 text-base group-hover:text-brand-blue transition-colors">{product.name}</h3>
          <StockLine stock={product.stock} />
        </div>
      </div>
      <div className="p-5 pt-0 flex items-center justify-between gap-4">
        <div>
          <span className="text-lg font-black text-brand-dark">{formatPrice(product.price)}</span>
          <p className="text-[10px] text-slate-400 font-bold">Incluye IVA</p>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: outOfStock ? 1 : 0.9 }}
          disabled={outOfStock}
          onClick={() => onAdd({ ...product, stock })}
          title={outOfStock ? 'Sin stock disponible' : 'Añadir al carro'}
          className="bg-brand-blue hover:bg-brand-blueDark text-white p-3 rounded-xl transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-brand-blue"
        >
          <ShoppingCart className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

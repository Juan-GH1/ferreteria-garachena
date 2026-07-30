import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { formatPrice, totalStockOf } from '../utils/format';
import ProductImage from './ProductImage';

/** Badge único flotante sobre la imagen (reemplaza las 2 pills de sucursal: menos ruido visual en la grilla). */
function AvailabilityBadge({ stock }) {
  const outOfStock = stock <= 0;
  const low = !outOfStock && stock <= 5;
  const label = outOfStock ? 'Agotado' : low ? `${stock} disponibles` : 'En stock';
  const tone = outOfStock ? 'text-neutral-400' : low ? 'text-amber-700' : 'text-emerald-700';

  return (
    <span
      className={`absolute top-3 right-3 backdrop-blur-sm bg-white/90 ${tone} text-10 font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset ring-neutral-200/70`}
    >
      {label}
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
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="bg-white rounded-2xl border border-neutral-100 hover:border-neutral-200 transition-colors duration-200 overflow-hidden flex flex-col group justify-between"
    >
      <div>
        <Link to={`/producto/${product.id}`} className="relative block">
          {/* Lazy loading: las tarjetas fuera del viewport no descargan su imagen */}
          <ProductImage product={product} loading="lazy" className="aspect-square" />
          <AvailabilityBadge stock={stock} />
        </Link>
        <div className="p-5 space-y-1.5">
          <p className="text-2xs text-neutral-400 font-medium uppercase tracking-[0.14em]">{product.brand || 'Garachena'}</p>
          <h3 className="font-semibold tracking-tight text-neutral-900 text-15 leading-snug group-hover:text-brand-blue transition-colors">
            <Link to={`/producto/${product.id}`}>{product.name}</Link>
          </h3>
        </div>
      </div>
      <div className="p-5 pt-1 flex items-end justify-between gap-4">
        <div>
          <span className="text-xl font-semibold tracking-tight text-neutral-900 tabular-nums">{formatPrice(product.price)}</span>
          <p className="text-10 text-neutral-400 font-medium mt-0.5">IVA incluido</p>
        </div>
        <motion.button
          type="button"
          whileHover={outOfStock ? undefined : { scale: 1.06 }}
          whileTap={{ scale: outOfStock ? 1 : 0.94 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          disabled={outOfStock}
          onClick={() => onAdd({ ...product, stock })}
          title={outOfStock ? 'Sin stock disponible' : 'Añadir al carro'}
          className="bg-brand-blue hover:bg-brand-blueDark text-white p-3 rounded-full shadow-sm transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue"
        >
          <ShoppingCart className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileDown, Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { formatPrice } from '../utils/format';
import { pickCrossSellAnchor } from '../utils/crossSell';
import { computeLineTotal } from '../utils/pricing';
import B2BQuoteModal from './B2BQuoteModal';
import CrossSellRecommendations from './CrossSellRecommendations';
import DeliveryLocationSelector from './DeliveryLocationSelector';
import ProductImage from './ProductImage';

function CartItemRow({ item, onIncrease, onDecrease, onRemove }) {
  const { unitPrice, lineTotal, fullTotal, savings, tier } = computeLineTotal(item.price, item.qty);
  const hasDiscount = savings > 0;

  return (
    <motion.li
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0 }}
      className="flex gap-4 py-4 overflow-hidden"
    >
      <ProductImage product={item} loading="lazy" className="w-16 h-16 rounded-xl shrink-0 shadow-inner" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className="text-13 font-bold tracking-tight text-slate-900 leading-snug line-clamp-2">{item.name}</p>
          <div className="text-right shrink-0">
            {hasDiscount && <span className="block text-10 text-slate-400 line-through tabular-nums">{formatPrice(fullTotal)}</span>}
            <span className="block text-13 font-black tracking-tight text-slate-900 tabular-nums">{formatPrice(lineTotal)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-2xs text-slate-400 font-medium tabular-nums">{formatPrice(unitPrice)} c/u</p>
          {hasDiscount && (
            <span className="text-10 font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
              -{Math.round(tier.discount * 100)}%
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2.5">
          <div className="inline-flex items-center rounded-full bg-slate-50 ring-1 ring-inset ring-slate-200/70">
            <button
              type="button"
              onClick={() => onDecrease(item.id)}
              disabled={item.qty <= 1}
              title="Restar unidad"
              className="w-7 h-7 flex items-center justify-center rounded-full text-slate-500 hover:text-brand-blue disabled:opacity-30 disabled:hover:text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-13 font-bold w-7 text-center tabular-nums">{item.qty}</span>
            <button
              type="button"
              onClick={() => onIncrease(item.id)}
              disabled={item.qty >= item.stock}
              title="Sumar unidad"
              className="w-7 h-7 flex items-center justify-center rounded-full text-slate-500 hover:text-brand-blue disabled:opacity-30 disabled:hover:text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            title="Eliminar producto"
            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.li>
  );
}

function TotalRow({ label, value, emphasis = false }) {
  return (
    <div className={`flex items-center justify-between ${emphasis ? 'pt-3' : ''}`}>
      <span className={emphasis ? 'text-15 font-black tracking-tight text-slate-900' : 'text-13 font-medium text-slate-500'}>
        {label}
      </span>
      <span className={`tabular-nums ${emphasis ? 'text-17 font-black tracking-tight text-slate-900' : 'text-13 font-semibold text-slate-600'}`}>
        {value}
      </span>
    </div>
  );
}

export default function CartDrawer({ open, onClose, cart, onCheckout, deliveryPreference, onSetPickup, onSetDelivery }) {
  const { items, totalPrice, changeQty, remove } = cart;
  const subtotal = totalPrice / 1.19;
  const iva = totalPrice - subtotal;
  const totalSavings = items.reduce((sum, item) => sum + computeLineTotal(item.price, item.qty).savings, 0);
  const crossSellAnchor = pickCrossSellAnchor(items);
  const [quoteOpen, setQuoteOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-navy-950/40 backdrop-blur-[2px]"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
              className="absolute right-0 top-0 h-full w-full max-w-md bg-white/90 backdrop-blur-md shadow-lift flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <h3 className="text-17 font-black tracking-tight text-slate-900 flex items-center gap-2.5">
                  <ShoppingCart className="w-5 h-5 text-brand-blue" /> Tu Carrito
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  title="Cerrar carrito"
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 pt-4 pb-1">
                <DeliveryLocationSelector preference={deliveryPreference} onSetPickup={onSetPickup} onSetDelivery={onSetDelivery} />
              </div>

              <div className="flex-1 overflow-y-auto px-6">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-8 text-slate-400">
                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                      <ShoppingCart className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="font-bold tracking-tight text-slate-500">Tu carrito está vacío</p>
                    <p className="text-xs mt-1.5 leading-relaxed">Agrega productos desde el catálogo para verlos aquí.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    <AnimatePresence>
                      {items.map((item) => (
                        <CartItemRow
                          key={item.id}
                          item={item}
                          onIncrease={(id) => changeQty(id, 1)}
                          onDecrease={(id) => changeQty(id, -1)}
                          onRemove={remove}
                        />
                      ))}
                    </AnimatePresence>
                  </ul>
                )}

                {crossSellAnchor && (
                  <div className="py-4">
                    <CrossSellRecommendations product={crossSellAnchor} onAdd={cart.add} excludeIds={items.map((item) => item.id)} />
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="border-t border-slate-100 px-6 py-5 space-y-2 bg-white/70 backdrop-blur-md">
                  {totalSavings > 0 && (
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 bg-emerald-50 -mx-1 px-3 py-2 rounded-xl">
                      <span>Ahorro por volumen</span>
                      <span className="tabular-nums">-{formatPrice(totalSavings)}</span>
                    </div>
                  )}
                  <TotalRow label="Subtotal (neto)" value={formatPrice(subtotal)} />
                  <TotalRow label="IVA (19%)" value={formatPrice(iva)} />
                  <div className="border-t border-slate-100" />
                  <TotalRow label="Total" value={formatPrice(totalPrice)} emphasis />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    onClick={onCheckout}
                    className="w-full mt-3 bg-brand-blue hover:bg-brand-blueDark text-white font-bold tracking-tight py-3.5 rounded-2xl shadow-lg shadow-brand-blue/25 hover:shadow-xl hover:shadow-brand-blue/30 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue"
                  >
                    Proceder al Pago
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => setQuoteOpen(true)}
                    className="w-full flex items-center justify-center gap-2 text-13 font-bold text-navy-900 border border-slate-200 hover:border-navy-900 py-3 rounded-2xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-navy-900"
                  >
                    <FileDown className="w-4 h-4" /> Descargar Cotización B2B (PDF)
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <B2BQuoteModal open={quoteOpen} onClose={() => setQuoteOpen(false)} items={items} />
    </>
  );
}

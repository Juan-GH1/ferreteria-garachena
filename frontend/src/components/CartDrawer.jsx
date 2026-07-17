import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { formatPrice } from '../utils/format';

function CartItemRow({ item, onIncrease, onDecrease, onRemove }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0 }}
      className="flex gap-3 p-4 overflow-hidden"
    >
      <img src={item.image_url || ''} alt={item.name} className="w-16 h-16 object-contain bg-slate-50 rounded-lg border border-slate-100 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
        <p className="text-xs text-slate-400 font-semibold">{formatPrice(item.price)} c/u</p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg">
            <button
              type="button"
              onClick={() => onDecrease(item.id)}
              disabled={item.qty <= 1}
              title="Restar unidad"
              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-brand-blue disabled:opacity-30 disabled:hover:text-slate-500"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
            <button
              type="button"
              onClick={() => onIncrease(item.id)}
              disabled={item.qty >= item.stock}
              title="Sumar unidad"
              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-brand-blue disabled:opacity-30 disabled:hover:text-slate-500"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <button type="button" onClick={() => onRemove(item.id)} title="Eliminar producto" className="text-red-500 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <span className="text-sm font-black text-brand-dark shrink-0">{formatPrice(item.price * item.qty)}</span>
    </motion.li>
  );
}

export default function CartDrawer({ open, onClose, cart, onCheckout }) {
  const { items, totalPrice, changeQty, remove } = cart;
  const subtotal = totalPrice / 1.19;
  const iva = totalPrice - subtotal;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-brand-dark flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-brand-blue" /> Tu Carrito
              </h3>
              <button type="button" onClick={onClose} title="Cerrar carrito" className="p-2 text-slate-400 hover:text-brand-blue rounded-lg hover:bg-slate-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-8 text-slate-400">
                  <ShoppingCart className="w-12 h-12 mb-3 text-slate-300" />
                  <p className="font-semibold">Tu carrito está vacío</p>
                  <p className="text-xs mt-1">Agrega productos desde el catálogo para verlos aquí.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  <AnimatePresence>
                    {items.map((item) => (
                      <CartItemRow key={item.id} item={item} onIncrease={(id) => changeQty(id, 1)} onDecrease={(id) => changeQty(id, -1)} onRemove={remove} />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-slate-100 p-5 space-y-2 bg-slate-50">
                <div className="flex items-center justify-between text-sm text-slate-500 font-semibold">
                  <span>Subtotal (neto)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-500 font-semibold">
                  <span>IVA (19%)</span>
                  <span>{formatPrice(iva)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-black text-brand-dark pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <button
                  type="button"
                  onClick={onCheckout}
                  className="w-full mt-3 bg-brand-blue hover:bg-brand-blueDark text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Proceder al Pago
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

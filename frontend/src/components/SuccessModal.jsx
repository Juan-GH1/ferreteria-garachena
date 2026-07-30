import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export default function SuccessModal({ order, onClose }) {
  return (
    <AnimatePresence>
      {order && (
        <div className="fixed inset-0 z-[130]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60" />
          <div className="relative min-h-full flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 text-center"
            >
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-extrabold text-brand-dark">¡Pedido #{order.id} confirmado!</h3>
              <p className="text-sm text-slate-500 mt-2">Gracias por tu compra. Te contactaremos a la brevedad con los detalles de tu entrega.</p>
              <button
                type="button"
                onClick={onClose}
                className="w-full mt-6 py-3 rounded-xl bg-brand-blue hover:bg-brand-blueDark text-white font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue"
              >
                Aceptar
              </button>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

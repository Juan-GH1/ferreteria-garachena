import { motion } from 'framer-motion';
import { Calculator, FileText, Truck } from 'lucide-react';

const EASE = { duration: 0.3, ease: 'easeOut' };

function PillAction({ icon: Icon, label, hint, index, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      title={hint}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...EASE, delay: index * 0.06 }}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      className="inline-flex items-center gap-2.5 bg-white rounded-full border border-neutral-200 shadow-sm px-5 py-3 text-13 font-medium text-neutral-900 hover:border-neutral-300 hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900"
    >
      <span className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-neutral-700" />
      </span>
      {label}
    </motion.button>
  );
}

/**
 * Hub de herramientas destacadas, como píldoras de acción flotantes (no
 * tarjetas): dos abren modales que ya existen en toda la app (Calculadora de
 * Pintura sin producto vinculado, Cotizador B2B con el carrito actual); la
 * tercera es puramente informativa (cobertura de despacho), sin acción.
 */
export default function QuickToolsHub({ onOpenCalculator, onOpenQuote }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <PillAction
        index={0}
        icon={Calculator}
        label="Calculadora de Pintura por m²"
        hint="Ingresa el ancho y alto de tu muro y te decimos cuántos galones comprar."
        onClick={onOpenCalculator}
      />
      <PillAction
        index={1}
        icon={FileText}
        label="Cotizador B2B Express"
        hint="Genera una cotización formal en PDF con los productos de tu carrito."
        onClick={onOpenQuote}
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...EASE, delay: 0.12 }}
        className="inline-flex items-center gap-2.5 bg-neutral-50 rounded-full border border-neutral-200 px-5 py-3 text-13 font-medium text-neutral-600"
      >
        <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 border border-neutral-200">
          <Truck className="w-3.5 h-3.5 text-neutral-700" />
        </span>
        Despacho hoy en Providencia y Vitacura
      </motion.div>
    </div>
  );
}

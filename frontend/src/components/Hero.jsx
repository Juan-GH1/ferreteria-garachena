import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Truck, Wrench } from 'lucide-react';

/**
 * Hero comercial de la Home. No contiene el simulador (ver PaintSimulator,
 * reubicado más abajo en Catalog.jsx) para no bloquear el acceso al catálogo.
 */
export default function Hero({ onViewCatalog, onBrowseTools }) {
  return (
    <section className="relative bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 overflow-hidden">
      <div aria-hidden className="absolute -top-24 -right-16 w-96 h-96 rounded-full bg-brand-blue/25 blur-3xl pointer-events-none" />
      <div aria-hidden className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-accent-500/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-28 md:pt-20 md:pb-32">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl">
          <span className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-[11px] font-bold tracking-wide uppercase px-3 py-1.5 rounded-full ring-1 ring-inset ring-white/10">
            <Truck className="w-3.5 h-3.5" /> Despacho Express en Santiago
          </span>

          <h1 className="mt-5 text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.08]">
            Tu Ferretería Profesional
            <br className="hidden sm:block" /> en Providencia y Vitacura
          </h1>

          <p className="mt-4 text-[15px] text-slate-300 font-medium leading-relaxed max-w-lg">
            Pinturas con tintometría digital, herramientas y materiales de construcción. Retiro gratis en tienda o despacho el mismo día.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={onViewCatalog}
              className="inline-flex items-center gap-2 bg-white text-navy-950 font-bold tracking-tight px-6 py-3.5 rounded-2xl shadow-lift"
            >
              Ver Catálogo <ArrowRight className="w-4 h-4" />
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={onBrowseTools}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold tracking-tight px-6 py-3.5 rounded-2xl ring-1 ring-inset ring-white/15 transition-colors"
            >
              <Wrench className="w-4 h-4" /> Herramientas
            </motion.button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Fórmula propia Garachena
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-400" /> Despacho hoy mismo en RM
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

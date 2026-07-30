import { motion } from 'framer-motion';
import { Clock, MapPin, Palette, Truck } from 'lucide-react';

const EASE = { duration: 0.35, ease: 'easeOut' };

// Cifras reales ya usadas en el resto del sitio (Footer, Hero, TrustBadges):
// no se inventan datos nuevos, solo se agrupan en una sección propia.
const STATS = [
  { icon: MapPin, value: '2', label: 'Sucursales: Providencia y Vitacura' },
  { icon: Palette, value: '1.000+', label: 'Productos con tintometría digital' },
  { icon: Truck, value: '24h', label: 'Despacho express Sector Oriente' },
  { icon: Clock, value: 'Lun-Vie', label: '08:30 a 19:00 hrs' },
];

/** Sección "Quiénes Somos": mismo tono editorial que CategoryGrid/TrustBadges. */
export default function AboutSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 pb-16">
      <div className="bg-white rounded-3xl border border-neutral-100 p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={EASE}
          className="lg:col-span-7"
        >
          <p className="text-2xs uppercase tracking-[0.2em] text-neutral-400 font-medium">Quiénes Somos</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 leading-[1.1]">
            Tu ferretería familiar,
            <br className="hidden sm:block" /> con precisión industrial
          </h2>
          <p className="mt-5 text-15 text-neutral-500 leading-relaxed max-w-lg">
            Ferretería Garachena nació en el corazón de Providencia con una convicción simple: quien construye o
            pinta merece stock real, precios claros y respuestas rápidas. Hoy combinamos esa cercanía familiar con
            tintometría digital, facturación automática a tu RUT y despacho propio en el sector oriente de Santiago.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ ...EASE, delay: 0.1 }}
          className="lg:col-span-5 grid grid-cols-2 gap-4"
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-surface-50 rounded-2xl border border-neutral-100 p-5">
              <span className="w-9 h-9 rounded-full bg-white border border-neutral-200 text-neutral-700 flex items-center justify-center">
                <stat.icon className="w-4 h-4" />
              </span>
              <p className="mt-3 text-xl font-semibold tracking-tight text-neutral-900 tabular-nums">{stat.value}</p>
              <p className="mt-0.5 text-2xs text-neutral-500 leading-tight">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

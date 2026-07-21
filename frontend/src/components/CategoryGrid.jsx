import { motion } from 'framer-motion';
import { FlaskConical, HardHat, Palette, Wrench } from 'lucide-react';

// Los "values" mapean a los valores reales de product.category en la BD
// (el catálogo importado de Sisgen usa "Pinturas"; el set demo usa
// "Pinturas & Tintometría" — se incluyen ambos para que el acceso rápido
// cubra todo el dominio de pinturas sin importar el origen del producto).
const CATEGORIES = [
  { label: 'Pinturas', icon: Palette, values: ['Pinturas', 'Pinturas & Tintometría'], tint: 'from-orange-50 to-rose-50', iconTint: 'text-orange-500' },
  { label: 'Herramientas Manuales', icon: Wrench, values: ['Herramientas Manuales'], tint: 'from-sky-50 to-blue-50', iconTint: 'text-brand-blue' },
  { label: 'Línea Construcción', icon: HardHat, values: ['Línea Construcción'], tint: 'from-amber-50 to-yellow-50', iconTint: 'text-amber-600' },
  { label: 'Aseo y Químicos', icon: FlaskConical, values: ['Aseo y Químicos'], tint: 'from-emerald-50 to-teal-50', iconTint: 'text-emerald-600' },
];

/** Grilla de accesos rápidos a categorías destacadas. Flota sobre el hero. */
export default function CategoryGrid({ onSelect }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {CATEGORIES.map((cat, index) => (
        <motion.button
          key={cat.label}
          type="button"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.35 }}
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(cat.values)}
          className="bg-white rounded-2xl border border-slate-100 shadow-lift p-5 text-left flex flex-col gap-3 transition-shadow hover:shadow-xl"
        >
          <span className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cat.tint} ${cat.iconTint} flex items-center justify-center`}>
            <cat.icon className="w-5 h-5" />
          </span>
          <span className="text-[13px] font-bold tracking-tight text-slate-900 leading-tight">{cat.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

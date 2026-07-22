import { motion } from 'framer-motion';
import { FlaskConical, HardHat, Palette, Wrench } from 'lucide-react';

// Los "values" mapean a los valores reales de product.category en la BD
// (el catálogo importado de Sisgen usa "Pinturas"; el set demo usa
// "Pinturas & Tintometría" — se incluyen ambos para que el acceso rápido
// cubra todo el dominio de pinturas sin importar el origen del producto).
const CATEGORIES = [
  {
    label: 'Pinturas',
    icon: Palette,
    values: ['Pinturas', 'Pinturas & Tintometría'],
    tint: 'from-orange-50 to-rose-50',
    iconTint: 'text-orange-500',
    blob: 'bg-orange-200/50',
  },
  {
    label: 'Herramientas Manuales',
    icon: Wrench,
    values: ['Herramientas Manuales'],
    tint: 'from-sky-50 to-blue-50',
    iconTint: 'text-brand-blue',
    blob: 'bg-sky-200/50',
  },
  {
    label: 'Línea Construcción',
    icon: HardHat,
    values: ['Línea Construcción'],
    tint: 'from-amber-50 to-yellow-50',
    iconTint: 'text-amber-600',
    blob: 'bg-amber-200/50',
  },
  {
    label: 'Aseo y Químicos',
    icon: FlaskConical,
    values: ['Aseo y Químicos'],
    tint: 'from-emerald-50 to-teal-50',
    iconTint: 'text-emerald-600',
    blob: 'bg-emerald-200/50',
  },
];

const countFormatter = new Intl.NumberFormat('es-CL');

/**
 * Grilla bento de accesos rápidos a categorías destacadas. `categoryCounts`
 * (de facets.categories en Catalog.jsx) alimenta la etiqueta de
 * disponibilidad real por categoría, en vez de un conteo estático.
 */
export default function CategoryGrid({ onSelect, categoryCounts = [] }) {
  const countByName = new Map(categoryCounts.map((c) => [c.name, c.count]));

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {CATEGORIES.map((cat, index) => {
        const total = cat.values.reduce((sum, value) => sum + (countByName.get(value) || 0), 0);
        const inStock = total > 0;

        return (
          <motion.button
            key={cat.label}
            type="button"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.35 }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(cat.values)}
            className="group relative bg-white rounded-2xl shadow-soft ring-1 ring-slate-900/5 p-5 text-left flex flex-col gap-3 overflow-hidden hover:shadow-lift transition-shadow duration-300"
          >
            {/* Blob líquido: se expande desde el ícono al pasar el mouse. */}
            <motion.span
              aria-hidden
              initial={false}
              className={`absolute -top-6 -left-6 w-28 h-28 rounded-full blur-2xl ${cat.blob} opacity-0 group-hover:opacity-100`}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.3, rotate: 25 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            />

            <span className={`relative w-11 h-11 rounded-xl bg-gradient-to-br ${cat.tint} ${cat.iconTint} flex items-center justify-center`}>
              <cat.icon className="w-5 h-5" />
            </span>
            <span className="relative text-[13px] font-bold tracking-tight text-slate-900 leading-tight">{cat.label}</span>

            {/* aria-hidden: es información complementaria (conteo/disponibilidad), no
                debe sumarse al nombre accesible del botón (que debe seguir siendo
                solo la categoría, p. ej. "Pinturas", para lectores de pantalla y tests). */}
            <span aria-hidden="true" className="relative flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              {inStock && (
                <span className="relative flex w-1.5 h-1.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
              )}
              {total > 0 ? `${countFormatter.format(total)} producto${total === 1 ? '' : 's'} · En stock` : 'Próximamente'}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

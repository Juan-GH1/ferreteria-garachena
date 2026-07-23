import { motion } from 'framer-motion';
import { FlaskConical, HardHat, Palette, Wrench } from 'lucide-react';

// Los "values" mapean a los valores reales de product.category en la BD
// (el catálogo importado de Sisgen usa "Pinturas"; el set demo usa
// "Pinturas & Tintometría" — se incluyen ambos para que el acceso rápido
// cubra todo el dominio de pinturas sin importar el origen del producto).
const CATEGORIES = [
  { label: 'Pinturas', icon: Palette, values: ['Pinturas', 'Pinturas & Tintometría'] },
  { label: 'Herramientas Manuales', icon: Wrench, values: ['Herramientas Manuales'] },
  { label: 'Línea Construcción', icon: HardHat, values: ['Línea Construcción'] },
  { label: 'Aseo y Químicos', icon: FlaskConical, values: ['Aseo y Químicos'] },
];

const EASE = { duration: 0.3, ease: 'easeOut' };
const countFormatter = new Intl.NumberFormat('es-CL');

/**
 * Bento de categorías, tono editorial desaturado: todas las tarjetas
 * comparten el mismo fondo neutro (sin tintes de color por categoría), el
 * ícono es lo único que las distingue visualmente. `categoryCounts` (de
 * facets.categories en Catalog.jsx) alimenta la etiqueta de disponibilidad
 * real por categoría, en vez de un conteo estático.
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
            transition={{ ...EASE, delay: index * 0.05 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(cat.values)}
            className="group relative bg-white rounded-2xl border border-neutral-100 p-5 text-left flex flex-col gap-3 overflow-hidden hover:border-neutral-200 transition-colors duration-200"
          >
            {/* Blob desaturado: mismo lenguaje de movimiento que antes, sin color por categoría. */}
            <motion.span
              aria-hidden
              initial={false}
              className="absolute -top-6 -left-6 w-28 h-28 rounded-full blur-2xl bg-neutral-200/60 opacity-0 group-hover:opacity-100"
              whileHover={{ scale: 1.25 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />

            <span className="relative w-11 h-11 rounded-xl bg-neutral-50 text-neutral-800 flex items-center justify-center">
              <cat.icon className="w-5 h-5" />
            </span>
            <span className="relative text-[13px] font-semibold tracking-tight text-neutral-900 leading-tight">{cat.label}</span>

            {/* aria-hidden: es información complementaria (conteo/disponibilidad), no
                debe sumarse al nombre accesible del botón (que debe seguir siendo
                solo la categoría, p. ej. "Pinturas", para lectores de pantalla y tests). */}
            <span aria-hidden="true" className="relative flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
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

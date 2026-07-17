import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Paintbrush } from 'lucide-react';

// Paleta de fórmulas propias Garachena (tintometría digital en el día).
const PAINT_COLORS = [
  { name: 'Blanco Invierno', hex: '#f1efe7' },
  { name: 'Lino Providencia', hex: '#d9c9a3' },
  { name: 'Terracota Andina', hex: '#c96f4a' },
  { name: 'Verde Salvia', hex: '#8ca188' },
  { name: 'Azul Pacífico', hex: '#4a6b9a' },
  { name: 'Grafito Urbano', hex: '#5b5e66' },
];

const SPRING = { type: 'spring', stiffness: 300, damping: 20 };

function PaintSwatch({ color, selected, onSelect }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        type="button"
        onClick={() => onSelect(color)}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.9 }}
        animate={{ scale: selected ? 1.12 : 1 }}
        transition={SPRING}
        title={color.name}
        aria-pressed={selected}
        className="relative w-11 h-11 rounded-full border border-black/10 shadow-inner cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
        style={{ backgroundColor: color.hex }}
      >
        {/* Anillo de selección elástico */}
        <motion.span
          aria-hidden
          initial={false}
          animate={{ scale: selected ? 1 : 0.6, opacity: selected ? 1 : 0 }}
          transition={SPRING}
          className="absolute -inset-1.5 rounded-full border-2 border-brand-blue pointer-events-none"
        />
        {/* Brillo de "pintura líquida" */}
        <span aria-hidden className="absolute top-1.5 left-2 w-3 h-1.5 rounded-full bg-white/50 rotate-[-20deg] pointer-events-none" />
      </motion.button>
      <span className={`text-[10px] font-bold text-center leading-tight transition-colors ${selected ? 'text-brand-blue' : 'text-slate-400'}`}>
        {color.name}
      </span>
    </div>
  );
}

/**
 * Habitación de muestra: la pared se tiñe con un crossfade de 0.4s.
 * Los elementos de la escena (zócalo, ventana, sofá) son capas estáticas por
 * encima de las capas de color, así solo se anima opacidad (barato en móvil).
 */
function SampleRoom({ color }) {
  return (
    <div className="relative w-full h-48 sm:h-56 rounded-xl overflow-hidden border border-slate-200 select-none">
      {/* Capas de color de la pared (crossfade) */}
      <AnimatePresence>
        <motion.div
          key={color.hex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="absolute inset-0"
          style={{ backgroundColor: color.hex }}
        />
      </AnimatePresence>

      {/* Sombra ambiental sutil sobre la pared */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10 pointer-events-none" />

      {/* Ventana */}
      <div aria-hidden className="absolute top-5 right-6 w-20 h-24 sm:w-24 sm:h-28 rounded-sm bg-sky-100/90 border-4 border-white shadow-md pointer-events-none">
        <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-white" />
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-white" />
      </div>

      {/* Sofá */}
      <div aria-hidden className="absolute bottom-6 left-6 pointer-events-none">
        <div className="w-32 h-10 sm:w-40 sm:h-12 rounded-t-lg bg-slate-700/85" />
        <div className="w-36 h-3 sm:w-44 -mx-2 rounded bg-slate-800/85" />
      </div>

      {/* Piso + zócalo */}
      <div aria-hidden className="absolute bottom-0 inset-x-0 h-6 bg-amber-100/95 border-t-4 border-white/90 pointer-events-none" />

      {/* Etiqueta del color activo */}
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[11px] font-bold text-slate-700 px-2.5 py-1 rounded-lg shadow-sm">
        {color.name}
      </div>
    </div>
  );
}

export default function PaintSimulator() {
  const [selected, setSelected] = useState(PAINT_COLORS[0]);

  return (
    <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <h3 className="text-lg font-extrabold text-brand-dark flex items-center gap-2">
          <Paintbrush className="w-5 h-5 text-brand-blue" /> Simulador de Pintura
        </h3>
        <p className="text-xs text-slate-400 font-semibold">
          Tintometría digital Garachena · prepara tu color en el día
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <SampleRoom color={selected} />

        <div>
          <p className="text-sm text-slate-500 font-semibold mb-4">
            Elige una muestra y mira cómo se tiñe la pared. Llevamos la fórmula exacta a cualquier envase, listo para retirar en Providencia o
            Vitacura.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-3 gap-x-2 gap-y-4">
            {PAINT_COLORS.map((color) => (
              <PaintSwatch key={color.hex} color={color} selected={selected.hex === color.hex} onSelect={setSelected} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

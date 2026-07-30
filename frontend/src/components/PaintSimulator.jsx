import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Calculator, Paintbrush, Store, Truck } from 'lucide-react';
import { searchProducts } from '../api';
import { formatPrice } from '../utils/format';
import { GALON_REGEX } from '../utils/paint';
import PaintCalculatorModal from './PaintCalculatorModal';

// Paleta de fórmulas propias Garachena (tintometría digital en el día).
// searchTerm conecta cada muestra con un producto real del catálogo
// importado (ver Épica 4): se busca por keyword y se usa el mejor match.
const PAINT_COLORS = [
  { name: 'Blanco Invierno', hex: '#f1efe7', searchTerm: 'BLANCO' },
  { name: 'Lino Providencia', hex: '#d9c9a3', searchTerm: 'HUESO' },
  { name: 'Terracota Andina', hex: '#c96f4a', searchTerm: 'LADRILLO' },
  { name: 'Verde Salvia', hex: '#8ca188', searchTerm: 'VERDE' },
  { name: 'Azul Pacífico', hex: '#4a6b9a', searchTerm: 'AZUL' },
  { name: 'Grafito Urbano', hex: '#5b5e66', searchTerm: 'GRAFITO' },
];

const SPRING = { type: 'spring', stiffness: 300, damping: 20 };

function PaintSwatch({ color, selected, onSelect }) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(color)}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.9 }}
      animate={{ scale: selected ? 1.1 : 1 }}
      transition={SPRING}
      title={color.name}
      aria-label={color.name}
      aria-pressed={selected}
      className="relative w-12 h-12 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
      style={{
        backgroundColor: color.hex,
        // Relieve sutil: luz superior + oclusión inferior + borde interior
        boxShadow:
          'inset 0 2px 4px rgb(255 255 255 / 0.45), inset 0 -3px 5px rgb(0 0 0 / 0.18), 0 2px 6px rgb(15 23 42 / 0.12)',
      }}
    >
      {/* Anillo de selección elástico */}
      <motion.span
        aria-hidden
        initial={false}
        animate={{ scale: selected ? 1 : 0.6, opacity: selected ? 1 : 0 }}
        transition={SPRING}
        className="absolute -inset-[5px] rounded-full border-2 border-brand-blue pointer-events-none"
      />
      {/* Brillo de "pintura líquida" */}
      <span aria-hidden className="absolute top-2 left-2.5 w-3.5 h-2 rounded-full bg-white/60 blur-[1px] rotate-[-20deg] pointer-events-none" />
    </motion.button>
  );
}

/**
 * Habitación de muestra: la pared se tiñe con un crossfade de 0.4s.
 * Los elementos de la escena (zócalo, ventana, sofá) son capas estáticas por
 * encima de las capas de color, así solo se anima opacidad (barato en móvil).
 */
function SampleRoom({ color }) {
  return (
    <div className="relative w-full h-full min-h-52 rounded-2xl overflow-hidden select-none shadow-soft">
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

      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10 pointer-events-none" />

      {/* Ventana */}
      <div aria-hidden className="absolute top-6 right-8 w-24 h-28 rounded-sm bg-sky-100/90 border-4 border-white shadow-lift pointer-events-none">
        <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-white" />
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-white" />
      </div>

      {/* Sofá */}
      <div aria-hidden className="absolute bottom-7 left-8 pointer-events-none drop-shadow-md">
        <div className="w-40 h-12 rounded-t-xl bg-slate-700/90" />
        <div className="w-44 h-3.5 -mx-2 rounded-md bg-slate-800/90" />
      </div>

      {/* Piso + zócalo */}
      <div aria-hidden className="absolute bottom-0 inset-x-0 h-7 bg-amber-100/95 border-t-4 border-white/90 pointer-events-none" />

      {/* Etiqueta del color activo */}
      <AnimatePresence mode="wait">
        <motion.div
          key={color.name}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute top-4 left-4 bg-white/85 backdrop-blur-md text-2xs font-bold tracking-tight text-slate-800 px-3 py-1.5 rounded-full shadow-card"
        >
          {color.name}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function FeatureTile({ icon: Icon, title, caption }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-brand-blueLight text-brand-blue flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-13 font-bold tracking-tight text-slate-900 leading-tight">{title}</p>
        <p className="text-2xs text-slate-400 font-medium leading-tight mt-0.5">{caption}</p>
      </div>
    </div>
  );
}

/** CTA que conecta la muestra seleccionada con su producto real en el catálogo. */
function BuyLinkedProductButton({ product }) {
  const navigate = useNavigate();
  if (!product) return null;

  const label = GALON_REGEX.test(product.name) ? 'Comprar este color en 1 Galón' : 'Ver ficha del producto';

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.015, y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={SPRING}
      onClick={() => navigate(`/producto/${product.id}`)}
      className="mt-4 w-full flex items-center justify-between gap-3 bg-brand-blue hover:bg-brand-blueDark text-white rounded-xl px-4 py-3 shadow-md shadow-brand-blue/20 hover:shadow-lg hover:shadow-brand-blue/30 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue"
    >
      <span className="text-left min-w-0">
        <span className="block text-13 font-bold tracking-tight">{label}</span>
        <span className="block text-2xs text-white/75 truncate">
          {product.name} · {formatPrice(product.price)}
        </span>
      </span>
      <ArrowRight className="w-4 h-4 shrink-0" />
    </motion.button>
  );
}

/** Abre la Calculadora de Pintura para la muestra seleccionada. */
function CalculatorButton({ disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-2.5 w-full flex items-center justify-center gap-2 text-xs font-bold text-brand-blue hover:bg-brand-blueLight py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-brand-blue"
    >
      <Calculator className="w-3.5 h-3.5" /> ¿Cuánta pintura necesito? Calcula por m²
    </button>
  );
}

/**
 * Bento del hero: habitación de muestra (pieza grande), panel de muestras y
 * dos tiles de propuesta de valor. Cada muestra está conectada a un producto
 * real del catálogo (buscado por keyword al montar), con un CTA que lleva
 * directo a su ficha para comprar.
 */
export default function PaintSimulator({ cart }) {
  const [selected, setSelected] = useState(PAINT_COLORS[0]);
  const [linkedProducts, setLinkedProducts] = useState({});
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      PAINT_COLORS.map((color) =>
        searchProducts(color.searchTerm)
          .then(({ products }) => [color.hex, products[0] || null])
          .catch(() => [color.hex, null])
      )
    ).then((entries) => {
      if (!cancelled) setLinkedProducts(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="grid grid-cols-1 md:grid-cols-5 gap-4 md:grid-rows-[auto_1fr]">
      <div className="md:col-span-3 md:row-span-2">
        <SampleRoom color={selected} />
      </div>

      <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-card p-5">
        <h3 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Paintbrush className="w-4 h-4 text-brand-blue" /> Simulador de Pintura
        </h3>
        <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
          Elige una muestra y mira la pared teñirse. Preparamos la fórmula exacta en el día.
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          {PAINT_COLORS.map((color) => (
            <PaintSwatch key={color.hex} color={color} selected={selected.hex === color.hex} onSelect={setSelected} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={selected.hex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <BuyLinkedProductButton product={linkedProducts[selected.hex]} />
            <CalculatorButton disabled={!linkedProducts[selected.hex]} onClick={() => setCalculatorOpen(true)} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-4">
        <FeatureTile icon={Truck} title="Despacho Express" caption="Hoy mismo en Santiago" />
        <FeatureTile icon={Store} title="Retiro en tienda" caption="Providencia y Vitacura" />
      </div>

      {cart && (
        <PaintCalculatorModal
          open={calculatorOpen}
          onClose={() => setCalculatorOpen(false)}
          product={linkedProducts[selected.hex]}
          onAdd={cart.addMany}
        />
      )}
    </section>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Building2, FileText, Home as HomeIcon, ScanBarcode, ShieldCheck, Truck, Wrench } from 'lucide-react';
import { formatPrice } from '../utils/format';

const SPRING = { type: 'spring', stiffness: 300, damping: 20 };

const MODE_OPTIONS = [
  { value: 'b2c', label: 'Proyectos del Hogar', icon: HomeIcon },
  { value: 'b2b', label: 'Contratistas y Constructoras', icon: Building2 },
];

/** Switcher B2C/B2B con indicador animado (mismo patrón que AdminSidebar). */
function ModeToggle({ mode, onChange }) {
  return (
    <div className="inline-flex items-center bg-white/10 rounded-full p-1 ring-1 ring-inset ring-white/10 gap-1">
      {MODE_OPTIONS.map((opt) => {
        const active = mode === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className="relative px-3.5 py-2 rounded-full text-[11px] sm:text-[12px] font-bold tracking-tight flex items-center gap-1.5"
          >
            {active && (
              <motion.span
                layoutId="hero-mode-active"
                transition={SPRING}
                className="absolute inset-0 bg-white rounded-full -z-10"
              />
            )}
            <opt.icon className={`w-3.5 h-3.5 relative z-10 shrink-0 ${active ? 'text-navy-950' : 'text-white/70'}`} />
            <span className={`relative z-10 whitespace-nowrap ${active ? 'text-navy-950' : 'text-white/70'}`}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Búsqueda rápida por código SKU (modo B2B). Filtra sobre el catálogo ya
 * cargado por Catalog.jsx (sin pegarle otra vez al backend): un maestro con
 * lista de materiales suele tener el SKU a mano y quiere ir directo a la
 * ficha, no navegar por categorías.
 */
function SkuQuickSearch({ products, navigate }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const term = query.trim().toUpperCase();
  const matches = term ? products.filter((p) => p.sku && p.sku.toUpperCase().includes(term)).slice(0, 6) : [];

  function handleSubmit(event) {
    event.preventDefault();
    if (!term) return;
    const exact = products.find((p) => p.sku && p.sku.toUpperCase() === term);
    const target = exact || matches[0];
    if (target) navigate(`/producto/${target.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative mt-6 max-w-md">
      <div className="relative">
        <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Buscar por código SKU..."
          className="w-full pl-11 pr-24 py-3.5 bg-white/10 border border-white/15 rounded-2xl text-white placeholder-white/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/15 transition-colors"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1.5 bottom-1.5 bg-white text-navy-950 text-xs font-bold px-4 rounded-xl hover:bg-slate-100 transition-colors"
        >
          Buscar
        </button>
      </div>

      {open && matches.length > 0 && (
        <ul className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl overflow-hidden z-20 divide-y divide-slate-100 text-left">
          {matches.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onMouseDown={() => navigate(`/producto/${product.id}`)}
                className="w-full text-left px-4 py-2.5 hover:bg-brand-blueLight transition-colors flex items-center justify-between gap-3"
              >
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold text-slate-700 truncate">{product.name}</span>
                  <span className="block text-[11px] text-slate-400 font-mono">{product.sku}</span>
                </span>
                <span className="text-xs font-black text-brand-blue shrink-0">{formatPrice(product.price)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

/**
 * Hero comercial de la Home, con switcher B2C/B2B: el modo Contratistas
 * destaca la cotización PDF y una búsqueda directa por SKU en vez de las
 * CTAs orientadas a compra minorista. No contiene el simulador (ver
 * PaintSimulator, reubicado más abajo en Catalog.jsx) para no bloquear el
 * acceso al catálogo.
 */
export default function Hero({ onViewCatalog, onBrowseTools, onOpenQuote, products = [] }) {
  const [mode, setMode] = useState('b2c');
  const navigate = useNavigate();
  const isB2B = mode === 'b2b';

  return (
    <section className="relative bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 overflow-hidden">
      <div aria-hidden className="absolute -top-24 -right-16 w-96 h-96 rounded-full bg-brand-blue/25 blur-3xl pointer-events-none" />
      <div aria-hidden className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-accent-500/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 pt-12 pb-28 md:pt-16 md:pb-32">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl">
          <ModeToggle mode={mode} onChange={setMode} />

          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <span className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-[11px] font-bold tracking-wide uppercase px-3 py-1.5 rounded-full ring-1 ring-inset ring-white/10 mt-6">
                <Truck className="w-3.5 h-3.5" /> {isB2B ? 'Atención preferencial para empresas' : 'Despacho Express en Santiago'}
              </span>

              <h1 className="mt-5 text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.08]">
                {isB2B ? (
                  <>
                    Materiales para tu Obra,
                    <br className="hidden sm:block" /> Facturados y a Tiempo
                  </>
                ) : (
                  <>
                    Tu Ferretería Profesional
                    <br className="hidden sm:block" /> en Providencia y Vitacura
                  </>
                )}
              </h1>

              <p className="mt-4 text-[15px] text-slate-300 font-medium leading-relaxed max-w-lg">
                {isB2B
                  ? 'Cotiza en PDF al instante, compra con factura a tu RUT y coordina despacho prioritario para tu obra o contratista.'
                  : 'Pinturas con tintometría digital, herramientas y materiales de construcción. Retiro gratis en tienda o despacho el mismo día.'}
              </p>

              {isB2B ? (
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    transition={SPRING}
                    onClick={onOpenQuote}
                    className="inline-flex items-center gap-2 bg-white text-navy-950 font-bold tracking-tight px-6 py-3.5 rounded-2xl shadow-lift"
                  >
                    <FileText className="w-4 h-4" /> Generar Cotización en PDF
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    transition={SPRING}
                    onClick={onViewCatalog}
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold tracking-tight px-6 py-3.5 rounded-2xl ring-1 ring-inset ring-white/15 transition-colors"
                  >
                    Ver Catálogo Completo <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              ) : (
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    transition={SPRING}
                    onClick={onViewCatalog}
                    className="inline-flex items-center gap-2 bg-white text-navy-950 font-bold tracking-tight px-6 py-3.5 rounded-2xl shadow-lift"
                  >
                    Ver Catálogo <ArrowRight className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    transition={SPRING}
                    onClick={onBrowseTools}
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold tracking-tight px-6 py-3.5 rounded-2xl ring-1 ring-inset ring-white/15 transition-colors"
                  >
                    <Wrench className="w-4 h-4" /> Herramientas
                  </motion.button>
                </div>
              )}

              {isB2B && <SkuQuickSearch products={products} navigate={navigate} />}

              {!isB2B && (
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Fórmula propia Garachena
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-400" /> Despacho hoy mismo en RM
                  </span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

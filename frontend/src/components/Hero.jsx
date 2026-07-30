import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Building2, FileText, Home as HomeIcon, ScanBarcode, Store, Truck } from 'lucide-react';
import { formatPrice } from '../utils/format';

const EASE = { duration: 0.35, ease: 'easeOut' };
const countFormatter = new Intl.NumberFormat('es-CL');

const MODE_OPTIONS = [
  { value: 'b2c', label: 'Proyectos del Hogar', shortLabel: 'Hogar', icon: HomeIcon },
  { value: 'b2b', label: 'Contratistas y Constructoras', shortLabel: 'Empresas', icon: Building2 },
];

/** Switcher B2C/B2B con indicador animado (mismo patrón que AdminSidebar). */
function ModeToggle({ mode, onChange }) {
  return (
    <div className="inline-flex items-center bg-white/10 rounded-full p-1.5 ring-1 ring-inset ring-white/15 gap-1">
      {MODE_OPTIONS.map((opt) => {
        const active = mode === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            /*
             * min-h-11 (44px): área táctil mínima recomendada para el switcher B2C/B2B.
             * isolate: sin esto, el -z-10 de la píldora activa (abajo) se compara contra
             * el stacking context del motion.div ancestro (Framer Motion le aplica
             * `transform`, que crea uno) en vez de quedar contenido en este botón, y la
             * píldora blanca terminaba pintándose invisible detrás de otro contenido.
             */
            className="group relative isolate px-4 min-h-11 rounded-full text-2xs sm:text-xs font-medium tracking-tight flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            {active && (
              <motion.span
                layoutId="hero-mode-active"
                transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                className="absolute inset-0 bg-white rounded-full -z-10"
              />
            )}
            <opt.icon
              className={`w-3.5 h-3.5 relative z-10 shrink-0 ${active ? 'text-ink-950' : 'text-white/70 group-hover:text-white/90'}`}
            />
            <span className={`relative z-10 whitespace-nowrap ${active ? 'text-ink-950' : 'text-white/70 group-hover:text-white/90'}`}>
              {/* Debajo de sm el label completo ("Contratistas y Constructoras") no cabe
                  ni en 320px junto al otro pill: se usa una versión corta en mobile. */}
              <span className="sm:hidden">{opt.shortLabel}</span>
              <span className="hidden sm:inline">{opt.label}</span>
            </span>
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
          className="w-full pl-11 pr-24 py-3.5 bg-white/[0.06] border border-white/15 rounded-full text-white placeholder-white/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/10 transition-colors"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1.5 bottom-1.5 bg-white text-ink-950 text-xs font-semibold px-4 rounded-full hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          Buscar
        </button>
      </div>

      {open && matches.length > 0 && (
        <ul className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl overflow-hidden z-20 divide-y divide-neutral-100 text-left">
          {matches.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onMouseDown={() => navigate(`/producto/${product.id}`)}
                className="w-full text-left px-4 py-2.5 hover:bg-neutral-50 transition-colors flex items-center justify-between gap-3 focus-visible:outline-none focus-visible:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue/30"
              >
                <span className="min-w-0">
                  <span className="block text-13 font-medium text-neutral-800 truncate">{product.name}</span>
                  <span className="block text-2xs text-neutral-400 font-mono">{product.sku}</span>
                </span>
                <span className="text-xs font-semibold text-brand-blue shrink-0">{formatPrice(product.price)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

/** Panel editorial asimétrico: estadísticas reales del catálogo, desplazado respecto a la columna de texto. */
function StatsPanel({ productsCount }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...EASE, delay: 0.15 }}
      className="w-full max-w-sm lg:-mt-10 bg-white/[0.04] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-sm"
    >
      <p className="text-10 uppercase tracking-[0.2em] text-white/40 font-medium">Catálogo en tiempo real</p>
      <p className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight text-white tabular-nums">
        {productsCount > 0 ? countFormatter.format(productsCount) : '—'}
      </p>
      <p className="mt-1.5 text-13 text-white/50 leading-relaxed">
        productos con stock verificado en Providencia y Vitacura
      </p>
      <div className="mt-6 sm:mt-7 pt-5 sm:pt-6 border-t border-white/10 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-full bg-accent-400/15 text-accent-400 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-semibold text-white tabular-nums leading-none">24h</p>
            <p className="text-10 sm:text-2xs text-white/40 mt-1 leading-tight">Sector oriente</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-full bg-accent-400/15 text-accent-400 flex items-center justify-center shrink-0">
            <Store className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-semibold text-white tabular-nums leading-none">2</p>
            <p className="text-10 sm:text-2xs text-white/40 mt-1 leading-tight">Providencia · Vitacura</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Hero editorial con switcher B2C/B2B: el modo Contratistas destaca la
 * cotización PDF y una búsqueda directa por SKU en vez de las CTAs
 * orientadas a compra minorista. Composición asimétrica (texto + panel de
 * stats desplazado) en vez del bloque centrado de la versión anterior. No
 * contiene el simulador (ver PaintSimulator, reubicado más abajo en
 * Catalog.jsx) para no bloquear el acceso al catálogo.
 */
export default function Hero({ onViewCatalog, onOpenQuote, products = [] }) {
  const [mode, setMode] = useState('b2c');
  const navigate = useNavigate();
  const isB2B = mode === 'b2b';

  return (
    <section className="relative bg-gradient-to-b from-[#151517] to-ink-950 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 pt-14 pb-24 md:pt-20 md:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          <div className="lg:col-span-7">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={EASE}>
              <ModeToggle mode={mode} onChange={setMode} />
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={EASE}>
                <p className="mt-7 flex items-center gap-2 text-2xs uppercase tracking-[0.2em] text-white/40 font-medium">
                  <Truck className="w-3.5 h-3.5" /> {isB2B ? 'Atención preferencial para empresas' : 'Providencia · Vitacura'}
                </p>

                <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.05]">
                  {isB2B ? (
                    <>
                      Materiales para tu Obra,
                      <br className="hidden sm:block" /> Facturados y a Tiempo
                    </>
                  ) : (
                    <>
                      Equipamiento Industrial
                      <br className="hidden sm:block" /> &amp; Ferretería de Alta Gama
                    </>
                  )}
                </h1>

                <p className="mt-5 text-15 text-white/55 font-normal leading-relaxed max-w-lg">
                  {isB2B
                    ? 'Cotiza en PDF al instante, compra con factura a tu RUT y coordina despacho prioritario para tu obra o contratista.'
                    : 'Pinturas con tintometría digital, herramientas y materiales de construcción, seleccionados para quienes exigen precisión.'}
                </p>

                {isB2B ? (
                  <div className="mt-9 flex flex-wrap items-center gap-3">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      onClick={onOpenQuote}
                      className="inline-flex items-center gap-2 bg-accent-400 hover:bg-accent-500 text-ink-950 font-semibold tracking-tight px-6 py-3.5 rounded-full shadow-[0_8px_24px_-6px_rgba(245,158,11,0.5)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    >
                      <FileText className="w-4 h-4" /> Generar Cotización en PDF
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      onClick={onViewCatalog}
                      className="inline-flex items-center gap-2 bg-transparent text-white font-medium tracking-tight px-6 py-3.5 rounded-full border border-white/20 hover:border-white/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    >
                      Ver Catálogo Completo <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                ) : (
                  <div className="mt-9 flex flex-wrap items-center gap-3">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      onClick={onViewCatalog}
                      className="inline-flex items-center gap-2 bg-accent-400 hover:bg-accent-500 text-ink-950 font-semibold tracking-tight px-6 py-3.5 rounded-full shadow-[0_8px_24px_-6px_rgba(245,158,11,0.5)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    >
                      Ver Catálogo <ArrowRight className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      onClick={onOpenQuote}
                      className="inline-flex items-center gap-2 bg-transparent text-white font-medium tracking-tight px-6 py-3.5 rounded-full border border-white/20 hover:border-white/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    >
                      <FileText className="w-4 h-4" /> Cotizar mi Proyecto
                    </motion.button>
                  </div>
                )}

                {isB2B && <SkuQuickSearch products={products} navigate={navigate} />}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="lg:col-span-5 flex lg:justify-end">
            <StatsPanel productsCount={products.length} />
          </div>
        </div>
      </div>
    </section>
  );
}

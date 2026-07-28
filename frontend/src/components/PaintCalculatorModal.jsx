import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calculator, ShoppingCart, X } from 'lucide-react';
import { fetchProductWithStock } from '../api';
import { computeGallonsNeeded } from '../utils/paint';
import { totalStockOf } from '../utils/format';

const SPRING = { type: 'spring', stiffness: 300, damping: 20 };

function NumberField({ label, value, onChange, min = 0, step = 0.1, suffix }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</label>
      <div className="relative mt-1">
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">{suffix}</span>}
      </div>
    </div>
  );
}

/**
 * Calculadora de superficie -> galones necesarios. Accesible desde la ficha
 * de un producto de Pinturas (ProductDetail) y desde el Simulador
 * (PaintSimulator), ambos le pasan el producto vinculado con el que se
 * agregará al carrito. El stock se resuelve recién al confirmar (los
 * resultados de búsqueda que alimentan al Simulador no traen stock), así el
 * total siempre refleja disponibilidad real al momento del clic.
 */
export default function PaintCalculatorModal({ open, onClose, product, onAdd }) {
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [openings, setOpenings] = useState('0');
  const [coats, setCoats] = useState('2');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const result = useMemo(() => computeGallonsNeeded({ width, height, openings, coats }), [width, height, openings, coats]);
  const hasInput = Number(width) > 0 && Number(height) > 0;

  function handleClose() {
    setWidth('');
    setHeight('');
    setOpenings('0');
    setCoats('2');
    setError('');
    onClose();
  }

  async function handleAddToCart() {
    if (!product || !onAdd) return;
    setError('');
    setAdding(true);
    try {
      const fresh = await fetchProductWithStock(product.id);
      onAdd({ ...fresh, stock: totalStockOf(fresh) }, result.gallonsToBuy);
      handleClose();
    } catch {
      setError('No se pudo agregar el producto al carrito. Intenta nuevamente.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[130]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} className="absolute inset-0 bg-slate-900/60" />

          <div className="relative min-h-full flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black tracking-tight text-navy-900 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-brand-blue" /> Calculadora de Pintura
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Cuántos galones necesitas según tu superficie</p>
                </div>
                <button type="button" onClick={handleClose} title="Cerrar" className="p-2 text-slate-400 hover:text-brand-blue rounded-lg hover:bg-slate-50 shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <NumberField label="Ancho" value={width} onChange={setWidth} suffix="m" />
                  <NumberField label="Alto" value={height} onChange={setHeight} suffix="m" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <NumberField label="Puertas/ventanas" value={openings} onChange={setOpenings} step={1} suffix="unid." />
                  <NumberField label="Manos de pintura" value={coats} onChange={setCoats} step={1} min={1} suffix="manos" />
                </div>

                <AnimatePresence mode="wait">
                  {hasInput && (
                    <motion.div
                      key={`${result.gallonsToBuy}-${result.netArea.toFixed(2)}-${result.coats}`}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="bg-brand-blueLight rounded-2xl p-4 text-center"
                    >
                      <p className="text-[13px] font-semibold text-slate-600">Necesitas</p>
                      <p className="text-2xl font-black tracking-tight text-brand-blue mt-0.5 tabular-nums">
                        {result.gallonsToBuy} {result.gallonsToBuy === 1 ? 'Galón' : 'Galones'}
                      </p>
                      <p className="text-[13px] font-semibold text-slate-600 mt-0.5">
                        para cubrir {result.netArea.toFixed(1)} m² a {result.coats} {result.coats === 1 ? 'mano' : 'manos'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium mt-1.5">Rendimiento estimado: ~37,5 m² por galón a 1 mano.</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!hasInput && (
                  <p className="text-xs text-slate-400 text-center font-medium py-2">Ingresa el ancho y alto de la superficie a pintar.</p>
                )}

                {error && <p className="text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">{error}</p>}

                {hasInput && product && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={SPRING}
                    onClick={handleAddToCart}
                    disabled={adding}
                    className="w-full flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blueDark text-white font-bold tracking-tight py-3.5 rounded-2xl shadow-lg shadow-brand-blue/25 hover:shadow-xl hover:shadow-brand-blue/30 transition-all duration-300 disabled:opacity-60"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {adding ? 'Agregando...' : `Añadir ${result.gallonsToBuy} ${result.gallonsToBuy === 1 ? 'Galón' : 'Galones'} al Carrito`}
                  </motion.button>
                )}

                {hasInput && !product && (
                  <p className="text-xs text-slate-400 text-center font-medium">
                    No encontramos un producto vinculado para agregar directamente. Búscalo en el catálogo.
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

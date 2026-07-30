import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Clock, MapPin, Store, Truck } from 'lucide-react';
import { DELIVERY_COMMUNES, PICKUP_BRANCHES } from '../hooks/useDeliveryPreference';
import { getDeliveryEta } from '../utils/delivery';

const EASE = { duration: 0.18, ease: 'easeOut' };

function OptionPill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-neutral-900 ${
        active ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
      }`}
    >
      {label}
    </button>
  );
}

/**
 * Selector omnicanal de logística: retiro gratis en tienda o despacho
 * express en el sector oriente, con insignia de tiempo estimado dinámica
 * (ver utils/delivery.js). El estado vive en Catalog.jsx (useDeliveryPreference)
 * y se pasa por props para que Header y CartDrawer queden siempre
 * sincronizados entre sí.
 */
export default function DeliveryLocationSelector({ preference, onSetPickup, onSetDelivery, className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const eta = getDeliveryEta(preference);
  const summary = preference.type === 'pickup' ? `Retiro en ${preference.branch}` : `Despacho a ${preference.commune}`;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:border-neutral-300 transition-colors max-w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900"
      >
        <MapPin className="w-3.5 h-3.5 text-brand-blue shrink-0" />
        <span className="truncate max-w-[160px]">{summary}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={EASE}
            className="absolute left-0 mt-2 w-80 max-w-[90vw] bg-white rounded-2xl border border-neutral-200/70 shadow-lift p-4 z-50"
          >
            <p className="text-2xs font-semibold uppercase tracking-wide text-neutral-400 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" /> Retiro Gratis en Tienda
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {PICKUP_BRANCHES.map((branch) => (
                <OptionPill
                  key={branch}
                  label={branch}
                  active={preference.type === 'pickup' && preference.branch === branch}
                  onClick={() => onSetPickup(branch)}
                />
              ))}
            </div>

            <p className="text-2xs font-semibold uppercase tracking-wide text-neutral-400 flex items-center gap-1.5 mt-4">
              <Truck className="w-3.5 h-3.5" /> Despacho Express Sector Oriente
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {DELIVERY_COMMUNES.map((commune) => (
                <OptionPill
                  key={commune}
                  label={commune}
                  active={preference.type === 'delivery' && preference.commune === commune}
                  onClick={() => onSetDelivery(commune)}
                />
              ))}
            </div>

            <div
              className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium ${
                eta.tone === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-50 text-neutral-600'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              {eta.label}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

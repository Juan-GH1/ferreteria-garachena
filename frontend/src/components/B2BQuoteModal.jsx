import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileDown, X } from 'lucide-react';
import { generateB2BQuotePdf } from '../utils/generateQuotePdf';
import { useToast } from '../hooks/useToast';

const SPRING = { type: 'spring', stiffness: 300, damping: 20 };

/**
 * Recolecta datos opcionales del cliente (Maestro/Constructora) y genera la
 * cotización B2B en PDF. No valida los campos: son solo para personalizar el
 * documento, la generación funciona igual sin completarlos.
 */
export default function B2BQuoteModal({ open, onClose, items }) {
  const showToast = useToast();
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [email, setEmail] = useState('');
  const [generating, setGenerating] = useState(false);

  function handleClose() {
    setName('');
    setRut('');
    setEmail('');
    onClose();
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const quoteNumber = await generateB2BQuotePdf({ items, customer: { name: name.trim(), rut: rut.trim(), email: email.trim() } });
      showToast(`Cotización ${quoteNumber} descargada correctamente.`);
      handleClose();
    } catch {
      showToast('No se pudo generar el PDF. Intenta nuevamente.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[140]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} className="absolute inset-0 bg-slate-900/60" />

          <div className="relative min-h-full flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black tracking-tight text-navy-900">Cotización B2B</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Datos opcionales, solo para el PDF</p>
                </div>
                <button type="button" onClick={handleClose} title="Cerrar" className="p-2 text-slate-400 hover:text-brand-blue rounded-lg hover:bg-slate-50 shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Cliente / Empresa</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Constructora Los Andes SpA"
                    className="w-full mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">RUT</label>
                    <input
                      type="text"
                      value={rut}
                      onChange={(e) => setRut(e.target.value)}
                      placeholder="76543210-3"
                      className="w-full mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="compras@empresa.cl"
                      className="w-full mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
                    />
                  </div>
                </div>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={SPRING}
                  onClick={handleGenerate}
                  disabled={generating || items.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blueDark text-white font-bold tracking-tight py-3.5 rounded-2xl shadow-lg shadow-brand-blue/25 hover:shadow-xl hover:shadow-brand-blue/30 transition-all duration-300 disabled:opacity-60"
                >
                  <FileDown className="w-4 h-4" /> {generating ? 'Generando...' : 'Descargar PDF'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

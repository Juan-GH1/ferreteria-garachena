import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { updateProduct } from '../../api';

export default function AdminProductEditModal({ product, onClose, onSaved }) {
  const [price, setPrice] = useState('');
  const [stockProvidencia, setStockProvidencia] = useState('0');
  const [stockVitacura, setStockVitacura] = useState('0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // El modal es un único componente montado por toda la vida de la página
  // (AnimatePresence necesita que persista para animar el cierre), así que el
  // formulario debe resincronizarse cada vez que cambia el producto objetivo
  // en vez de confiar en el valor inicial de useState (que solo corre una vez).
  useEffect(() => {
    if (!product) return;
    setPrice(String(product.price ?? ''));
    setStockProvidencia(String(product.stock?.Providencia ?? 0));
    setStockVitacura(String(product.stock?.Vitacura ?? 0));
    setError('');
  }, [product]);

  async function handleSave() {
    const parsedPrice = Number(price);
    const parsedProvidencia = Number(stockProvidencia);
    const parsedVitacura = Number(stockVitacura);

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError('El precio debe ser un número mayor o igual a 0.');
      return;
    }
    if (!Number.isInteger(parsedProvidencia) || parsedProvidencia < 0 || !Number.isInteger(parsedVitacura) || parsedVitacura < 0) {
      setError('El stock debe ser un número entero mayor o igual a 0 en ambas sucursales.');
      return;
    }

    setError('');
    setSaving(true);
    const result = await updateProduct(product.id, {
      price: parsedPrice,
      stock: { Providencia: parsedProvidencia, Vitacura: parsedVitacura },
    });
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved(result.product);
  }

  return (
    <AnimatePresence>
      {product && (
        <div className="fixed inset-0 z-[120]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60" />
          <div className="relative min-h-full flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-100">
                <div className="min-w-0">
                  <h3 className="text-base font-black tracking-tight text-navy-900">Editar producto</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">{product.name}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  title="Cerrar"
                  className="p-2 text-slate-400 hover:text-brand-blue rounded-lg hover:bg-slate-50 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Precio (CLP)</label>
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Stock Providencia</label>
                    <input
                      type="number"
                      min="0"
                      value={stockProvidencia}
                      onChange={(e) => setStockProvidencia(e.target.value)}
                      className="w-full mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Stock Vitacura</label>
                    <input
                      type="number"
                      min="0"
                      value={stockVitacura}
                      onChange={(e) => setStockVitacura(e.target.value)}
                      className="w-full mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
                    />
                  </div>
                </div>

                {error && (
                  <p className="flex items-start gap-2 text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl bg-brand-blue hover:bg-brand-blueDark text-white font-bold transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue"
                  >
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

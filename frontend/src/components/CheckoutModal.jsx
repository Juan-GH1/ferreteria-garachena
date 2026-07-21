import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileDown, X } from 'lucide-react';
import { createOrder } from '../api';
import { formatPrice } from '../utils/format';
import { isValidRut } from '../utils/rut';
import B2BQuoteModal from './B2BQuoteModal';

const DISPATCH_FEE = 3990;

const DELIVERY_OPTIONS = [
  { value: 'Retiro Providencia', label: 'Retiro en Providencia', priceLabel: 'Gratis', priceClass: 'text-emerald-600' },
  { value: 'Retiro Vitacura', label: 'Retiro en Vitacura', priceLabel: 'Gratis', priceClass: 'text-emerald-600' },
  { value: 'Despacho a Domicilio RM', label: 'Despacho a Domicilio RM', priceLabel: '+$3.990', priceClass: 'text-slate-500' },
];

const EMPTY_FORM = {
  name: '',
  rut: '',
  email: '',
  phone: '',
  deliveryType: DELIVERY_OPTIONS[0].value,
  documentType: 'boleta',
  billingRut: '',
  billingRazonSocial: '',
  billingGiro: '',
  billingAddress: '',
};

export default function CheckoutModal({ open, onClose, cartItems, onSuccess, onStockConflict }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);

  const itemsTotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const dispatchFee = form.deliveryType === 'Despacho a Domicilio RM' ? DISPATCH_FEE : 0;
  const total = itemsTotal + dispatchFee;
  const subtotal = total / 1.19;
  const iva = total - subtotal;

  function handleClose() {
    setStep(1);
    setForm(EMPTY_FORM);
    setError('');
    onClose();
  }

  function validateStep1() {
    if (!form.name.trim()) return 'Ingresa tu nombre completo.';
    if (!isValidRut(form.rut)) return 'El RUT ingresado no es válido (ej: 12345678-9).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Ingresa un email válido.';
    if (!form.phone.trim()) return 'Ingresa un teléfono de contacto.';

    if (form.documentType === 'factura') {
      if (!isValidRut(form.billingRut)) return 'El RUT de facturación no es válido (ej: 76543210-3).';
      if (!form.billingRazonSocial.trim()) return 'Ingresa la razón social de la empresa.';
      if (!form.billingGiro.trim()) return 'Ingresa el giro comercial.';
      if (!form.billingAddress.trim()) return 'Ingresa la dirección de facturación.';
    }
    return null;
  }

  function goToStep2() {
    const validationError = validateStep1();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setStep(2);
  }

  // El envío se dispara siempre por handlers de clic/teclado explícitos, nunca
  // por el evento "submit" nativo del <form>: al hacer clic en "Continuar",
  // React re-renderiza y reemplaza ese botón por el de "Confirmar Pedido"
  // (type="submit") en la misma posición del DOM dentro del mismo ciclo del
  // evento, y el navegador puede terminar disparando el submit nativo sobre
  // el botón nuevo. Evitamos el problema no dependiendo de type="submit"/onSubmit.
  async function submitOrder() {
    setError('');
    setSubmitting(true);

    const billing =
      form.documentType === 'factura'
        ? {
            document_type: 'factura',
            rut: form.billingRut.trim(),
            razon_social: form.billingRazonSocial.trim(),
            giro: form.billingGiro.trim(),
            address: form.billingAddress.trim(),
          }
        : { document_type: 'boleta' };

    const payload = {
      customer: { name: form.name.trim(), rut: form.rut.trim(), email: form.email.trim(), phone: form.phone.trim() },
      delivery_type: form.deliveryType,
      billing,
      items: cartItems.map((item) => ({ product_id: Number(item.id), quantity: item.qty })),
    };

    const result = await createOrder(payload);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      if (result.status === 409) onStockConflict?.();
      return;
    }

    onSuccess(result.order);
    handleClose();
  }

  function handleKeyDown(event) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (step === 1) goToStep2();
    else if (!submitting) submitOrder();
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] overflow-y-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} className="fixed inset-0 bg-slate-900/60" />

          <div className="relative min-h-full flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-extrabold text-brand-dark">Finalizar Compra</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    {step === 1 ? 'Paso 1 de 2 · Datos y entrega' : 'Paso 2 de 2 · Resumen y pago'}
                  </p>
                </div>
                <button type="button" onClick={handleClose} title="Cerrar" className="p-2 text-slate-400 hover:text-brand-blue rounded-lg hover:bg-slate-50">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(event) => event.preventDefault()} onKeyDown={handleKeyDown} className="p-5 space-y-5" noValidate>
                {step === 1 ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nombre completo</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        autoComplete="name"
                        className="w-full mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">RUT</label>
                        <input
                          type="text"
                          value={form.rut}
                          onChange={(e) => setForm({ ...form, rut: e.target.value })}
                          placeholder="12345678-9"
                          className="w-full mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Teléfono</label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="+56 9 1234 5678"
                          autoComplete="tel"
                          className="w-full mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        autoComplete="email"
                        className="w-full mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tipo de entrega</label>
                      <div className="mt-2 space-y-2">
                        {DELIVERY_OPTIONS.map((option) => (
                          <label
                            key={option.value}
                            className={`flex items-center justify-between gap-3 p-3 border-2 rounded-xl cursor-pointer transition-colors ${
                              form.deliveryType === option.value ? 'border-brand-blue bg-brand-blueLight' : 'border-slate-200'
                            }`}
                          >
                            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                              <input
                                type="radio"
                                name="delivery_type"
                                checked={form.deliveryType === option.value}
                                onChange={() => setForm({ ...form, deliveryType: option.value })}
                                className="text-brand-blue focus:ring-brand-blue"
                              />
                              {option.label}
                            </span>
                            <span className={`text-xs font-bold ${option.priceClass}`}>{option.priceLabel}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Documento tributario</label>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {[
                          { value: 'boleta', label: 'Boleta' },
                          { value: 'factura', label: 'Factura' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setForm({ ...form, documentType: option.value })}
                            className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-colors ${
                              form.documentType === option.value
                                ? 'border-brand-blue bg-brand-blueLight text-brand-blue'
                                : 'border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>

                      <AnimatePresence initial={false}>
                        {form.documentType === 'factura' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-3 pt-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">RUT empresa</label>
                                  <input
                                    type="text"
                                    value={form.billingRut}
                                    onChange={(e) => setForm({ ...form, billingRut: e.target.value })}
                                    placeholder="76543210-3"
                                    className="w-full mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Giro comercial</label>
                                  <input
                                    type="text"
                                    value={form.billingGiro}
                                    onChange={(e) => setForm({ ...form, billingGiro: e.target.value })}
                                    placeholder="Construcción"
                                    className="w-full mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Razón social</label>
                                <input
                                  type="text"
                                  value={form.billingRazonSocial}
                                  onChange={(e) => setForm({ ...form, billingRazonSocial: e.target.value })}
                                  placeholder="Empresa SpA"
                                  className="w-full mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Dirección de facturación</label>
                                <input
                                  type="text"
                                  value={form.billingAddress}
                                  onChange={(e) => setForm({ ...form, billingAddress: e.target.value })}
                                  placeholder="Av. Providencia 1234, Of. 56"
                                  className="w-full mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm gap-2">
                          <span className="text-slate-600 font-semibold truncate">
                            {item.name} <span className="text-slate-400">×{item.qty}</span>
                          </span>
                          <span className="text-slate-700 font-bold shrink-0">{formatPrice(item.price * item.qty)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                      <span className="text-slate-500 font-semibold">Documento</span>
                      <span className="font-bold text-slate-700">
                        {form.documentType === 'factura' ? `Factura · ${form.billingRazonSocial.trim()}` : 'Boleta'}
                      </span>
                    </div>
                    <div className="border-t border-slate-100 pt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-sm text-slate-500 font-semibold">
                        <span>Subtotal (neto)</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-500 font-semibold">
                        <span>IVA (19%)</span>
                        <span>{formatPrice(iva)}</span>
                      </div>
                      {dispatchFee > 0 && (
                        <div className="flex items-center justify-between text-sm text-slate-500 font-semibold">
                          <span>Despacho a domicilio</span>
                          <span>{formatPrice(dispatchFee)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-base font-black text-brand-dark pt-2 border-t border-slate-200">
                        <span>Total a pagar</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuoteOpen(true)}
                      className="w-full flex items-center justify-center gap-2 text-[13px] font-bold text-brand-dark border border-slate-200 hover:border-brand-dark py-2.5 rounded-xl transition-colors"
                    >
                      <FileDown className="w-4 h-4" /> Descargar Cotización B2B (PDF)
                    </button>
                  </div>
                )}

                {error && <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{error}</p>}

                <div className="flex items-center gap-3 pt-2">
                  {step === 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setStep(1);
                      }}
                      className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                    >
                      Volver
                    </button>
                  )}
                  {step === 1 ? (
                    <button
                      type="button"
                      onClick={goToStep2}
                      className="flex-1 py-3 rounded-xl bg-brand-blue hover:bg-brand-blueDark text-white font-bold transition-colors"
                    >
                      Continuar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={submitOrder}
                      disabled={submitting}
                      className="flex-1 py-3 rounded-xl bg-brand-blue hover:bg-brand-blueDark text-white font-bold transition-colors disabled:opacity-60"
                    >
                      {submitting ? 'Procesando...' : 'Confirmar Pedido (Simular Pago)'}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}

      <B2BQuoteModal open={quoteOpen} onClose={() => setQuoteOpen(false)} items={cartItems} />
    </AnimatePresence>
  );
}

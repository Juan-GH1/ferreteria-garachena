import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  KeyRound,
  UploadCloud,
  X,
} from 'lucide-react';
import { importProducts } from '../api';
import { useToast } from '../hooks/useToast';

const ADMIN_KEY_STORAGE = 'garachena_admin_key';
const ALLOWED_EXTENSIONS = /\.(csv|xlsx|xls)$/i;

function GarachenaLogo() {
  return (
    <svg className="w-9 h-9 text-brand-blue" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="4" />
      <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="1" />
      <path d="M26 20 V80 H38 V20 Z" fill="currentColor" />
      <path d="M44 20 V80 H47 V20 Z" fill="currentColor" />
      <path d="M50 20 H74 C74 20 88 32 88 50 C88 68 74 80 50 80" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <path d="M63 53 H88" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

export default function AdminPanel() {
  const showToast = useToast();
  const fileInputRef = useRef(null);

  const [adminKey, setAdminKey] = useState(() => localStorage.getItem(ADMIN_KEY_STORAGE) || '');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null); // { ok, data?, message }
  const [sessionLog, setSessionLog] = useState([]);

  function handleAdminKeyChange(value) {
    setAdminKey(value);
    localStorage.setItem(ADMIN_KEY_STORAGE, value);
  }

  function logSessionEntry(fileName, summary, ok) {
    const time = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    setSessionLog((prev) => [{ fileName, summary, ok, time, id: crypto.randomUUID() }, ...prev]);
  }

  async function handleFileSelected(file) {
    if (!ALLOWED_EXTENSIONS.test(file.name)) {
      showToast('Formato no soportado. Usa un archivo .csv, .xlsx o .xls.');
      return;
    }

    setSelectedFileName(file.name);
    setResult(null);
    setProcessing(true);
    showToast('Procesando archivo...');

    const response = await importProducts(file, adminKey.trim());
    setProcessing(false);

    if (!response.ok) {
      setResult({ ok: false, message: response.error });
      showToast(`Error: ${response.error}`);
      logSessionEntry(file.name, `Error: ${response.error}`, false);
      return;
    }

    const { data } = response;
    const totalOk = data.created + data.updated;
    const successMessage = `¡Éxito! ${totalOk} producto${totalOk === 1 ? '' : 's'} actualizado${totalOk === 1 ? '' : 's'} correctamente.`;
    setResult({ ok: true, data, message: successMessage });
    showToast(successMessage);
    logSessionEntry(file.name, `${data.created} creados, ${data.updated} actualizados, ${data.skipped} omitidos (de ${data.total_rows} filas)`, true);
  }

  function handleInputChange(event) {
    const file = event.target.files[0];
    if (file) handleFileSelected(file);
    event.target.value = '';
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files[0];
    if (file) handleFileSelected(file);
  }

  return (
    <div className="bg-brand-light text-slate-800 font-sans antialiased min-h-screen">
      <header className="bg-brand-dark text-white">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GarachenaLogo />
            <div>
              <h1 className="text-lg font-extrabold leading-none">Portal de Administración Garachena</h1>
              <p className="text-xs text-slate-400 font-semibold mt-1">Sincronización masiva de inventario · puente hacia Sisgen</p>
            </div>
          </div>
          <Link to="/" className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Ver tienda
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <label htmlFor="admin-key-input" className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-brand-blue" /> Clave de administrador (opcional)
          </label>
          <p className="text-xs text-slate-400 mt-1 mb-2">
            Solo necesaria si el servidor tiene <code className="bg-slate-50 px-1 py-0.5 rounded">ADMIN_API_KEY</code> configurada. Se guarda en este
            navegador.
          </p>
          <input
            id="admin-key-input"
            type="password"
            value={adminKey}
            onChange={(e) => handleAdminKeyChange(e.target.value)}
            placeholder="Clave de administrador"
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
          />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-extrabold text-brand-dark flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-brand-blue" /> Importar inventario
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Sube el archivo exportado desde Sisgen (.csv, .xlsx o .xls). Columnas esperadas:{' '}
              <code className="bg-slate-50 px-1 py-0.5 rounded">SKU</code>, <code className="bg-slate-50 px-1 py-0.5 rounded">nombre</code>,{' '}
              <code className="bg-slate-50 px-1 py-0.5 rounded">precio</code>, <code className="bg-slate-50 px-1 py-0.5 rounded">stock_total</code>. Si
              el SKU ya existe se actualiza precio y stock; si no, se crea el producto.
            </p>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
              dragActive ? 'border-brand-blue bg-brand-blueLight' : 'border-slate-300 hover:border-brand-blue hover:bg-brand-blueLight'
            }`}
          >
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleInputChange} />
            <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300" />
            <p className="mt-3 font-bold text-slate-600">Arrastra tu archivo aquí</p>
            <p className="text-xs text-slate-400 mt-1">o haz clic para seleccionarlo desde tu computador</p>
            {selectedFileName && <p className="mt-3 text-sm font-semibold text-brand-blue">Archivo seleccionado: {selectedFileName}</p>}
          </div>

          {processing && (
            <div className="flex items-center gap-3 bg-brand-blueLight text-brand-blue font-semibold text-sm p-4 rounded-xl">
              <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span>Procesando archivo...</span>
            </div>
          )}

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                {!result.ok ? (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold">{result.message}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl">
                      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-bold">{result.message}</p>
                        <p className="mt-1 text-emerald-600">
                          {result.data.total_rows} filas procesadas · {result.data.created} productos creados · {result.data.updated} actualizados
                        </p>
                      </div>
                    </div>
                    {result.data.errors?.length > 0 && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <p className="text-sm font-bold text-amber-700 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          {result.data.skipped} fila{result.data.skipped === 1 ? '' : 's'} omitida{result.data.skipped === 1 ? '' : 's'} por errores de
                          datos:
                        </p>
                        <ul className="mt-2 text-xs text-amber-700 space-y-1 max-h-40 overflow-y-auto pl-2">
                          {result.data.errors.map((line, index) => (
                            <li key={index}>• {line}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {sessionLog.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-wide mb-3">Importaciones de esta sesión</h3>
            <ul className="space-y-2 text-sm">
              {sessionLog.map((entry) => (
                <li key={entry.id} className="flex items-start gap-2 pb-2 border-b border-slate-50 last:border-0 last:pb-0">
                  {entry.ok ? (
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                  ) : (
                    <X className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                  )}
                  <span className="text-slate-600">
                    <span className="font-bold text-slate-800">{entry.fileName}</span> ({entry.time}) — {entry.summary}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

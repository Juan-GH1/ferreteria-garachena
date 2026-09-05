import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, KeyRound, LockKeyhole } from 'lucide-react';

function GarachenaMark() {
  return (
    <svg className="w-8 h-8 text-white" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="4" />
      <path d="M26 20 V80 H38 V20 Z" fill="currentColor" />
      <path d="M44 20 V80 H47 V20 Z" fill="currentColor" />
    </svg>
  );
}

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (onLogin(password)) return;
    setError('Contraseña incorrecta. Inténtalo nuevamente.');
    setPassword('');
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-soft ring-1 ring-slate-900/5 overflow-hidden"
      >
        <div className="bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 px-8 pt-8 pb-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center ring-1 ring-inset ring-white/10">
            <GarachenaMark />
          </div>
          <h1 className="mt-4 text-lg font-black tracking-tight text-white">Panel de Administración</h1>
          <p className="text-xs text-slate-300 font-medium mt-1">Ferretería Garachena</p>
        </div>

        <div className="p-8 -mt-6">
          <div className="bg-white rounded-2xl shadow-lift p-5 space-y-4">
            <div>
              <label htmlFor="admin-password" className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <LockKeyhole className="w-3.5 h-3.5 text-brand-blue" /> Contraseña
              </label>
              <input
                id="admin-password"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                className="w-full mt-1.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
              />
              {error && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-semibold text-rose-600 mt-2">
                  {error}
                </motion.p>
              )}
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={handleSubmit}
              className="w-full flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blueDark text-white font-bold tracking-tight py-3 rounded-xl shadow-md shadow-brand-blue/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue"
            >
              <KeyRound className="w-4 h-4" /> Ingresar
            </motion.button>
          </div>

          <Link
            to="/"
            className="mt-6 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 hover:text-brand-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 rounded"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a la tienda
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

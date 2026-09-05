import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, ExternalLink, KeyRound, LayoutDashboard, LogOut, Package, UploadCloud } from 'lucide-react';
import { ADMIN_KEY_STORAGE } from '../../api';

const NAV_ITEMS = [
  { to: '/admin', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
  { to: '/admin/catalogo', label: 'Catálogo', icon: Package },
  { to: '/admin/importar', label: 'Importar', icon: UploadCloud },
];

function GarachenaMark() {
  return (
    <svg className="w-7 h-7 text-white" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="4" />
      <path d="M26 20 V80 H38 V20 Z" fill="currentColor" />
      <path d="M44 20 V80 H47 V20 Z" fill="currentColor" />
    </svg>
  );
}

function NavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink to={to} end={end} className="relative block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
      {({ isActive }) => (
        <span
          className={`relative z-10 flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-13 font-bold tracking-tight transition-colors ${
            isActive ? 'text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          {isActive && (
            <motion.span
              layoutId="admin-nav-active"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="absolute inset-0 -z-10 rounded-xl bg-brand-blue shadow-md shadow-brand-blue/30"
            />
          )}
          <Icon className="w-4 h-4 shrink-0" />
          {label}
        </span>
      )}
    </NavLink>
  );
}

/**
 * Campo de clave de administrador (ADMIN_API_KEY / X-Admin-Key) compartido
 * por todas las páginas del panel — antes solo vivía en la vista de Importar,
 * lo que dejaba al resto de la UI sin forma de configurarla si el backend la
 * exige. Es un mecanismo aparte del login simulado: éste controla quién ve la
 * UI del panel en este navegador, aquél si el backend acepta las escrituras.
 */
function AdminKeyField() {
  const [key, setKey] = useState(() => localStorage.getItem(ADMIN_KEY_STORAGE) || '');

  function handleChange(value) {
    setKey(value);
    localStorage.setItem(ADMIN_KEY_STORAGE, value);
  }

  return (
    <div className="px-3.5">
      <label htmlFor="admin-api-key" className="text-10 font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <KeyRound className="w-3 h-3" /> Clave del servidor
      </label>
      <input
        id="admin-api-key"
        type="password"
        value={key}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Opcional"
        className="w-full mt-1.5 px-2.5 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-blue"
      />
    </div>
  );
}

export default function AdminSidebar({ onLogout }) {
  return (
    <aside className="w-64 shrink-0 bg-gradient-to-b from-navy-950 to-navy-900 min-h-screen flex flex-col py-6 gap-6">
      <div className="flex items-center gap-2.5 px-5">
        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center ring-1 ring-inset ring-white/10">
          <GarachenaMark />
        </div>
        <div>
          <p className="text-13 font-black tracking-tight text-white leading-none">GARACHENA</p>
          <p className="text-10 text-slate-400 font-bold uppercase tracking-widest mt-1">Panel Admin</p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1.5 px-3">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <div className="space-y-4 border-t border-white/10 pt-5">
        <AdminKeyField />

        <div className="px-3.5 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-13 font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors -mx-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <ExternalLink className="w-4 h-4 shrink-0" /> Ver tienda
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-13 font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors -mx-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <LogOut className="w-4 h-4 shrink-0" /> Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}

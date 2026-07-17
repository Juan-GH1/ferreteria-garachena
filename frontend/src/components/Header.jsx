import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, PhoneCall } from 'lucide-react';
import { formatPrice } from '../utils/format';

function GarachenaLogo() {
  return (
    <svg className="w-10 h-10 text-brand-blue" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="4" />
      <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="1" />
      <path d="M26 20 V80 H38 V20 Z" fill="currentColor" />
      <path d="M44 20 V80 H47 V20 Z" fill="currentColor" />
      <path d="M50 20 H74 C74 20 88 32 88 50 C88 68 74 80 50 80" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <path d="M63 53 H88" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

function CartBadge({ count, className }) {
  if (count === 0) return null;
  return <span className={className}>{count}</span>;
}

export default function Header({ cartCount, onOpenCart, searchQuery, onSearchQueryChange, searchResults, searchOpen, onSelectResult, onCloseSearch }) {
  const searchBoxRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        onCloseSearch();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCloseSearch]);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center justify-between w-full lg:w-auto">
          <Link to="/" className="flex items-center gap-3">
            <GarachenaLogo />
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-brand-dark leading-none">
                GARA<span className="text-brand-blue">CHENA</span>
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ferretería Profesional</span>
            </div>
          </Link>

          <button
            type="button"
            onClick={onOpenCart}
            className="relative p-2 text-slate-600 hover:text-brand-blue lg:hidden"
            title="Ver carrito"
          >
            <ShoppingCart className="w-6 h-6" />
            <CartBadge
              count={cartCount}
              className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center"
            />
          </button>
        </div>

        <div ref={searchBoxRef} className="relative w-full lg:max-w-xl">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="¿Qué herramienta o pintura buscas hoy?..."
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white transition-all text-sm font-medium"
            />
            <Search className="absolute left-4 top-3 text-slate-400 w-5 h-5" />
          </div>
          {searchOpen && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
              <ul className="text-sm divide-y divide-slate-100">
                {searchResults.length ? (
                  searchResults.map((product) => (
                    <li key={product.id}>
                      <button
                        type="button"
                        onClick={() => onSelectResult(product)}
                        className="w-full text-left p-3 flex items-center justify-between gap-3 hover:bg-brand-blueLight transition-colors"
                      >
                        <span>
                          <span className="block font-bold text-slate-700">{product.name}</span>
                          <span className="block text-xs text-slate-400">{product.category}</span>
                        </span>
                        <span className="font-black text-brand-blue text-sm shrink-0">{formatPrice(product.price)}</span>
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="p-4 text-slate-400 text-center text-sm">Sin resultados</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="hidden lg:flex items-center gap-6">
          <div className="flex items-center gap-3 text-xs border-r border-slate-200 pr-6">
            <div className="text-right">
              <p className="font-bold text-slate-700">Servicio al Cliente</p>
              <p className="text-brand-blue font-semibold">Providencia &amp; Vitacura</p>
            </div>
            <div className="bg-brand-blueLight p-2 rounded-xl text-brand-blue">
              <PhoneCall className="w-5 h-5" />
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenCart}
            className="relative bg-brand-blue hover:bg-brand-blueDark text-white p-3 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300"
            title="Ver carrito"
          >
            <ShoppingCart className="w-5 h-5" />
            <CartBadge
              count={cartCount}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold border-2 border-white"
            />
          </button>
        </div>
      </div>
    </header>
  );
}

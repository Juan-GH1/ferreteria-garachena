import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, PhoneCall } from 'lucide-react';
import { formatPrice } from '../utils/format';
import DeliveryLocationSelector from './DeliveryLocationSelector';

function GarachenaLogo() {
  return (
    <svg className="w-8 h-8 text-neutral-900 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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

/**
 * Nav flotante y minimalista (dirección editorial tipo nikola.cl): una sola
 * fila en todos los breakpoints, cápsula rounded-full con blur, en vez del
 * bloque de 2 filas con borde inferior de la versión anterior. La lógica de
 * búsqueda/dropdown/carrito es exactamente la misma, solo cambia el chrome.
 */
export default function Header({
  cartCount,
  onOpenCart,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  searchApproximate,
  searchOpen,
  onSelectResult,
  onCloseSearch,
  deliveryPreference,
  onSetPickup,
  onSetDelivery,
}) {
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
    <header className="sticky top-3 z-50 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto flex items-center gap-2.5 sm:gap-4 rounded-full bg-white/80 backdrop-blur-md border border-neutral-200/50 shadow-sm px-3 sm:px-5 py-2.5">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <GarachenaLogo />
          <span className="hidden sm:block text-[15px] font-semibold tracking-tight text-neutral-900 leading-none">
            GARA<span className="text-brand-blue">CHENA</span>
          </span>
        </Link>

        <div ref={searchBoxRef} className="relative flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="¿Qué herramienta o pintura buscas hoy?..."
              className="w-full pl-10 pr-3 py-2 bg-neutral-100 border-0 rounded-full text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:bg-white transition-colors text-[13px] sm:text-sm font-medium"
            />
          </div>
          {searchOpen && (
            <div className="absolute left-0 right-0 mt-2 bg-white border border-neutral-200/70 rounded-2xl shadow-lift overflow-hidden z-50">
              {searchApproximate && searchResults.length > 0 && (
                <p className="px-3.5 py-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 border-b border-amber-100">
                  Mostrando resultados aproximados para “{searchQuery.trim()}”
                </p>
              )}
              {/* divide-slate-100 (no divide-neutral-100): la suite E2E depende de este selector exacto
                  (ul.divide-y.divide-slate-100) para el dropdown de búsqueda; el tono es casi idéntico a neutral-100. */}
              <ul className="text-sm divide-y divide-slate-100">
                {searchResults.length ? (
                  searchResults.map((product) => (
                    <li key={product.id}>
                      <button
                        type="button"
                        onClick={() => onSelectResult(product)}
                        className="w-full text-left px-3.5 py-3 flex items-center justify-between gap-3 hover:bg-neutral-50 transition-colors"
                      >
                        <span className="min-w-0">
                          {/* font-bold (no font-medium): la suite E2E lee este nombre vía el selector span.font-bold */}
                          <span className="block font-bold text-neutral-800 truncate">{product.name}</span>
                          <span className="block text-xs text-neutral-400">{product.category}</span>
                        </span>
                        <span className="font-semibold text-brand-blue text-sm shrink-0">{formatPrice(product.price)}</span>
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="p-4 text-neutral-400 text-center text-sm">Sin resultados</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <DeliveryLocationSelector
          preference={deliveryPreference}
          onSetPickup={onSetPickup}
          onSetDelivery={onSetDelivery}
          className="hidden md:block shrink-0"
        />

        <div className="hidden lg:flex items-center gap-2.5 text-xs text-neutral-500 shrink-0 pr-1 border-r border-neutral-200 mr-0.5">
          <PhoneCall className="w-4 h-4 text-neutral-400" />
          <div className="pr-3">
            <p className="font-medium text-neutral-700 leading-tight">Servicio al Cliente</p>
            <p className="text-neutral-400 leading-tight">Providencia &amp; Vitacura</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCart}
          className="relative shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-neutral-900 hover:bg-neutral-800 text-white transition-colors"
          title="Ver carrito"
        >
          <ShoppingCart className="w-4 h-4" />
          <CartBadge
            count={cartCount}
            className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-brand-blue text-white rounded-full text-[10px] flex items-center justify-center font-bold border-2 border-white"
          />
        </button>
      </div>
    </header>
  );
}

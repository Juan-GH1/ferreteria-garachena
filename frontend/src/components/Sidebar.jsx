import { SlidersHorizontal, X } from 'lucide-react';
import { formatPrice } from '../utils/format';
import { EMPTY_FILTERS, hasActiveFilters } from '../utils/filters';

const AVAILABILITY_OPTIONS = [
  { value: 'all', label: 'Todos los productos' },
  { value: 'in_stock', label: 'Solo con stock' },
  { value: 'providencia', label: 'Con stock en Providencia' },
  { value: 'vitacura', label: 'Con stock en Vitacura' },
];

function toggleInList(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/**
 * Panel de filtros dinámico: las opciones y sus conteos se derivan del
 * catálogo cargado (prop `facets`), no de listas hardcodeadas.
 */
export default function Sidebar({ facets, filters, onFiltersChange }) {
  const active = hasActiveFilters(filters);

  return (
    <aside className="lg:col-span-3 space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-brand-dark flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-brand-blue" /> Filtros
          </h3>
          {active && (
            <button
              type="button"
              onClick={() => onFiltersChange(EMPTY_FILTERS)}
              className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Limpiar
            </button>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Categorías</h4>
          <div className="space-y-1.5">
            {facets.categories.map(({ name, count }) => (
              <label key={name} className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-600 cursor-pointer hover:text-brand-blue">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(name)}
                    onChange={() => onFiltersChange({ ...filters, categories: toggleInList(filters.categories, name) })}
                    className="rounded text-brand-blue focus:ring-brand-blue"
                  />
                  {name}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs ${filters.categories.includes(name) ? 'bg-blue-50 text-brand-blue' : 'bg-slate-50 text-slate-500'}`}>
                  {count}
                </span>
              </label>
            ))}
          </div>
        </div>

        <hr className="border-slate-100" />

        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Marcas</h4>
          <div className="space-y-1.5">
            {facets.brands.map(({ name, count }) => (
              <label key={name} className="flex items-center justify-between gap-2 text-sm font-medium text-slate-600 cursor-pointer hover:text-brand-blue">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.brands.includes(name)}
                    onChange={() => onFiltersChange({ ...filters, brands: toggleInList(filters.brands, name) })}
                    className="rounded text-brand-blue focus:ring-brand-blue"
                  />
                  {name}
                </span>
                <span className="text-xs text-slate-400">{count}</span>
              </label>
            ))}
          </div>
        </div>

        <hr className="border-slate-100" />

        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Precio</h4>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="Mín"
              value={filters.minPrice}
              onChange={(e) => onFiltersChange({ ...filters, minPrice: e.target.value })}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
            />
            <span className="text-slate-400 text-sm">—</span>
            <input
              type="number"
              min="0"
              placeholder="Máx"
              value={filters.maxPrice}
              onChange={(e) => onFiltersChange({ ...filters, maxPrice: e.target.value })}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
            />
          </div>
          {facets.priceRange && (
            <p className="text-[11px] text-slate-400 font-semibold">
              Catálogo: {formatPrice(facets.priceRange.min)} – {formatPrice(facets.priceRange.max)}
            </p>
          )}
        </div>

        <hr className="border-slate-100" />

        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Disponibilidad</h4>
          <div className="space-y-1.5">
            {AVAILABILITY_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer hover:text-brand-blue">
                <input
                  type="radio"
                  name="availability"
                  checked={filters.availability === option.value}
                  onChange={() => onFiltersChange({ ...filters, availability: option.value })}
                  className="text-brand-blue focus:ring-brand-blue"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

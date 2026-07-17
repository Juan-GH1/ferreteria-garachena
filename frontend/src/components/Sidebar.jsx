import { SlidersHorizontal } from 'lucide-react';

const CATEGORIES = [
  { name: 'Pinturas & Tintometría', count: 12, active: true },
  { name: 'Herramientas Manuales', count: 45, active: false },
  { name: 'Jardín y Paisajismo', count: 18, active: false },
  { name: 'Aseo y Químicos', count: 24, active: false },
];

const BRANDS = [
  { name: 'J. Garachena S.A.', checked: true },
  { name: 'Sipa Chile', checked: false },
  { name: 'Soudal Profesional', checked: false },
];

export default function Sidebar() {
  return (
    <aside className="lg:col-span-3 space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-lg font-extrabold text-brand-dark flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-brand-blue" /> Filtros de Búsqueda
        </h3>

        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Categorías</h4>
          <ul className="space-y-1 text-sm font-semibold text-slate-600">
            {CATEGORIES.map((category) => (
              <li key={category.name}>
                <a
                  href="#"
                  className={`flex items-center justify-between ${category.active ? 'text-brand-blue' : 'hover:text-brand-blue'}`}
                >
                  {category.name}
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      category.active ? 'bg-blue-50 text-brand-blue' : 'bg-slate-50 text-slate-500'
                    }`}
                  >
                    {category.count}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <hr className="border-slate-100" />

        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Marcas de Calidad</h4>
          <div className="space-y-2">
            {BRANDS.map((brand) => (
              <label key={brand.name} className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <input type="checkbox" defaultChecked={brand.checked} className="rounded text-brand-blue focus:ring-brand-blue" />
                {brand.name}
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

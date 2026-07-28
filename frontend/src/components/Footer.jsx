import { Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white py-12 border-t-4 border-brand-blue mt-auto">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <span className="text-xl font-black text-white">
            GARA<span className="text-brand-blue">CHENA</span>
          </span>
          <p className="text-xs text-slate-400">
            Tu ferretería familiar y experta en el corazón de Providencia y Vitacura. Especialistas en preparación de
            pinturas y colorimetría digital en el día.
          </p>
        </div>
        <div>
          <h4 className="font-bold text-sm uppercase tracking-wider mb-4 text-brand-blue">Enlaces Rápidos</h4>
          <ul className="text-xs space-y-2.5 text-slate-300">
            <li>• Catálogo de Pinturas &amp; Herramientas</li>
            <li>• Sucursales y Horarios de Atención</li>
            <li>• Políticas de Despacho Express en Santiago</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-sm uppercase tracking-wider mb-4 text-brand-blue">Atención Telefónica</h4>
          <p className="text-xs text-slate-400 mb-2">Lunes a Viernes de 08:30 a 19:00 hrs.</p>
          <span className="text-lg font-bold text-white flex items-center gap-2">
            <Phone className="w-5 h-5 text-brand-blue" /> +56 2 2222 3344
          </span>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 mt-8 pt-6 border-t border-slate-800">
        © 2026 J. Garachena S.A. Todos los derechos reservados.
      </div>
    </footer>
  );
}

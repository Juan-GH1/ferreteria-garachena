import { motion } from 'framer-motion';
import { ArrowRight, Calculator, FileText, MapPin, Truck } from 'lucide-react';

function ToolCard({ icon: Icon, tint, iconTint, title, description, action, index }) {
  const Tag = action ? motion.button : motion.div;

  return (
    <Tag
      type={action ? 'button' : undefined}
      onClick={action}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      whileHover={action ? { y: -4 } : undefined}
      whileTap={action ? { scale: 0.98 } : undefined}
      className={`text-left bg-white rounded-2xl shadow-soft ring-1 ring-slate-900/5 p-6 flex flex-col gap-4 h-full ${
        action ? 'hover:shadow-lift transition-shadow duration-300' : ''
      }`}
    >
      <span className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tint} ${iconTint} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5" />
      </span>
      <div className="flex-1">
        <h3 className="text-[15px] font-black tracking-tight text-navy-900">{title}</h3>
        <p className="text-[13px] text-slate-500 font-medium mt-1 leading-relaxed">{description}</p>
      </div>
      {action && (
        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-brand-blue">
          Abrir <ArrowRight className="w-3.5 h-3.5" />
        </span>
      )}
    </Tag>
  );
}

/**
 * Hub de herramientas destacadas: 3 tarjetas bento justo debajo del Hero.
 * Las dos primeras abren modales que ya existen en toda la app (Calculadora
 * de Pintura sin producto vinculado, Cotizador B2B con el carrito actual); la
 * tercera es puramente informativa (cobertura de despacho), sin acción.
 */
export default function QuickToolsHub({ onOpenCalculator, onOpenQuote }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <ToolCard
        index={0}
        icon={Calculator}
        tint="from-sky-50 to-blue-50"
        iconTint="text-brand-blue"
        title="Calculadora de Pintura por m²"
        description="Ingresa el ancho y alto de tu muro y te decimos cuántos galones comprar."
        action={onOpenCalculator}
      />
      <ToolCard
        index={1}
        icon={FileText}
        tint="from-violet-50 to-indigo-50"
        iconTint="text-indigo-600"
        title="Cotizador B2B Express"
        description="Genera una cotización formal en PDF con los productos de tu carrito."
        action={onOpenQuote}
      />
      <div className="bg-white rounded-2xl shadow-soft ring-1 ring-slate-900/5 p-6 flex flex-col gap-4 h-full">
        <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 flex items-center justify-center shrink-0">
          <Truck className="w-5 h-5" />
        </span>
        <div className="flex-1">
          <h3 className="text-[15px] font-black tracking-tight text-navy-900">Despacho Express</h3>
          <p className="text-[13px] text-slate-500 font-medium mt-1 leading-relaxed">Cobertura hoy mismo en Providencia y Vitacura.</p>
        </div>
        <div className="space-y-1.5">
          <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Providencia · retiro y despacho
          </span>
          <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Vitacura · retiro y despacho
          </span>
        </div>
      </div>
    </div>
  );
}

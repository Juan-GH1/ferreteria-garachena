import { motion } from 'framer-motion';
import { Headset, Receipt, Truck, Warehouse } from 'lucide-react';

const BADGES = [
  { icon: Receipt, label: 'Factura Automática (RUT)' },
  { icon: Warehouse, label: 'Stock Real en Sucursales' },
  { icon: Truck, label: 'Despacho 24h en Sector Oriente' },
  { icon: Headset, label: 'Soporte Técnico Directo' },
];

/** Barra de confianza y garantía ferretera: 4 badges limpios con ícono + etiqueta. */
export default function TrustBadges() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {BADGES.map((badge, index) => (
        <motion.div
          key={badge.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          className="flex items-center gap-3 bg-white rounded-2xl border border-neutral-100 px-4 py-3.5"
        >
          <span className="w-9 h-9 rounded-full bg-brand-blueLight text-brand-blue flex items-center justify-center shrink-0">
            <badge.icon className="w-4.5 h-4.5" />
          </span>
          <span className="text-[12px] font-semibold tracking-tight text-neutral-900 leading-tight">{badge.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

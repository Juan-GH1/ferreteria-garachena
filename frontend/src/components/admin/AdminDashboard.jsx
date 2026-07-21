import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, ClipboardList, PackageSearch, Wallet } from 'lucide-react';
import { fetchAdminSummary } from '../../api';
import { formatPrice } from '../../utils/format';
import { statusLabel, statusStyle } from '../../utils/orderStatus';

function formatDateTime(value) {
  return new Date(`${value.replace(' ', 'T')}Z`).toLocaleString('es-CL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function KpiCard({ icon: Icon, tone, label, value, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-soft ring-1 ring-slate-900/5 p-6"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="mt-4 text-[13px] font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-tight text-navy-900 tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400 font-medium">{sub}</p>}
    </motion.div>
  );
}

function PanelCard({ title, action, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className="bg-white rounded-2xl shadow-soft ring-1 ring-slate-900/5 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black tracking-tight text-navy-900">{title}</h3>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminSummary()
      .then(setSummary)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-navy-900">Resumen de Hoy</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Estado general de pedidos, ventas e inventario.</p>
      </div>

      {loading && <p className="text-sm text-slate-400 font-semibold py-8 text-center">Cargando resumen...</p>}

      {!loading && error && (
        <div className="bg-white rounded-2xl shadow-soft ring-1 ring-slate-900/5 p-6 flex items-start gap-3 text-rose-600">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {!loading && !error && summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <KpiCard
              icon={ClipboardList}
              tone="bg-amber-50 text-amber-600"
              label="Pedidos Pendientes"
              value={summary.pending_orders}
              sub="Esperando despacho"
            />
            <KpiCard
              icon={Wallet}
              tone="bg-emerald-50 text-emerald-600"
              label="Ventas del Día"
              value={formatPrice(summary.today_sales.total)}
              sub={`${summary.today_sales.count} pedido${summary.today_sales.count === 1 ? '' : 's'} hoy`}
            />
            <KpiCard
              icon={AlertTriangle}
              tone="bg-rose-50 text-rose-600"
              label="Stock Bajo"
              value={summary.low_stock.count}
              sub={`${summary.low_stock.count === 1 ? 'Producto' : 'Productos'} con ≤ ${summary.low_stock.threshold} unid.`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2">
              <PanelCard title="Alerta de Stock Bajo">
                {summary.low_stock.items.length === 0 ? (
                  <p className="text-sm text-slate-400 font-medium py-4 text-center">Todo el catálogo tiene stock saludable.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {summary.low_stock.items.map((item) => (
                      <li key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                        <span className="text-[13px] font-semibold text-slate-700 truncate">{item.name}</span>
                        <span className="text-xs font-bold text-rose-600 shrink-0 tabular-nums">{item.total_stock} un.</span>
                      </li>
                    ))}
                  </ul>
                )}
              </PanelCard>
            </div>

            <div className="lg:col-span-3">
              <PanelCard
                title="Últimos Pedidos"
                action={
                  <Link to="/admin/pedidos" className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1">
                    Ver todos <ArrowRight className="w-3 h-3" />
                  </Link>
                }
              >
                {summary.recent_orders.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">
                    <PackageSearch className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">Aún no hay pedidos.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {summary.recent_orders.map((order) => (
                      <li key={order.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-slate-700 truncate">
                            #{order.id} · {order.customer_name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium">{formatDateTime(order.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[13px] font-bold text-slate-700 tabular-nums">{formatPrice(order.total_amount)}</span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${statusStyle(order.status)}`}>
                            {statusLabel(order.status)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </PanelCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

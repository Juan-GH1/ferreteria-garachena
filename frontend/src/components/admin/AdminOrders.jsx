import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, PackageSearch } from 'lucide-react';
import { fetchOrders, updateOrderStatus } from '../../api';
import { formatPrice } from '../../utils/format';
import { useToast } from '../../hooks/useToast';
import { ORDER_STATUSES, statusLabel, statusStyle } from '../../utils/orderStatus';

function formatDateTime(value) {
  return new Date(`${value.replace(' ', 'T')}Z`).toLocaleString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DocumentBadge({ order }) {
  const isFactura = order.document_type === 'factura';
  const rut = isFactura ? order.billing_rut : order.rut;
  return (
    <div>
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-2xs font-bold ring-1 ring-inset ${
          isFactura ? 'bg-indigo-50 text-indigo-700 ring-indigo-100' : 'bg-slate-100 text-slate-600 ring-slate-200'
        }`}
      >
        {isFactura ? 'Factura' : 'Boleta'}
      </span>
      <p className="text-2xs text-slate-400 font-medium mt-1 tabular-nums">{rut}</p>
    </div>
  );
}

function StatusSelect({ order, onChange }) {
  return (
    <select
      value={order.status}
      onChange={(e) => onChange(order.id, e.target.value)}
      className={`text-2xs font-bold rounded-full pl-2.5 pr-6 py-1 ring-1 ring-inset border-0 focus:outline-none focus:ring-2 focus:ring-brand-blue cursor-pointer appearance-none bg-no-repeat bg-[right_6px_center] ${statusStyle(
        order.status
      )}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")",
        backgroundSize: '14px',
      }}
    >
      {ORDER_STATUSES.map((status) => (
        <option key={status} value={status}>
          {statusLabel(status)}
        </option>
      ))}
    </select>
  );
}

export default function AdminOrders() {
  const showToast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleStatusChange(id, status) {
    const previous = orders;
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)));

    const result = await updateOrderStatus(id, status);
    if (!result.ok) {
      setOrders(previous);
      showToast(`Error: ${result.error}`);
      return;
    }
    showToast(`Pedido #${id} actualizado a "${statusLabel(status)}".`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-navy-900">Pedidos</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          {loading ? 'Cargando...' : `${orders.length} pedido${orders.length === 1 ? '' : 's'} en total`}
        </p>
      </div>

      {loading && <p className="text-sm text-slate-400 font-semibold py-12 text-center">Cargando pedidos...</p>}

      {!loading && error && (
        <div className="bg-white rounded-2xl shadow-soft ring-1 ring-slate-900/5 p-6 flex items-start gap-3 text-rose-600">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="bg-white rounded-2xl shadow-soft ring-1 ring-slate-900/5 p-12 text-center text-slate-400">
          <PackageSearch className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold">Todavía no han llegado pedidos.</p>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-soft ring-1 ring-slate-900/5 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-2xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Orden</th>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Documento</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-700 tabular-nums">#{order.id}</td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{formatDateTime(order.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-700">{order.customer_name}</p>
                      <p className="text-xs text-slate-400">{order.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <DocumentBadge order={order} />
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-800 tabular-nums whitespace-nowrap">{formatPrice(order.total_amount)}</td>
                    <td className="px-5 py-3.5">
                      <StatusSelect order={order} onChange={handleStatusChange} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

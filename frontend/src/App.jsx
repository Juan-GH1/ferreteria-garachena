import { Route, Routes } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import Catalog from './components/Catalog';
import ProductDetail from './components/ProductDetail';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminOrders from './components/admin/AdminOrders';
import AdminCatalog from './components/admin/AdminCatalog';
import AdminImport from './components/admin/AdminImport';

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/producto/:id" element={<ProductDetail />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="pedidos" element={<AdminOrders />} />
          <Route path="catalogo" element={<AdminCatalog />} />
          <Route path="importar" element={<AdminImport />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}

export default App;

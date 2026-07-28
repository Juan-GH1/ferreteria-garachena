import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import AdminLogin from './AdminLogin';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout() {
  const { isAuthenticated, login, logout } = useAdminAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <AdminLogin onLogin={login} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar onLogout={logout} />
      <main className="flex-1 min-w-0 p-6 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

import { Route, Routes } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import Catalog from './components/Catalog';
import AdminPanel from './components/AdminPanel';

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </ToastProvider>
  );
}

export default App;

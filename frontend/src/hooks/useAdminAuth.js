import { useCallback, useState } from 'react';

// Autenticación simulada: solo controla si se muestra la UI del panel admin
// en este navegador. No reemplaza la protección real del backend (la clave
// ADMIN_API_KEY / X-Admin-Key opcional que exigen los endpoints de escritura).
const SESSION_KEY = 'garachena_admin_session';
const ADMIN_PASSWORD = 'garachena2026';

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem(SESSION_KEY) === 'true');

  const login = useCallback((password) => {
    if (password !== ADMIN_PASSWORD) return false;
    localStorage.setItem(SESSION_KEY, 'true');
    setIsAuthenticated(true);
    return true;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, login, logout };
}

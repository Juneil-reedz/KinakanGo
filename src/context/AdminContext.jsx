import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, storage } from '../services/api';

const AdminContext = createContext();

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}

export function AdminProvider({ children }) {
  const [admin, setAdmin]     = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('kkg_admin');
    if (saved && storage.getAccess()) {
      setAdmin(JSON.parse(saved));
    }
    setIsLoading(false);
  }, []);

  const persist = (a) => {
    setAdmin(a);
    if (a) localStorage.setItem('kkg_admin', JSON.stringify(a));
    else   localStorage.removeItem('kkg_admin');
  };

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    if (res.user.role !== 'admin') {
      throw new Error('Not an admin account');
    }
    storage.setTokens(res.accessToken, res.refreshToken);
    persist(res.user);
    return { success: true, admin: res.user };
  };

  const logout = useCallback(async () => {
    try { await authApi.logout(storage.getRefresh()); } catch { /* ignore */ }
    storage.clearTokens();
    persist(null);
  }, []);

  return (
    <AdminContext.Provider value={{ admin, isLoading, login, logout, isAuthenticated: !!admin }}>
      {children}
    </AdminContext.Provider>
  );
}

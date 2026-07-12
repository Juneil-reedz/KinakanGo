import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, storage } from '../services/api';

const RiderContext = createContext();

export function useRider() {
  const ctx = useContext(RiderContext);
  if (!ctx) throw new Error('useRider must be used within RiderProvider');
  return ctx;
}

export function RiderProvider({ children }) {
  const [rider, setRider]     = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('kkg_rider');
    if (saved && storage.getAccess()) {
      setRider(JSON.parse(saved));
    }
    setIsLoading(false);
  }, []);

  const persist = (r) => {
    setRider(r);
    if (r) localStorage.setItem('kkg_rider', JSON.stringify(r));
    else   localStorage.removeItem('kkg_rider');
  };

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    // Riders are stored with 'customer' role + has_rider_profile flag in the DB
    if (res.user.role !== 'rider' && !res.user.has_rider_profile) {
      throw new Error('Not a rider account');
    }
    storage.setTokens(res.accessToken, res.refreshToken);
    persist(res.user);
    return { success: true, rider: res.user };
  };

  const logout = useCallback(async () => {
    try { await authApi.logout(storage.getRefresh()); } catch { /* ignore */ }
    storage.clearTokens();
    persist(null);
  }, []);

  const updateRider = (updates) => {
    const updated = { ...rider, ...updates };
    persist(updated);
  };

  return (
    <RiderContext.Provider value={{ rider, isLoading, login, logout, updateRider, isAuthenticated: !!rider }}>
      {children}
    </RiderContext.Provider>
  );
}

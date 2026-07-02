import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, storage } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('kkg_user');
    if (saved && storage.getAccess()) {
      setUser(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const persist = (u) => {
    setUser(u);
    if (u) localStorage.setItem('kkg_user', JSON.stringify(u));
    else   localStorage.removeItem('kkg_user');
  };

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    if (res.user.role !== 'customer') {
      throw new Error('This account is not a customer account');
    }
    storage.setTokens(res.accessToken, res.refreshToken);
    persist(res.user);
    return res.user;
  };

  const register = async (userData) => {
    const res = await authApi.register({ ...userData, role: 'customer' });
    storage.setTokens(res.accessToken, res.refreshToken);
    persist(res.user);
    return res.user;
  };

  const logout = useCallback(async () => {
    try { await authApi.logout(storage.getRefresh()); } catch { /* ignore */ }
    storage.clearTokens();
    persist(null);
  }, []);

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    persist(updated);
  };

  // Address helpers (local-only until address API is wired)
  const addAddress = (address) => {
    const list = user.addresses || [];
    const newAddr = { id: Date.now(), ...address, isDefault: list.length === 0 || address.isDefault };
    const updated = list.map(a => ({ ...a, isDefault: newAddr.isDefault ? false : a.isDefault }));
    updateUser({ addresses: [...updated, newAddr] });
    return newAddr;
  };

  const updateAddress = (id, updates) => {
    const updated = (user.addresses || []).map(a =>
      a.id === id ? { ...a, ...updates } : updates.isDefault ? { ...a, isDefault: false } : a
    );
    updateUser({ addresses: updated });
  };

  const deleteAddress = (id) => {
    const filtered = (user.addresses || []).filter(a => a.id !== id);
    if (filtered.length && (user.addresses || []).find(a => a.id === id)?.isDefault) {
      filtered[0].isDefault = true;
    }
    updateUser({ addresses: filtered });
  };

  // Payment helpers (local-only)
  const addPaymentMethod = (payment) => {
    const list = user.paymentMethods || [];
    const newPm = { id: Date.now(), ...payment, isDefault: list.length === 0 || payment.isDefault };
    const updated = list.map(p => ({ ...p, isDefault: newPm.isDefault ? false : p.isDefault }));
    updateUser({ paymentMethods: [...updated, newPm] });
    return newPm;
  };

  const updatePaymentMethod = (id, updates) => {
    const updated = (user.paymentMethods || []).map(p =>
      p.id === id ? { ...p, ...updates } : updates.isDefault ? { ...p, isDefault: false } : p
    );
    updateUser({ paymentMethods: updated });
  };

  const deletePaymentMethod = (id) => {
    const filtered = (user.paymentMethods || []).filter(p => p.id !== id);
    if (filtered.length && (user.paymentMethods || []).find(p => p.id === id)?.isDefault) {
      filtered[0].isDefault = true;
    }
    updateUser({ paymentMethods: filtered });
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      loading,
      login,
      register,
      logout,
      updateUser,
      addAddress,
      updateAddress,
      deleteAddress,
      addPaymentMethod,
      updatePaymentMethod,
      deletePaymentMethod,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

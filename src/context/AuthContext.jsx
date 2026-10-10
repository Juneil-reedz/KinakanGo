import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, safeLocalSet, storage, usersApi, addressesApi, SESSION_EXPIRED_EVENT } from '../services/api';

const AuthContext = createContext();

const normalizeUser = (u) => {
  if (!u) return null;
  const isData = (v) => typeof v === 'string' && v.startsWith('data:');
  const avatar = [u.avatar, u.avatarUrl, u.avatar_url].find(v => v && !isData(v)) || null;
  // Raw image data is too large for browser storage; the API returns photos as links
  return { ...u, avatar, avatarUrl: avatar, avatar_url: avatar };
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Put the server's address list on the user (state + saved copy)
  const applyAddresses = (list) => {
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, addresses: list };
      safeLocalSet('kkg_user', JSON.stringify(next));
      return next;
    });
  };

  // Load saved addresses from the account. Addresses that were only kept in this
  // browser (before they were stored on the server) are uploaded once.
  const syncAddresses = async (localList = []) => {
    try {
      let { data } = await addressesApi.list();
      if (!data.length && localList.length) {
        for (const a of localList) {
          ({ data } = await addressesApi.create({
            label: a.label, address: a.address, city: a.city, province: a.province,
            zip: a.zip, notes: a.notes, isDefault: !!a.isDefault,
          }));
        }
      }
      applyAddresses(data);
    } catch { /* keep whatever we have; the next load retries */ }
  };

  // Hydrate from localStorage, then refresh capabilities from server
  useEffect(() => {
    const saved = localStorage.getItem('kkg_user');
    if (saved && storage.getAccess()) {
      const cached = normalizeUser(JSON.parse(saved));
      setUser(cached);
      syncAddresses(cached.addresses || []);
      // Refresh has_restaurant / has_rider_profile in background
      authApi.me()
        .then(fresh => {
          // Merge into the current user so addresses loaded meanwhile are kept
          if (fresh) setUser(prev => {
            const next = normalizeUser({ ...(prev || cached), ...fresh });
            safeLocalSet('kkg_user', JSON.stringify(next));
            return next;
          });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // The API layer fires this when the server rejects the refresh token
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      localStorage.removeItem('kkg_user');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const persist = (u) => {
    const normalized = normalizeUser(u);
    setUser(normalized);
    if (normalized) safeLocalSet('kkg_user', JSON.stringify(normalized));
    else   localStorage.removeItem('kkg_user');
  };

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    if (res.user.role === 'admin') {
      throw new Error('Use the admin panel to log in as admin');
    }
    storage.setTokens(res.accessToken, res.refreshToken);
    persist(res.user);
    syncAddresses();
    return normalizeUser(res.user);
  };

  const register = async (userData) => {
    const res = await authApi.register({ ...userData, role: 'customer' });
    storage.setTokens(res.accessToken, res.refreshToken);
    persist(res.user);
    return normalizeUser(res.user);
  };

  const logout = useCallback(async () => {
    try { await authApi.logout(storage.getRefresh()); } catch { /* ignore */ }
    storage.clearTokens();
    persist(null);
  }, []);

  const updateUser = async (updates) => {
    let next = { ...user, ...updates };
    const shouldPersistProfile = ['name', 'phone', 'avatar', 'avatarUrl'].some(key => Object.prototype.hasOwnProperty.call(updates, key));
    if (user?.id && shouldPersistProfile) {
      const res = await usersApi.update(user.id, {
        name: updates.name,
        phone: updates.phone,
        avatarUrl: updates.avatar || updates.avatarUrl,
      });
      // An uploaded photo is sent as image data; show it via the short link the
      // server returns (raw image data is too big to keep in browser storage)
      if (res?.avatarUrl) next = { ...next, avatar: res.avatarUrl, avatarUrl: res.avatarUrl, avatar_url: res.avatarUrl };
    }
    const updated = normalizeUser(next);
    persist(updated);
    return updated;
  };

  // Saved addresses live on the account (server); each call returns the full list
  const addAddress = async (address) => {
    const { data } = await addressesApi.create(address);
    applyAddresses(data);
    return data;
  };

  const updateAddress = async (id, updates) => {
    const { data } = await addressesApi.update(id, updates);
    applyAddresses(data);
    return data;
  };

  const deleteAddress = async (id) => {
    const { data } = await addressesApi.remove(id);
    applyAddresses(data);
    return data;
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

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, request } from '../services/api';

const AdminContext = createContext();

// Separate token keys so admin and customer sessions don't overwrite each other
const ADMIN_ACCESS_KEY  = 'kkg_admin_access';
const ADMIN_REFRESH_KEY = 'kkg_admin_refresh';

const adminStorage = {
  getAccess:   () => localStorage.getItem(ADMIN_ACCESS_KEY),
  getRefresh:  () => localStorage.getItem(ADMIN_REFRESH_KEY),
  setTokens:   (a, r) => {
    localStorage.setItem(ADMIN_ACCESS_KEY, a);
    if (r) localStorage.setItem(ADMIN_REFRESH_KEY, r);
  },
  clearTokens: () => {
    localStorage.removeItem(ADMIN_ACCESS_KEY);
    localStorage.removeItem(ADMIN_REFRESH_KEY);
  },
};

// Dedicated fetch wrapper that always uses admin tokens
async function adminRequest(path, options = {}, retry = true) {
  const BASE  = import.meta.env.VITE_API_URL || '/api';
  const token = adminStorage.getAccess();
  const res   = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && retry) {
    const refreshToken = adminStorage.getRefresh();
    if (refreshToken) {
      try {
        const rr = await fetch(`${BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (rr.ok) {
          const { accessToken } = await rr.json();
          adminStorage.setTokens(accessToken, null);
          return adminRequest(path, options, false);
        }
      } catch {}
    }
    adminStorage.clearTokens();
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: res.status, data });
  return data;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}

export function AdminProvider({ children }) {
  const [admin, setAdmin]         = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('kkg_admin');
    if (saved && adminStorage.getAccess()) {
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
    adminStorage.setTokens(res.accessToken, res.refreshToken);
    persist(res.user);
    return { success: true, admin: res.user };
  };

  const logout = useCallback(async () => {
    try {
      const refreshToken = adminStorage.getRefresh();
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {}
    adminStorage.clearTokens();
    persist(null);
  }, []);

  return (
    <AdminContext.Provider value={{ admin, isLoading, login, logout, isAuthenticated: !!admin, adminRequest }}>
      {children}
    </AdminContext.Provider>
  );
}

export { adminRequest };

// Admin-scoped api helpers — always use admin token
export const adminApi = {
  users: {
    list:   (p = {}) => adminRequest(`/users?${new URLSearchParams(p)}`),
    getOne: (id)     => adminRequest(`/users/${id}`),
    update: (id, d)  => adminRequest(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
    ban:    (id, r)  => adminRequest(`/users/${id}/ban`,   { method: 'POST', body: JSON.stringify({ reason: r }) }),
    unban:  (id)     => adminRequest(`/users/${id}/unban`, { method: 'POST' }),
  },
  restaurants: {
    list:    (p = {}) => adminRequest(`/restaurants?${new URLSearchParams(p)}`),
    approve: (id)     => adminRequest(`/restaurants/${id}/approve`, { method: 'POST' }),
    remove:  (id)     => adminRequest(`/restaurants/${id}`, { method: 'DELETE' }),
  },
  orders: {
    list: (p = {}) => adminRequest(`/orders?${new URLSearchParams(p)}`),
  },
  issues: {
    list:    (p = {})      => adminRequest(`/issues?${new URLSearchParams(p)}`),
    resolve: (id, d)       => adminRequest(`/issues/${id}/resolve`, { method: 'POST', body: JSON.stringify(d) }),
    deny:    (id, notes)   => adminRequest(`/issues/${id}/deny`, { method: 'POST', body: JSON.stringify({ notes }) }),
  },
  promos: {
    list:   (p = {})  => adminRequest(`/promos?${new URLSearchParams(p)}`),
    create: (d)       => adminRequest(`/promos`, { method: 'POST', body: JSON.stringify(d) }),
    update: (id, d)   => adminRequest(`/promos/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
    remove: (id)      => adminRequest(`/promos/${id}`, { method: 'DELETE' }),
  },
};

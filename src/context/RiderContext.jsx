import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const BASE = import.meta.env.VITE_API_URL || '/api';

// Rider-specific token keys — separate from the shared customer kkg_access keys
const RIDER_ACCESS_KEY  = 'kkg_rider_access';
const RIDER_REFRESH_KEY = 'kkg_rider_refresh';

const riderStorage = {
  getAccess:   ()      => localStorage.getItem(RIDER_ACCESS_KEY),
  getRefresh:  ()      => localStorage.getItem(RIDER_REFRESH_KEY),
  setTokens:   (a, r)  => {
    localStorage.setItem(RIDER_ACCESS_KEY, a);
    if (r) localStorage.setItem(RIDER_REFRESH_KEY, r);
  },
  clearTokens: ()      => {
    localStorage.removeItem(RIDER_ACCESS_KEY);
    localStorage.removeItem(RIDER_REFRESH_KEY);
  },
};

async function tryRiderRefresh() {
  const refreshToken = riderStorage.getRefresh();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const { accessToken } = await res.json();
    riderStorage.setTokens(accessToken, null);
    return true;
  } catch {
    return false;
  }
}

// All rider portal API calls go through this — uses rider-specific tokens
export async function riderRequest(path, options = {}, retry = true) {
  const token = riderStorage.getAccess();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && retry) {
    const refreshed = await tryRiderRefresh();
    if (refreshed) return riderRequest(path, options, false);
    riderStorage.clearTokens();
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: res.status, data });
  return data;
}

const RiderContext = createContext();

export function useRider() {
  const ctx = useContext(RiderContext);
  if (!ctx) throw new Error('useRider must be used within RiderProvider');
  return ctx;
}

export function RiderProvider({ children }) {
  const [rider,     setRider]     = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('kkg_rider_user');
    if (saved && riderStorage.getAccess()) {
      setRider(JSON.parse(saved));
    }
    setIsLoading(false);
  }, []);

  const persist = (r) => {
    setRider(r);
    if (r) localStorage.setItem('kkg_rider_user', JSON.stringify(r));
    else   localStorage.removeItem('kkg_rider_user');
  };

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    // Riders are stored with 'customer' role + has_rider_profile flag in the DB
    if (res.user.role !== 'rider' && !res.user.has_rider_profile) {
      throw new Error('Not a rider account');
    }
    // Store in rider-specific keys — never overwrites the customer kkg_access token
    riderStorage.setTokens(res.accessToken, res.refreshToken);
    persist(res.user);
    return { success: true, rider: res.user };
  };

  const logout = useCallback(async () => {
    try {
      await fetch(`${BASE}/auth/logout`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refreshToken: riderStorage.getRefresh() }),
      });
    } catch { /* ignore */ }
    riderStorage.clearTokens();
    persist(null);
  }, []);

  const updateRider = (updates) => persist({ ...rider, ...updates });

  return (
    <RiderContext.Provider value={{ rider, isLoading, login, logout, updateRider, isAuthenticated: !!rider }}>
      {children}
    </RiderContext.Provider>
  );
}

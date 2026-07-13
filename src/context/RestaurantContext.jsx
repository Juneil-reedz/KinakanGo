import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const BASE = import.meta.env.VITE_API_URL || '/api';
const RESTAURANT_ACCESS_KEY = 'kkg_restaurant_access';
const RESTAURANT_REFRESH_KEY = 'kkg_restaurant_refresh';

const restaurantStorage = {
  getAccess: () => localStorage.getItem(RESTAURANT_ACCESS_KEY),
  getRefresh: () => localStorage.getItem(RESTAURANT_REFRESH_KEY),
  setTokens: (access, refresh) => {
    localStorage.setItem(RESTAURANT_ACCESS_KEY, access);
    if (refresh) localStorage.setItem(RESTAURANT_REFRESH_KEY, refresh);
  },
  clearTokens: () => {
    localStorage.removeItem(RESTAURANT_ACCESS_KEY);
    localStorage.removeItem(RESTAURANT_REFRESH_KEY);
  },
};

async function tryRestaurantRefresh() {
  const refreshToken = restaurantStorage.getRefresh();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const { accessToken } = await res.json();
    restaurantStorage.setTokens(accessToken, null);
    return true;
  } catch {
    return false;
  }
}

export async function restaurantRequest(path, options = {}, retry = true) {
  const token = restaurantStorage.getAccess();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && retry) {
    const refreshed = await tryRestaurantRefresh();
    if (refreshed) return restaurantRequest(path, options, false);
    restaurantStorage.clearTokens();
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: res.status, data });
  return data;
}

const RestaurantContext = createContext();

export function useRestaurant() {
  const ctx = useContext(RestaurantContext);
  if (!ctx) throw new Error('useRestaurant must be used within RestaurantProvider');
  return ctx;
}

export function RestaurantProvider({ children }) {
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading]   = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('kkg_restaurant');
    if (saved && restaurantStorage.getAccess()) {
      setRestaurant(JSON.parse(saved));
      // Refresh restaurant data from API in background
      restaurantRequest('/restaurants/owner/me')
        .then(data => persist(data))
        .catch(() => { /* keep cached data if offline */ });
    }
    setIsLoading(false);
  }, []);

  const persist = (r) => {
    setRestaurant(r);
    if (r) localStorage.setItem('kkg_restaurant', JSON.stringify(r));
    else   localStorage.removeItem('kkg_restaurant');
  };

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    if (res.user.role === 'admin') throw new Error('Use the admin panel to log in as admin');
    restaurantStorage.setTokens(res.accessToken, res.refreshToken);
    const restaurantData = await restaurantRequest('/restaurants/owner/me');
    if (!restaurantData) throw new Error('No restaurant found for this account');
    persist(restaurantData);
    return { success: true, restaurant: restaurantData };
  };

  const logout = useCallback(async () => {
    try { await authApi.logout(restaurantStorage.getRefresh()); } catch { /* ignore */ }
    restaurantStorage.clearTokens();
    persist(null);
  }, []);

  const updateRestaurant = async (updates) => {
    if (!restaurant?.id) return;
    const result = await restaurantRequest(`/restaurants/${restaurant.id}`, { method: 'PATCH', body: JSON.stringify(updates) });
    // Backend returns full updated row; fall back to merging if it only returns a message
    const fresh = result?.id ? result : { ...restaurant, ...updates };
    persist(fresh);
  };

  return (
    <RestaurantContext.Provider value={{ restaurant, isLoading, login, logout, updateRestaurant, isAuthenticated: !!restaurant }}>
      {children}
    </RestaurantContext.Provider>
  );
}

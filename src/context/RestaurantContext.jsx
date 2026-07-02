import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, restaurantsApi, storage } from '../services/api';

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
    if (saved && storage.getAccess()) {
      setRestaurant(JSON.parse(saved));
      // Refresh restaurant data from API in background
      restaurantsApi.myRestaurant()
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
    if (res.user.role !== 'restaurant_owner') {
      throw new Error('Not a restaurant owner account');
    }
    storage.setTokens(res.accessToken, res.refreshToken);
    // Fetch the restaurant profile after login
    const restaurantData = await restaurantsApi.myRestaurant();
    persist(restaurantData);
    return { success: true, restaurant: restaurantData };
  };

  const logout = useCallback(async () => {
    try { await authApi.logout(storage.getRefresh()); } catch { /* ignore */ }
    storage.clearTokens();
    persist(null);
  }, []);

  const updateRestaurant = async (updates) => {
    if (restaurant?.id) {
      await restaurantsApi.update(restaurant.id, updates);
    }
    const updated = { ...restaurant, ...updates };
    persist(updated);
  };

  return (
    <RestaurantContext.Provider value={{ restaurant, isLoading, login, logout, updateRestaurant, isAuthenticated: !!restaurant }}>
      {children}
    </RestaurantContext.Provider>
  );
}

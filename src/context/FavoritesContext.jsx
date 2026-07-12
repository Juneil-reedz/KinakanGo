import { createContext, useContext, useEffect, useState } from 'react';
import { favoritesApi, storage } from '../services/api';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'kkg_favorites';
const FavoritesContext = createContext(null);

const normalizeFavorite = (item, restaurant = {}) => ({
  id: item.id,
  name: item.name,
  price: Number(item.price || 0),
  image: item.image_url || item.image || '',
  rating: Number(item.rating || restaurant.rating || 4.8),
  restaurantId: item.restaurant_id || restaurant.id || item.restaurant?.id || null,
  restaurant: item.restaurant_name || restaurant.name || item.restaurant?.name || item.restaurant || 'Restaurant',
  category: item.category_name || item.category || 'Food',
  description: item.description || '',
});

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const localFavorites = (() => {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
      catch { return []; }
    })();

    if (!user || !storage.getAccess()) {
      setFavorites(localFavorites);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await Promise.allSettled(localFavorites.map(item => favoritesApi.add(item.id)));
        const res = await favoritesApi.list();
        if (!cancelled) setFavorites((res.data || []).map(item => normalizeFavorite(item)));
      } catch {
        if (!cancelled) setFavorites(localFavorites);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const isFavorite = (id) => favorites.some(item => String(item.id) === String(id));

  const addFavorite = (item, restaurant) => {
    const favorite = normalizeFavorite(item, restaurant);
    setFavorites(prev => prev.some(i => String(i.id) === String(favorite.id)) ? prev : [favorite, ...prev]);
    if (storage.getAccess()) favoritesApi.add(favorite.id).catch(() => {});
  };

  const removeFavorite = (id) => {
    setFavorites(prev => prev.filter(item => String(item.id) !== String(id)));
    if (storage.getAccess()) favoritesApi.remove(id).catch(() => {});
  };

  const toggleFavorite = (item, restaurant) => {
    if (isFavorite(item.id)) {
      removeFavorite(item.id);
      return false;
    }
    addFavorite(item, restaurant);
    return true;
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, addFavorite, removeFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider');
  return context;
}

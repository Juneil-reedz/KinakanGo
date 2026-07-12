import { createContext, useContext, useEffect, useState } from 'react';

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
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    try {
      setFavorites(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
    } catch {
      setFavorites([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const isFavorite = (id) => favorites.some(item => String(item.id) === String(id));

  const addFavorite = (item, restaurant) => {
    const favorite = normalizeFavorite(item, restaurant);
    setFavorites(prev => prev.some(i => String(i.id) === String(favorite.id)) ? prev : [favorite, ...prev]);
  };

  const removeFavorite = (id) => setFavorites(prev => prev.filter(item => String(item.id) !== String(id)));

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

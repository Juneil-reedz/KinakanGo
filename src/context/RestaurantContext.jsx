import { createContext, useContext, useState, useEffect } from 'react';

const RestaurantContext = createContext();

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within RestaurantProvider');
  }
  return context;
}

export function RestaurantProvider({ children }) {
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock restaurant data
  const mockRestaurant = {
    id: 1,
    name: 'Pizza Palace',
    email: 'owner@pizzapalace.com',
    phone: '+63 917 987 6543',
    address: 'Purok 3, Barangay Laminusa, Bongao, Tawi-Tawi',
    logo: null,
    status: 'open',
    rating: 4.5,
    totalOrders: 1247,
    categories: ['Italian', 'Pizza', 'Pasta'],
  };

  useEffect(() => {
    // Check if restaurant is logged in (from localStorage)
    const savedRestaurant = localStorage.getItem('restaurant');
    if (savedRestaurant) {
      setRestaurant(JSON.parse(savedRestaurant));
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    // Mock login - in production, this would call an API
    if (email && password) {
      const restaurantData = { ...mockRestaurant, email };
      setRestaurant(restaurantData);
      localStorage.setItem('restaurant', JSON.stringify(restaurantData));
      return { success: true, restaurant: restaurantData };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    setRestaurant(null);
    localStorage.removeItem('restaurant');
  };

  const updateRestaurant = (updates) => {
    const updated = { ...restaurant, ...updates };
    setRestaurant(updated);
    localStorage.setItem('restaurant', JSON.stringify(updated));
  };

  const value = {
    restaurant,
    isLoading,
    login,
    logout,
    updateRestaurant,
    isAuthenticated: !!restaurant,
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
}

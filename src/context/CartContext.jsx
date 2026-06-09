import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedRestaurantId = localStorage.getItem('cartRestaurantId');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    if (savedRestaurantId) {
      setRestaurantId(JSON.parse(savedRestaurantId));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
    if (restaurantId) {
      localStorage.setItem('cartRestaurantId', JSON.stringify(restaurantId));
    }
  }, [cartItems, restaurantId]);

  const addToCart = (item, restaurant) => {
    // If cart has items from a different restaurant, ask user to clear cart
    if (restaurantId && restaurantId !== restaurant.id) {
      const shouldClear = window.confirm(
        `Your cart contains items from ${cartItems[0]?.restaurant}. Would you like to clear your cart and add items from ${restaurant.name}?`
      );
      if (!shouldClear) {
        return false;
      }
      clearCart();
    }

    setRestaurantId(restaurant.id);

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);
      if (existingItem) {
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prevItems, { ...item, restaurant: restaurant.name, restaurantId: restaurant.id }];
    });

    return true;
  };

  const removeFromCart = (itemId) => {
    setCartItems((prevItems) => {
      const newItems = prevItems.filter((i) => i.id !== itemId);
      if (newItems.length === 0) {
        setRestaurantId(null);
        localStorage.removeItem('cartRestaurantId');
      }
      return newItems;
    });
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setRestaurantId(null);
    localStorage.removeItem('cart');
    localStorage.removeItem('cartRestaurantId');
  };

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const value = {
    cartItems,
    restaurantId,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

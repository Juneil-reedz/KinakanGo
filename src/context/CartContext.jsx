import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { safeLocalSet } from '../services/api';
import { useDialog } from './DialogContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const ask = useDialog();
  const [cartItems, setCartItems] = useState([]);
  const [restaurantId, setRestaurantIdState] = useState(null);
  // Kept in a ref too, so clearCart() followed by addToCart() in the same tap
  // (reorder) sees the cleared cart instead of asking to start a new one
  const restaurantRef = useRef(null);
  const setRestaurantId = (v) => { restaurantRef.current = v; setRestaurantIdState(v); };
  // Promo code the customer entered in the cart; checked again at checkout
  const [promoCode, setPromoCodeState] = useState(() => {
    try { return localStorage.getItem('cartPromo') || ''; } catch { return ''; }
  });
  const setPromoCode = (code) => {
    const c = (code || '').trim().toUpperCase();
    setPromoCodeState(c);
    try { c ? safeLocalSet('cartPromo', c) : localStorage.removeItem('cartPromo'); } catch { /* storage unavailable */ }
  };

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
    safeLocalSet('cart', JSON.stringify(cartItems));
    if (restaurantId) {
      safeLocalSet('cartRestaurantId', JSON.stringify(restaurantId));
    }
  }, [cartItems, restaurantId]);

  const addToCart = (item, restaurant) => {
    // If cart has items from a different restaurant, ask user to clear cart
    // Cart holds one restaurant at a time: ask (in-app) before starting over.
    // Returns false now; the item is added once the customer agrees.
    if (restaurantRef.current && restaurantRef.current !== restaurant.id) {
      ask({
        title: 'Start a new cart?',
        message: `Your cart has food from ${cartItems[0]?.restaurant}. Clear it and add this from ${restaurant.name}?`,
        confirmLabel: 'Clear and add',
      }).then(ok => {
        if (!ok) return;
        clearCart();
        setRestaurantId(restaurant.id);
        setCartItems([{ ...item, restaurant: restaurant.name, restaurantId: restaurant.id }]);
      });
      return false;
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
        setPromoCode('');
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
    setPromoCode('');
    setRestaurantId(null);
    localStorage.removeItem('cart');
    localStorage.removeItem('cartRestaurantId');
  };

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  // Bring the cart in line with the restaurant's current menu: new prices, and
  // foods that were removed or marked sold out. Returns what changed, for a message.
  const syncWithMenu = (menuRows) => {
    const byId = new Map(menuRows.map(m => [String(m.id), m]));
    const changes = [];
    const next = [];
    for (const item of cartItems) {
      const m = byId.get(String(item.id));
      if (!m || m.is_available === false) { changes.push(`${item.name} is no longer available and was removed`); continue; }
      const price = Number(m.price);
      if (Number.isFinite(price) && Math.abs(price - Number(item.price)) > 0.005) {
        changes.push(`${item.name} is now ₱${price.toFixed(2)}`);
        next.push({ ...item, price });
      } else {
        next.push(item);
      }
    }
    if (changes.length) {
      setCartItems(next);
      if (!next.length) { setRestaurantId(null); setPromoCode(''); localStorage.removeItem('cartRestaurantId'); }
    }
    return changes;
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
    syncWithMenu,
    promoCode,
    setPromoCode,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

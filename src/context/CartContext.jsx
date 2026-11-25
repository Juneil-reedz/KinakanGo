import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { safeLocalSet } from '../services/api';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// The cart can hold food from several restaurants at once. Each restaurant is
// checked out as its own order, so one of them is "active": cartItems, the
// totals and checkout all work on that restaurant's food. allItems is everything.
const sameRest = (a, b) => String(a) === String(b);

// Read the saved cart once, before the first render, so the first save can never
// write an empty cart over it. Older carts had no restaurantId on each item.
function loadSaved() {
  let items = [];
  let rid = null;
  try { items = JSON.parse(localStorage.getItem('cart') || '[]'); } catch { items = []; }
  try { rid = JSON.parse(localStorage.getItem('cartRestaurantId') || 'null'); } catch { rid = null; }
  if (!Array.isArray(items)) items = [];
  items = items.map(i => (i.restaurantId == null && rid != null ? { ...i, restaurantId: rid } : i));
  if (!items.some(i => sameRest(i.restaurantId, rid))) rid = items.length ? items[0].restaurantId ?? null : null;
  return { items, rid };
}

export const CartProvider = ({ children }) => {
  const [saved] = useState(loadSaved);
  const [allItems, setAllItems] = useState(saved.items);
  const [restaurantId, setRestaurantIdState] = useState(saved.rid);
  // Kept in a ref too, so a reorder (clear, then add) in one tap sees the cleared state
  const restaurantRef = useRef(saved.rid);
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

  useEffect(() => {
    safeLocalSet('cart', JSON.stringify(allItems));
    if (restaurantId != null) safeLocalSet('cartRestaurantId', JSON.stringify(restaurantId));
    else { try { localStorage.removeItem('cartRestaurantId'); } catch { /* storage unavailable */ } }
  }, [allItems, restaurantId]);

  // After items leave the cart, keep the active restaurant valid
  const settle = (next) => {
    if (!next.some(i => sameRest(i.restaurantId, restaurantRef.current))) {
      if (restaurantRef.current != null) setPromoCode('');
      setRestaurantId(next.length ? next[0].restaurantId : null);
    }
    return next;
  };

  const cartItems = restaurantId == null ? [] : allItems.filter(i => sameRest(i.restaurantId, restaurantId));

  // Pick which restaurant's food the totals and checkout use
  const selectRestaurant = (id) => {
    if (sameRest(id, restaurantRef.current)) return;
    setPromoCode('');
    setRestaurantId(id);
  };

  const addToCart = (item, restaurant) => {
    if (!sameRest(restaurant.id, restaurantRef.current)) setPromoCode('');
    setRestaurantId(restaurant.id);
    setAllItems((prev) => {
      const existing = prev.find((i) => i.id === item.id && sameRest(i.restaurantId, restaurant.id));
      if (existing) {
        return prev.map((i) => (i === existing ? { ...i, quantity: i.quantity + item.quantity } : i));
      }
      return [...prev, { ...item, restaurant: restaurant.name, restaurantId: restaurant.id }];
    });
    return true;
  };

  const removeFromCart = (itemId) => {
    setAllItems((prev) => settle(prev.filter((i) => i.id !== itemId)));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }
    setAllItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)));
  };

  // Clears one restaurant's food (the active one by default), e.g. after its order is placed
  const clearCart = (id = restaurantRef.current) => {
    setPromoCode('');
    const next = id == null ? [] : allItems.filter(i => !sameRest(i.restaurantId, id));
    setRestaurantId(next.length ? next[0].restaurantId : null);
    setAllItems(prev => (id == null ? [] : prev.filter(i => !sameRest(i.restaurantId, id))));
  };

  const getCartTotal = () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Bring the active restaurant's food in line with its current menu: new prices,
  // and foods that were removed or marked sold out. Returns what changed, for a message.
  const syncWithMenu = (menuRows) => {
    const byId = new Map(menuRows.map(m => [String(m.id), m]));
    const changes = [];
    const fixed = new Map();
    for (const item of cartItems) {
      const m = byId.get(String(item.id));
      if (!m || m.is_available === false) { changes.push(`${item.name} is no longer available and was removed`); fixed.set(item, null); continue; }
      const price = Number(m.price);
      if (Number.isFinite(price) && Math.abs(price - Number(item.price)) > 0.005) {
        changes.push(`${item.name} is now ₱${price.toFixed(2)}`);
        fixed.set(item, { ...item, price });
      }
    }
    if (changes.length) {
      setAllItems(prev => settle(prev.flatMap(i => (fixed.has(i) ? (fixed.get(i) ? [fixed.get(i)] : []) : [i]))));
    }
    return changes;
  };

  const getCartCount = () => allItems.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    cartItems,
    allItems,
    restaurantId,
    selectRestaurant,
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

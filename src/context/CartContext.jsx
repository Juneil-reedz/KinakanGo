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

// The cart can hold food from several restaurants at once. The customer marks
// (long-presses) the foods to order; marked foods are always from one restaurant,
// the "active" one, since each restaurant is its own order. cartItems is the
// marked food, which the totals and checkout use. allItems is everything.
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

  // Marked food ids, kept across reloads so checkout still knows what to order
  const [picked, setPickedState] = useState(() => {
    try { const v = JSON.parse(localStorage.getItem('cartPicked') || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
  });
  const setPicked = (v) => {
    setPickedState(prev => {
      const next = typeof v === 'function' ? v(prev) : v;
      try { next.length ? safeLocalSet('cartPicked', JSON.stringify(next)) : localStorage.removeItem('cartPicked'); } catch { /* storage unavailable */ }
      return next;
    });
  };
  const isPicked = (id) => picked.some(p => String(p) === String(id));

  const restItems = restaurantId == null ? [] : allItems.filter(i => sameRest(i.restaurantId, restaurantId));
  const cartItems = restItems.filter(i => isPicked(i.id));

  // Mark or unmark one food. Marking food from another restaurant starts a new
  // selection there, because one order can only come from one restaurant.
  const togglePick = (item) => {
    if (!sameRest(item.restaurantId, restaurantRef.current)) {
      setPromoCode('');
      setRestaurantId(item.restaurantId);
      setPicked([item.id]);
      return;
    }
    setPicked(prev => (prev.some(p => String(p) === String(item.id)) ? prev.filter(p => String(p) !== String(item.id)) : [...prev, item.id]));
  };
  // Mark every food from one restaurant, or clear the marks
  const pickAll = (rid) => {
    if (!sameRest(rid, restaurantRef.current)) { setPromoCode(''); setRestaurantId(rid); }
    setPicked(allItems.filter(i => sameRest(i.restaurantId, rid)).map(i => i.id));
  };
  const clearPicks = () => setPicked([]);

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
    setPicked(prev => prev.filter(p => String(p) !== String(itemId)));
    setAllItems((prev) => settle(prev.filter((i) => i.id !== itemId)));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }
    setAllItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)));
  };

  // clearCart() removes the marked food once its order is placed.
  // clearCart(restaurantId) removes all of one restaurant's food (used by reorder).
  const clearCart = (id) => {
    setPromoCode('');
    const gone = id === undefined
      ? (i) => sameRest(i.restaurantId, restaurantRef.current) && isPicked(i.id)
      : (i) => sameRest(i.restaurantId, id);
    const next = allItems.filter(i => !gone(i));
    setPicked([]);
    if (!next.some(i => sameRest(i.restaurantId, restaurantRef.current))) setRestaurantId(next.length ? next[0].restaurantId : null);
    setAllItems(prev => prev.filter(i => !gone(i)));
  };

  const getCartTotal = () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Bring the active restaurant's food in line with its current menu: new prices,
  // and foods that were removed or marked sold out. Returns what changed, for a message.
  const syncWithMenu = (menuRows) => {
    const byId = new Map(menuRows.map(m => [String(m.id), m]));
    const changes = [];
    const fixed = new Map();
    for (const item of restItems) {
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
    togglePick,
    pickAll,
    clearPicks,
    isPicked,
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

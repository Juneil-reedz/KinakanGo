import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { ArrowLeft, Heart, Star, Clock, Store, UtensilsCrossed, Plus, Minus, ShoppingCart } from 'lucide-react';
import { menuApi } from '../services/api';
import useGoBack from '../hooks/useGoBack';

export default function FoodDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const goBack     = useGoBack();
  const location   = useLocation();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [quantity, setQuantity]         = useState(1);

  // Normally passed from the list we came from; when opened directly (refresh,
  // shared link) load it from the API instead of showing placeholder data.
  const stateItem = location.state?.foodItem;
  const [fetched, setFetched] = useState(null);
  const [status, setStatus]   = useState(stateItem ? 'ready' : 'loading');

  useEffect(() => {
    // A list item passed in state may not carry the food's own rating, so
    // still load it quietly in the background to show the latest stars.
    if (!stateItem) setStatus('loading');
    menuApi.getItem(id)
      .then(item => { setFetched(item); setStatus('ready'); })
      .catch(() => { if (!stateItem) setStatus('missing'); });
  }, [id, stateItem]);

  if (status !== 'ready') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        {status === 'loading'
          ? <div className="w-10 h-10 rounded-full border-2 border-forest-300/30 border-t-forest-300 animate-spin" />
          : <div className="glass rounded-3xl p-10 max-w-sm w-full text-center">
              <p className="text-white font-bold text-lg mb-2">Item not found</p>
              <p className="text-forest-200/60 text-sm mb-6">This item may no longer be available.</p>
              <button onClick={() => navigate('/restaurants', { replace: true })}
                className="btn-glow-orange text-white text-sm font-bold px-6 py-2.5 rounded-xl">Browse Food</button>
            </div>}
      </div>
    );
  }

  const raw = stateItem ? { ...stateItem, ...(fetched && { avg_rating: fetched.avg_rating, rating_count: fetched.rating_count }) } : fetched;
  // API prices arrive as strings ("150.00"); keep the maths numeric
  const foodItem = { ...raw, price: Number(raw.price) || 0 };

  const total = foodItem.price * quantity;

  const handleAdd = () => {
    const restaurantInfo = typeof foodItem.restaurant === 'string'
      ? { id: foodItem.restaurant_id || foodItem.restaurant, name: foodItem.restaurant }
      : {
          id: foodItem.restaurant?.id || foodItem.restaurant_id || 0,
          name: foodItem.restaurant?.name || foodItem.restaurant_name || 'Restaurant',
        };
    const added = addToCart({ id:foodItem.id, name:foodItem.name, price:foodItem.price, quantity, image:foodItem.image || foodItem.image_url }, restaurantInfo);
    if (added) navigate('/cart');
  };

  const restaurantName = typeof foodItem.restaurant === 'string'
    ? foodItem.restaurant
    : (foodItem.restaurant?.name || foodItem.restaurant_name);

  // The plate turns a little each time the quantity changes
  const spin = (quantity - 1) * 40;

  const facts = [
    { label: 'Rating', value: Number(foodItem.rating_count) > 0 ? `${Number(foodItem.avg_rating).toFixed(1)} (${foodItem.rating_count})` : 'New', Icon: Star, tint: 'fact-amber' },
    { label: 'Type', value: foodItem.category || foodItem.category_name || 'Food', Icon: UtensilsCrossed, tint: 'fact-rose' },
    { label: 'From', value: restaurantName || 'Restaurant', Icon: Store, tint: 'fact-violet' },
    { label: 'Ready', value: '~30 min', Icon: Clock, tint: 'fact-teal' },
  ];

  return (
    <div className="food-detail min-h-screen relative overflow-hidden flex flex-col">
      {/* Header */}
      <header className="relative z-20 flex items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2 max-w-5xl w-full mx-auto">
        <button onClick={() => goBack('/restaurants')} aria-label="Back"
          className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center text-white font-heading font-bold text-lg truncate fd-fade" style={{ animationDelay: '120ms' }}>{foodItem.name}</h1>
        <button onClick={() => toggleFavorite(foodItem)} aria-label="Favorite"
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
          <Heart className={`w-5 h-5 ${isFavorite(foodItem.id) ? 'fill-ember-400 text-ember-400' : 'text-white/70'}`} />
        </button>
      </header>

      <div className="relative flex-1 w-full max-w-5xl mx-auto">
        {/* Big round photo, half off the right edge, turning as it lands */}
        <div className="fd-plate-wrap" aria-hidden="true">
          <div className={`fd-plate ${location.state?.morph ? 'fd-plate-morph' : ''}`} style={{ viewTransitionName: `food-${foodItem.id}` }}>
            <img src={foodItem.image || foodItem.image_url} alt="" style={{ transform: `rotate(${spin}deg)` }} />
          </div>
        </div>

        {/* Facts down the left, sliding in one by one */}
        <div className="relative z-10 px-5 pt-10 sm:pt-16 flex flex-col gap-3.5 w-[58%] sm:w-[46%]">
          {facts.map(({ label, value, Icon, tint }, i) => (
            <div key={label} className="fd-fact fd-slide" style={{ animationDelay: `${200 + i * 90}ms` }}>
              <div className="min-w-0">
                <p className="text-forest-200/55 text-[11px] font-semibold uppercase tracking-wide">{label}</p>
                <p className={`text-white text-sm font-semibold truncate ${label === 'Type' ? 'capitalize' : ''}`}>{value}</p>
              </div>
              <span className={`fd-fact-badge ${tint}`}><Icon className="w-4 h-4" /></span>
            </div>
          ))}

          {/* Quantity */}
          <div className="fd-qty fd-slide mt-3" style={{ animationDelay: '580ms' }}>
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} aria-label="Decrease quantity"
              className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10">
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-white font-bold text-base w-7 text-center tabular-nums">{String(quantity).padStart(2, '0')}</span>
            <button onClick={() => setQuantity(q => q + 1)} aria-label="Increase quantity"
              className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {foodItem.description && (
          <p className="relative z-10 px-5 mt-8 max-w-md text-forest-200/65 text-sm leading-relaxed fd-slide" style={{ animationDelay: '660ms' }}>
            {foodItem.description}
          </p>
        )}
      </div>

      {/* Bottom bar: Add to Cart and the total */}
      <div className="relative z-20 w-full max-w-5xl mx-auto flex items-center justify-between gap-4 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] fd-rise" style={{ animationDelay: '450ms' }}>
        <button onClick={handleAdd}
          className="btn-glow-orange text-white font-heading font-bold rounded-full px-7 py-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" /> Add to Cart
        </button>
        <p className="text-white font-heading font-extrabold text-2xl"><span className="text-ember-500 text-base mr-0.5">₱</span>{total.toFixed(2)}</p>
      </div>
    </div>
  );
}

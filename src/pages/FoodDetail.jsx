import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { ArrowLeft, Heart, Star, Clock, Store, UtensilsCrossed, Plus, Minus, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { menuApi, getAllMenuItems } from '../services/api';
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

  // Other foods of the same kind to spin through (passed from the list, or loaded)
  const [pool, setPool] = useState(location.state?.options || null);
  useEffect(() => {
    if (pool) return;
    getAllMenuItems({ limit: 100 })
      .then(r => setPool(Array.isArray(r) ? r : r?.data || []))
      .catch(() => setPool([]));
  }, [pool]);
  const [current, setCurrent] = useState(null); // the option the user spun to
  const [turn, setTurn]       = useState(0);    // degrees from swipes
  const [drag, setDrag]       = useState(0);    // live degrees while dragging
  const [swapping, setSwapping] = useState(false);
  const dragStart = useRef(null);

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
  const baseItem = { ...raw, price: Number(raw.price) || 0 };
  const foodItem = current ? { ...current, price: Number(current.price) || 0 } : baseItem;

  // Same type first (all the burgers), else the same restaurant, else just this one
  const kind = (i) => String(i?.category_name || i?.category || '').toLowerCase();
  const list = pool || [];
  let options = list.filter(i => kind(i) && kind(i) === kind(baseItem));
  if (options.length < 2) options = list.filter(i => i.restaurant_id && i.restaurant_id === baseItem.restaurant_id);
  if (!options.some(i => i.id === baseItem.id)) options = [baseItem, ...options];
  const index = Math.max(0, options.findIndex(i => i.id === foodItem.id));
  const many = options.length > 1;
  const prevItem = many ? options[(index - 1 + options.length) % options.length] : null;
  const nextItem = many ? options[(index + 1) % options.length] : null;

  // Spin the plate to the next or previous option
  const spinTo = (dir) => {
    if (!many || swapping) return;
    const target = dir > 0 ? nextItem : prevItem;
    setSwapping(true);
    setTurn(t => t + (dir > 0 ? -360 : 360));
    setTimeout(() => { setCurrent(target); setQuantity(1); }, 300);
    setTimeout(() => setSwapping(false), 720);
  };

  const onPointerDown = (e) => { dragStart.current = e.clientX; e.currentTarget.setPointerCapture?.(e.pointerId); };
  const onPointerMove = (e) => { if (dragStart.current != null) setDrag((e.clientX - dragStart.current) * 0.6); };
  const onPointerUp = (e) => {
    if (dragStart.current == null) return;
    const dx = e.clientX - dragStart.current;
    dragStart.current = null;
    setDrag(0);
    if (Math.abs(dx) > 45) spinTo(dx < 0 ? 1 : -1);
  };

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
        {/* The plate: drag or swipe it to spin to the next option */}
        <div className="fd-stage" onPointerDown={onPointerDown} onPointerMove={onPointerMove}
          onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
          {prevItem && (
            <button type="button" className="fd-peek fd-peek-left" onClick={() => spinTo(-1)} aria-label={`Previous: ${prevItem.name}`}>
              <img src={prevItem.image_url || prevItem.image} alt="" draggable="false" />
            </button>
          )}
          <div className={`fd-plate ${location.state?.morph ? 'fd-plate-morph' : ''} ${swapping ? 'is-swapping' : ''} ${drag ? 'is-dragging' : ''}`}
            style={{ viewTransitionName: `food-${baseItem.id}` }}>
            <img src={foodItem.image || foodItem.image_url} alt={foodItem.name} draggable="false"
              style={{ transform: `rotate(${turn + drag + spin}deg)` }} />
          </div>
          {nextItem && (
            <button type="button" className="fd-peek fd-peek-right" onClick={() => spinTo(1)} aria-label={`Next: ${nextItem.name}`}>
              <img src={nextItem.image_url || nextItem.image} alt="" draggable="false" />
            </button>
          )}
        </div>

        {many && (
          <div className="flex items-center justify-center gap-3 mt-3 fd-fade" style={{ animationDelay: '500ms' }}>
            <button onClick={() => spinTo(-1)} aria-label="Previous option" className="w-8 h-8 rounded-full flex items-center justify-center text-forest-200/70 hover:text-white hover:bg-white/10"><ChevronLeft className="w-5 h-5" /></button>
            <div className="flex items-center gap-1.5">
              {options.slice(0, 8).map((o, i) => (
                <span key={o.id} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-ember-500' : 'w-1.5 bg-white/25'}`} />
              ))}
            </div>
            <button onClick={() => spinTo(1)} aria-label="Next option" className="w-8 h-8 rounded-full flex items-center justify-center text-forest-200/70 hover:text-white hover:bg-white/10"><ChevronRight className="w-5 h-5" /></button>
          </div>
        )}

        {/* Facts, sliding in one by one (again after each spin) */}
        <div key={foodItem.id} className="relative z-10 px-5 mt-5 grid grid-cols-2 gap-3">
          {facts.map(({ label, value, Icon, tint }, i) => (
            <div key={label} className="fd-fact fd-slide" style={{ animationDelay: `${(current ? 0 : 200) + i * 70}ms` }}>
              <div className="min-w-0">
                <p className="text-forest-200/55 text-[11px] font-semibold uppercase tracking-wide">{label}</p>
                <p className={`text-white text-sm font-semibold truncate ${label === 'Type' ? 'capitalize' : ''}`}>{value}</p>
              </div>
              <span className={`fd-fact-badge ${tint}`}><Icon className="w-4 h-4" /></span>
            </div>
          ))}
        </div>

        {/* Quantity */}
        <div className="relative z-10 px-5 mt-4 flex items-center justify-between fd-slide" style={{ animationDelay: '560ms' }}>
          <p className="text-white font-semibold text-sm">Quantity</p>
          <div className="fd-qty">
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
          <p key={`d-${foodItem.id}`} className="relative z-10 px-5 mt-5 max-w-xl text-forest-200/65 text-sm leading-relaxed fd-slide" style={{ animationDelay: '660ms' }}>
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

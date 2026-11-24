import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { ArrowLeft, Heart, Star, Clock, Store, UtensilsCrossed, Plus, Minus, ShoppingCart } from 'lucide-react';
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

  // Other foods of the same kind to swipe through (passed from the list, or loaded)
  const [pool, setPool] = useState(location.state?.options || null);
  useEffect(() => {
    if (pool) return;
    getAllMenuItems({ limit: 100 })
      .then(r => setPool(Array.isArray(r) ? r : r?.data || []))
      .catch(() => setPool([]));
  }, [pool]);
  const [current, setCurrent] = useState(null); // the option the user swiped to
  const [dragX, setDragX]     = useState(0);    // live finger offset in px
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const stageRef  = useRef(null);
  const moved     = useRef(false);
  const lastMove  = useRef({ x: 0, t: 0, v: 0 });
  const frame     = useRef(0);

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

  // Carousel: the foods sit side by side; drag to slide, let go to snap
  const goTo = (i) => {
    if (!many) return;
    const n = Math.min(options.length - 1, Math.max(0, i));
    if (n === index) return;
    setCurrent(options[n]);
    setQuantity(1);
  };
  const slotWidth = () => (stageRef.current?.offsetWidth || 360) * 0.62;

  // The row moves slower than the finger (a heavy, smooth drag) and eases into place
  const DRAG = 0.6;
  const onPointerDown = (e) => {
    if (!many) return;
    dragStart.current = e.clientX;
    lastMove.current = { x: e.clientX, t: performance.now(), v: 0 };
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (dragStart.current == null) return;
    const now = performance.now();
    const last = lastMove.current;
    const dt = Math.max(1, now - last.t);
    lastMove.current = { x: e.clientX, t: now, v: (e.clientX - last.x) / dt };
    let dx = (e.clientX - dragStart.current) * DRAG;
    // Resist past the first and last food
    if ((index === 0 && dx > 0) || (index === options.length - 1 && dx < 0)) dx *= 0.35;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setDragX(dx));
  };
  const onPointerUp = (e) => {
    if (dragStart.current == null) return;
    cancelAnimationFrame(frame.current);
    const dx = (e.clientX - dragStart.current) * DRAG;
    const v = performance.now() - lastMove.current.t < 120 ? lastMove.current.v : 0;
    dragStart.current = null;
    moved.current = Math.abs(dx) > 4;
    setDragging(false);
    setDragX(0);
    const slot = slotWidth();
    let steps = Math.round(-dx / slot);
    if (!steps && Math.abs(dx) > slot * 0.22) steps = dx < 0 ? 1 : -1;   // a short drag still moves one
    if (!steps && Math.abs(v) > 0.45) steps = v < 0 ? 1 : -1;            // a quick flick moves one
    if (steps) goTo(index + steps);
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
        {/* The foods side by side: swipe to slide the next one into the middle */}
        <div ref={stageRef} className={`fd-stage ${dragging ? 'is-dragging' : ''}`}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove}
          onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
          {options.map((o, i) => {
            const rel = i - index;
            if (Math.abs(rel) > 2) return null;
            const slot = slotWidth();
            const offset = rel * slot + dragX;
            const t = Math.min(1, Math.abs(offset) / slot);
            const scale = 1 - t * 0.48;
            return (
              <button key={o.id} type="button" tabIndex={rel === 0 ? -1 : 0}
                onClick={() => { if (rel !== 0 && !moved.current) goTo(i); moved.current = false; }}
                aria-label={rel === 0 ? o.name : `Show ${o.name}`}
                className={`fd-plate ${rel === 0 && location.state?.morph && !current ? 'fd-plate-morph' : ''} ${rel === 0 ? 'is-center' : ''}`}
                style={{
                  transform: `translateX(calc(-50% + ${offset}px)) scale(${scale})`,
                  opacity: 1 - t * 0.45,
                  zIndex: 10 - Math.abs(rel),
                  viewTransitionName: o.id === baseItem.id ? `food-${o.id}` : undefined,
                }}>
                <img src={o.image_url || o.image} alt="" draggable="false" />
              </button>
            );
          })}
        </div>

        {many && (
          <div className="flex items-center justify-center gap-3 mt-4 fd-fade" style={{ animationDelay: '500ms' }}>
            <div className="flex items-center gap-1.5">
              {options.slice(0, 8).map((o, i) => (
                <span key={o.id} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-ember-500' : 'w-1.5 bg-white/25'}`} />
              ))}
            </div>
          </div>
        )}

        {/* Facts, sliding in one by one (again after each swipe) */}
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

      {/* Bottom bar: the total on the left, a round add-to-cart button on the right */}
      <div className="relative z-20 w-full max-w-5xl mx-auto flex items-center justify-between gap-4 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] fd-rise" style={{ animationDelay: '450ms' }}>
        <div>
          <p className="text-forest-200/55 text-xs font-semibold uppercase tracking-wide">Total</p>
          <p className="text-white font-heading font-extrabold text-3xl leading-tight"><span className="text-ember-500 text-lg mr-0.5">₱</span>{total.toFixed(2)}</p>
        </div>
        <button onClick={handleAdd} aria-label="Add to cart"
          className="relative w-16 h-16 btn-glow-orange text-white rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform">
          <ShoppingCart className="w-7 h-7" />
          <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-white text-ember-600 flex items-center justify-center shadow">
            <Plus className="w-3.5 h-3.5" strokeWidth={3} />
          </span>
        </button>
      </div>
    </div>
  );
}

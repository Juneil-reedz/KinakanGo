import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { ArrowLeft, Heart, Star, Clock, MapPin, Plus, Minus, ShoppingCart, Check } from 'lucide-react';
import { menuApi } from '../services/api';
import useGoBack from '../hooks/useGoBack';

const ADD_ONS = [
  { id:1, name:'Extra Cheese', price:50,  image:'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200&h=200&fit=crop' },
  { id:2, name:'Pickles',      price:30,  image:'https://images.unsplash.com/photo-1623218655048-d60d0a8ee280?w=200&h=200&fit=crop' },
  { id:3, name:'Extra Patty',  price:100, image:'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=200&h=200&fit=crop' },
];

export default function FoodDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const goBack     = useGoBack();
  const location   = useLocation();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [quantity, setQuantity]         = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState([]);

  // Normally passed from the list we came from; when opened directly (refresh,
  // shared link) load it from the API instead of showing placeholder data.
  const stateItem = location.state?.foodItem;
  const [fetched, setFetched] = useState(null);
  const [status, setStatus]   = useState(stateItem ? 'ready' : 'loading');

  useEffect(() => {
    if (stateItem) return;
    setStatus('loading');
    menuApi.getItem(id)
      .then(item => { setFetched(item); setStatus('ready'); })
      .catch(() => setStatus('missing'));
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

  const raw = stateItem || fetched;
  // API prices arrive as strings ("150.00"); keep the maths numeric
  const foodItem = { ...raw, price: Number(raw.price) || 0 };

  const toggleAddOn = (a) => setSelectedAddOns(p => p.find(i=>i.id===a.id) ? p.filter(i=>i.id!==a.id) : [...p,a]);
  const total = (foodItem.price + selectedAddOns.reduce((s,a)=>s+a.price,0)) * quantity;

  const handleAdd = () => {
    const restaurantInfo = typeof foodItem.restaurant === 'string'
      ? { id: foodItem.restaurant_id || foodItem.restaurant, name: foodItem.restaurant }
      : {
          id: foodItem.restaurant?.id || foodItem.restaurant_id || 0,
          name: foodItem.restaurant?.name || foodItem.restaurant_name || 'Restaurant',
        };
    const added = addToCart({ id:foodItem.id, name:foodItem.name, price:total/quantity, quantity, addOns:selectedAddOns, image:foodItem.image || foodItem.image_url }, restaurantInfo);
    if (added) navigate('/cart');
  };

  const restaurantName = typeof foodItem.restaurant === 'string'
    ? foodItem.restaurant
    : (foodItem.restaurant?.name || foodItem.restaurant_name);

  const addButton = (
    <button onClick={handleAdd}
      className="w-full py-4 btn-glow-orange text-white font-heading font-bold rounded-2xl flex items-center justify-center gap-2">
      <ShoppingCart className="w-5 h-5" />
      Add to Cart - ₱{total.toFixed(2)}
    </button>
  );

  return (
    <div className="min-h-screen relative pb-28 md:pb-10 animate-fade-up">
      <div className="orb w-72 h-72 bg-forest-600/15 top-0 right-0" />

      <div className="relative max-w-5xl mx-auto md:px-6 md:pt-6">
        {/* Desktop back link */}
        <div className="hidden md:flex items-center mb-4">
          <button onClick={() => goBack('/restaurants')}
            className="flex items-center gap-1.5 text-forest-200/60 hover:text-forest-100 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <div className="md:grid md:grid-cols-2 md:gap-8 md:items-start">
          {/* Photo: capped height on phones, a square card on desktop */}
          <div className="relative overflow-hidden h-64 xs:h-72 md:h-auto md:aspect-square md:rounded-3xl md:card-3d md:sticky md:top-6">
            <img src={foodItem.image || foodItem.image_url} alt={foodItem.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            <button onClick={() => goBack('/restaurants')} aria-label="Back"
              className="md:hidden absolute top-4 left-4 w-10 h-10 glass rounded-xl flex items-center justify-center text-white hover:glass-green transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button onClick={() => toggleFavorite(foodItem)} aria-label="Favorite"
              className="absolute top-4 right-4 w-10 h-10 glass rounded-xl flex items-center justify-center hover:glass-orange transition-all">
              <Heart className={`w-5 h-5 ${isFavorite(foodItem.id) ? 'fill-ember-400 text-ember-400' : 'text-white/70'}`} />
            </button>
          </div>

          {/* Details */}
          <div className="relative z-10 -mt-6 md:mt-0 glass rounded-t-3xl md:rounded-3xl p-5 sm:p-6 space-y-5">
            <div>
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl md:text-2xl font-heading font-bold text-white">{foodItem.name}</h1>
                <p className="text-ember-400 font-heading font-bold text-xl md:text-2xl flex-shrink-0">₱{Number(foodItem.price).toFixed(2)}</p>
              </div>
              <p className="text-forest-200/60 text-sm capitalize mt-0.5">{foodItem.category || foodItem.category_name || 'Food'}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 glass-green rounded-xl px-3 py-2 text-xs">
                <Star className="w-3.5 h-3.5 fill-ember-400 text-ember-400" />
                <span className="text-forest-100">{foodItem.rating || '4.5'}</span>
              </div>
              {restaurantName && (
                <div className="flex items-center gap-1.5 glass rounded-xl px-3 py-2 text-xs text-forest-200/70 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-ember-400 flex-shrink-0" />
                  <span className="truncate">{restaurantName}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 glass rounded-xl px-3 py-2 text-xs text-forest-200/70">
                <Clock className="w-3.5 h-3.5" />30 min
              </div>
            </div>

            {foodItem.description && (
              <div>
                <p className="text-white font-semibold text-sm mb-2">Description</p>
                <p className="text-forest-200/60 text-sm leading-relaxed">{foodItem.description}</p>
              </div>
            )}

            <div>
              <p className="text-white font-semibold text-sm mb-3">Add Ons</p>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {ADD_ONS.map(a => {
                  const selected = !!selectedAddOns.find(i=>i.id===a.id);
                  return (
                    <button key={a.id} onClick={() => toggleAddOn(a)}
                      className={`flex-shrink-0 relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all glass
                        ${selected ? 'border-ember-500 scale-95 shadow-[0_0_12px_rgba(230,126,34,.4)]' : 'border-transparent'}`}>
                      {/* A picture that fails to load is hidden rather than shown as a broken image */}
                      <img src={a.image} alt="" className="absolute inset-0 w-full h-full object-cover"
                        onError={e => { e.currentTarget.style.display = 'none'; }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      {selected && (
                        <div className="absolute top-1 right-1 w-5 h-5 btn-glow-orange rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className="absolute bottom-1 left-0 right-0 text-center">
                        <p className="text-white text-xs font-medium leading-tight">{a.name}</p>
                        <p className="text-ember-300 text-xs">+₱{a.price}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-white font-semibold text-sm">Quantity</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity(q=>Math.max(1,q-1))} aria-label="Decrease quantity"
                  className="w-9 h-9 glass rounded-xl flex items-center justify-center hover:glass-orange transition-all">
                  <Minus className="w-4 h-4 text-forest-200" />
                </button>
                <span className="text-white font-bold text-lg w-6 text-center">{quantity}</span>
                <button onClick={() => setQuantity(q=>q+1)} aria-label="Increase quantity"
                  className="w-9 h-9 glass rounded-xl flex items-center justify-center hover:glass-green transition-all">
                  <Plus className="w-4 h-4 text-forest-200" />
                </button>
              </div>
            </div>

            {/* Desktop: the button sits with the details */}
            <div className="hidden md:block pt-1">{addButton}</div>
          </div>
        </div>
      </div>

      {/* Phones: the button is pinned to the bottom of the screen */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 glass-dark p-4 z-20"
        style={{ borderTop:'1px solid rgba(var(--fg-rgb),.08)' }}>
        {addButton}
      </div>
    </div>
  );
}

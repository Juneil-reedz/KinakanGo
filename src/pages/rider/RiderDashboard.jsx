import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRider } from '../../context/RiderContext';
import { useNotification } from '../../context/NotificationContext';
import { useCart } from '../../context/CartContext';
import { ordersApi, riderApi, getRestaurants, getAllMenuItems } from '../../services/api';
import {
  Banknote, Package, Bike, Clock, MapPin, ChevronRight, Store,
  Check, X, TrendingUp, Wifi, WifiOff, Home, LayoutDashboard,
  Heart, Star, Plus, Minus, Search, SlidersHorizontal, Utensils
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────────

const FOOD_CATEGORIES = [
  { id:'all',      label:'All',      emoji:'🍽️' },
  { id:'pizza',    label:'Pizza',    emoji:'🍕' },
  { id:'burgers',  label:'Burgers',  emoji:'🍔' },
  { id:'sushi',    label:'Sushi',    emoji:'🍣' },
  { id:'pasta',    label:'Pasta',    emoji:'🍝' },
  { id:'salads',   label:'Salads',   emoji:'🥗' },
  { id:'desserts', label:'Desserts', emoji:'🍰' },
  { id:'drinks',   label:'Drinks',   emoji:'🥤' },
];

const STATS_DEF = [
  { label:"Today's Earnings", key:'todayEarnings',    icon:Banknote, fmt: v => `₱${Number(v).toFixed(2)}`, color:'btn-glow-green' },
  { label:'Deliveries Today', key:'todayDeliveries',  icon:Package,  fmt: v => v,                          color:'btn-glow-orange' },
  { label:'Active',           key:'activeDeliveries', icon:Bike,     fmt: v => v,                          color:'glass-green' },
  { label:'Pending Pickups',  key:'pendingOffers',    icon:Clock,    fmt: v => v,                          color:'glass-orange' },
];

const POLL_MS = 15000;

// ── Deliveries tab ─────────────────────────────────────────────────────────────

function DeliveriesTab({ rider }) {
  const { addNotification } = useNotification();
  const navigate             = useNavigate();

  const [pendingOrders, setPending] = useState([]);
  const [activeOrders,  setActive]  = useState([]);
  const [loading,  setLoading]      = useState(true);
  const [filter,   setFilter]       = useState('all');
  const [available, setAvail]       = useState(true);
  const [togglingAvail, setToggling] = useState(false);
  const pollRef = useRef(null);

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [pendingRes, activeRes] = await Promise.allSettled([
        ordersApi.list({ rider_orders: 'true', status: 'ready',     limit: 20 }),
        ordersApi.list({ rider_orders: 'true', status: 'picked_up', limit: 10 }),
      ]);
      if (pendingRes.status === 'fulfilled') {
        const orders = pendingRes.value.data || pendingRes.value || [];
        setPending(prev => {
          if (silent && orders.length > prev.length) addNotification('New delivery assignment!', 'success');
          return orders;
        });
      }
      if (activeRes.status === 'fulfilled') {
        setActive(activeRes.value.data || activeRes.value || []);
      }
    } catch {
      if (!silent) addNotification('Failed to load orders', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    if (available) pollRef.current = setInterval(() => fetchOrders(true), POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [available]);

  const toggleAvailability = async () => {
    if (togglingAvail) return;
    setToggling(true);
    const next = !available;
    try {
      await riderApi.setAvailability(next);
      setAvail(next);
      addNotification(next ? 'You are now available for deliveries' : 'You are now offline', 'success');
      if (!next) clearInterval(pollRef.current);
    } catch {
      addNotification('Failed to update availability', 'error');
    } finally {
      setToggling(false);
    }
  };

  const accept = async (id) => {
    try {
      await ordersApi.riderResponse(id, true);
      const order = pendingOrders.find(o => o.id === id);
      setPending(prev => prev.filter(o => o.id !== id));
      if (order) setActive(prev => [...prev, { ...order, status: 'picked_up' }]);
      addNotification('Order accepted! Head to the restaurant.', 'success');
      setTimeout(() => navigate(`/rider/delivery/${id}`), 800);
    } catch (err) {
      addNotification(err?.data?.error || 'Failed to accept order', 'error');
    }
  };

  const decline = async (id) => {
    try { await ordersApi.riderResponse(id, false); } catch {}
    setPending(prev => prev.filter(o => o.id !== id));
    addNotification('Order declined. Another rider will be assigned.', 'success');
  };

  const orders = [
    ...pendingOrders.map(o => ({ ...o, _view: 'assigned' })),
    ...activeOrders.map(o => ({ ...o,  _view: 'in_progress' })),
  ];
  const stats = {
    todayEarnings: 0, todayDeliveries: 0,
    activeDeliveries: activeOrders.length,
    pendingOffers:    pendingOrders.length,
  };
  const filtered = filter === 'all' ? orders : orders.filter(o => o._view === filter);
  const FILTERS = [
    { key:'all', label:'All' }, { key:'assigned', label:'New' }, { key:'in_progress', label:'Active' },
  ];

  return (
    <div className="space-y-5">
      {/* Greeting + availability */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-forest-200/50 text-sm">Welcome back</p>
          <h1 className="text-2xl font-heading font-bold text-white">{rider?.name || 'Rider'}</h1>
        </div>
        <button onClick={toggleAvailability} disabled={togglingAvail}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-60
            ${available ? 'btn-glow-green text-white' : 'glass text-forest-200/60'}`}>
          {available
            ? <><Wifi className="w-3.5 h-3.5" /><span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Online</>
            : <><WifiOff className="w-3.5 h-3.5" /> Offline</>}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS_DEF.map(({ label, key, icon:Icon, fmt, color }) => (
          <div key={key} className="glass card-3d rounded-2xl p-4">
            <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-white font-heading font-bold text-xl">{fmt(stats[key])}</p>
            <p className="text-forest-200/50 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <button onClick={() => navigate('/rider/earnings')}
          className="flex-1 glass hover:glass-green transition-all rounded-xl py-2.5 flex items-center justify-center gap-2 text-forest-100 text-sm font-medium">
          <TrendingUp className="w-4 h-4" /> Earnings
        </button>
        <button className="flex-1 glass hover:glass-orange transition-all rounded-xl py-2.5 flex items-center justify-center gap-2 text-forest-100 text-sm font-medium">
          <MapPin className="w-4 h-4" /> My Zone
        </button>
      </div>

      {/* Offline notice */}
      {!available && (
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-forest-300/50 flex-shrink-0" />
          <p className="text-forest-200/60 text-sm">You are offline. Go online to receive delivery assignments.</p>
        </div>
      )}

      {/* Orders */}
      <div className="glass rounded-3xl overflow-hidden">
        <div className="flex" style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex-1 py-3 text-sm font-semibold transition-all
                ${filter === f.key ? 'btn-glow-orange text-white' : 'text-forest-200/50 hover:text-forest-100'}`}>
              {f.label}
              {f.key !== 'all' && <span className="ml-1.5 text-xs opacity-70">({orders.filter(o => o._view === f.key).length})</span>}
            </button>
          ))}
        </div>

        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-4 space-y-3">{[1,2].map(i => <div key={i} className="glass rounded-xl h-32 animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-14 flex flex-col items-center gap-3">
              <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center">
                <Package className="w-7 h-7 text-forest-300/40" />
              </div>
              <p className="text-forest-200/50 text-sm">
                {available ? 'No orders assigned yet' : 'Go online to receive orders'}
              </p>
            </div>
          ) : filtered.map(order => {
            const items          = order.items || [];
            const restaurantName = order.restaurant_name    || 'Restaurant';
            const restaurantAddr = order.restaurant_address || '';
            const customerName   = order.customer_name      || 'Customer';
            const customerAddr   = order.delivery_address   || '';
            const deliveryFee    = order.delivery_fee       || 0;
            return (
              <div key={order.id} className="p-4 hover:glass transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-white font-semibold text-sm">Order #{order.id}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${order._view === 'assigned' ? 'glass-orange text-ember-200' : 'glass-green text-forest-200'}`}>
                        {order._view === 'assigned' ? 'New' : 'Active'}
                      </span>
                    </div>
                    {order.created_at && <p className="text-forest-200/40 text-xs">{new Date(order.created_at).toLocaleTimeString()}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-forest-300 font-heading font-bold text-lg">₱{Number(deliveryFee).toFixed(2)}</p>
                    <p className="text-forest-200/40 text-xs">your fee</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="glass rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Store className="w-3 h-3 text-ember-400" />
                      <p className="text-ember-300/80 text-xs font-semibold uppercase tracking-wide">Pickup</p>
                    </div>
                    <p className="text-white text-xs font-semibold">{restaurantName}</p>
                    {restaurantAddr && <p className="text-forest-200/50 text-xs mt-0.5 leading-tight">{restaurantAddr}</p>}
                  </div>
                  <div className="glass rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <MapPin className="w-3 h-3 text-forest-400" />
                      <p className="text-forest-300/80 text-xs font-semibold uppercase tracking-wide">Deliver</p>
                    </div>
                    <p className="text-white text-xs font-semibold">{customerName}</p>
                    {customerAddr && <p className="text-forest-200/50 text-xs mt-0.5 leading-tight">{customerAddr}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3 text-xs text-forest-200/50">
                  <span className="flex items-center gap-1"><Package className="w-3 h-3" />{items.length || '?'} items</span>
                  <span className="flex items-center gap-1">
                    <Bike className="w-3 h-3" />{order._view === 'assigned' ? 'Awaiting your response' : 'In progress'}
                  </span>
                </div>

                {order._view === 'assigned' && (
                  <div className="flex gap-2">
                    <button onClick={() => accept(order.id)}
                      className="flex-1 btn-glow-green text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4" /> Accept
                    </button>
                    <button onClick={() => decline(order.id)}
                      className="w-10 h-10 glass hover:glass-orange transition-all rounded-xl flex items-center justify-center flex-shrink-0">
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                )}
                {order._view === 'in_progress' && (
                  <button onClick={() => navigate(`/rider/delivery/${order.id}`)}
                    className="w-full btn-glow-orange text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                    Continue Delivery <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Customer Food Order tab (mirrors Restaurants.jsx) ─────────────────────────

function HomeTab() {
  const navigate      = useNavigate();
  const { addToCart } = useCart();

  const [viewMode,    setViewMode]  = useState('food');
  const [searchQuery, setSearch]    = useState('');
  const [selectedCat, setCat]       = useState('all');
  const [sortBy,      setSort]      = useState('recommended');
  const [favorites,   setFavs]      = useState([]);
  const [restaurants, setRests]     = useState([]);
  const [foodItems,   setFood]      = useState([]);
  const [loading,     setLoading]   = useState(true);
  const [modalItem,   setModal]     = useState(null);
  const [modalQty,    setModalQty]  = useState(1);

  useEffect(() => { fetchData(); }, [viewMode, selectedCat, searchQuery, sortBy]);

  const fetchData = async () => {
    setLoading(true);
    const start = Date.now();
    try {
      const filters = {
        ...(selectedCat !== 'all' ? { category: selectedCat } : {}),
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(sortBy !== 'recommended' ? { sortBy } : {}),
      };
      if (viewMode === 'food') {
        const res = await getAllMenuItems(filters);
        setFood(Array.isArray(res) ? res : res?.data || []);
      } else {
        const res = await getRestaurants(filters);
        setRests(Array.isArray(res) ? res : res?.data || []);
      }
    } catch { /* silently empty */ } finally {
      const wait = Math.max(0, 600 - (Date.now() - start));
      setTimeout(() => setLoading(false), wait);
    }
  };

  const handleSearch = (e) => { e.preventDefault(); fetchData(); };
  const toggleFav    = (id) => setFavs(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const addItem      = (item, qty = 1) =>
    addToCart(
      { id:item.id, name:item.name, price:Number(item.price), quantity:qty, image:item.image_url || item.image },
      item.restaurant || { id: item.restaurant_id, name: item.restaurant_name || '' }
    );

  return (
    <div className="space-y-5 pb-6">
      {/* Header + toggle */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-white">Food Order</h1>
        <div className="glass rounded-xl p-1 flex">
          {[
            { mode:'food',        icon:Utensils, label:'Food'   },
            { mode:'restaurants', icon:Store,    label:'Stores' },
          ].map(({ mode, icon:Icon, label }) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${viewMode === mode ? 'btn-glow-orange text-white' : 'text-forest-100/60 hover:text-white'}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Search + sort */}
      <div className="flex gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/50" />
          <input value={searchQuery} onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${viewMode === 'food' ? 'food' : 'restaurants'}…`}
            className="w-full input-glass pl-10 pr-4 py-2.5 text-sm" />
        </form>
        <div className="relative">
          <select value={sortBy} onChange={e => setSort(e.target.value)}
            className="input-glass pl-9 pr-3 py-2.5 text-sm appearance-none cursor-pointer">
            <option value="recommended" style={{ background:'#0d2b1a' }}>Recommended</option>
            <option value="rating"      style={{ background:'#0d2b1a' }}>Top Rated</option>
            {viewMode === 'restaurants'
              ? <option value="deliveryTime" style={{ background:'#0d2b1a' }}>Fastest</option>
              : <option value="price"        style={{ background:'#0d2b1a' }}>Price ↑</option>}
          </select>
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/50 pointer-events-none" />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
        {FOOD_CATEGORIES.map(({ id, label, emoji }) => (
          <button key={id} onClick={() => setCat(id)}
            className={`category-pill flex-shrink-0 px-3 py-2 text-xs
              ${selectedCat === id ? 'active text-white' : 'glass text-forest-100/60 hover:text-white hover:glass-green'}`}>
            <span className="text-lg">{emoji}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="glass rounded-2xl aspect-square animate-pulse" />)}
        </div>
      )}

      {/* Food grid */}
      {!loading && viewMode === 'food' && (
        foodItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {foodItems.map((item, idx) => (
              <div key={item.id}
                onClick={() => navigate(`/food/${item.id}`, { state:{ foodItem:item } })}
                className="restaurant-card card-3d glass cursor-pointer group animate-fade-up"
                style={{ animationDelay:`${idx * 40}ms` }}>
                <div className="relative aspect-square overflow-hidden">
                  {item.image_url || item.image
                    ? <img src={item.image_url || item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full glass flex items-center justify-center text-3xl">🍽️</div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <button onClick={e => { e.stopPropagation(); toggleFav(item.id); }}
                    className="absolute top-2 right-2 w-7 h-7 glass rounded-full flex items-center justify-center">
                    <Heart className={`w-3.5 h-3.5 ${favorites.includes(item.id) ? 'fill-ember-400 text-ember-400' : 'text-white/70'}`} />
                  </button>
                  <p className="absolute bottom-2 left-2 text-white font-bold text-sm text-glow-orange">₱{Number(item.price).toFixed(2)}</p>
                </div>
                <div className="p-2.5">
                  <p className="text-white font-semibold text-xs truncate">{item.name}</p>
                  <p className="text-forest-200/50 text-xs truncate mb-2">{item.restaurant_name || item.restaurant?.name}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-ember-400 text-ember-400" />
                      <span className="text-ember-300 text-xs">{item.rating || '4.8'}</span>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setModal(item); setModalQty(1); }}
                      className="w-6 h-6 btn-glow-orange rounded-lg flex items-center justify-center">
                      <Plus className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-3xl py-16 flex flex-col items-center gap-3">
            <span className="text-5xl">🍽️</span>
            <p className="text-white font-semibold">No food items found</p>
            <p className="text-forest-200/50 text-sm">Try adjusting your filters</p>
            <button onClick={() => { setCat('all'); setSearch(''); }}
              className="btn-glow-orange text-white text-sm px-5 py-2.5 rounded-xl mt-2">Clear Filters</button>
          </div>
        )
      )}

      {/* Restaurants grid */}
      {!loading && viewMode === 'restaurants' && (
        restaurants.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {restaurants.map((r, idx) => (
              <button key={r.id} onClick={() => navigate(`/restaurant/${r.id}`)}
                className="restaurant-card card-3d glass text-left group animate-fade-up"
                style={{ animationDelay:`${idx * 40}ms` }}>
                <div className="relative h-36 overflow-hidden">
                  {r.image_url || r.image
                    ? <img src={r.image_url || r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full glass flex items-center justify-center text-4xl">🏪</div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  {!(r.is_open ?? r.isOpen) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="glass text-white/70 text-xs px-3 py-1 rounded-full">Closed</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-3 right-3">
                    <p className="text-white font-semibold text-sm truncate">{r.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-0.5 text-ember-300 text-xs">
                        <Star className="w-3 h-3 fill-current" />{r.rating}
                      </span>
                      <span className="text-white/40 text-xs">•</span>
                      <span className="text-forest-200 text-xs">{r.delivery_time || r.deliveryTime} min</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="glass-green text-forest-200 text-xs px-2 py-0.5 rounded-full capitalize">{r.category}</span>
                  <span className="text-forest-200/50 text-xs">₱{r.delivery_fee ?? r.deliveryFee} del.</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="glass rounded-3xl py-16 flex flex-col items-center gap-3">
            <span className="text-5xl">🏪</span>
            <p className="text-white font-semibold">No restaurants found</p>
            <button onClick={() => { setCat('all'); setSearch(''); }}
              className="btn-glow-orange text-white text-sm px-5 py-2.5 rounded-xl mt-2">Clear Filters</button>
          </div>
        )
      )}

      {/* Add-to-cart modal */}
      {modalItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background:'rgba(0,0,0,.7)', backdropFilter:'blur(8px)' }}
          onClick={() => setModal(null)}>
          <div className="glass w-full max-w-sm rounded-3xl overflow-hidden card-3d animate-fade-up"
            onClick={e => e.stopPropagation()}>
            <div className="relative h-48">
              {modalItem.image_url || modalItem.image
                ? <img src={modalItem.image_url || modalItem.image} alt={modalItem.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full glass flex items-center justify-center text-6xl">🍽️</div>
              }
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <button onClick={() => setModal(null)}
                className="absolute top-3 right-3 w-8 h-8 glass rounded-full flex items-center justify-center text-white">
                <X className="w-4 h-4" />
              </button>
              <p className="absolute bottom-3 left-4 text-white font-bold text-xl text-glow-orange">₱{Number(modalItem.price).toFixed(2)}</p>
            </div>
            <div className="p-5">
              <p className="text-white font-heading font-bold text-lg mb-1">{modalItem.name}</p>
              <p className="text-forest-200/60 text-sm mb-4">{modalItem.description || modalItem.restaurant_name}</p>
              <div className="flex items-center justify-between mb-5">
                <span className="text-forest-200/60 text-sm">Quantity</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setModalQty(q => Math.max(1, q - 1))}
                    className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:glass-orange transition-all">
                    <Minus className="w-4 h-4 text-forest-200" />
                  </button>
                  <span className="text-white font-bold w-5 text-center">{modalQty}</span>
                  <button onClick={() => setModalQty(q => q + 1)}
                    className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:glass-green transition-all">
                    <Plus className="w-4 h-4 text-forest-200" />
                  </button>
                </div>
              </div>
              <button onClick={() => { addItem(modalItem, modalQty); setModal(null); }}
                className="w-full py-3.5 btn-glow-orange text-white font-bold rounded-xl flex items-center justify-center gap-2">
                Add to Cart — ₱{(Number(modalItem.price) * modalQty).toFixed(2)} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root component ─────────────────────────────────────────────────────────────

export default function RiderDashboard() {
  const { rider } = useRider();
  const [tab, setTab] = useState('deliveries');

  const TABS = [
    { key:'deliveries', label:'Deliveries', icon:LayoutDashboard },
    { key:'home',       label:'Home',       icon:Home },
  ];

  return (
    <div className="space-y-5 pb-6 animate-fade-up">
      {/* Tab switcher */}
      <div className="glass rounded-2xl p-1 flex gap-1">
        {TABS.map(({ key, label, icon:Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${tab === key ? 'btn-glow-orange text-white' : 'text-forest-200/60 hover:text-forest-100'}`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'deliveries' ? <DeliveriesTab rider={rider} /> : <HomeTab />}
    </div>
  );
}

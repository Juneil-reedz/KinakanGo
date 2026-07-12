import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRider } from '../../context/RiderContext';
import { useNotification } from '../../context/NotificationContext';
import { useCart } from '../../context/CartContext';
import { ordersApi, riderApi, getFeaturedRestaurants, getAllMenuItems } from '../../services/api';
import {
  Banknote, Package, Bike, Clock, MapPin, ChevronRight, Store,
  Check, X, TrendingUp, Wifi, WifiOff, Home, LayoutDashboard,
  Heart, Star, Plus, Flame, Zap, UtensilsCrossed, Truck, Tag
} from 'lucide-react';

// ── Customer home constants ────────────────────────────────────────────────────

const CATEGORIES = ['All','Burger','Pizza','Sushi','Chicken','Beverage','Bakery','Seafood'];

const PROMOS = [
  { id:1, tag:'Hot Deal',     title:'Get 20% Off',     sub:'Your first order today',        bg:'from-ember-700/80 to-ember-900/80',   accent:'#f97316' },
  { id:2, tag:'Free Delivery',title:'Orders Above ₱500',sub:'Limited time offer',            bg:'from-forest-700/80 to-forest-900/80', accent:'#2d8a57' },
  { id:3, tag:'Flash Sale',   title:'Buy 1 Get 1 Free', sub:'On all burgers this weekend',   bg:'from-forest-600/80 to-ember-800/80',  accent:'#3db870' },
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
          if (silent && orders.length > prev.length) {
            addNotification('New delivery assignment!', 'success');
          }
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
    if (available) {
      pollRef.current = setInterval(() => fetchOrders(true), POLL_MS);
    }
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
    todayEarnings:    0,
    todayDeliveries:  0,
    activeDeliveries: activeOrders.length,
    pendingOffers:    pendingOrders.length,
  };
  const filtered = filter === 'all' ? orders : orders.filter(o => o._view === filter);
  const FILTERS = [
    { key:'all',         label:'All' },
    { key:'assigned',    label:'New' },
    { key:'in_progress', label:'Active' },
  ];

  return (
    <div className="space-y-5">
      {/* Availability + greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-forest-200/50 text-sm">Welcome back</p>
          <h1 className="text-2xl font-heading font-bold text-white">{rider?.name || 'Rider'}</h1>
        </div>
        <button
          onClick={toggleAvailability}
          disabled={togglingAvail}
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
              {f.key !== 'all' && (
                <span className="ml-1.5 text-xs opacity-70">({orders.filter(o => o._view === f.key).length})</span>
              )}
            </button>
          ))}
        </div>

        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2].map(i => <div key={i} className="glass rounded-xl h-32 animate-pulse" />)}
            </div>
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
            const items          = order.items || order.orderItems || [];
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
                    {order.created_at && (
                      <p className="text-forest-200/40 text-xs">{new Date(order.created_at).toLocaleTimeString()}</p>
                    )}
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
                    <Bike className="w-3 h-3" />
                    {order._view === 'assigned' ? 'Awaiting your response' : 'In progress'}
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

// ── Customer home tab ──────────────────────────────────────────────────────────

function HomeTab() {
  const navigate      = useNavigate();
  const { addToCart } = useCart();

  const [cat, setCat]           = useState('All');
  const [promo, setPromo]       = useState(0);
  const [favorites, setFavs]    = useState([]);
  const [restaurants, setRests] = useState([]);
  const [menuItems, setItems]   = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const t = setInterval(() => setPromo(p => (p + 1) % PROMOS.length), 4000);
    Promise.all([
      getFeaturedRestaurants(4).catch(() => []),
      getAllMenuItems({ limit: 12 }).catch(() => []),
    ]).then(([rests, items]) => {
      setRests(Array.isArray(rests?.data) ? rests.data : Array.isArray(rests) ? rests : []);
      setItems(Array.isArray(items) ? items : []);
    }).finally(() => setLoading(false));
    return () => clearInterval(t);
  }, []);

  const filtered = cat === 'All'
    ? menuItems
    : menuItems.filter(i => i.category_name?.toLowerCase() === cat.toLowerCase());

  const toggleFav = id => setFavs(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleAdd = item =>
    addToCart(
      { id: item.id, name: item.name, price: item.price, image: item.image_url, quantity: 1 },
      { id: item.restaurant_id, name: item.restaurant_name }
    );

  return (
    <div className="space-y-6">

      {/* Promo carousel */}
      <section>
        <div
          className={`relative bg-gradient-to-br ${PROMOS[promo].bg} rounded-3xl p-5 md:p-7 overflow-hidden transition-all duration-700 card-3d`}
          style={{ border:`1px solid ${PROMOS[promo].accent}30`, boxShadow:`0 8px 32px ${PROMOS[promo].accent}20` }}>
          <div className="orb w-48 h-48 opacity-30 -top-10 -right-10" style={{ background:PROMOS[promo].accent }} />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="inline-block glass px-3 py-1 rounded-full text-xs text-white font-medium">{PROMOS[promo].tag}</span>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-white text-glow-orange">{PROMOS[promo].title}</h2>
              <p className="text-white/70 text-sm">{PROMOS[promo].sub}</p>
              <button onClick={() => navigate('/restaurants')}
                className="mt-2 btn-glow-orange text-white text-sm font-semibold px-5 py-2.5 rounded-xl inline-flex items-center gap-2">
                Order Now <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="absolute bottom-4 left-5 flex gap-1.5">
            {PROMOS.map((_, i) => (
              <button key={i} onClick={() => setPromo(i)}
                className={`h-1.5 rounded-full transition-all ${i === promo ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { icon:Truck, label:'Free Delivery', val:'₱500+',  color:'text-ember-400' },
          { icon:Clock, label:'Avg. Delivery',  val:'30 min', color:'text-forest-300' },
          { icon:Tag,   label:'Active Promos',  val:'12+',    color:'text-ember-300' },
        ].map(({ icon:Icon, label, val, color }) => (
          <div key={label} className="glass card-3d rounded-2xl p-3 flex flex-col items-center gap-1 text-center">
            <Icon className={`w-5 h-5 ${color}`} />
            <p className="text-white font-bold text-sm">{val}</p>
            <p className="text-forest-200/60 text-xs">{label}</p>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-heading font-bold text-lg">Categories</h3>
          <button onClick={() => navigate('/restaurants')} className="text-ember-400 text-xs font-medium hover:text-ember-300 flex items-center gap-1">
            See all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map(name => (
            <button key={name} onClick={() => setCat(name)}
              className={`category-pill flex-shrink-0 ${
                cat === name ? 'active text-white' : 'glass text-forest-100/70 hover:text-white hover:glass-green'
              }`}>
              <span className="text-xs font-medium whitespace-nowrap">{name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Popular food */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-heading font-bold text-lg flex items-center gap-2">
            <Flame className="w-5 h-5 text-ember-400" /> Popular Food
          </h3>
          <button onClick={() => navigate('/restaurants')} className="text-ember-400 text-xs font-medium hover:text-ember-300 flex items-center gap-1">
            See all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="glass rounded-2xl h-48 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
            <UtensilsCrossed className="w-10 h-10 text-forest-300/50" />
            <p className="text-forest-200/60 text-sm">No items yet — check back soon!</p>
            <button onClick={() => navigate('/restaurants')} className="btn-glow-orange text-white text-xs px-4 py-2 rounded-xl">
              Browse Restaurants
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((item, idx) => (
              <div key={item.id} className="restaurant-card card-3d glass group animate-fade-up"
                style={{ animationDelay:`${idx * 80}ms` }}>
                <div className="relative h-40 overflow-hidden">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full glass flex items-center justify-center"><UtensilsCrossed className="w-10 h-10 text-forest-300/40" /></div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <button onClick={() => toggleFav(item.id)}
                    className="absolute top-3 right-3 w-7 h-7 glass rounded-full flex items-center justify-center hover:glass-orange transition-all">
                    <Heart className={`w-3.5 h-3.5 ${favorites.includes(item.id) ? 'fill-ember-400 text-ember-400' : 'text-white/70'}`} />
                  </button>
                  <div className="absolute bottom-3 left-3">
                    <p className="text-white font-heading font-bold text-lg text-glow-orange">₱{Number(item.price).toFixed(2)}</p>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-white font-semibold text-sm truncate">{item.name}</p>
                  <p className="text-forest-200/60 text-xs truncate mb-2">{item.restaurant_name}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-ember-400 text-ember-400" />
                      <span className="text-ember-300 text-xs font-medium">{Number(item.rating ?? 0).toFixed(1)}</span>
                    </div>
                    <button onClick={() => handleAdd(item)}
                      className="w-7 h-7 btn-glow-orange rounded-lg flex items-center justify-center">
                      <Plus className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured restaurants */}
      {restaurants.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-heading font-bold text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-forest-300" /> Featured Restaurants
            </h3>
            <button onClick={() => navigate('/restaurants')} className="text-ember-400 text-xs font-medium hover:text-ember-300 flex items-center gap-1">
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
            {restaurants.slice(0, 4).map((r, idx) => (
              <button key={r.id} onClick={() => navigate(`/restaurant/${r.id}`)}
                className="restaurant-card card-3d glass text-left group animate-fade-up"
                style={{ animationDelay:`${idx * 80}ms` }}>
                <div className="relative h-32 overflow-hidden">
                  {r.image_url
                    ? <img src={r.image_url} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full glass flex items-center justify-center"><UtensilsCrossed className="w-8 h-8 text-forest-300/40" /></div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-semibold text-sm truncate">{r.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-ember-300 text-xs">
                        <Star className="w-3 h-3 fill-current" />{Number(r.rating ?? 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  {!r.is_open && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="glass text-white/70 text-xs px-3 py-1 rounded-full">Closed</span>
                    </div>
                  )}
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="glass-green text-forest-200 text-xs px-2 py-0.5 rounded-full">{r.cuisine ?? 'Restaurant'}</span>
                  <span className="text-forest-200/60 text-xs">₱{r.delivery_fee} delivery</span>
                </div>
              </button>
            ))}
          </div>
        </section>
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

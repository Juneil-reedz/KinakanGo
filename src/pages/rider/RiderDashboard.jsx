import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRider } from '../../context/RiderContext';
import { useNotification } from '../../context/NotificationContext';
import { riderRequest } from '../../context/RiderContext';
import {
  Banknote, Package, Bike, Clock, MapPin, ChevronRight, Store,
  Check, X, TrendingUp, Wifi, WifiOff
} from 'lucide-react';

const STATS_DEF = [
  { label:"Today's Earnings", key:'todayEarnings',    icon:Banknote, fmt: v => `₱${Number(v).toFixed(2)}`, color:'btn-glow-green' },
  { label:'Deliveries Today', key:'todayDeliveries',  icon:Package,  fmt: v => v,                          color:'btn-glow-orange' },
  { label:'Active',           key:'activeDeliveries', icon:Bike,     fmt: v => v,                          color:'glass-green' },
  { label:'Pending Pickups',  key:'pendingOffers',    icon:Clock,    fmt: v => v,                          color:'glass-orange' },
];

const POLL_MS = 15000;

export default function RiderDashboard() {
  const { rider }           = useRider();
  const { addNotification } = useNotification();
  const navigate            = useNavigate();

  const [pendingOrders, setPending] = useState([]);
  const [activeOrders,  setActive]  = useState([]);
  const [loading,  setLoading]      = useState(true);
  const [filter,   setFilter]       = useState('all');
  const [mobileSection, setMobileSection] = useState('overview');
  const [available, setAvail]       = useState(true);
  const [togglingAvail, setToggling] = useState(false);
  const [riderStats, setRiderStats] = useState({
    todayEarnings: 0,
    todayDeliveries: 0,
  });
  const pollRef = useRef(null);

  // On mount: upsert rider_profiles row so auto-assign can find this rider
  useEffect(() => {
    riderRequest('/riders/availability', {
      method: 'PATCH', body: JSON.stringify({ is_available: true }),
    }).then(() => fetchOrders(true)).catch(() => {});
  }, []);

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [ordersRes, profileRes] = await Promise.allSettled([
        riderRequest('/orders?rider_orders=true&limit=50'),
        riderRequest('/riders/me'),
      ]);
      if (ordersRes.status === 'fulfilled') {
        const orders = ordersRes.value.data || ordersRes.value || [];
        const pending = orders.filter(o => o.status === 'ready');
        const active = orders.filter(o => o.status === 'picked_up');
        setPending(prev => {
          if (silent && pending.length > prev.length) addNotification('New delivery assignment!', 'success');
          return pending;
        });
        setActive(active);
      }
      if (profileRes.status === 'fulfilled') {
        const profile = profileRes.value;
        setAvail(Boolean(profile.is_available));
        setRiderStats({
          todayEarnings: Number(profile.today_earnings || 0),
          todayDeliveries: Number(profile.today_deliveries || 0),
        });
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
      await riderRequest('/riders/availability', {
        method: 'PATCH', body: JSON.stringify({ is_available: next }),
      });
      setAvail(next);
      addNotification(next ? 'You are now available for deliveries' : 'You are now offline', 'success');
      if (!next) clearInterval(pollRef.current);
      else {
        fetchOrders(true);
        pollRef.current = setInterval(() => fetchOrders(true), POLL_MS);
      }
    } catch {
      addNotification('Failed to update availability', 'error');
    } finally {
      setToggling(false);
    }
  };

  const accept = async (id) => {
    try {
      await riderRequest(`/orders/${id}/rider-response`, {
        method: 'PATCH', body: JSON.stringify({ accept: true }),
      });
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
    try {
      await riderRequest(`/orders/${id}/rider-response`, {
        method: 'PATCH', body: JSON.stringify({ accept: false }),
      });
    } catch {}
    setPending(prev => prev.filter(o => o.id !== id));
    addNotification('Order declined. Another rider will be assigned.', 'success');
  };

  const orders = [
    ...pendingOrders.map(o => ({ ...o, _view: 'assigned' })),
    ...activeOrders.map(o => ({ ...o,  _view: 'in_progress' })),
  ];
  const stats = {
    todayEarnings: riderStats.todayEarnings,
    todayDeliveries: riderStats.todayDeliveries,
    activeDeliveries: activeOrders.length,
    pendingOffers:    pendingOrders.length,
  };
  const filtered = filter === 'all' ? orders : orders.filter(o => o._view === filter);
  const FILTERS = [
    { key:'all', label:'All' }, { key:'assigned', label:'New' }, { key:'in_progress', label:'Active' },
  ];

  return (
    <div className="space-y-5 pb-6 animate-fade-up">

      {/* Greeting + availability toggle */}
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

      <div className="lg:hidden glass rounded-2xl p-1 grid grid-cols-2 gap-1">
        {[{ key: 'overview', label: 'Overview' }, { key: 'orders', label: `Deliveries (${orders.length})` }].map(tab => (
          <button key={tab.key} onClick={() => setMobileSection(tab.key)}
            className={`py-2.5 rounded-xl text-sm font-semibold transition-all
              ${mobileSection === tab.key ? 'btn-glow-orange text-white' : 'text-forest-200/60'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <section className={`${mobileSection === 'overview' ? 'block' : 'hidden'} lg:block space-y-5`}>
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
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/rider/earnings')}
            className="glass hover:glass-green transition-all rounded-xl py-2.5 flex items-center justify-center gap-2 text-forest-100 text-sm font-medium">
            <TrendingUp className="w-4 h-4" /> Earnings
          </button>
          <button className="glass hover:glass-orange transition-all rounded-xl py-2.5 flex items-center justify-center gap-2 text-forest-100 text-sm font-medium">
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

        <button onClick={() => setMobileSection('orders')}
          className="lg:hidden w-full btn-glow-green text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2">
          View Deliveries <ChevronRight className="w-4 h-4" />
        </button>
      </section>

      {/* Orders */}
      <section className={`${mobileSection === 'orders' ? 'block' : 'hidden'} lg:block glass rounded-3xl overflow-hidden`}>
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
      </section>
    </div>
  );
}

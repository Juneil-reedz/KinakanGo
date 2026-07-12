import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRestaurant } from '../../context/RestaurantContext';
import { messagesApi, ordersApi } from '../../services/api';
import { DollarSign, Package, TrendingUp, ChefHat, ArrowRight, Clock, User, MessageSquare, MapPin, Store } from 'lucide-react';

const STATUS_STYLE = {
  pending:   'glass-orange text-ember-200',
  preparing: 'glass text-forest-200',
  ready:     'btn-glow-green text-white',
  completed: 'glass-green text-forest-200',
};

export default function RestaurantDashboard() {
  const { restaurant }            = useRestaurant();
  const [recentOrders, setOrders] = useState([]);
  const [messages, setMessages]   = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await ordersApi.list({ limit: 5 });
        setOrders(res.data || res || []);
        const inbox = await messagesApi.list('inbox').catch(() => null);
        setMessages(inbox?.data || []);
      } catch {
        // silently fail — dashboard is non-critical
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Derive simple stats from the fetched orders
  const todayOrders = recentOrders.length;
  const totalSales  = recentOrders.reduce((s, o) => s + Number(o.total || o.totalAmount || 0), 0);
  const pendingCount = recentOrders.filter(o => o.status === 'pending').length;

  const STAT_CARDS = [
    { label:'Recent Orders',   value:todayOrders,                icon:Package,    color:'btn-glow-green',  trend:'+8%'  },
    { label:'Total Revenue',   value:`₱${totalSales.toFixed(2)}`,icon:DollarSign, color:'btn-glow-orange', trend:'+10%' },
    { label:'Pending',         value:pendingCount,               icon:ChefHat,    color:'glass-orange',    trend:''     },
    { label:'Restaurant',      value:restaurant?.name ? '—' : '—', icon:TrendingUp, color:'glass-green',  trend:''     },
  ];

  return (
    <div className="space-y-5 pb-6 animate-fade-up">

      {/* Greeting */}
      <div>
        <p className="text-forest-200/50 text-sm">Overview</p>
        <h1 className="text-2xl font-heading font-bold text-white">{restaurant?.name || 'Restaurant'}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-3xl p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden btn-glow-orange flex items-center justify-center flex-shrink-0">
            {restaurant?.image_url
              ? <img src={restaurant.image_url} alt={restaurant.name} className="w-full h-full object-cover" />
              : <Store className="w-8 h-8 text-white" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-heading font-bold text-lg truncate">{restaurant?.name || 'Restaurant Profile'}</p>
            <p className="text-forest-200/60 text-sm truncate">{restaurant?.cuisine || 'Restaurant'} · {restaurant?.is_open ? 'Open' : 'Closed'}</p>
            <p className="text-forest-200/45 text-xs flex items-center gap-1 mt-1 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" />{restaurant?.address || 'No address set'}
            </p>
          </div>
          <Link to="/owner/settings" className="glass hover:glass-green transition-all text-forest-100 text-xs px-3 py-2 rounded-xl flex-shrink-0">
            Edit Profile
          </Link>
        </div>
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-forest-300" />
              <p className="text-white font-semibold">Messages</p>
            </div>
            <span className="glass-green text-forest-200 text-xs px-2 py-0.5 rounded-full">{messages.length}</span>
          </div>
          <p className="text-forest-200/60 text-sm line-clamp-2">
            {messages[0] ? `${messages[0].sender_name}: ${messages[0].body}` : 'No customer messages yet.'}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ label, value, icon:Icon, color, trend }) => (
          <div key={label} className="glass card-3d rounded-2xl p-4">
            <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-white font-heading font-bold text-xl leading-tight">{value}</p>
            <p className="text-forest-200/50 text-xs mt-0.5">{label}</p>
            {trend && (
              <p className="text-forest-300 text-xs mt-1 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> {trend}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent orders — 2 cols */}
        <div className="lg:col-span-2 glass rounded-2xl overflow-hidden">
          <div className="p-4 flex items-center justify-between" style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
            <p className="text-white font-semibold">Recent Orders</p>
            <Link to="/owner/orders" className="flex items-center gap-1 text-ember-400 hover:text-ember-300 text-xs font-medium transition-colors">
              See All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => <div key={i} className="glass rounded-xl h-16 animate-pulse" />)}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="p-8 flex flex-col items-center gap-2">
              <Package className="w-8 h-8 text-forest-300/30" />
              <p className="text-forest-200/40 text-sm">No recent orders</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recentOrders.slice(0, 3).map(order => {
                const items = order.items || order.orderItems || [];
                const customerName = order.customerName || order.customer?.name || 'Customer';
                const total = order.total || order.totalAmount || 0;
                const firstItemName = items[0]?.name || items[0]?.menuItem?.name || 'Order';
                return (
                  <div key={order.id} className="p-4 flex items-center gap-3 hover:glass transition-all">
                    <div className="w-10 h-10 btn-glow-orange rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {firstItemName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{firstItemName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <User className="w-3 h-3 text-forest-300/50" />
                        <p className="text-forest-200/50 text-xs truncate">{customerName}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-ember-400 font-bold text-sm">₱{Number(total).toFixed(2)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${STATUS_STYLE[order.status] || 'glass text-forest-200/60'}`}>
                        {(order.status||'pending').charAt(0).toUpperCase() + (order.status||'pending').slice(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="p-4" style={{ borderTop:'1px solid rgba(255,255,255,.07)' }}>
            <Link to="/owner/orders">
              <button className="w-full btn-glow-orange text-white text-sm font-semibold py-2.5 rounded-xl">
                View All Orders
              </button>
            </Link>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Pending ring */}
          <div className="glass rounded-2xl p-5 text-center">
            <p className="text-white font-semibold mb-4">Pending Orders</p>
            <div className="relative inline-flex items-center justify-center w-28 h-28 mx-auto mb-3">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="10" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="url(#grad)" strokeWidth="10"
                  strokeDasharray="251" strokeDashoffset={251 - (todayOrders > 0 ? (pendingCount / todayOrders) * 251 : 0)} strokeLinecap="round" />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white font-heading font-bold text-3xl">{pendingCount}</span>
                <span className="text-forest-200/50 text-xs">of {todayOrders}</span>
              </div>
            </div>
            <p className="text-forest-200/50 text-xs">Awaiting confirmation</p>
          </div>

          {/* Quick actions */}
          <div className="glass rounded-2xl p-4 space-y-2">
            <p className="text-white font-semibold mb-3">Quick Actions</p>
            {[
              { label:'Manage Menu',   path:'/owner/menu',    color:'hover:glass-orange' },
              { label:'View Reports',  path:'/owner/reports', color:'hover:glass-green'  },
              { label:'All Orders',    path:'/owner/orders',  color:'hover:glass-orange' },
            ].map(({ label, path, color }) => (
              <Link key={path} to={path}>
                <button className={`w-full glass ${color} transition-all text-forest-100/80 hover:text-white text-sm font-medium py-2.5 rounded-xl flex items-center justify-between px-4 mb-1`}>
                  {label} <ChevronRight />
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRight() {
  return (
    <svg className="w-4 h-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

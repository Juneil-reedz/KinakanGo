import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRider } from '../../context/RiderContext';
import { useNotification } from '../../context/NotificationContext';
import {
  Banknote, Package, Bike, Clock, MapPin, Phone,
  ChevronRight, Store, User, Check, X, TrendingUp
} from 'lucide-react';

const STATS = [
  { label:"Today's Earnings", key:'todayEarnings',   icon:Banknote,    fmt: v => `₱${v.toFixed(2)}`, color:'btn-glow-green' },
  { label:'Deliveries Today', key:'todayDeliveries', icon:Package,     fmt: v => v,                   color:'btn-glow-orange' },
  { label:'Active',           key:'activeDeliveries',icon:Bike,        fmt: v => v,                   color:'glass-green' },
  { label:'New Offers',       key:'pendingOffers',   icon:Clock,       fmt: v => v,                   color:'glass-orange' },
];

const INIT_ORDERS = [
  {
    id:'12345', status:'assigned', assignedTime:'5 min ago',
    restaurant:{ name:'Pizza Palace',  address:'Purok 3, Brgy. Laminusa, Bongao', phone:'+63 917 987 6543' },
    customer:  { name:'John Doe',      address:'Purok 5, Brgy. Poblacion, Bongao', phone:'+63 917 123 4567' },
    items:[{ name:'Margherita Pizza', quantity:2 },{ name:'Caesar Salad', quantity:1 }],
    total:40.76, deliveryFee:5.50, distance:'2.3 km', estimatedTime:'25 min',
  },
  {
    id:'12346', status:'assigned', assignedTime:'2 min ago',
    restaurant:{ name:'Burger House',  address:'Purok 7, Brgy. Sanga-Sanga, Bongao', phone:'+63 917 456 7890' },
    customer:  { name:'Jane Smith',    address:'Purok 2, Brgy. Masantong, Bongao',   phone:'+63 917 987 6543' },
    items:[{ name:'Classic Cheeseburger', quantity:1 },{ name:'French Fries', quantity:1 }],
    total:19.25, deliveryFee:4.00, distance:'1.8 km', estimatedTime:'20 min',
  },
  {
    id:'12344', status:'in_progress', assignedTime:'15 min ago',
    restaurant:{ name:'Sushi Masters', address:'Purok 1, Brgy. Ipil, Bongao',       phone:'+63 917 234 5678' },
    customer:  { name:'Mike Johnson',  address:'Purok 4, Brgy. Simandagit, Bongao', phone:'+63 917 456 7890' },
    items:[{ name:'California Roll', quantity:2 },{ name:'Salmon Nigiri', quantity:1 }],
    total:32.97, deliveryFee:6.00, distance:'3.1 km', estimatedTime:'30 min',
  },
];

export default function RiderDashboard() {
  const { rider }              = useRider();
  const { showSuccess }        = useNotification();
  const navigate               = useNavigate();

  const [stats]                = useState({ todayEarnings:124.50, todayDeliveries:8, activeDeliveries:1, pendingOffers:2 });
  const [orders, setOrders]    = useState(INIT_ORDERS);
  const [filter, setFilter]    = useState('all');
  const [available, setAvail]  = useState(true);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const accept = (id) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status:'in_progress' } : o));
    showSuccess('Order accepted! Head to the restaurant.');
    setTimeout(() => navigate(`/rider/delivery/${id}`), 800);
  };

  const decline = (id) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    showSuccess('Order declined.');
  };

  const filters = [
    { key:'all',         label:'All' },
    { key:'assigned',    label:'New' },
    { key:'in_progress', label:'Active' },
  ];

  return (
    <div className="space-y-5 pb-6 animate-fade-up">

      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-forest-200/50 text-sm">Welcome back</p>
          <h1 className="text-2xl font-heading font-bold text-white">{rider?.name || 'Rider'}</h1>
        </div>
        <button onClick={() => setAvail(a => !a)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
            ${available ? 'btn-glow-green text-white' : 'glass text-forest-200/60'}`}>
          <span className={`w-2 h-2 rounded-full ${available ? 'bg-white animate-pulse' : 'bg-forest-200/40'}`} />
          {available ? 'Available' : 'Offline'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map(({ label, key, icon:Icon, fmt, color }) => (
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

      {/* Orders */}
      <div className="glass rounded-3xl overflow-hidden">
        {/* Filter tabs */}
        <div className="flex" style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex-1 py-3 text-sm font-semibold transition-all
                ${filter === f.key ? 'btn-glow-orange text-white' : 'text-forest-200/50 hover:text-forest-100'}`}>
              {f.label}
              {f.key !== 'all' && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({orders.filter(o => o.status === f.key).length})
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="divide-y divide-white/5">
          {filtered.length === 0 ? (
            <div className="py-14 flex flex-col items-center gap-3">
              <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center">
                <Package className="w-7 h-7 text-forest-300/40" />
              </div>
              <p className="text-forest-200/50 text-sm">No orders here</p>
            </div>
          ) : filtered.map(order => (
            <div key={order.id} className="p-4 hover:glass transition-all">
              {/* Order top row */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white font-semibold text-sm">Order #{order.id}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${order.status === 'assigned' ? 'glass-orange text-ember-200' : 'glass-green text-forest-200'}`}>
                      {order.status === 'assigned' ? 'New' : 'Active'}
                    </span>
                  </div>
                  <p className="text-forest-200/40 text-xs">{order.assignedTime}</p>
                </div>
                <div className="text-right">
                  <p className="text-forest-300 font-heading font-bold text-lg">₱{order.deliveryFee.toFixed(2)}</p>
                  <p className="text-forest-200/40 text-xs">your fee</p>
                </div>
              </div>

              {/* Pickup / Deliver */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="glass rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Store className="w-3 h-3 text-ember-400" />
                    <p className="text-ember-300/80 text-xs font-semibold uppercase tracking-wide">Pickup</p>
                  </div>
                  <p className="text-white text-xs font-semibold">{order.restaurant.name}</p>
                  <p className="text-forest-200/50 text-xs mt-0.5 leading-tight">{order.restaurant.address}</p>
                </div>
                <div className="glass rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <MapPin className="w-3 h-3 text-forest-400" />
                    <p className="text-forest-300/80 text-xs font-semibold uppercase tracking-wide">Deliver</p>
                  </div>
                  <p className="text-white text-xs font-semibold">{order.customer.name}</p>
                  <p className="text-forest-200/50 text-xs mt-0.5 leading-tight">{order.customer.address}</p>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-3 mb-3 text-xs text-forest-200/50">
                <span className="flex items-center gap-1"><Bike className="w-3 h-3" />{order.distance}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{order.estimatedTime}</span>
                <span className="flex items-center gap-1"><Package className="w-3 h-3" />{order.items.length} items</span>
              </div>

              {/* Actions */}
              {order.status === 'assigned' && (
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
              {order.status === 'in_progress' && (
                <button onClick={() => navigate(`/rider/delivery/${order.id}`)}
                  className="w-full btn-glow-orange text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                  Continue Delivery <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

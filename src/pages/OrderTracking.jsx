import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi, storage } from '../services/api';
import {
  MapPin, Clock, Phone, Package, ChevronRight,
  ClipboardList, ChefHat, PackageCheck, Bike, Navigation, CheckCircle2,
  ArrowRight, Store, RefreshCw
} from 'lucide-react';

const STATUSES = [
  { id:'pending',    label:'Placed',    icon:ClipboardList, desc:'Order received by restaurant' },
  { id:'accepted',   label:'Accepted',  icon:ClipboardList, desc:'Restaurant accepted your order' },
  { id:'preparing',  label:'Cooking',   icon:ChefHat,       desc:'Restaurant is preparing your food' },
  { id:'ready',      label:'Ready',     icon:PackageCheck,  desc:'Food is ready for pickup' },
  { id:'picked_up',  label:'Picked',    icon:Bike,          desc:'Rider picked up your order' },
  { id:'delivered',  label:'Delivered', icon:CheckCircle2,  desc:'Order successfully delivered' },
];

export default function OrderTracking() {
  const navigate = useNavigate();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async (silent = false) => {
    if (!storage.getAccess()) { setLoading(false); return; }
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await ordersApi.list({ limit: 10 });
      const list = res?.data ?? [];
      const active = list.filter(o => !['delivered','cancelled','refunded'].includes(o.status));
      setOrders(active.length ? active : list.slice(0, 5));
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const t = setInterval(() => fetchOrders(true), 30000);
    return () => clearInterval(t);
  }, []);

  const getStatusIdx = (s) => STATUSES.findIndex(st => st.id === s);

  if (loading) return (
    <div className="space-y-4">
      <div className="glass rounded-3xl h-48 animate-pulse" />
      <div className="glass rounded-3xl h-48 animate-pulse" />
    </div>
  );

  if (orders.length === 0) return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="glass rounded-3xl p-12 max-w-sm w-full text-center card-3d animate-fade-up">
        <div className="w-16 h-16 glass rounded-3xl flex items-center justify-center mx-auto mb-5">
          <Package className="w-8 h-8 text-forest-300/60" />
        </div>
        <p className="text-white font-bold text-lg mb-2">No active orders</p>
        <p className="text-forest-200/50 text-sm mb-6">Place an order to track it here.</p>
        <button onClick={() => navigate('/restaurants')} className="btn-glow-orange text-white px-8 py-3 rounded-xl font-bold">
          Order Now
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 pb-20 lg:pb-0 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-white">Track Orders</h1>
        <button onClick={() => fetchOrders(true)} disabled={refreshing}
          className="glass hover:glass-green transition-all px-3 py-2 rounded-xl text-forest-200 text-sm flex items-center gap-1.5">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {orders.map((order) => {
        const curIdx = Math.max(0, getStatusIdx(order.status));
        const isDone = order.status === 'delivered';
        const isCancelled = ['cancelled','refunded'].includes(order.status);

        return (
          <div key={order.id} className="glass rounded-3xl overflow-hidden">

            {/* Order header */}
            <div className="p-5 flex flex-wrap items-start justify-between gap-4"
              style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <p className="text-white font-bold text-base">Order #{order.id}</p>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    isDone ? 'glass-green text-forest-200' : isCancelled ? 'text-red-300 glass' : 'glass-orange text-ember-200'}`}>
                    {order.status.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-forest-200/60 text-xs">
                  <Store className="w-3.5 h-3.5" />
                  <span>{order.restaurant_name}</span>
                </div>
                <p className="text-forest-200/30 text-xs">{new Date(order.created_at).toLocaleString('en-PH')}</p>
              </div>
              <div className="text-right">
                <p className="text-ember-400 font-heading font-bold text-2xl">₱{Number(order.total).toFixed(2)}</p>
                {!isDone && order.estimated_delivery && (
                  <p className="text-forest-200/60 text-xs flex items-center gap-1 justify-end mt-1">
                    <Clock className="w-3 h-3" />
                    <span>ETA: {new Date(order.estimated_delivery).toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit' })}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Progress stepper */}
            {!isCancelled && (
              <div className="px-5 pt-5 pb-4">
                <div className="relative">
                  <div className="absolute top-5 left-5 right-5 h-px bg-white/8">
                    <div className="h-full bg-gradient-to-r from-forest-500 to-ember-500 transition-all duration-700"
                      style={{ width:`${(curIdx / (STATUSES.length - 1)) * 100}%` }} />
                  </div>
                  <div className="relative grid grid-cols-6">
                    {STATUSES.map((s, i) => {
                      const done    = i <= curIdx;
                      const current = i === curIdx;
                      const Icon    = s.icon;
                      return (
                        <div key={s.id} className="flex flex-col items-center gap-2">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 z-10
                            ${current ? 'btn-glow-orange scale-110' : done ? 'btn-glow-green' : 'glass'}`}>
                            <Icon className={`w-4 h-4 ${done ? 'text-white' : 'text-forest-200/40'}`} />
                          </div>
                          <p className={`text-[10px] text-center font-medium leading-tight hidden sm:block
                            ${current ? 'text-ember-300' : done ? 'text-forest-300' : 'text-forest-200/30'}`}>
                            {s.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-4 glass rounded-xl px-4 py-2.5 flex items-center gap-2">
                  {(() => { const Icon = STATUSES[curIdx]?.icon ?? Package; return <Icon className={`w-4 h-4 flex-shrink-0 ${isDone ? 'text-forest-400' : 'text-ember-400'}`} />; })()}
                  <p className="text-forest-100/70 text-sm">{STATUSES[curIdx]?.desc}</p>
                </div>
              </div>
            )}

            {/* Rider info */}
            {order.rider_id && !isDone && (
              <div className="px-5 pb-4">
                <div className="glass rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 btn-glow-green rounded-xl flex items-center justify-center flex-shrink-0">
                      <Bike className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Rider assigned</p>
                      <p className="text-forest-200/50 text-xs">On the way</p>
                    </div>
                  </div>
                  <Navigation className="w-5 h-5 text-ember-400" />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="px-5 pb-5">
              {isDone ? (
                <button onClick={() => navigate('/restaurants')}
                  className="w-full btn-glow-orange text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2">
                  Order Again <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={() => navigate(`/restaurant/${order.restaurant_id}`)}
                  className="w-full glass hover:glass-green transition-all text-forest-200 text-sm py-3 rounded-xl flex items-center justify-center gap-2">
                  <Store className="w-4 h-4" />
                  View Restaurant
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import DeliveryMap3D from '../components/DeliveryMap3D';
import { mockSocket, generateRoute, mockLocations } from '../services/mockSocket';
import { MapPin, Clock, Phone, ChevronRight, Package } from 'lucide-react';

const STATUSES = [
  { id:'placed',     label:'Placed',   icon:'📝', desc:'Order received' },
  { id:'preparing',  label:'Cooking',  icon:'👨‍🍳', desc:'Restaurant is preparing your food' },
  { id:'ready',      label:'Ready',    icon:'✅', desc:'Food is ready for pickup' },
  { id:'picked_up',  label:'Picked',   icon:'🏍️', desc:'Rider picked up your order' },
  { id:'on_the_way', label:'On Way',   icon:'🚗', desc:'Delivery in progress' },
  { id:'delivered',  label:'Done',     icon:'🎉', desc:'Order delivered!' },
];

const DEMO_ORDERS = [{
  id:'12345', restaurant:'Pizza Palace',
  items:['Margherita Pizza x2','Caesar Salad x1'],
  total:34.97, status:'preparing', statusText:'Preparing',
  estimatedTime:'25-30 min', date: new Date().toISOString(),
  driver:null,
  restaurantLocation: mockLocations.restaurants[0],
  customerLocation: mockLocations.customers[0],
  riderLocation:null, route:null, deliveryProgress:0,
}];

export default function OrderTracking() {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [orders, setOrders]         = useState(DEMO_ORDERS);
  const [activeOrderId, setActiveOrderId] = useState(null);

  const getStatusIdx = (s) => STATUSES.findIndex(st => st.id === s);

  const simulateProgress = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === 'delivered') return;
    const idx = getStatusIdx(order.status);
    if (idx >= STATUSES.length - 1) return;
    const next = STATUSES[idx + 1];
    setOrders(prev => prev.map(o => o.id === orderId
      ? { ...o, status:next.id, statusText:next.label, driver: next.id==='picked_up' ? {name:'Maria Santos', phone:'+63 912 000 0001'} : o.driver }
      : o));
    addNotification(`Order #${orderId}: ${next.label} — ${next.desc}`, 'info');
    if (next.id === 'picked_up') startTracking(orderId);
    if (next.id === 'delivered') setTimeout(() => addNotification('Order delivered! Enjoy your meal 🎉', 'success'), 500);
  };

  const startTracking = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const route = generateRoute(order.restaurantLocation, order.customerLocation, 20);
    setOrders(prev => prev.map(o => o.id === orderId
      ? { ...o, route, riderLocation: route[0], estimatedTime:`${mockSocket.calculateETA(0, route.length)} min` }
      : o));
    setActiveOrderId(orderId);
    mockSocket.connect(orderId);
    mockSocket.on('rider_location', (data) => {
      setOrders(prev => prev.map(o => o.id === orderId
        ? { ...o, riderLocation:data.position, deliveryProgress:data.progress,
            estimatedTime:`${mockSocket.calculateETA(Math.floor((data.progress/100)*route.length), route.length)} min` }
        : o));
    });
    mockSocket.on('order_status', (data) => {
      if (data.status==='delivered') {
        addNotification('Order delivered! 🎉', 'success');
        setOrders(prev => prev.map(o => o.id===orderId ? {...o,status:'delivered',statusText:'Delivered',estimatedTime:null} : o));
        mockSocket.disconnect(); setActiveOrderId(null);
      } else { addNotification(data.message, 'info'); }
    });
    mockSocket.startRiderUpdates(route, 2000);
  };

  useEffect(() => () => { mockSocket.disconnect(); }, []);

  if (orders.length === 0) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-3xl p-10 max-w-sm text-center card-3d animate-fade-up">
        <span className="text-5xl mb-4 block">📦</span>
        <p className="text-white font-bold text-lg mb-2">No active orders</p>
        <p className="text-forest-200/50 text-sm mb-6">Place an order to track it here.</p>
        <button onClick={() => navigate('/restaurants')} className="btn-glow-orange text-white px-8 py-3 rounded-xl font-bold">Order Now</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 pb-20 lg:pb-0 animate-fade-up">
      <h1 className="text-2xl font-heading font-bold text-white">Track Orders</h1>

      {orders.map((order) => {
        const curIdx = getStatusIdx(order.status);
        const isDone = order.status === 'delivered';

        return (
          <div key={order.id} className="glass card-3d rounded-3xl overflow-hidden">
            {/* Order header */}
            <div className="p-5 flex flex-wrap items-start justify-between gap-3"
              style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-semibold">Order #{order.id}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isDone ? 'glass-green text-forest-200' : 'glass-orange text-ember-200'}`}>
                    {order.statusText}
                  </span>
                </div>
                <p className="text-forest-200/60 text-xs">{order.restaurant}</p>
                <p className="text-forest-200/40 text-xs">{new Date(order.date).toLocaleString('en-PH')}</p>
              </div>
              <div className="text-right">
                <p className="text-ember-400 font-heading font-bold text-xl">₱{order.total.toFixed(2)}</p>
                {!isDone && order.estimatedTime && (
                  <p className="text-forest-200/60 text-xs flex items-center gap-1 justify-end mt-0.5">
                    <Clock className="w-3 h-3" /> ETA: {order.estimatedTime}
                  </p>
                )}
              </div>
            </div>

            {/* Progress stepper */}
            <div className="p-5">
              <div className="relative">
                {/* track line */}
                <div className="absolute top-6 left-6 right-6 h-0.5 bg-forest-800">
                  <div className="h-full bg-gradient-to-r from-forest-500 to-ember-500 transition-all duration-700"
                    style={{ width:`${(curIdx / (STATUSES.length-1)) * 100}%` }} />
                </div>
                <div className="relative grid grid-cols-6 gap-1">
                  {STATUSES.map((s, i) => {
                    const done    = i <= curIdx;
                    const current = i === curIdx;
                    return (
                      <div key={s.id} className="flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-2 transition-all duration-500 z-10
                          ${done ? (current ? 'btn-glow-orange scale-110 shadow-[0_0_20px_rgba(230,126,34,.5)]' : 'btn-glow-green') : 'glass'}`}>
                          {s.icon}
                        </div>
                        <p className={`text-xs text-center font-medium leading-tight hidden sm:block
                          ${done ? (current ? 'text-ember-300' : 'text-forest-300') : 'text-forest-200/40'}`}>
                          {s.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="text-center text-forest-200/60 text-xs mt-3">{STATUSES[curIdx].desc}</p>
            </div>

            {/* Items */}
            <div className="px-5 pb-4">
              <div className="glass-dark rounded-xl p-3 mb-4">
                {order.items.map((item, i) => (
                  <p key={i} className="text-forest-200/70 text-xs py-0.5 flex items-center gap-2">
                    <span className="text-ember-400">•</span>{item}
                  </p>
                ))}
              </div>

              {/* Driver */}
              {order.driver && !isDone && (
                <div className="glass rounded-xl px-4 py-3 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 btn-glow-green rounded-xl flex items-center justify-center text-lg">🛵</div>
                    <div>
                      <p className="text-white font-semibold text-sm">{order.driver.name}</p>
                      <p className="text-forest-200/50 text-xs">{order.driver.phone}</p>
                    </div>
                  </div>
                  <button className="glass hover:glass-green transition-all px-3 py-2 rounded-xl text-forest-200 text-xs flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </button>
                </div>
              )}

              {/* Map */}
              {order.riderLocation && order.route && !isDone && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-semibold text-sm">Live Tracking</p>
                    <span className="glass-green text-forest-200 text-xs px-2 py-0.5 rounded-full flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-forest-400 rounded-full animate-pulse" />Live
                    </span>
                  </div>
                  <div className="h-64 rounded-2xl overflow-hidden border border-white/10">
                    <DeliveryMap3D
                      restaurantLocation={order.restaurantLocation}
                      customerLocation={order.customerLocation}
                      riderLocation={order.riderLocation}
                      route={order.route}
                      mode="customer"
                      riderName={order.driver?.name || 'Your Rider'}
                      eta={order.estimatedTime?.replace(' min','') || null}
                      progress={order.deliveryProgress}
                    />
                  </div>
                  {order.deliveryProgress > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-forest-200/50 mb-1">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Restaurant</span>
                        <span className="flex items-center gap-1">You <MapPin className="w-3 h-3 text-ember-400" /></span>
                      </div>
                      <div className="h-1.5 glass rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-forest-500 to-ember-500 transition-all duration-500 rounded-full"
                          style={{ width:`${order.deliveryProgress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Simulate button (dev helper) */}
              {!isDone && (
                <button onClick={() => simulateProgress(order.id)}
                  className="w-full glass hover:glass-orange transition-all text-forest-200 text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Simulate Next Step <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
              {isDone && (
                <button onClick={() => navigate('/restaurants')}
                  className="w-full btn-glow-orange text-white font-bold py-3 rounded-xl mt-2">
                  Order Again 🎉
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

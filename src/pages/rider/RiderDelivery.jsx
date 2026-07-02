import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRider } from '../../context/RiderContext';
import { useNotification } from '../../context/NotificationContext';
import DeliveryMap3D from '../../components/DeliveryMap3D';
import {
  Store, MapPin, Phone, Navigation, ArrowLeft,
  CheckCircle2, Package, ChevronRight, AlertTriangle
} from 'lucide-react';

const STEPS = [
  { id:'heading_to_restaurant', label:'Picking Up',   icon:Store },
  { id:'heading_to_customer',   label:'Delivering',   icon:Navigation },
  { id:'delivered',             label:'Completed',    icon:CheckCircle2 },
];

export default function RiderDelivery() {
  const { orderId }       = useParams();
  const navigate          = useNavigate();
  const { rider }         = useRider();
  const { showSuccess }   = useNotification();

  const [status, setStatus] = useState('heading_to_restaurant');

  const order = {
    id: orderId,
    restaurant:{ name:'Pizza Palace',  address:'Purok 3, Brgy. Laminusa, Bongao', phone:'+63 917 987 6543', location:{ lat:5.0250, lng:119.7700 } },
    customer:  { name:'John Doe',      address:'Purok 5, Brgy. Poblacion, Bongao', phone:'+63 917 123 4567', location:{ lat:5.0320, lng:119.7760 } },
    items:[
      { name:'Margherita Pizza', quantity:2, price:12.99 },
      { name:'Caesar Salad',     quantity:1, price:8.99  },
    ],
    total:40.76, deliveryFee:5.50,
    distance:'2.3 km', estimatedTime:'25 min',
    note:'Please ring doorbell',
  };

  const riderLoc   = { lat:5.0280, lng:119.7730 };
  const routeToRest = [riderLoc, { lat:5.0265, lng:119.7715 }, order.restaurant.location];
  const routeToCust = [order.restaurant.location, { lat:5.0285, lng:119.7730 }, order.customer.location];

  const pickUp = () => {
    setStatus('heading_to_customer');
    showSuccess('Order picked up. Head to customer.');
  };

  const deliver = () => {
    setStatus('delivered');
    showSuccess(`Order delivered! +₱${order.deliveryFee.toFixed(2)}`);
    setTimeout(() => navigate('/rider/dashboard'), 2000);
  };

  const openMaps = () => {
    const dest = status === 'heading_to_restaurant' ? order.restaurant.address : order.customer.address;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`, '_blank');
  };

  const curStepIdx  = STEPS.findIndex(s => s.id === status);
  const isDone      = status === 'delivered';
  const atRest      = status === 'heading_to_restaurant';

  return (
    <div className="space-y-4 pb-6 animate-fade-up">

      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/rider/dashboard')}
          className="w-9 h-9 glass rounded-xl flex items-center justify-center text-forest-200 hover:glass-green transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-heading font-bold text-white">Active Delivery</h1>
          <p className="text-forest-200/50 text-xs">Order #{order.id}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center">
          {STEPS.map((step, i) => {
            const Icon  = step.icon;
            const done  = i <= curStepIdx;
            const cur   = i === curStepIdx;
            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all
                    ${cur ? 'btn-glow-orange scale-110' : done ? 'btn-glow-green' : 'glass'}`}>
                    <Icon className={`w-4 h-4 ${done ? 'text-white' : 'text-forest-200/30'}`} />
                  </div>
                  <p className={`text-xs mt-1.5 font-medium ${cur ? 'text-ember-300' : done ? 'text-forest-300' : 'text-forest-200/30'}`}>
                    {step.label}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-2 mb-5 bg-white/8">
                    {done && i < curStepIdx && <div className="h-full bg-gradient-to-r from-forest-500 to-ember-500" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status action card */}
      {!isDone ? (
        <div className={`glass rounded-2xl p-4 ${atRest ? 'glass-orange' : 'glass-green'}`}>
          <div className="flex items-start gap-3 mb-4">
            <div className={`w-10 h-10 ${atRest ? 'btn-glow-orange' : 'btn-glow-green'} rounded-xl flex items-center justify-center flex-shrink-0`}>
              {atRest ? <Store className="w-5 h-5 text-white" /> : <MapPin className="w-5 h-5 text-white" />}
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">{atRest ? 'Heading to Restaurant' : 'Heading to Customer'}</p>
              <p className="text-white/70 text-sm">{atRest ? order.restaurant.name : order.customer.name}</p>
              <p className="text-white/50 text-xs mt-0.5">{atRest ? order.restaurant.address : order.customer.address}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={openMaps}
              className="flex-1 glass text-forest-100 text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:glass-green transition-all">
              <Navigation className="w-4 h-4" /> Open in Maps
            </button>
            <button onClick={() => window.open(`tel:${atRest ? order.restaurant.phone : order.customer.phone}`)}
              className="w-11 h-11 glass rounded-xl flex items-center justify-center hover:glass-green transition-all flex-shrink-0">
              <Phone className="w-4 h-4 text-forest-200" />
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-green rounded-2xl p-5 text-center">
          <CheckCircle2 className="w-10 h-10 text-forest-300 mx-auto mb-2 animate-breathe" />
          <p className="text-white font-bold text-lg">Delivery Complete!</p>
          <p className="text-forest-200/60 text-sm">You earned ₱{order.deliveryFee.toFixed(2)}</p>
        </div>
      )}

      {/* Map */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4" style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
          <p className="text-white font-semibold text-sm">
            {atRest ? 'Route to Restaurant' : 'Route to Customer'}
          </p>
        </div>
        <div style={{ height:320 }}>
          <DeliveryMap3D
            restaurantLocation={{ ...order.restaurant.location, name:order.restaurant.name }}
            customerLocation={{ ...order.customer.location, address:order.customer.address }}
            riderLocation={riderLoc}
            route={atRest ? routeToRest : routeToCust}
            mode="rider"
            riderName={rider?.name || 'You'}
            eta={order.estimatedTime.replace(' min','')}
          />
        </div>
      </div>

      {/* Pickup / Delivery details */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`glass rounded-2xl p-4 ${!atRest ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-1.5 mb-3">
            <Store className="w-3.5 h-3.5 text-ember-400" />
            <p className="text-ember-300/80 text-xs font-semibold uppercase tracking-wide">Pickup</p>
            {!atRest && (
              <span className="ml-auto glass-green text-forest-200 text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> Done
              </span>
            )}
          </div>
          <p className="text-white text-sm font-semibold">{order.restaurant.name}</p>
          <p className="text-forest-200/50 text-xs mt-1 leading-tight">{order.restaurant.address}</p>
          <p className="text-forest-200/40 text-xs mt-1">{order.restaurant.phone}</p>
        </div>

        <div className={`glass rounded-2xl p-4 ${atRest ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-1.5 mb-3">
            <MapPin className="w-3.5 h-3.5 text-forest-400" />
            <p className="text-forest-300/80 text-xs font-semibold uppercase tracking-wide">Deliver</p>
            {isDone && (
              <span className="ml-auto glass-green text-forest-200 text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> Done
              </span>
            )}
          </div>
          <p className="text-white text-sm font-semibold">{order.customer.name}</p>
          <p className="text-forest-200/50 text-xs mt-1 leading-tight">{order.customer.address}</p>
          <p className="text-forest-200/40 text-xs mt-1">{order.customer.phone}</p>
        </div>
      </div>

      {/* Order items */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-4 h-4 text-forest-300/60" />
          <p className="text-white font-semibold text-sm">Order Items</p>
        </div>
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <p className="text-forest-100/80 text-sm">{item.quantity}x {item.name}</p>
              <p className="text-forest-200/60 text-sm">₱{(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop:'1px solid rgba(255,255,255,.07)' }}>
          <p className="text-forest-200/60 text-sm">Order Total</p>
          <p className="text-white font-semibold text-sm">₱{order.total.toFixed(2)}</p>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-forest-300 text-sm font-semibold">Your Delivery Fee</p>
          <p className="text-forest-300 font-heading font-bold text-lg">₱{order.deliveryFee.toFixed(2)}</p>
        </div>
        {order.note && (
          <div className="mt-3 glass rounded-xl px-3 py-2 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-ember-400 mt-0.5 flex-shrink-0" />
            <p className="text-ember-200/80 text-xs">{order.note}</p>
          </div>
        )}
      </div>

      {/* CTA */}
      {!isDone && (
        <button onClick={atRest ? pickUp : deliver}
          className="w-full btn-glow-orange text-white font-heading font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-base">
          {atRest ? 'Mark as Picked Up' : 'Mark as Delivered'}
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Issues */}
      {!isDone && (
        <div className="glass rounded-2xl p-4">
          <p className="text-white/60 text-sm font-semibold mb-3">Having Issues?</p>
          <div className="flex gap-2 flex-wrap">
            {['Report Problem','Contact Support','Cancel Delivery'].map(label => (
              <button key={label}
                className="glass hover:glass-orange transition-all text-forest-200/70 text-xs px-3 py-2 rounded-xl">
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

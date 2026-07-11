import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Package, Clock, ShoppingBag, MapPin } from 'lucide-react';
import { ordersApi } from '../services/api';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const navigate    = useNavigate();
  const location    = useLocation();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    ordersApi.getOne(orderId)
      .then(data => setOrder(data))
      .catch(() => {
        // fallback to state passed from checkout
        const s = location.state?.orderData;
        if (s) setOrder({ id: orderId, restaurant_name: s.restaurant?.name || 'Restaurant', total: s.total });
      });
  }, [orderId]);

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-ember-400/30 border-t-ember-400 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative">
      <div className="orb w-96 h-96 bg-forest-600/20 top-[-5rem] left-[-5rem]" />
      <div className="orb w-72 h-72 bg-ember-500/10 bottom-0 right-0" />

      <div className="w-full max-w-lg relative z-10 space-y-4 animate-fade-up">
        {/* Success */}
        <div className="glass card-3d rounded-3xl p-8 text-center">
          <div className="relative inline-flex mb-4">
            <div className="w-20 h-20 btn-glow-green rounded-3xl flex items-center justify-center animate-breathe">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <div className="absolute inset-0 rounded-3xl animate-pulse-ring" style={{ background:'rgba(45,138,87,.4)' }} />
          </div>
          <h1 className="text-2xl font-heading font-bold text-white mb-2">Order Placed!</h1>
          <p className="text-forest-200/60 text-sm">Your food is on its way. Hang tight!</p>
        </div>

        {/* Details */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <p className="text-white font-semibold mb-1">Order Details</p>
          {[
            { label:'Order ID',   val:`#${order.id}`,                        icon:Package  },
            { label:'Restaurant', val:order.restaurant_name || '—',           icon:ShoppingBag },
            { label:'ETA',        val:'30-40 min',                            icon:Clock    },
            { label:'Total',      val:`₱${Number(order.total).toFixed(2)}`,   icon:null     },
          ].map(({ label, val, icon:Icon }) => (
            <div key={label} className="flex items-center justify-between py-1.5"
              style={{ borderBottom:'1px solid rgba(255,255,255,.05)' }}>
              <span className="text-forest-200/60 text-sm flex items-center gap-2">
                {Icon && <Icon className="w-4 h-4 text-forest-300/50" />}{label}
              </span>
              <span className={`font-semibold text-sm ${label==='Total' ? 'text-ember-400' : 'text-white'}`}>{val}</span>
            </div>
          ))}
        </div>

        {/* What's next */}
        <div className="glass rounded-2xl p-5">
          <p className="text-white font-semibold mb-3">What's Next?</p>
          <div className="space-y-3">
            {[
              { n:'1', text:'Restaurant is preparing your order', color:'btn-glow-green'  },
              { n:'2', text:'A rider will pick up your food',     color:'btn-glow-orange' },
              { n:'3', text:'Delivered to your door!',            color:'btn-glow-green'  },
            ].map(({ n, text, color }) => (
              <div key={n} className="flex items-center gap-3">
                <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>{n}</div>
                <p className="text-forest-200/70 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => navigate('/orders')}
            className="flex-1 py-3.5 btn-glow-green text-white font-bold rounded-2xl flex items-center justify-center gap-2">
            <MapPin className="w-4 h-4" /> Track Order
          </button>
          <button onClick={() => navigate('/')}
            className="flex-1 py-3.5 glass text-forest-100 font-semibold rounded-2xl hover:glass-green transition-all">
            Back Home
          </button>
        </div>
      </div>
    </div>
  );
}

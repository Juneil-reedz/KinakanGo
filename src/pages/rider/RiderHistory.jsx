import { useEffect, useState } from 'react';
import { riderRequest } from '../../context/RiderContext';
import { Bike, CheckCircle2, ChevronDown, Clock, Image as ImageIcon, MapPin, Package, Store, User } from 'lucide-react';

export default function RiderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openOrderId, setOpenOrderId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await riderRequest('/orders?rider_orders=true&status=delivered&limit=50');
        setOrders(res.data || res || []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-5 pb-6 animate-fade-up">
      <div>
        <p className="text-forest-200/50 text-sm">Completed trips</p>
        <h1 className="text-2xl font-heading font-bold text-white">Delivery History</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-4">
          <div className="w-9 h-9 btn-glow-green rounded-xl flex items-center justify-center mb-3">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <p className="text-white font-heading font-bold text-xl">{orders.length}</p>
          <p className="text-forest-200/50 text-xs">Completed</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="w-9 h-9 btn-glow-orange rounded-xl flex items-center justify-center mb-3">
            <Bike className="w-4 h-4 text-white" />
          </div>
          <p className="text-white font-heading font-bold text-xl">₱{orders.reduce((s, o) => s + Number(o.delivery_fee || 0), 0).toFixed(2)}</p>
          <p className="text-forest-200/50 text-xs">Delivery Fees</p>
        </div>
      </div>

      <div className="glass rounded-3xl overflow-hidden">
        <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <p className="text-white font-semibold">Completed Deliveries</p>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1,2,3].map(i => <div key={i} className="glass rounded-xl h-28 animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-14 flex flex-col items-center gap-3">
            <Package className="w-10 h-10 text-forest-300/30" />
            <p className="text-forest-200/50 text-sm">No completed deliveries yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {orders.map(order => {
              const open = openOrderId === order.id;
              return (
              <div key={order.id} className="p-4 space-y-3">
                <button onClick={() => setOpenOrderId(open ? null : order.id)} className="w-full flex items-start justify-between gap-3 text-left">
                  <div>
                    <p className="text-white font-semibold text-sm flex items-center gap-2">
                      Order #{order.id}
                      <ChevronDown className={`w-4 h-4 text-forest-200/50 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </p>
                    <p className="text-forest-200/40 text-xs flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {order.delivered_at
                        ? new Date(order.delivered_at).toLocaleString('en-PH')
                        : new Date(order.created_at).toLocaleString('en-PH')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-forest-300 font-heading font-bold">₱{Number(order.delivery_fee || 0).toFixed(2)}</p>
                    <p className="text-forest-200/40 text-xs">your fee</p>
                  </div>
                </button>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="glass rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Store className="w-3.5 h-3.5 text-ember-400" />
                      <p className="text-ember-300/80 text-xs font-semibold uppercase tracking-wide">Restaurant</p>
                    </div>
                    <p className="text-white text-sm font-semibold">{order.restaurant_name || 'Restaurant'}</p>
                    <p className="text-forest-200/50 text-xs mt-1 leading-tight">{order.restaurant_address || 'No address'}</p>
                  </div>
                  <div className="glass rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <User className="w-3.5 h-3.5 text-forest-400" />
                      <p className="text-forest-300/80 text-xs font-semibold uppercase tracking-wide">Customer</p>
                    </div>
                    <p className="text-white text-sm font-semibold">{order.customer_name || 'Customer'}</p>
                    <p className="text-forest-200/50 text-xs mt-1 leading-tight flex gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />{order.delivery_address || 'No address'}
                    </p>
                  </div>
                </div>
                {open && (
                  <div className="glass-dark rounded-2xl p-4 space-y-3 border border-white/5">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="glass rounded-xl p-3">
                        <p className="text-forest-200/45 mb-1">Order Total</p>
                        <p className="text-white font-bold">₱{Number(order.total || 0).toFixed(2)}</p>
                      </div>
                      <div className="glass rounded-xl p-3">
                        <p className="text-forest-200/45 mb-1">Status</p>
                        <p className="text-forest-300 font-bold capitalize">{order.status?.replace('_', ' ')}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="w-4 h-4 text-forest-300/70" />
                        <p className="text-white font-semibold text-sm">Proof of Delivery</p>
                      </div>
                      {order.delivery_proof_image ? (
                        <a href={order.delivery_proof_image} target="_blank" rel="noreferrer">
                          <img src={order.delivery_proof_image} alt={`Proof for order ${order.id}`} className="w-full max-h-80 object-cover rounded-xl border border-white/10" />
                        </a>
                      ) : (
                        <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                          <ImageIcon className="w-8 h-8 text-forest-300/25 mx-auto mb-2" />
                          <p className="text-forest-200/45 text-sm">No proof image saved for this delivery</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

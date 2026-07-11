import { useState, useEffect, useCallback } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useNotification } from '../../context/NotificationContext';
import { ordersApi } from '../../services/api';
import { Package, Search, MapPin, Clock, Check, X, AlertTriangle, ChevronDown, ChevronUp, User, Phone, Smartphone, ImageIcon } from 'lucide-react';

const STATUS_STYLE = {
  pending:   'glass-orange text-ember-200',
  preparing: 'glass text-forest-100',
  ready:     'btn-glow-green text-white',
  completed: 'glass-green text-forest-200',
  delivered: 'glass-green text-forest-200',
  cancelled: 'bg-red-500/20 text-red-300',
  rejected:  'bg-red-500/20 text-red-300',
};

export default function RestaurantOrders() {
  const { restaurant }               = useRestaurant();
  const { addNotification }          = useNotification();
  const [orders, setOrders]          = useState([]);
  const [loading, setLoading]        = useState(true);
  const [filter, setFilter]          = useState('all');
  const [search, setSearch]          = useState('');
  const [expanded, setExpanded]      = useState(null);
  const [itemsMap, setItemsMap]      = useState({});   // orderId -> items[]
  const [rejectId, setRejectId]      = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    if (!restaurant?.id) return;
    try {
      setLoading(true);
      const res = await ordersApi.list({ restaurant_id: restaurant.id, limit: 200 });
      setOrders(res.data || res || []);
    } catch {
      addNotification('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [restaurant?.id]);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = async (orderId) => {
    if (expanded === orderId) { setExpanded(null); return; }
    setExpanded(orderId);
    if (itemsMap[orderId]) return;
    try {
      const full = await ordersApi.getOne(orderId);
      setItemsMap(p => ({ ...p, [orderId]: full.items || [] }));
    } catch { /* show empty items */ }
  };

  const filtered = orders.filter(o => {
    const matchStatus = filter === 'all' || o.status === filter;
    const matchSearch = !search ||
      String(o.id).includes(search) ||
      (o.customer_name || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const advance = async (id, nextStatus, msg) => {
    try {
      await ordersApi.updateStatus(id, nextStatus);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: nextStatus } : o));
      addNotification(msg, 'success');
    } catch {
      addNotification('Failed to update order status', 'error');
    }
  };

  const reject = async () => {
    if (!rejectReason.trim()) return;
    try {
      await ordersApi.updateStatus(rejectId, 'cancelled', { cancelledReason: rejectReason });
      setOrders(prev => prev.map(o => o.id === rejectId ? { ...o, status: 'cancelled' } : o));
      addNotification('Order rejected.', 'success');
      setRejectId(null); setRejectReason('');
    } catch {
      addNotification('Failed to reject order', 'error');
    }
  };

  const FILTERS = [
    { key: 'all',       label: 'All' },
    { key: 'pending',   label: 'Pending' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'ready',     label: 'Ready' },
    { key: 'delivered', label: 'Delivered' },
  ];

  return (
    <div className="space-y-4 pb-6 animate-fade-up">
      <div>
        <p className="text-forest-200/50 text-sm">Manage</p>
        <h1 className="text-2xl font-heading font-bold text-white">Orders</h1>
      </div>

      {/* Search + filters */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/50" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by order ID or customer name…"
            className="w-full input-glass pl-9 py-2.5 text-sm" />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all
                ${filter === f.key ? 'btn-glow-orange text-white' : 'glass text-forest-200/60 hover:text-forest-100'}`}>
              {f.label}
              <span className="ml-1.5 opacity-60 text-xs">
                ({f.key === 'all' ? orders.length : orders.filter(o => o.status === f.key).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="glass rounded-2xl h-20 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl py-14 flex flex-col items-center gap-3">
          <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center">
            <Package className="w-7 h-7 text-forest-300/40" />
          </div>
          <p className="text-white font-semibold">No orders yet</p>
          <p className="text-forest-200/50 text-sm">Orders from customers will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const isOpen   = expanded === order.id;
            const items    = itemsMap[order.id] || [];
            const total    = order.total || 0;
            const customer = order.customer_name || 'Customer';

            return (
              <div key={order.id} className="glass rounded-2xl overflow-hidden">
                {/* Header row */}
                <button className="w-full p-4 flex items-start gap-3 hover:glass-green transition-all text-left"
                  onClick={() => toggleExpand(order.id)}>
                  <div className="w-10 h-10 btn-glow-orange rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    #{order.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-white font-semibold text-sm">Order #{order.id}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[order.status] || 'glass text-forest-200/60'}`}>
                        {(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${order.payment_method === 'gcash' ? 'glass text-teal-300' : 'glass text-forest-200/60'}`}>
                        {order.payment_method === 'gcash' ? 'GCash' : 'Cash'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-forest-200/50">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{customer}</span>
                      {order.created_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(order.created_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="text-ember-400 font-heading font-bold">₱{Number(total).toFixed(2)}</p>
                    {isOpen
                      ? <ChevronUp className="w-4 h-4 text-forest-200/40" />
                      : <ChevronDown className="w-4 h-4 text-forest-200/40" />}
                  </div>
                </button>

                {/* Expanded */}
                {isOpen && (
                  <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,.07)' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">

                      {/* Items */}
                      <div className="glass rounded-xl p-3">
                        <p className="text-forest-200/50 text-xs font-semibold uppercase tracking-wide mb-2">Items Ordered</p>
                        {items.length === 0 ? (
                          <div className="flex items-center gap-2 py-2">
                            <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                            <span className="text-forest-200/40 text-xs">Loading items…</span>
                          </div>
                        ) : items.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 py-1.5"
                            style={{ borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                            <div className="w-10 h-10 glass rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {item.image_url
                                ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                : <ImageIcon className="w-4 h-4 text-forest-300/30" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-xs font-semibold truncate">{item.quantity}× {item.name}</p>
                              {item.notes && <p className="text-ember-300/70 text-xs">Note: {item.notes}</p>}
                            </div>
                            <p className="text-forest-200/60 text-xs flex-shrink-0">
                              ₱{(Number(item.price) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Delivery + payment */}
                      <div className="glass rounded-xl p-3 space-y-2">
                        <p className="text-forest-200/50 text-xs font-semibold uppercase tracking-wide mb-2">Delivery Info</p>
                        {order.delivery_address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-forest-400 flex-shrink-0 mt-0.5" />
                            <p className="text-forest-100/70 text-xs">{order.delivery_address}</p>
                          </div>
                        )}
                        {order.customer_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-forest-400 flex-shrink-0" />
                            <p className="text-forest-100/70 text-xs">{order.customer_phone}</p>
                          </div>
                        )}
                        {order.special_instructions && (
                          <div className="flex items-start gap-2 glass-orange rounded-lg px-2 py-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-ember-400 flex-shrink-0 mt-0.5" />
                            <p className="text-ember-200/80 text-xs">{order.special_instructions}</p>
                          </div>
                        )}

                        {/* Payment proof */}
                        {order.payment_method === 'gcash' && (
                          <div className="pt-1 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,.07)' }}>
                            <div className="flex items-center gap-1.5">
                              <Smartphone className="w-3.5 h-3.5 text-teal-400" />
                              <p className="text-teal-300 text-xs font-semibold">GCash Payment</p>
                            </div>
                            {order.proof_image ? (
                              <img src={order.proof_image} alt="Payment proof"
                                className="w-full rounded-lg object-contain max-h-40 glass" />
                            ) : (
                              <p className="text-forest-200/40 text-xs">No proof uploaded</p>
                            )}
                          </div>
                        )}

                        {/* Totals */}
                        <div className="space-y-1 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,.07)' }}>
                          {[
                            ['Subtotal',  order.subtotal],
                            ['Delivery',  order.delivery_fee],
                            ['Tax',       order.tax],
                          ].filter(([, v]) => v != null).map(([l, v]) => (
                            <div key={l} className="flex justify-between text-xs text-forest-200/50">
                              <span>{l}</span><span>₱{Number(v).toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm font-bold text-white pt-1">
                            <span>Total</span>
                            <span className="text-ember-400">₱{Number(total).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      {order.status === 'pending' && (
                        <>
                          <button onClick={() => advance(order.id, 'preparing', 'Order accepted!')}
                            className="flex-1 btn-glow-green text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                            <Check className="w-4 h-4" /> Accept Order
                          </button>
                          <button onClick={() => setRejectId(order.id)}
                            className="w-10 h-10 glass hover:glass-orange transition-all rounded-xl flex items-center justify-center flex-shrink-0">
                            <X className="w-4 h-4 text-red-400" />
                          </button>
                        </>
                      )}
                      {order.status === 'preparing' && (
                        <button onClick={() => advance(order.id, 'ready', 'Order is ready for pickup!')}
                          className="flex-1 btn-glow-green text-white text-sm font-semibold py-2.5 rounded-xl">
                          Mark Ready for Pickup
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button onClick={() => advance(order.id, 'delivered', 'Order delivered!')}
                          className="flex-1 btn-glow-orange text-white text-sm font-semibold py-2.5 rounded-xl">
                          Mark as Delivered
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-3xl p-6 w-full max-w-sm">
            <p className="text-white font-semibold mb-1">Reject Order #{rejectId}</p>
            <p className="text-forest-200/50 text-sm mb-4">Please provide a reason for rejection.</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              className="w-full input-glass py-3 text-sm h-24 resize-none mb-4"
              placeholder="e.g., Item out of stock, Too busy…" />
            <div className="flex gap-2">
              <button onClick={() => { setRejectId(null); setRejectReason(''); }}
                className="flex-1 glass hover:glass-green transition-all text-forest-200 text-sm font-medium py-2.5 rounded-xl">
                Cancel
              </button>
              <button onClick={reject} disabled={!rejectReason.trim()}
                className="flex-1 bg-red-500/80 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-all">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

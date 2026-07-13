import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { restaurantRequest, useRestaurant } from '../../context/RestaurantContext';
import { useNotification } from '../../context/NotificationContext';
import {
  Package, Search, MapPin, Clock, Check, X, AlertTriangle,
  User, Phone, Smartphone, ImageIcon, RefreshCw, ChevronRight, Bike,
} from 'lucide-react';

const STATUS_STYLE = {
  pending:   { cls: 'glass-orange text-ember-200',        label: 'Pending'   },
  preparing: { cls: 'glass text-forest-100',              label: 'Preparing' },
  ready:     { cls: 'btn-glow-green text-white',          label: 'Ready'     },
  picked_up: { cls: 'glass-orange text-ember-200',        label: 'Picked Up' },
  delivered: { cls: 'glass-green text-forest-200',        label: 'Delivered' },
  cancelled: { cls: 'bg-red-500/20 text-red-300',         label: 'Cancelled' },
};

function statusStyle(s) {
  return STATUS_STYLE[s] || { cls: 'glass text-forest-200/60', label: s || 'Unknown' };
}

export default function RestaurantOrders() {
  const { restaurant }              = useRestaurant();
  const { addNotification }         = useNotification();
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [detail, setDetail]         = useState(null);   // full order in modal
  const [detailLoading, setDetailLoading] = useState(false);
  const [rejectReason, setRejectReason]   = useState('');
  const [rejecting, setRejecting]         = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!restaurant?.id) return;
    try {
      if (!silent) setLoading(true);
      const res = await restaurantRequest(`/orders?${new URLSearchParams({ restaurant_id: restaurant.id, limit: 200 })}`);
      setOrders(res.data || res || []);
    } catch {
      if (!silent) addNotification('Failed to load orders', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [restaurant?.id]);

  useEffect(() => {
    load();
    // Poll every 10 s so rider assignment shows up automatically
    const t = setInterval(() => load(true), 10000);
    return () => clearInterval(t);
  }, [load]);

  const openDetail = async (order) => {
    setDetail({ ...order, items: [] });
    setDetailLoading(true);
    try {
      const full = await restaurantRequest(`/orders/${order.id}`);
      // Merge so list-level fields (customer_name etc) fill in if getOne misses them
      setDetail(prev => ({ ...prev, ...full, items: full.items || [] }));
    } catch (err) {
      addNotification(`Could not load full order details: ${err?.message || 'unknown error'}`, 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => { setDetail(null); setRejectReason(''); setRejecting(false); };

  const advance = async (id, nextStatus, msg) => {
    try {
      await restaurantRequest(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: nextStatus } : o));
      if (detail?.id === id) setDetail(d => ({ ...d, status: nextStatus }));
      addNotification(msg, 'success');
    } catch {
      addNotification('Failed to update status', 'error');
    }
  };

  const reject = async () => {
    if (!rejectReason.trim() || !detail) return;
    try {
      await restaurantRequest(`/orders/${detail.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled', cancelledReason: rejectReason }) });
      setOrders(prev => prev.map(o => o.id === detail.id ? { ...o, status: 'cancelled' } : o));
      setDetail(d => ({ ...d, status: 'cancelled' }));
      addNotification('Order rejected.', 'success');
      setRejecting(false); setRejectReason('');
    } catch {
      addNotification('Failed to reject order', 'error');
    }
  };

  const FILTERS = [
    { key: 'all',       label: 'All' },
    { key: 'pending',   label: 'Pending' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'ready',     label: 'Ready' },
    { key: 'picked_up', label: 'Picked Up' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const filtered = orders.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return String(o.id).includes(q) || (o.customer_name || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-forest-200/50 text-sm">Manage</p>
          <h1 className="text-2xl font-heading font-bold text-white">Orders</h1>
        </div>
        <button onClick={load}
          className="w-9 h-9 glass rounded-xl flex items-center justify-center hover:glass-green transition-all">
          <RefreshCw className="w-4 h-4 text-forest-200/60" />
        </button>
      </div>

      {/* Search + filters */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/50" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by order ID or customer…"
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

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="glass rounded-2xl h-36 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl py-16 flex flex-col items-center gap-3">
          <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center">
            <Package className="w-7 h-7 text-forest-300/40" />
          </div>
          <p className="text-white font-semibold">No orders found</p>
          <p className="text-forest-200/50 text-sm">Orders from customers will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(order => {
            const { cls, label } = statusStyle(order.status);
            return (
              <button key={order.id} onClick={() => openDetail(order)}
                className="glass rounded-2xl p-4 text-left hover:glass-green transition-all group">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 btn-glow-orange rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      #{order.id}
                    </div>
                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>
                    </div>
                  </div>
                  <p className="text-ember-400 font-heading font-bold text-sm">₱{Number(order.total).toFixed(2)}</p>
                </div>

                {/* Customer */}
                <div className="flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-forest-300/50 flex-shrink-0" />
                  <p className="text-white text-sm font-medium truncate">{order.customer_name || 'Customer'}</p>
                </div>

                {/* Rider badge — shown when assigned */}
                {order.rider_id && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <Bike className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                    <p className="text-teal-300 text-xs font-medium truncate">
                      {order.rider_name || 'Rider assigned'}
                    </p>
                  </div>
                )}

                {/* Time + payment */}
                <div className="flex items-center gap-3 text-xs text-forest-200/40 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {order.created_at ? new Date(order.created_at).toLocaleString() : '—'}
                  </span>
                </div>

                {/* Payment badge */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${order.payment_method === 'gcash' ? 'glass text-teal-300' : 'glass text-forest-200/60'}`}>
                    {order.payment_method === 'gcash' ? 'GCash' : 'Cash on Delivery'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-forest-300/30 group-hover:text-forest-300/70 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {detail && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)',
          overflowY: 'auto',
        }} onClick={closeDetail}>
          <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
            <div className="glass w-full max-w-2xl rounded-3xl overflow-hidden animate-fade-up"
              style={{ maxHeight: '90vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}>

              {/* Modal header */}
              <div className="p-5 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 btn-glow-orange rounded-xl flex items-center justify-center text-white font-bold text-sm">
                    #{detail.id}
                  </div>
                  <div>
                    <p className="text-white font-heading font-bold">Order #{detail.id}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle(detail.status).cls}`}>
                      {statusStyle(detail.status).label}
                    </span>
                  </div>
                </div>
                <button onClick={closeDetail}
                  className="w-8 h-8 glass rounded-full flex items-center justify-center hover:glass-orange transition-all">
                  <X className="w-4 h-4 text-forest-200" />
                </button>
              </div>

              <div className="p-5 space-y-4">

                {/* Customer card */}
                <div className="glass rounded-2xl p-4">
                  <p className="text-forest-200/50 text-xs font-semibold uppercase tracking-wide mb-3">Customer &amp; Delivery</p>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-forest-400 flex-shrink-0" />
                      <p className="text-white text-sm font-medium">{detail.customer_name || 'Customer'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-forest-400 flex-shrink-0" />
                      <p className="text-forest-100/70 text-sm">{detail.customer_phone || '—'}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-forest-400 flex-shrink-0 mt-0.5" />
                      <p className="text-forest-100/70 text-sm">{detail.delivery_address || '—'}</p>
                    </div>
                    {detail.special_instructions && (
                      <div className="flex items-start gap-2 glass-orange rounded-xl p-2.5 mt-1">
                        <AlertTriangle className="w-4 h-4 text-ember-400 flex-shrink-0 mt-0.5" />
                        <p className="text-ember-200/80 text-sm">{detail.special_instructions}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rider card — only when a rider is assigned */}
                {detail.rider_id && (
                  <div className="glass rounded-2xl p-4">
                    <p className="text-forest-200/50 text-xs font-semibold uppercase tracking-wide mb-3">Assigned Rider</p>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Bike className="w-4 h-4 text-teal-400 flex-shrink-0" />
                        <p className="text-white text-sm font-medium">{detail.rider_name || 'Rider #' + detail.rider_id}</p>
                      </div>
                      {detail.rider_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-teal-400 flex-shrink-0" />
                          <p className="text-forest-100/70 text-sm">{detail.rider_phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(detail.status === 'delivered' || detail.delivery_proof_image) && (
                  <div className="glass rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ImageIcon className="w-4 h-4 text-forest-300/70" />
                      <p className="text-white font-semibold text-sm">Rider Proof of Delivery</p>
                    </div>
                    {detail.delivered_at && (
                      <p className="text-forest-200/45 text-xs mb-2">
                        Delivered {new Date(detail.delivered_at).toLocaleString('en-PH')}
                      </p>
                    )}
                    {detail.delivery_proof_image ? (
                      <a href={detail.delivery_proof_image} target="_blank" rel="noreferrer">
                        <img src={detail.delivery_proof_image} alt={`Proof for order ${detail.id}`}
                          className="w-full rounded-xl object-cover max-h-80 border border-white/10" />
                      </a>
                    ) : (
                      <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                        <ImageIcon className="w-8 h-8 text-forest-300/25 mx-auto mb-2" />
                        <p className="text-forest-200/45 text-sm">No proof image saved for this delivery</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Items card */}
                <div className="glass rounded-2xl p-4">
                  <p className="text-forest-200/50 text-xs font-semibold uppercase tracking-wide mb-3">Items Ordered</p>
                  {detailLoading ? (
                    <div className="flex items-center gap-3 py-4">
                      <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin flex-shrink-0" />
                      <p className="text-forest-200/50 text-sm">Loading items…</p>
                    </div>
                  ) : (detail.items || []).length === 0 ? (
                    <p className="text-forest-200/40 text-sm py-2">No item details available</p>
                  ) : (
                    <div className="space-y-2">
                      {(detail.items || []).map((item, i) => (
                        <div key={i} className="flex items-center gap-3 py-2"
                          style={{ borderBottom: i < detail.items.length - 1 ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
                          <div className="w-12 h-12 glass rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {item.image_url
                              ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                              : <ImageIcon className="w-5 h-5 text-forest-300/30" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                            <p className="text-forest-200/50 text-xs">Qty: {item.quantity}</p>
                            {item.notes && <p className="text-ember-300/70 text-xs mt-0.5">Note: {item.notes}</p>}
                          </div>
                          <p className="text-ember-400 font-semibold text-sm flex-shrink-0">
                            ₱{(Number(item.price) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment + totals card */}
                <div className="glass rounded-2xl p-4">
                  <p className="text-forest-200/50 text-xs font-semibold uppercase tracking-wide mb-3">Payment</p>
                  <div className="flex items-center gap-2 mb-3">
                    {detail.payment_method === 'gcash'
                      ? <Smartphone className="w-4 h-4 text-teal-400" />
                      : <Package className="w-4 h-4 text-forest-400" />}
                    <p className="text-white text-sm font-medium">
                      {detail.payment_method === 'gcash' ? 'GCash' : 'Cash on Delivery'}
                    </p>
                  </div>

                  {detail.payment_method === 'gcash' && (
                    <div className="mb-3 space-y-1.5">
                      <p className="text-forest-200/50 text-xs font-semibold uppercase tracking-wide">Payment Screenshot</p>
                      {detailLoading ? (
                        <div className="h-16 glass rounded-xl flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                        </div>
                      ) : detail.proof_image ? (
                        <img src={detail.proof_image} alt="Payment proof"
                          className="w-full rounded-xl object-contain max-h-56 glass" />
                      ) : (
                        <div className="h-16 glass rounded-xl flex items-center justify-center">
                          <p className="text-forest-200/40 text-xs">No screenshot uploaded</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5" style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: '0.75rem' }}>
                    {[
                      ['Subtotal',  detail.subtotal],
                      ['Delivery',  detail.delivery_fee],
                      ['Tax',       detail.tax],
                    ].filter(([, v]) => v != null).map(([l, v]) => (
                      <div key={l} className="flex justify-between text-sm text-forest-200/50">
                        <span>{l}</span><span>₱{Number(v).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-1" style={{ borderTop: '1px solid rgba(255,255,255,.07)' }}>
                      <span className="text-white font-bold">Total</span>
                      <span className="text-ember-400 font-heading font-bold text-lg">₱{Number(detail.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                {!rejecting ? (
                  <div className="flex gap-2">
                    {detail.status === 'pending' && (
                      <>
                        <button onClick={() => advance(detail.id, 'preparing', 'Order accepted!')}
                          className="flex-1 btn-glow-green text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2">
                          <Check className="w-4 h-4" /> Accept Order
                        </button>
                        <button onClick={() => setRejecting(true)}
                          className="w-12 glass hover:glass-orange transition-all rounded-2xl flex items-center justify-center flex-shrink-0">
                          <X className="w-4 h-4 text-red-400" />
                        </button>
                      </>
                    )}
                    {detail.status === 'preparing' && (
                      <button onClick={() => advance(detail.id, 'ready', 'Order is ready for pickup!')}
                        className="flex-1 btn-glow-green text-white font-bold py-3 rounded-2xl">
                        Mark Ready for Pickup
                      </button>
                    )}
                    {detail.status === 'ready' && (
                      <div className="flex-1 glass-orange rounded-2xl p-3 text-center">
                        <p className="text-ember-100 text-sm font-semibold">Waiting for rider pickup and delivery proof</p>
                        <p className="text-ember-200/70 text-xs mt-0.5">The rider must upload proof before marking this delivered.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="glass rounded-2xl p-4 space-y-3">
                    <p className="text-white font-semibold text-sm">Reason for rejection</p>
                    <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                      className="w-full input-glass py-2.5 text-sm h-20 resize-none"
                      placeholder="e.g., Item out of stock, Too busy…" />
                    <div className="flex gap-2">
                      <button onClick={() => { setRejecting(false); setRejectReason(''); }}
                        className="flex-1 glass hover:glass-green text-forest-200 text-sm font-medium py-2.5 rounded-xl transition-all">
                        Cancel
                      </button>
                      <button onClick={reject} disabled={!rejectReason.trim()}
                        className="flex-1 bg-red-500/80 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-all">
                        Confirm Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

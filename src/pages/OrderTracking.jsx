import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ordersApi, storage } from '../services/api';
import CancelOrderDialog from '../components/CancelOrderDialog';
import OrderTracker from '../components/OrderTracker';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { useDialog } from '../context/DialogContext';
import {
  Clock, Package, ChevronRight, ChevronDown,
  ClipboardList, ChefHat, PackageCheck, Bike, CheckCircle2,
  Store, RefreshCw, UtensilsCrossed, MapPin, Star, Receipt, RotateCcw,
} from 'lucide-react';

const ORDER_LIVE_MS = 10000;

const STATUSES = [
  { id:'pending',    label:'Placed',    icon:ClipboardList, desc:'Order received by restaurant' },
  { id:'accepted',   label:'Accepted',  icon:ClipboardList, desc:'Restaurant accepted your order' },
  { id:'preparing',  label:'Cooking',   icon:ChefHat,       desc:'Restaurant is preparing your food' },
  { id:'ready',      label:'Ready',     icon:PackageCheck,  desc:'Food is ready for pickup' },
  { id:'picked_up',  label:'On the Way', icon:Bike,         desc:'Rider is on the way to you' },
  { id:'delivered',  label:'Delivered', icon:CheckCircle2,  desc:'Order successfully delivered' },
];

// Status tabs: each order sits in exactly one
const TABS = [
  { id: 'pending',   label: 'Pending',    has: ['pending'] },
  { id: 'preparing', label: 'Preparing',  has: ['accepted', 'preparing', 'ready'] },
  { id: 'on_way',    label: 'On the way', has: ['picked_up'] },
  { id: 'delivered', label: 'Delivered',  has: ['delivered'] },
  { id: 'cancelled', label: 'Cancelled',  has: ['cancelled', 'refunded'] },
];
const tabOf = (o) => (TABS.find(t => t.has.includes(o.status)) || TABS[0]).id;

const isActiveOrder = (o) => !['delivered', 'cancelled', 'refunded'].includes(o.status);

// One section per restaurant, like the cart, newest restaurant first
function groupByRestaurant(orders) {
  const groups = [];
  for (const o of orders) {
    const id = o.restaurant_id ?? o.restaurant_name ?? 'other';
    let g = groups.find(x => x.id === id);
    if (!g) groups.push(g = { id, name: o.restaurant_name || 'Restaurant', orders: [] });
    g.orders.push(o);
  }
  return groups;
}

export default function OrderTracking() {
  const navigate = useNavigate();
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLiveAt, setLastLiveAt] = useState(null);
  const [cancelOrder, setCancelOrder] = useState(null);
  const [tab, setTab] = useState(null); // null: the first tab that has orders
  // Orders show as a compact list; tapping one opens its progress, map and items.
  // /orders?order=27 opens that one straight away.
  const [params] = useSearchParams();
  const [openIds, setOpenIds] = useState(() => new Set([parseInt(params.get('order'))].filter(Boolean)));
  const toggleOpen = (id) => setOpenIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  // Full-screen tracker for one order (?track=27 opens it straight away)
  const [trackId, setTrackId] = useState(() => parseInt(params.get('track')) || null);
  const { addToCart, clearCart } = useCart();
  const { addNotification } = useNotification();
  const ask = useDialog();
  const handleReorder = async (order) => {
    if (!(await ask({ title: `Reorder from ${order.restaurant_name}?`, confirmLabel: 'Reorder' }))) return;
    if (!order.restaurant_id) { addNotification('Restaurant details are missing for this order', 'error'); return; }
    const items = order.items || [];
    if (!items.length) { addNotification('No items found for this order', 'error'); return; }
    clearCart(order.restaurant_id); // start this restaurant's food over; other restaurants stay
    const restaurant = { id: order.restaurant_id, name: order.restaurant_name };
    items.forEach(item => addToCart({
      id: item.menu_item_id || item.item_id || item.id, name: item.name, price: Number(item.price),
      quantity: item.quantity, image_url: item.image_url, notes: item.notes,
    }, restaurant));
    addNotification('Previous order added to cart', 'success');
    navigate('/cart');
  };
  const detailsRef = useRef({}); // { [orderId]: { key, data } } — cached getOne results

  const fetchOrders = async (silent = false) => {
    if (!storage.getAccess()) { setLoading(false); return; }
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await ordersApi.list({ limit: 20 });
      const list = res?.data ?? [];
      // Every order still on its way, then the last few finished ones, so earlier
      // orders don't vanish from the page while a newer one is active
      const active = list.filter(isActiveOrder);
      const base   = [...active, ...list.filter(o => !isActiveOrder(o))];

      // Only refetch an order's details when it's new or its status/rider changed;
      // the list response already carries the fields that change while polling.
      const detailKey = (o) => `${o.status}|${o.rider_id ?? ''}`;
      const stale = base.filter(o => detailsRef.current[o.id]?.key !== detailKey(o));
      const detailed = await Promise.allSettled(stale.map(o => ordersApi.getOne(o.id)));
      stale.forEach((o, i) => {
        if (detailed[i].status === 'fulfilled') {
          detailsRef.current[o.id] = { key: detailKey(o), data: detailed[i].value };
        }
      });
      const merged = base.map(o => {
        const full = detailsRef.current[o.id]?.data ?? {};
        return { ...full, ...o, items: full.items ?? [] };
      });
      setOrders(merged);
      setLastLiveAt(new Date());

    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') fetchOrders(true);
    }, ORDER_LIVE_MS);
    const onFocus = () => fetchOrders(true);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchOrders(true);
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(t);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const getStatusIdx = (s) => STATUSES.findIndex(st => st.id === s);
  const displayStatus = (status) => {
    if (status === 'picked_up') return 'On the Way';
    return status.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase());
  };

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
        <p className="text-white font-bold text-lg mb-2">No orders yet</p>
        <p className="text-forest-200/50 text-sm mb-6">Place an order to track it here.</p>
        <button onClick={() => navigate('/restaurants')} className="btn-glow-orange text-white px-8 py-3 rounded-xl font-bold">
          Order Now
        </button>
      </div>
    </div>
  );

  // Open the first tab that has orders, unless the customer picked one
  // (a link to one order opens that order's tab)
  const linked = orders.find(o => String(o.id) === params.get('order'));
  const currentTab = tab || (linked && tabOf(linked)) || (TABS.find(t => orders.some(o => tabOf(o) === t.id)) || TABS[0]).id;
  const tabOrders  = orders.filter(o => tabOf(o) === currentTab);

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-white">Orders</h1>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 glass-green text-forest-200 text-xs px-3 py-2 rounded-xl whitespace-nowrap flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-400 animate-pulse" />
            Live{lastLiveAt ? ` · ${lastLiveAt.toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit' })}` : ''}
          </div>
          <button onClick={() => fetchOrders(true)} disabled={refreshing}
            className="glass hover:glass-green transition-all px-3 py-2 rounded-xl text-forest-200 text-sm flex items-center gap-1.5">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="-mx-4 px-4 flex gap-2 overflow-x-auto scrollbar-hide" role="tablist" aria-label="Order status">
        {TABS.map(t => {
          const n = orders.filter(o => tabOf(o) === t.id).length;
          const on = t.id === currentTab;
          return (
            <button key={t.id} role="tab" aria-selected={on} onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-all ${
                on ? 'bg-ember-500 text-white shadow-[0_8px_20px_-8px_rgb(247_147_30_/_.8)]' : 'glass text-forest-200/70 hover:text-white'}`}>
              {t.label}
              <span className={`min-w-[1.25rem] h-5 px-1 rounded-full text-[11px] flex items-center justify-center ${on ? 'bg-white/25' : 'bg-white/10'}`}>{n}</span>
            </button>
          );
        })}
      </div>

      {!tabOrders.length && (
        <div className="glass rounded-3xl py-10 px-6 text-center">
          <Package className="w-10 h-10 text-forest-300/30 mx-auto mb-2" />
          <p className="text-forest-200/60 text-sm">No {TABS.find(t => t.id === currentTab)?.label.toLowerCase()} orders.</p>
        </div>
      )}

      {[['', tabOrders]].filter(([, list]) => list.length).map(([title, list]) => (
      <div key={title || 'list'} className="space-y-6">
      {groupByRestaurant(list).map(g => (
      <section key={g.id} className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full glass-orange flex items-center justify-center flex-shrink-0">
            <Store className="w-4 h-4 text-ember-300" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-white font-heading font-bold truncate">{g.name}</span>
            <span className="block text-forest-200/60 text-xs">{g.orders.length} order{g.orders.length === 1 ? '' : 's'}</span>
          </span>
        </div>
      {g.orders.map((order) => {
        const curIdx = Math.max(0, getStatusIdx(order.status));
        const isDone = order.status === 'delivered';
        const isCancelled = ['cancelled','refunded'].includes(order.status);
        const isOpen = openIds.has(order.id);

        return (
          <div key={order.id} className={`cart-line ${isOpen ? 'is-picked' : ''} relative ml-11`}>

            {/* Order row, shaped like a cart line: round photo off the left edge. Tap to open. */}
            <div role="button" tabIndex={0} aria-expanded={isOpen} aria-controls={`order-body-${order.id}`}
              onClick={() => toggleOpen(order.id)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleOpen(order.id); } }}
              className="relative min-h-[7rem] py-3.5 pr-4 pl-[4.25rem] cursor-pointer select-none">
              {/* Order number badge: a ring that fills as the order moves along */}
              {(() => {
                const pct = isCancelled ? 100 : Math.max(6, (curIdx / (STATUSES.length - 1)) * 100);
                const Icon = isCancelled ? Package : (STATUSES[curIdx]?.icon ?? Package);
                return (
                  <div className={`order-badge ${isCancelled ? 'is-cancelled' : isDone ? 'is-done' : ''}`}
                    style={{ '--pct': `${pct}%` }} aria-label={`Order number ${order.id}`}>
                    <div className="order-badge-core">
                      <span className="order-badge-label">Order</span>
                      <span className="order-badge-num" style={String(order.id).length > 4 ? { fontSize: `${Math.max(0.9, 1.55 - (String(order.id).length - 4) * 0.22)}rem` } : undefined}><span className="order-badge-hash">#</span>{order.id}</span>
                    </div>
                    <span className="order-badge-icon" aria-hidden="true"><Icon className="w-3.5 h-3.5" /></span>
                  </div>
                );
              })()}
              <div className="flex items-start justify-between gap-2">
                <p className="text-white font-heading font-bold text-[.95rem] truncate">
                  {(() => { const n = (order.items || []).reduce((t, i) => t + Number(i.quantity || 0), 0); return n ? `${n} item${n === 1 ? '' : 's'}` : 'Your order'; })()}
                </p>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                  isDone ? 'glass-green text-forest-200' : isCancelled ? 'text-red-300 glass' : 'glass-orange text-ember-200'}`}>
                  {displayStatus(order.status)}
                </span>
              </div>
              <p className="text-forest-200/60 text-xs mt-0.5 truncate">
                Placed {new Date(order.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </p>
              <div className="flex items-end justify-between gap-2 mt-1.5">
                <div className="min-w-0">
                  {Number(order.credit_used) > 0 ? (
                    <>
                      <p className="text-white font-heading font-extrabold"><span className="text-ember-500 text-sm mr-0.5">₱</span>{Math.max(0, Number(order.total) - Number(order.credit_used)).toFixed(2)}</p>
                      <p className="text-forest-200/50 text-[11px]">to pay · ₱{Number(order.credit_used).toFixed(2)} credit used</p>
                    </>
                  ) : (
                    <p className="text-white font-heading font-extrabold"><span className="text-ember-500 text-sm mr-0.5">₱</span>{Number(order.total).toFixed(2)}</p>
                  )}
                  {!isDone && !isCancelled && order.estimated_delivery && (
                    <p className="text-forest-200/60 text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      ETA {new Date(order.estimated_delivery).toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit' })}
                    </p>
                  )}
                </div>
                <span className="text-forest-300 text-xs font-semibold flex items-center gap-0.5 flex-shrink-0">
                  {isOpen ? 'Hide' : 'Details'}
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </span>
              </div>
              {!isCancelled && (
                <div className="mt-2 h-1.5 rounded-full clay-sunk overflow-hidden" aria-hidden="true">
                  <div className="h-full rounded-full bg-gradient-to-r from-forest-500 to-ember-500 transition-all duration-700"
                    style={{ width:`${Math.max(8, (curIdx / (STATUSES.length - 1)) * 100)}%` }} />
                </div>
              )}
            </div>

            {/* Details open inside the same card, under the order */}
            {isOpen && (<div id={`order-body-${order.id}`} className="order-card-body animate-fade-up">

            {order.status === 'pending' && (
              <div className="px-5 pt-4 flex items-center justify-between gap-3">
                <p className="text-forest-200/60 text-xs">Waiting for the restaurant to accept. You can still cancel.</p>
                <button onClick={() => setCancelOrder(order)}
                  className="glass hover:bg-red-500/20 transition-all text-red-300 text-xs font-semibold px-3 py-2 rounded-xl flex-shrink-0">
                  Cancel order
                </button>
              </div>
            )}

            {/* Tracking: opens the full-screen tracker with the map */}
            {!isCancelled && (() => {
              const Icon = STATUSES[curIdx]?.icon ?? Package;
              return (
                <div className="px-5 pt-4 pb-4">
                  <button onClick={() => setTrackId(order.id)}
                    className="track-btn w-full flex items-center gap-3 text-left">
                    <span className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDone ? 'btn-glow-green' : 'btn-glow-orange'}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-white text-sm font-heading font-bold">{isDone ? 'Delivery details' : 'Track order'}</span>
                      <span className="block text-forest-200/60 text-xs truncate">{STATUSES[curIdx]?.desc}</span>
                    </span>
                    {!isDone && ['accepted','preparing','ready','picked_up'].includes(order.status) && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-ember-400 flex-shrink-0"><MapPin className="w-3.5 h-3.5" />Map</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-forest-200/50 flex-shrink-0" />
                  </button>
                </div>
              );
            })()}

            {/* Order items */}
            {order.items && order.items.length > 0 && (
              <div className="px-5 pb-4">
                <div className="glass rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3"
                    style={{ borderBottom:'1px solid rgba(var(--fg-rgb),.07)' }}>
                    <UtensilsCrossed className="w-4 h-4 text-ember-400" />
                    <p className="text-white text-sm font-semibold">
                      {order.restaurant_name} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="space-y-3 p-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="cart-line relative ml-9 min-h-[5rem] flex items-center gap-3 py-2.5 pr-4 pl-[3.5rem]">
                        <div className="cart-line-photo is-sm">
                          {item.image_url
                            ? <img src={item.image_url} alt="" />
                            : <span className="w-full h-full flex items-center justify-center"><UtensilsCrossed className="w-5 h-5 text-forest-300/40" /></span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-heading font-bold truncate">{item.name}</p>
                          {item.notes && <p className="text-ember-300/70 text-xs mt-0.5 truncate">Note: {item.notes}</p>}
                          <p className="text-forest-200/60 text-xs mt-0.5">₱{Number(item.price).toFixed(2)} × {item.quantity}</p>
                        </div>
                        <p className="text-white font-heading font-extrabold text-sm flex-shrink-0">
                          <span className="text-ember-500 text-xs mr-0.5">₱</span>{(Number(item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                  {/* Totals */}
                  <div className="px-4 py-3 space-y-1.5 glass-dark"
                    style={{ borderTop:'1px solid rgba(var(--fg-rgb),.07)' }}>
                    {[
                      ['Subtotal',       order.subtotal],
                      ['Delivery fee',   order.delivery_fee],
                      ['Tax',            order.tax],
                    ].filter(([, v]) => v != null && Number(v) > 0).map(([label, val]) => (
                      <div key={label} className="flex justify-between text-xs text-forest-200/50">
                        <span>{label}</span>
                        <span>₱{Number(val).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-1.5"
                      style={{ borderTop:'1px solid rgba(var(--fg-rgb),.07)' }}>
                      <span className="text-white font-bold text-sm">Total</span>
                      <span className="text-ember-400 font-heading font-bold text-base">
                        ₱{Number(order.total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="px-5 pb-5">
              {isDone || isCancelled ? (
                <div className="grid grid-cols-3 gap-2">
                  {isDone && !order.food_rating ? (
                    <button onClick={() => navigate(`/order-receipt/${order.id}#rate`)}
                      className="glass-orange text-ember-200 text-xs font-semibold py-3 rounded-xl flex flex-col items-center gap-1">
                      <Star className="w-4 h-4" /> Rate
                    </button>
                  ) : (
                    <button onClick={() => navigate(`/restaurant/${order.restaurant_id}`)}
                      className="glass text-forest-200 text-xs font-semibold py-3 rounded-xl flex flex-col items-center gap-1">
                      <Store className="w-4 h-4" /> Restaurant
                    </button>
                  )}
                  <button onClick={() => navigate(`/order-receipt/${order.id}`)}
                    className="glass text-forest-200 text-xs font-semibold py-3 rounded-xl flex flex-col items-center gap-1">
                    <Receipt className="w-4 h-4" /> Receipt
                  </button>
                  <button onClick={() => handleReorder(order)}
                    className="btn-glow-orange text-white text-xs font-bold py-3 rounded-xl flex flex-col items-center gap-1">
                    <RotateCcw className="w-4 h-4" /> Reorder
                  </button>
                </div>
              ) : (
                <button onClick={() => navigate(`/restaurant/${order.restaurant_id}`)}
                  className="w-full glass hover:glass-green transition-all text-forest-200 text-sm py-3 rounded-xl flex items-center justify-center gap-2">
                  <Store className="w-4 h-4" />
                  View Restaurant
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
            </div>)}
          </div>
        );
      })}
      </section>
      ))}
      </div>
      ))}
      {(() => { const t = trackId && orders.find(o => o.id === trackId); return t ? <OrderTracker order={t} onClose={() => setTrackId(null)} /> : null; })()}
      {cancelOrder && (
        <CancelOrderDialog order={cancelOrder} onClose={() => setCancelOrder(null)}
          onCancelled={() => { setCancelOrder(null); fetchOrders(true); }} />
      )}
    </div>
  );
}

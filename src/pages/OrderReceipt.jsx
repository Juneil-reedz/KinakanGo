import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Printer, Clock, Store, MapPin, Bike, Banknote, Smartphone,
  UtensilsCrossed, Navigation, XCircle, CheckCircle, RotateCcw, Mail, Star, AlertTriangle,
} from 'lucide-react';
import StarRating from '../components/StarRating';
import { ordersApi, issuesApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';

const STATUS_LABEL = {
  pending: 'Waiting for restaurant', accepted: 'Accepted', preparing: 'Preparing',
  ready: 'Ready for pickup', picked_up: 'On the way', delivered: 'Delivered',
  cancelled: 'Cancelled', refunded: 'Refunded',
};
const ACTIVE = ['pending', 'accepted', 'preparing', 'ready', 'picked_up'];
const peso = (v) => `₱${Number(v || 0).toFixed(2)}`;
const when = (d) => new Date(d).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });

function Section({ title, children }) {
  return (
    <div className="p-5 md:p-6" style={{ borderBottom: '1px solid rgba(var(--fg-rgb),.08)' }}>
      <p className="text-forest-200/50 text-xs font-semibold uppercase tracking-wide mb-3 print:text-gray-500">{title}</p>
      {children}
    </div>
  );
}

// Rate a delivered order: one food rating that applies to every food in this
// order (and only those), plus the restaurant. Shows the ratings once given.
function RateOrder({ order, onRated }) {
  const { addNotification } = useNotification();
  // One row per distinct menu item (the same item can appear twice with different notes)
  const foods = [];
  for (const i of order.items || []) {
    if (!foods.some(f => f.menu_item_id === i.menu_item_id)) foods.push(i);
  }
  const [food, setFood] = useState(0);
  const [rest, setRest] = useState(0);
  const [rider, setRider] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const row = (label, value, onChange, aria) => (
    <div className="flex items-center justify-between gap-3">
      <span className={onChange ? 'text-white text-sm font-medium' : 'text-forest-100/80 truncate'}>{label}</span>
      <StarRating value={value} onChange={onChange} size={onChange ? undefined : 'w-5 h-5'} label={aria} />
    </div>
  );

  if (order.food_rating) {
    return (
      <Section title="Your rating">
        <div className="space-y-2 text-sm">
          {foods.map(f => (
            <div key={f.menu_item_id}>
              {/* Older reviews only stored one food rating for the whole order */}
              {row(f.name, f.my_rating || order.food_rating)}
            </div>
          ))}
          {order.restaurant_rating && row(`Restaurant${order.restaurant_name ? ` · ${order.restaurant_name}` : ''}`, order.restaurant_rating)}
          {order.rider_rating && row(`Rider${order.rider_name ? ` · ${order.rider_name}` : ''}`, order.rider_rating)}
          {order.review_comment && <p className="text-forest-200/60 italic">"{order.review_comment}"</p>}
        </div>
      </Section>
    );
  }

  const submit = async () => {
    if (!food || !rest) { addNotification('Please rate both the food and the restaurant', 'error'); return; }
    setSaving(true);
    try {
      const itemRatings = foods.map(f => ({ menuItemId: f.menu_item_id, rating: food }));
      await ordersApi.review(order.id, { itemRatings, restaurantRating: rest, riderRating: rider || null, comment: comment.trim() || null });
      addNotification('Thanks for your rating!', 'success');
      onRated({
        food_rating: food, restaurant_rating: rest, rider_rating: rider || null, review_comment: comment.trim() || null,
        items: (order.items || []).map(i => ({ ...i, my_rating: food })),
      });
    } catch (err) {
      addNotification(err.message || 'Could not save your rating', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="rate" className="print:hidden">
      <Section title="Rate this order">
        <div className="space-y-3">
          <div>
            {row('How was the food?', food, setFood, 'Food rating')}
            <p className="text-forest-200/50 text-xs mt-1">
              Goes to {foods.length > 1 ? 'every food in this order' : 'the food in this order'}: {foods.map(f => f.name).join(', ')}
            </p>
          </div>
          {row('How was the restaurant?', rest, setRest, 'Restaurant rating')}
          {order.rider_id && row(`How was the rider?${order.rider_name ? ` (${order.rider_name})` : ''}`, rider, setRider, 'Rider rating')}
          <textarea value={comment} onChange={e => setComment(e.target.value)} maxLength={500} rows={2}
            placeholder="Anything to add? (optional)"
            className="w-full input-glass px-3 py-2.5 text-sm rounded-xl resize-none" />
          <button onClick={submit} disabled={saving || !food || !rest}
            className="w-full btn-glow-orange text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
            <Star className="w-4 h-4" /> {saving ? 'Saving…' : 'Submit rating'}
          </button>
        </div>
      </Section>
    </div>
  );
}

const ISSUE_TYPES = [
  { id: 'missing', label: 'Missing or wrong item' },
  { id: 'quality', label: 'Food quality problem' },
  { id: 'rider',   label: 'Problem with the delivery' },
  { id: 'payment', label: 'Payment problem' },
  { id: 'refund',  label: 'Other / I want a refund' },
];

// Where a report stands, in the customer's words. The restaurant reviews it first
// and sends any refund itself; KinakanGo steps in for delivery problems or when
// the customer asks for a review.
const hoursSince = (t) => (t ? (Date.now() - new Date(t).getTime()) / 3600e3 : 0);
function reportState(r, waitHours = 24) {
  const amt = r.refund_approved ? peso(r.refund_approved) : '';
  const byAdmin = r.handler === 'admin';
  if (r.refund_status === 'received') return { text: `Refund of ${amt} received`, tone: 'good' };
  if (r.refund_status === 'sent') return { text: `The restaurant sent your ${amt} refund`, tone: 'good', confirm: true };
  if (r.refund_status === 'not_received') return { text: `You told us the ${amt} refund didn't arrive. KinakanGo is checking with the restaurant.`, tone: 'wait' };
  if (r.refund_status === 'to_send') return {
    text: `Refund of ${amt} approved. The restaurant will send it to you.`, tone: 'good',
    escalate: !byAdmin && hoursSince(r.resolved_at) >= waitHours ? "I still haven't received it" : null,
  };
  if (r.status === 'pending') return byAdmin
    ? { text: r.escalated_at ? 'KinakanGo is reviewing your report' : 'KinakanGo is reviewing this delivery problem', tone: 'wait' }
    : { text: 'The restaurant is reviewing your report', tone: 'wait',
        escalate: hoursSince(r.created_at) >= waitHours ? 'No answer yet? Ask KinakanGo to review' : null };
  if (r.status === 'denied') return byAdmin
    ? { text: 'KinakanGo declined this report', tone: 'bad' }
    : { text: 'The restaurant declined this report', tone: 'bad', escalate: 'Ask KinakanGo to review' };
  return { text: 'Resolved', tone: 'good' };
}
const TONE_CLS = { good: 'text-forest-300', bad: 'text-red-300', wait: 'text-ember-300' };

// Report a problem with this order (optionally asking for a refund), or show the report's status
function ReportProblem({ order }) {
  const { addNotification } = useNotification();
  const [reports, setReports] = useState(null);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('missing');
  const [text, setText] = useState('');
  const [wantRefund, setWantRefund] = useState(false);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [waitHours, setWaitHours] = useState(24);
  const [busyId, setBusyId] = useState(null);

  const load = () => issuesApi.mine(order.id)
    .then(r => { setReports(r.data || []); if (r.restaurantWaitHours) setWaitHours(r.restaurantWaitHours); })
    .catch(() => setReports([]));
  useEffect(() => { load(); }, [order.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (reports === null) return null;
  // One open report per order: still being reviewed, or a refund still on its way
  const pending = reports.find(r => r.status === 'pending' || ['to_send', 'sent', 'not_received'].includes(r.refund_status));

  const act = async (r, fn, done) => {
    setBusyId(r.id);
    try { await fn(); addNotification(done, 'success'); await load(); }
    catch (err) { addNotification(err.message || 'Something went wrong', 'error'); }
    finally { setBusyId(null); }
  };
  const escalate = (r, label) => {
    const reason = window.prompt(`${label}\n\nTell KinakanGo what happened (optional):`, '');
    if (reason === null) return;
    act(r, () => issuesApi.escalate(r.id, reason), "Sent to KinakanGo. We'll get back to you.");
  };

  const submit = async () => {
    if (text.trim().length < 5) { addNotification('Please describe the problem', 'error'); return; }
    setSaving(true);
    try {
      const saved = await issuesApi.submit({
        orderId: order.id, type, description: text.trim(),
        refundRequested: wantRefund ? Number(amount || order.total) : null,
      });
      setReports(r => [saved, ...r]);
      setOpen(false); setText(''); setWantRefund(false); setAmount('');
      addNotification(type === 'rider'
        ? "Thanks, KinakanGo will review your report. You'll get a notification with the answer."
        : "Thanks, the restaurant will review your report. You'll get a notification with the answer.", 'success');
    } catch (err) {
      addNotification(err.message || 'Could not send your report', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="print:hidden">
      <Section title="Problem with this order?">
        {reports.length > 0 && (
          <div className="space-y-2 mb-3">
            {reports.map(r => {
              const st = reportState(r, waitHours);
              const busy = busyId === r.id;
              return (
                <div key={r.id} className="glass rounded-xl px-3 py-2.5 text-sm">
                  <span className="text-white font-medium">{ISSUE_TYPES.find(t => t.id === r.type)?.label || 'Report'}</span>
                  <p className="text-forest-200/60 text-xs mt-1">{r.description}</p>
                  <p className={`${TONE_CLS[st.tone]} text-sm font-medium mt-2`}>{st.text}</p>
                  {r.resolution_notes && <p className="text-forest-200/60 text-xs mt-1 italic">"{r.resolution_notes}"</p>}
                  {r.refund_sent_note && ['sent', 'received'].includes(r.refund_status) && (
                    <p className="text-forest-200/70 text-xs mt-1">How it was sent: {r.refund_sent_note}</p>
                  )}
                  {st.confirm && (
                    <div className="flex gap-2 mt-2">
                      <button disabled={busy} onClick={() => act(r, () => issuesApi.received(r.id), 'Thanks for confirming')}
                        className="flex-1 btn-glow-green text-white text-xs font-semibold py-2 rounded-lg disabled:opacity-50">I got it</button>
                      <button disabled={busy} onClick={() => escalate(r, "Didn't get the refund?")}
                        className="flex-1 glass text-forest-100 text-xs py-2 rounded-lg disabled:opacity-50">I didn't get it</button>
                    </div>
                  )}
                  {st.escalate && (
                    <button disabled={busy} onClick={() => escalate(r, st.escalate)}
                      className="w-full glass hover:glass-orange transition-all text-forest-100 text-xs py-2 rounded-lg mt-2 disabled:opacity-50">
                      {st.escalate}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {pending ? null : !open ? (
          <button onClick={() => setOpen(true)}
            className="w-full glass hover:glass-orange transition-all text-forest-100 text-sm py-3 rounded-xl flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-ember-400" /> Report a problem
          </button>
        ) : (
          <div className="space-y-3">
            <select value={type} onChange={e => setType(e.target.value)} className="w-full input-glass px-3 py-2.5 text-sm rounded-xl">
              {ISSUE_TYPES.map(t => <option key={t.id} value={t.id} style={{ background: '#0d2b1a' }}>{t.label}</option>)}
            </select>
            <p className="text-forest-200/50 text-xs">
              {type === 'rider'
                ? 'KinakanGo reviews delivery problems.'
                : 'The restaurant reviews this first and sends any refund to you. If you disagree with its answer, you can ask KinakanGo to review.'}
            </p>
            <textarea value={text} onChange={e => setText(e.target.value)} maxLength={1000} rows={3}
              placeholder="What happened?" className="w-full input-glass px-3 py-2.5 text-sm rounded-xl resize-none" />
            <label className="flex items-center gap-2 text-sm text-forest-100">
              <input type="checkbox" checked={wantRefund} onChange={e => setWantRefund(e.target.checked)} />
              Ask for a refund
            </label>
            {wantRefund && (
              <input type="number" min="1" step="0.01" max={Number(order.total)} value={amount}
                onChange={e => setAmount(e.target.value)} placeholder={`Amount (up to ${peso(order.total)})`}
                className="w-full input-glass px-3 py-2.5 text-sm rounded-xl" />
            )}
            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 glass text-forest-200 text-sm py-3 rounded-xl">Cancel</button>
              <button onClick={submit} disabled={saving}
                className="flex-1 btn-glow-orange text-white font-bold py-3 rounded-xl disabled:opacity-50">
                {saving ? 'Sending…' : 'Send report'}
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

// Full details of one of the customer's orders (opened from Order History)
export default function OrderReceipt() {
  const { orderId } = useParams();
  const navigate    = useNavigate();
  const { addToCart, clearCart } = useCart();
  const { addNotification } = useNotification();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [sendingReceipt, setSendingReceipt] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const cancelOrder = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(true);
    try {
      await ordersApi.updateStatus(order.id, 'cancelled', { cancelledReason: 'Cancelled by customer' });
      setOrder(o => ({ ...o, status: 'cancelled', cancelled_reason: 'Cancelled by customer' }));
      addNotification('Your order was cancelled', 'success');
    } catch (err) {
      addNotification(err.message || 'Could not cancel the order', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const emailReceipt = async () => {
    setSendingReceipt(true);
    try {
      const r = await ordersApi.emailReceipt(orderId);
      addNotification(`Receipt sent to ${r.sentTo || 'your email'}`, 'success');
    } catch (err) {
      addNotification(err.message || 'Could not send the receipt', 'error');
    } finally {
      setSendingReceipt(false);
    }
  };

  useEffect(() => {
    let live = true;
    setOrder(null); setError('');
    ordersApi.getOne(orderId)
      .then(o => {
        if (!live) return;
        setOrder(o);
        if (window.location.hash === '#rate') setTimeout(() => document.getElementById('rate')?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .catch(err => { if (live) setError(err.status === 404 ? 'Order not found' : (err.message || 'Could not load this order')); });
    return () => { live = false; };
  }, [orderId]);

  const back = (
    <button onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/profile', { state: { tab: 'orders' } }))}
      className="glass hover:glass-green transition-all text-forest-100/80 hover:text-white text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2">
      <ArrowLeft className="w-4 h-4" /> Back
    </button>
  );

  if (error || !order) {
    return (
      <div className="container-custom py-8 animate-fade-up space-y-6">
        <div className="print:hidden">{back}</div>
        <div className="glass rounded-2xl py-16 flex flex-col items-center gap-4">
          {error
            ? <><XCircle className="w-10 h-10 text-red-400/70" /><p className="text-forest-200/70">{error}</p></>
            : <><Clock className="w-10 h-10 text-forest-300/40 animate-pulse" /><p className="text-forest-200/50">Loading order…</p></>}
        </div>
      </div>
    );
  }

  const items      = order.items || [];
  const itemsTotal = items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);
  const discount   = Math.max(0, itemsTotal - Number(order.subtotal || 0));
  const isActive   = ACTIVE.includes(order.status);
  const isCancelled = ['cancelled', 'refunded'].includes(order.status);
  const paidBy     = order.payment_method === 'gcash' ? 'GCash' : 'Cash on Delivery';
  const PayIcon    = order.payment_method === 'gcash' ? Smartphone : Banknote;

  const reorder = () => {
    if (!items.length) return;
    clearCart();
    const restaurant = { id: order.restaurant_id, name: order.restaurant_name };
    items.forEach(i => addToCart({ id: i.menu_item_id, name: i.name, price: Number(i.price), quantity: i.quantity, image_url: i.image_url, notes: i.notes }, restaurant));
    addNotification('Items added to your cart', 'success');
    navigate('/cart');
  };

  return (
    <div className="container-custom pt-8 pb-28 lg:pb-8 animate-fade-up">
      <div className="print:hidden mb-6 flex justify-between items-center gap-3 flex-wrap">
        {back}
        <div className="flex gap-2">
          <button onClick={emailReceipt} disabled={sendingReceipt}
            className="glass hover:glass-green transition-all text-forest-100/80 hover:text-white text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50">
            <Mail className="w-4 h-4" /> {sendingReceipt ? 'Sending…' : 'Email receipt'}
          </button>
          <button onClick={() => window.print()}
            className="glass hover:glass-green transition-all text-forest-100/80 hover:text-white text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto glass print:bg-white print:shadow-none rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 md:p-6 flex flex-wrap items-start justify-between gap-3" style={{ borderBottom: '1px solid rgba(var(--fg-rgb),.08)' }}>
          <div>
            <h1 className="text-white font-heading font-bold text-2xl print:text-black">Order #{order.id}</h1>
            <p className="text-forest-200/50 text-sm mt-1 print:text-gray-600">Placed {when(order.created_at)}</p>
            {order.delivered_at && (
              <p className="text-forest-200/50 text-sm print:text-gray-600">Delivered {when(order.delivered_at)}</p>
            )}
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 ${
            order.status === 'delivered' ? 'glass-green text-forest-200' : isCancelled ? 'glass text-red-300' : 'glass-orange text-ember-200'}`}>
            {order.status === 'delivered' ? <CheckCircle className="w-3.5 h-3.5" /> : isCancelled ? <XCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            {STATUS_LABEL[order.status] || order.status}
          </span>
        </div>

        {isCancelled && order.cancelled_reason && (
          <div className="px-5 md:px-6 py-3 text-sm text-red-300 glass">Reason: {order.cancelled_reason}</div>
        )}

        <Section title="Delivery">
          <div className="space-y-2.5 text-sm">
            <p className="flex items-start gap-2 text-forest-100/80 print:text-gray-700">
              <Store className="w-4 h-4 text-ember-400 mt-0.5 flex-shrink-0" />
              <span><span className="text-white font-semibold print:text-black">{order.restaurant_name}</span>
                {order.restaurant_address && <span className="block text-forest-200/50 text-xs">{order.restaurant_address}</span>}</span>
            </p>
            <p className="flex items-start gap-2 text-forest-100/80 print:text-gray-700">
              <MapPin className="w-4 h-4 text-ember-400 mt-0.5 flex-shrink-0" />
              <span>{order.delivery_address}</span>
            </p>
            {order.special_instructions && (
              <p className="text-forest-200/60 text-xs pl-6">Note: {order.special_instructions}</p>
            )}
            {order.rider_name && (
              <p className="flex items-center gap-2 text-forest-100/80 print:text-gray-700">
                <Bike className="w-4 h-4 text-ember-400 flex-shrink-0" />
                <span>Rider: <span className="text-white print:text-black">{order.rider_name}</span>{order.rider_phone ? ` · ${order.rider_phone}` : ''}</span>
              </p>
            )}
          </div>
        </Section>

        <Section title={`Items (${items.length})`}>
          <div className="divide-y divide-white/5">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 glass print:hidden">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed className="w-4 h-4 text-forest-300/30" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate print:text-black">{item.name}</p>
                  <p className="text-forest-200/50 text-xs">{peso(item.price)} × {item.quantity}</p>
                  {item.notes && <p className="text-ember-300/70 text-xs truncate">Note: {item.notes}</p>}
                </div>
                <p className="text-ember-400 font-semibold text-sm flex-shrink-0 print:text-black">{peso(Number(item.price) * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 space-y-1.5 text-sm" style={{ borderTop: '1px solid rgba(var(--fg-rgb),.08)' }}>
            {[
              ['Items', peso(itemsTotal)],
              ...(discount > 0.005 ? [['Promo discount', `−${peso(discount)}`]] : []),
              ['Delivery fee', peso(order.delivery_fee)],
              ['Tax (8%)', peso(order.tax)],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between text-forest-200/60 print:text-gray-600"><span>{l}</span><span>{v}</span></div>
            ))}
            <div className="flex justify-between items-center pt-2 font-bold" style={{ borderTop: '1px solid rgba(var(--fg-rgb),.08)' }}>
              <span className="text-white print:text-black">Total</span>
              <span className="text-ember-400 font-heading text-lg print:text-black">{peso(order.total)}</span>
            </div>
          </div>
        </Section>

        <Section title="Payment">
          <p className="flex items-center gap-2 text-sm text-forest-100/80 print:text-gray-700">
            <PayIcon className="w-4 h-4 text-ember-400" /> {paidBy}
            <span className="text-forest-200/50">·</span>
            <span className={order.payment_status === 'paid' || order.status === 'delivered' ? 'text-forest-300' : 'text-ember-300'}>
              {order.payment_status === 'refunded' ? 'Refunded'
                : isCancelled && order.payment_status === 'paid' ? 'Paid · ask for a refund below'
                : order.payment_status === 'paid' || order.status === 'delivered' ? 'Paid'
                : isCancelled ? 'Not charged'
                : order.payment_method === 'gcash' ? 'Payment proof sent' : 'Pay the rider on delivery'}
            </span>
          </p>
        </Section>

        {order.status === 'delivered' && (
          <RateOrder order={order} onRated={r => setOrder(o => ({ ...o, ...r }))} />
        )}

        {order.status !== 'pending' && <ReportProblem order={order} />}

        {order.status === 'pending' && (
          <div className="p-5 md:p-6 print:hidden" style={{ borderBottom: '1px solid rgba(var(--fg-rgb),.08)' }}>
            <p className="text-forest-200/60 text-xs mb-2">The restaurant hasn't accepted this order yet, so you can still cancel it.</p>
            <button onClick={cancelOrder} disabled={cancelling}
              className="w-full glass hover:bg-red-500/20 transition-all text-red-300 text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              <XCircle className="w-4 h-4" /> {cancelling ? 'Cancelling…' : 'Cancel order'}
            </button>
          </div>
        )}

        <div className="p-5 md:p-6 flex flex-col sm:flex-row gap-2 print:hidden">
          {isActive && (
            <button onClick={() => navigate('/orders')}
              className="flex-1 btn-glow-orange text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
              <Navigation className="w-4 h-4" /> Track order
            </button>
          )}
          {!isActive && items.length > 0 && (
            <button onClick={reorder}
              className="flex-1 btn-glow-orange text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> Order again
            </button>
          )}
          <button onClick={() => navigate(`/restaurant/${order.restaurant_id}`)}
            className="flex-1 glass hover:glass-green transition-all text-forest-200 text-sm py-3 rounded-xl flex items-center justify-center gap-2">
            <Store className="w-4 h-4" /> View restaurant
          </button>
        </div>
      </div>
    </div>
  );
}

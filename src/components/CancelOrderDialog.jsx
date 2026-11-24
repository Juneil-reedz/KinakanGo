import { useState } from 'react';
import { XCircle } from 'lucide-react';
import { ordersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const REASONS = [
  'I changed my mind',
  'I ordered by mistake',
  'Wrong address or order details',
  "It's taking too long",
  'Other',
];
const peso = (n) => `₱${Number(n || 0).toFixed(2)}`;

// How cancelling works (the server enforces the same rules):
// - Only while the restaurant hasn't accepted the order yet.
// - Cash: nothing was paid, so nothing to refund.
// - GCash: the customer says they sent the money to the restaurant. The restaurant
//   first checks that it arrived (a screenshot can be fake), then it comes back
//   as store credit at that restaurant or by GCash (the restaurant sends it and
//   the customer confirms).
// - Store credit used on the order always comes back as store credit.
export function cancelSummary(order) {
  const credit = Number(order?.credit_used || 0);
  const paidGcash = order?.payment_method === 'gcash' ? Math.max(0, Number(order?.total || 0) - credit) : 0;
  return { credit, paidGcash };
}

export default function CancelOrderDialog({ order, onClose, onCancelled }) {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { credit, paidGcash } = cancelSummary(order);
  const [reason, setReason] = useState(REASONS[0]);
  const [other, setOther] = useState('');
  const [method, setMethod] = useState('credit');
  const [gcash, setGcash] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const text = reason === 'Other' ? (other.trim() || 'Other') : reason;
      const res = await ordersApi.updateStatus(order.id, 'cancelled', {
        cancelledReason: `Cancelled by customer: ${text}`,
        ...(paidGcash > 0 ? { refundMethod: method, refundGcash: method === 'gcash' ? gcash : null } : {}),
      });
      addNotification(
        paidGcash > 0
          ? res?.refund?.state === 'approved'
            ? method === 'credit'
              ? `Order cancelled. ${peso(paidGcash)} was added to your store credit.`
              : `Order cancelled. The restaurant will send ${peso(paidGcash)} back to your GCash.`
            : `Order cancelled. The restaurant will check that your ${peso(paidGcash)} arrived, then return it.`
          : 'Your order was cancelled',
        'success'
      );
      onCancelled?.(res);
    } catch (err) {
      addNotification(err.message || 'Could not cancel the order', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="cancel-title"
        className="glass w-full max-w-sm rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--panel-bg)' }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-5 h-5 text-red-300" />
          </div>
          <div>
            <h2 id="cancel-title" className="text-white font-heading font-bold text-lg">Cancel order #{order.id}?</h2>
            <p className="text-forest-200/60 text-xs">You can cancel until the restaurant accepts it.</p>
          </div>
        </div>

        <div>
          <label className="block text-forest-200/60 text-xs font-medium mb-1">Why are you cancelling?</label>
          <select value={reason} onChange={e => setReason(e.target.value)} className="w-full input-glass px-3 py-2.5 text-sm rounded-xl">
            {REASONS.map(r => <option key={r} value={r} style={{ background: '#0d2b1a' }}>{r}</option>)}
          </select>
          {reason === 'Other' && (
            <input value={other} onChange={e => setOther(e.target.value)} maxLength={200} placeholder="Tell us more (optional)"
              className="w-full input-glass px-3 py-2.5 text-sm rounded-xl mt-2" />
          )}
        </div>

        {paidGcash > 0 ? (
          <div className="space-y-2">
            <p className="text-forest-100 text-sm">You paid <span className="font-bold">{peso(paidGcash)}</span> by GCash. The restaurant first checks that it arrived. How do you want it back?</p>
            {[
              ['credit', 'Store credit', `Added as soon as the restaurant confirms. Use it on your next order at ${order.restaurant_name || 'this restaurant'}.`],
              ['gcash',  'Back to my GCash', 'The restaurant sends it to your GCash. You confirm when it arrives.'],
            ].map(([id, label, hint]) => (
              <label key={id} className={`flex items-start gap-2 rounded-xl p-2.5 text-sm cursor-pointer ${method === id ? 'glass-green' : 'glass'}`}>
                <input type="radio" name="cancel-refund" checked={method === id} onChange={() => setMethod(id)} className="mt-1" />
                <span className="text-forest-100">{label}<span className="block text-forest-200/60 text-xs">{hint}</span></span>
              </label>
            ))}
            {method === 'gcash' && (
              <input type="tel" value={gcash} onChange={e => setGcash(e.target.value)} placeholder="GCash number, e.g. 09171234567"
                className="w-full input-glass px-3 py-2.5 text-sm rounded-xl" />
            )}
          </div>
        ) : (
          <p className="glass rounded-xl px-3 py-2.5 text-forest-200/80 text-sm">
            {order.payment_method === 'gcash' ? 'Nothing was paid by GCash, so there is nothing to refund.' : "Cash on delivery: you haven't paid anything, so there is nothing to refund."}
          </p>
        )}
        {credit > 0 && (
          <p className="text-forest-300 text-xs">The {peso(credit)} store credit you used goes back to your store credit.</p>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} disabled={saving} className="flex-1 glass text-forest-200 text-sm py-3 rounded-xl">Keep order</button>
          <button onClick={submit} disabled={saving || (paidGcash > 0 && method === 'gcash' && !gcash.trim())}
            className="flex-1 bg-red-500/80 hover:bg-red-500 text-white text-sm font-semibold py-3 rounded-xl disabled:opacity-50">
            {saving ? 'Cancelling…' : 'Cancel order'}
          </button>
        </div>
      </div>
    </div>
  );
}

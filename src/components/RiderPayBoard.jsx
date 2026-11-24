import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Send, CheckCircle, X, Wallet } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

// Delivery fees between restaurants and riders, as one running balance per pair.
// Every delivered order is added automatically:
//   GCash order: the restaurant got the money, so it owes the rider the delivery fee.
//   Cash order: the rider collected everything, keeps the fee and owes the rest.
// Money is sent outside the app; the payer taps "I paid" and the other side confirms.
//
// side: 'rider' or 'restaurant' (whose page this is); request: that side's API helper.
const peso = (n) => `₱${Math.abs(Number(n || 0)).toFixed(2)}`;
const STATUS = {
  sent:      { label: 'Waiting for confirmation', cls: 'glass-orange text-ember-200' },
  confirmed: { label: 'Received',                 cls: 'glass-green text-forest-200' },
  disputed:  { label: 'Not received · KinakanGo reviewing', cls: 'bg-red-500/20 text-red-300' },
  cancelled: { label: 'Taken back',               cls: 'glass text-forest-200/50' },
};

export default function RiderPayBoard({ side, request }) {
  const { addNotification } = useNotification();
  const [pairs, setPairs] = useState(null);
  const [open, setOpen] = useState({});      // pair key -> history rows
  const [paying, setPaying] = useState(null); // pair being paid
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);

  const key = (p) => `${p.restaurant_id}-${p.rider_id}`;
  // Positive = the other side owes me
  const owedToMe = (p) => (side === 'rider' ? 1 : -1) * Number(p.balance);
  const iOwe = (p) => Math.max(0, -((side === 'rider' ? 1 : -1) * (Number(p.balance) + Number(p.pending))));
  const other = (p) => side === 'rider'
    ? { name: p.restaurant_name, gcash: p.restaurant_gcash, gcashName: p.restaurant_gcash_name }
    : { name: p.rider_name, gcash: p.rider_gcash, gcashName: p.rider_gcash_name };

  const loadHistory = async (p) => {
    const r = await request(`/rider-pay/pair?${new URLSearchParams({ restaurantId: p.restaurant_id, riderId: p.rider_id, as: side })}`);
    setOpen(o => ({ ...o, [key(p)]: r.data || [] }));
  };
  const load = async () => {
    try {
      const r = await request(`/rider-pay/${side}`);
      const list = r.data || [];
      setPairs(list);
      // Open the ones with a payment waiting, so it can't be missed
      await Promise.all(list.filter(p => p.waiting > 0 || p.disputed > 0).map(loadHistory));
    } catch {
      setPairs([]);
      addNotification('Could not load rider pay', 'error');
    }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (p) => {
    if (open[key(p)]) setOpen(o => { const n = { ...o }; delete n[key(p)]; return n; });
    else loadHistory(p).catch(() => addNotification('Could not load the history', 'error'));
  };

  const act = async (path, body, msg) => {
    setBusy(true);
    try {
      await request(path, { method: 'POST', body: JSON.stringify({ ...body, as: side }) });
      addNotification(msg, 'success');
      setPaying(null);
      await load();
    } catch (err) {
      addNotification(err?.data?.error || err.message || 'Could not save', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (pairs === null) return <div className="glass rounded-2xl h-28 animate-pulse" />;
  if (!pairs.length) return (
    <div className="glass rounded-2xl p-6 text-center">
      <Wallet className="w-8 h-8 text-forest-300/40 mx-auto mb-2" />
      <p className="text-forest-200/60 text-sm">Nothing yet. After each delivery, the delivery fee shows up here automatically.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {pairs.map(p => {
        const o = other(p);
        const mine = owedToMe(p);
        const owe = iOwe(p);
        const hist = open[key(p)];
        return (
          <div key={key(p)} className="glass rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-white font-semibold">{o.name}</p>
                <p className="text-forest-200/50 text-xs">
                  {p.deliveries} deliver{p.deliveries === 1 ? 'y' : 'ies'}
                  {o.gcash ? ` · GCash ${o.gcash}${o.gcashName ? ` (${o.gcashName})` : ''}` : ' · no GCash number yet'}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`font-heading font-bold text-lg ${mine > 0 ? 'text-forest-300' : mine < 0 ? 'text-ember-300' : 'text-forest-200/60'}`}>
                  {mine === 0 ? '₱0.00' : peso(mine)}
                </p>
                <p className="text-forest-200/50 text-xs">
                  {mine > 0 ? `${o.name} owes you` : mine < 0 ? `You owe ${o.name}` : 'All settled'}
                </p>
              </div>
            </div>
            {Number(p.pending) !== 0 && (
              <p className="text-ember-200 text-xs mt-2">{peso(p.pending)} sent and waiting for confirmation</p>
            )}

            <div className="flex gap-2 mt-3 flex-wrap">
              {owe > 0 && (
                <button onClick={() => { setPaying(p); setAmount(owe.toFixed(2)); setReference(''); }}
                  className="btn-glow-orange text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" /> I paid {peso(owe)}
                </button>
              )}
              <button onClick={() => toggle(p)} className="glass text-forest-200 text-xs px-3 py-2 rounded-xl flex items-center gap-1">
                {hist ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} History
              </button>
            </div>

            {hist && (
              <div className="mt-3 space-y-1.5">
                {hist.map(e => {
                  const toRider = Number(e.amount) < 0; // payments: restaurant -> rider
                  const iReceive = e.kind === 'payment' && (side === 'rider' ? toRider : !toRider);
                  const effect = (side === 'rider' ? 1 : -1) * Number(e.amount); // + good for me
                  return (
                    <div key={e.id} className="glass rounded-xl px-3 py-2 text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="text-forest-100">
                          {e.kind === 'delivery'
                            ? `Order #${e.order_id}: fee ${peso(e.delivery_fee)}${Number(e.cash_collected) > 0 ? `, cash collected ${peso(e.cash_collected)}` : ' (GCash order)'}`
                            : `${iReceive ? 'Received' : 'Paid'} by GCash · ${e.reference}`}
                        </span>
                        <span className={e.kind === 'payment' && e.status !== 'confirmed' ? 'text-forest-200/40' : effect >= 0 ? 'text-forest-300' : 'text-ember-300'}>
                          {effect >= 0 ? '+' : '−'}{peso(e.amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="text-forest-200/40">{new Date(e.created_at).toLocaleString()}</span>
                        {e.kind === 'payment' && <span className={`px-2 py-0.5 rounded-full ${STATUS[e.status]?.cls}`}>{STATUS[e.status]?.label}</span>}
                      </div>
                      {e.disputed_reason && <p className="text-red-300/80 mt-1">"{e.disputed_reason}"</p>}
                      {e.kind === 'payment' && e.status === 'sent' && iReceive && (
                        <div className="flex gap-2 mt-2">
                          <button disabled={busy} onClick={() => act(`/rider-pay/${e.id}/confirm`, {}, 'Thanks, marked as received')}
                            className="btn-glow-green text-white px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50">
                            <CheckCircle className="w-3.5 h-3.5" /> I got it
                          </button>
                          <button disabled={busy} onClick={() => act(`/rider-pay/${e.id}/dispute`, { reason: 'It is not in my GCash' }, 'KinakanGo will review it')}
                            className="glass text-red-300 px-3 py-1.5 rounded-lg disabled:opacity-50">
                            I didn't get it
                          </button>
                        </div>
                      )}
                      {e.kind === 'payment' && ['sent', 'disputed'].includes(e.status) && !iReceive && (
                        <button disabled={busy} onClick={() => act(`/rider-pay/${e.id}/cancel`, {}, 'Payment taken back')}
                          className="glass text-forest-200/70 px-3 py-1.5 rounded-lg mt-2 disabled:opacity-50">
                          Take back (recorded by mistake)
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {paying && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" className="glass rounded-3xl p-6 w-full max-w-sm space-y-3" style={{ background: 'var(--panel-bg)' }}>
            <div className="flex items-center justify-between">
              <p className="text-white font-semibold">Pay {other(paying).name}</p>
              <button onClick={() => setPaying(null)} className="w-8 h-8 glass rounded-xl flex items-center justify-center"><X className="w-4 h-4 text-forest-200" /></button>
            </div>
            <p className="text-forest-200/70 text-xs">
              Send the money in your GCash app first
              {other(paying).gcash ? ` to ${other(paying).gcash}${other(paying).gcashName ? ` (${other(paying).gcashName})` : ''}` : ''}.
              Then enter the reference so they can check it. It counts once they confirm.
            </p>
            <div>
              <label className="block text-forest-200/60 text-xs font-medium mb-1">Amount sent (₱)</label>
              <input type="number" min="0" step="0.01" max={iOwe(paying)} value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full input-glass py-2.5 px-3 text-sm" />
            </div>
            <div>
              <label className="block text-forest-200/60 text-xs font-medium mb-1">GCash reference number *</label>
              <input value={reference} onChange={e => setReference(e.target.value)} maxLength={120}
                className="w-full input-glass py-2.5 px-3 text-sm" placeholder="e.g. 1234 567 890123" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPaying(null)} className="flex-1 glass text-forest-200 text-xs py-2.5 rounded-xl">Cancel</button>
              <button disabled={busy || reference.trim().length < 3 || !(Number(amount) > 0)}
                onClick={() => act('/rider-pay/pay', { restaurantId: paying.restaurant_id, riderId: paying.rider_id, amount: Number(amount), reference }, 'Recorded. They will confirm it.')}
                className="flex-1 btn-glow-green text-white text-xs font-semibold py-2.5 rounded-xl disabled:opacity-50">
                {busy ? 'Saving…' : `I sent ${peso(amount)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

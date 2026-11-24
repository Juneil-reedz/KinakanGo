import { useEffect, useState } from 'react';
import { adminRequest } from '../../context/AdminContext';
import { useNotification } from '../../context/NotificationContext';

const peso = (n) => `₱${Math.abs(Number(n || 0)).toFixed(2)}`;

// Every restaurant–rider balance, and payments someone says never arrived
export default function AdminRiderPay() {
  const { addNotification } = useNotification();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = () => adminRequest('/rider-pay/admin')
    .then(setData)
    .catch(() => { setData({ data: [], disputes: [] }); addNotification('Could not load rider pay', 'error'); });
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resolve = async (id, received) => {
    setBusy(id);
    try {
      await adminRequest(`/rider-pay/${id}/resolve`, { method: 'POST', body: JSON.stringify({ received }) });
      addNotification(received ? 'Counted as received' : 'Removed: it did not arrive', 'success');
      await load();
    } catch (err) {
      addNotification(err?.data?.error || err.message || 'Could not save', 'error');
    } finally {
      setBusy(null);
    }
  };

  if (!data) return <div className="glass rounded-2xl h-40 animate-pulse" />;
  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="text-2xl font-heading font-bold text-white">Rider Pay</h1>
        <p className="text-forest-200/60 text-sm mt-1">What restaurants and riders owe each other. Restaurants and riders send the money themselves; you only settle disputes.</p>
      </div>

      <div className="glass rounded-2xl p-5">
        <p className="text-white font-semibold mb-3">Payments not received ({data.disputes.length})</p>
        {!data.disputes.length ? <p className="text-forest-200/50 text-sm">None right now.</p> : (
          <div className="space-y-2">
            {data.disputes.map(d => (
              <div key={d.id} className="glass rounded-xl p-3 text-sm">
                <p className="text-white">
                  {Number(d.amount) < 0 ? `${d.restaurant_name} → ${d.rider_name}` : `${d.rider_name} → ${d.restaurant_name}`}: <span className="font-semibold">{peso(d.amount)}</span>
                </p>
                <p className="text-forest-200/60 text-xs">Ref: {d.reference} · {new Date(d.created_at).toLocaleString()}</p>
                {d.disputed_reason && <p className="text-red-300/80 text-xs mt-1">Receiver says: "{d.disputed_reason}"</p>}
                <div className="flex gap-2 mt-2">
                  <button disabled={busy === d.id} onClick={() => resolve(d.id, true)} className="btn-glow-green text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-50">It arrived</button>
                  <button disabled={busy === d.id} onClick={() => resolve(d.id, false)} className="glass text-red-300 text-xs px-3 py-1.5 rounded-lg disabled:opacity-50">It did not arrive</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-5 overflow-x-auto">
        <p className="text-white font-semibold mb-3">All balances</p>
        {!data.data.length ? <p className="text-forest-200/50 text-sm">No deliveries yet.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-forest-200/50 text-xs text-left">
              <th className="py-2 pr-3">Restaurant</th><th className="py-2 pr-3">Rider</th><th className="py-2 pr-3">Deliveries</th><th className="py-2 pr-3">Balance</th><th className="py-2">Waiting</th>
            </tr></thead>
            <tbody>
              {data.data.map(p => (
                <tr key={`${p.restaurant_id}-${p.rider_id}`} className="border-t border-white/5">
                  <td className="py-2 pr-3 text-forest-100">{p.restaurant_name}</td>
                  <td className="py-2 pr-3 text-forest-100">{p.rider_name}</td>
                  <td className="py-2 pr-3 text-forest-200/70">{p.deliveries}</td>
                  <td className="py-2 pr-3">
                    {Number(p.balance) === 0 ? <span className="text-forest-200/50">Settled</span>
                      : Number(p.balance) > 0 ? <span className="text-ember-300">Restaurant owes {peso(p.balance)}</span>
                      : <span className="text-ember-300">Rider owes {peso(p.balance)}</span>}
                  </td>
                  <td className="py-2 text-forest-200/60">{Number(p.pending) ? peso(p.pending) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

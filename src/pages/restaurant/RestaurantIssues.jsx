import { useEffect, useState } from 'react';
import { restaurantRequest } from '../../context/RestaurantContext';
import { useNotification } from '../../context/NotificationContext';
import { AlertTriangle, CheckCircle, Clock, Send, X } from 'lucide-react';

const TYPE_LABEL = {
  missing: 'Missing or wrong item',
  quality: 'Food quality problem',
  rider:   'Problem with the delivery',
  payment: 'Payment problem',
  refund:  'Other / refund request',
};
const peso = (n) => `₱${Number(n || 0).toFixed(2)}`;

// What the restaurant needs to do about a report, and how it is shown
function stage(i) {
  if (i.handler === 'restaurant' && i.status === 'pending') return { key: 'answer', label: 'Needs your answer', cls: 'glass-orange text-ember-200' };
  if (['to_send', 'not_received'].includes(i.refund_status)) {
    return { key: 'send', label: i.refund_status === 'not_received' ? "Customer didn't get the refund" : 'Send the refund', cls: 'bg-red-500/20 text-red-300' };
  }
  if (i.refund_status === 'sent') return { key: 'done', label: 'Refund sent, waiting for the customer', cls: 'glass text-forest-200/70' };
  if (i.refund_status === 'received') return { key: 'done', label: 'Customer received the refund', cls: 'glass-green text-forest-200' };
  if (i.handler === 'admin' && i.status === 'pending') return { key: 'admin', label: 'KinakanGo is reviewing', cls: 'glass text-forest-200/70' };
  if (i.status === 'denied') return { key: 'done', label: i.handler === 'admin' ? 'Declined by KinakanGo' : 'You declined', cls: 'glass text-forest-200/60' };
  return { key: 'done', label: 'Resolved', cls: 'glass-green text-forest-200' };
}

export default function RestaurantIssues() {
  const { addNotification } = useNotification();
  const [issues, setIssues] = useState(null);
  const [tab, setTab] = useState('todo');
  const [modal, setModal] = useState(null); // { issue, mode: 'approve' | 'decline' | 'sent' }
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => restaurantRequest('/issues/restaurant')
    .then(r => setIssues(r.data || []))
    .catch(() => { setIssues([]); addNotification('Could not load customer problems', 'error'); });
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const open = (issue, mode) => {
    setModal({ issue, mode });
    setAmount(mode === 'approve' && issue.refund_requested ? String(Number(issue.refund_requested)) : '');
    setNote('');
  };
  const close = () => setModal(null);

  const submit = async () => {
    const { issue, mode } = modal;
    const path = mode === 'approve' ? 'restaurant-resolve' : mode === 'decline' ? 'restaurant-deny' : 'refund-sent';
    const body = mode === 'approve' ? { refundApproved: amount === '' ? null : Number(amount), notes: note }
      : mode === 'decline' ? { notes: note } : { note };
    setSaving(true);
    try {
      await restaurantRequest(`/issues/${issue.id}/${path}`, { method: 'POST', body: JSON.stringify(body) });
      addNotification(mode === 'sent' ? 'Marked as sent. The customer will confirm.' : 'Your answer was sent to the customer', 'success');
      close();
      await load();
    } catch (err) {
      addNotification(err.message || 'Could not save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const list = issues || [];
  const todo = list.filter(i => ['answer', 'send'].includes(stage(i).key));
  const shown = tab === 'todo' ? todo : list;

  return (
    <div className="space-y-5 pb-6 animate-fade-up max-w-3xl mx-auto">
      <div>
        <p className="text-forest-200/50 text-sm">Orders</p>
        <h1 className="text-2xl font-heading font-bold text-white">Customer Problems</h1>
        <p className="text-forest-200/60 text-sm mt-1">
          Customers report problems with their orders here. You decide first. If you approve a refund, send it back
          the way they paid (GCash or cash) and tap "Refund sent". If the customer disagrees, KinakanGo reviews it.
        </p>
      </div>

      <div className="flex gap-2">
        {[['todo', `To do (${todo.length})`], ['all', `All (${list.length})`]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${tab === k ? 'btn-glow-green text-white' : 'glass text-forest-200/60 hover:text-forest-100'}`}>
            {label}
          </button>
        ))}
      </div>

      {issues === null ? (
        <div className="space-y-3">{[1, 2].map(i => <div key={i} className="glass rounded-2xl h-32 animate-pulse" />)}</div>
      ) : shown.length === 0 ? (
        <div className="glass rounded-2xl py-14 flex flex-col items-center gap-3">
          <div className="w-14 h-14 glass-green rounded-2xl flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-forest-300" />
          </div>
          <p className="text-forest-200/50 text-sm">{tab === 'todo' ? 'Nothing to do right now' : 'No customer problems yet'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map(i => {
            const st = stage(i);
            return (
              <div key={i.id} className="glass rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl glass-orange flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-ember-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${st.cls}`}>{st.label}</span>
                      <span className="text-forest-200/40 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />{new Date(i.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-white font-semibold text-sm">{TYPE_LABEL[i.type] || 'Problem'} · Order #{i.order_id}</p>
                    <p className="text-forest-200/70 text-sm mt-1">{i.description}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                      <div>
                        <p className="text-forest-200/40">Customer</p>
                        <p className="text-forest-100/80">{i.customer_name}</p>
                        {i.customer_phone && <p className="text-forest-200/50">{i.customer_phone}</p>}
                      </div>
                      <div>
                        <p className="text-forest-200/40">Order total</p>
                        <p className="text-forest-100/80">{peso(i.order_total)} · {i.payment_method === 'gcash' ? 'GCash' : 'Cash'}</p>
                      </div>
                    </div>
                    {i.refund_requested && st.key === 'answer' && (
                      <p className="glass-orange rounded-xl px-3 py-2 mt-2 text-ember-200 text-xs font-semibold">Asks for a refund of {peso(i.refund_requested)}</p>
                    )}
                    {i.refund_approved && (
                      <p className="glass-green rounded-xl px-3 py-2 mt-2 text-forest-200 text-xs font-semibold">
                        Refund to send: {peso(i.refund_approved)}{i.refund_sent_note ? ` · Sent: ${i.refund_sent_note}` : ''}
                      </p>
                    )}
                    {i.escalation_reason && <p className="text-forest-200/60 text-xs mt-2">Customer to KinakanGo: "{i.escalation_reason}"</p>}
                    {i.resolution_notes && <p className="text-forest-200/60 text-xs mt-1 italic">Answer: "{i.resolution_notes}"</p>}

                    {st.key === 'answer' && (
                      <div className="flex gap-2 flex-wrap mt-3">
                        <button onClick={() => open(i, 'approve')} className="btn-glow-green text-white text-xs font-semibold px-3 py-2 rounded-xl">
                          Accept
                        </button>
                        <button onClick={() => open(i, 'decline')} className="glass text-red-300 text-xs font-medium px-3 py-2 rounded-xl">
                          Decline
                        </button>
                      </div>
                    )}
                    {st.key === 'send' && (
                      <button onClick={() => open(i, 'sent')} className="mt-3 btn-glow-orange text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5" /> Refund sent
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-3xl p-6 w-full max-w-sm space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-white font-semibold">
                {modal.mode === 'approve' ? 'Accept this report' : modal.mode === 'decline' ? 'Decline this report' : 'Refund sent'}
              </p>
              <button onClick={close} className="w-8 h-8 glass rounded-xl flex items-center justify-center"><X className="w-4 h-4 text-forest-200" /></button>
            </div>
            {modal.mode === 'approve' && (
              <div>
                <label className="block text-forest-200/60 text-xs font-medium mb-1">Refund amount (₱), leave empty for no refund</label>
                <input type="number" min="0" step="0.01" max={Number(modal.issue.order_total)} value={amount}
                  onChange={e => setAmount(e.target.value)} className="w-full input-glass py-2.5 px-3 text-sm" placeholder="0.00" />
                <div className="flex gap-1.5 mt-2">
                  {[['Asked', modal.issue.refund_requested], ['Full', modal.issue.order_total]].filter(([, v]) => v).map(([label, v]) => (
                    <button key={label} type="button" onClick={() => setAmount(String(Number(v)))}
                      className="glass text-forest-200/70 text-xs px-2.5 py-1 rounded-lg">{label} {peso(v)}</button>
                  ))}
                </div>
              </div>
            )}
            {modal.mode === 'sent' && (
              <p className="text-forest-200/70 text-xs">
                Send {peso(modal.issue.refund_approved)} to the customer first, then say how you sent it so they can check.
              </p>
            )}
            <div>
              <label className="block text-forest-200/60 text-xs font-medium mb-1">
                {modal.mode === 'sent' ? 'How did you send it? *' : modal.mode === 'decline' ? 'Why? (the customer sees this) *' : 'Message to the customer'}
              </label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                className="w-full input-glass py-2.5 px-3 text-sm resize-none"
                placeholder={modal.mode === 'sent' ? 'e.g. GCash ref 1234567890' : modal.mode === 'decline' ? 'e.g. The order left complete and hot' : 'Optional'} />
            </div>
            <div className="flex gap-2">
              <button onClick={close} className="flex-1 glass text-forest-200 text-xs py-2.5 rounded-xl">Cancel</button>
              <button onClick={submit} disabled={saving}
                className={`flex-1 text-white text-xs font-semibold py-2.5 rounded-xl disabled:opacity-50 ${modal.mode === 'decline' ? 'bg-red-500/80 hover:bg-red-500' : 'btn-glow-green'}`}>
                {saving ? 'Saving…' : modal.mode === 'approve' ? (amount ? `Approve ${peso(amount)} refund` : 'Resolve, no refund') : modal.mode === 'decline' ? 'Decline' : 'Mark as sent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

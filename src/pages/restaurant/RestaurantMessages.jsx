import { useEffect, useState } from 'react';
import { restaurantRequest } from '../../context/RestaurantContext';
import { useNotification } from '../../context/NotificationContext';
import { Inbox, MessageSquare, Reply, Send, User } from 'lucide-react';

export default function RestaurantMessages() {
  const { addNotification } = useNotification();
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await restaurantRequest('/messages?box=inbox');
      const inbox = res.data || [];
      setMessages(inbox);
      setSelected(current => current || inbox[0] || null);
    } catch {
      addNotification('Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openMessage = async (message) => {
    setSelected(message);
    if (!message.is_read) {
      try {
        await restaurantRequest(`/messages/${message.id}/read`, { method: 'PATCH' });
        setMessages(prev => prev.map(m => m.id === message.id ? { ...m, is_read: true } : m));
      } catch { /* non-critical */ }
    }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!selected || !reply.trim() || sending) return;
    setSending(true);
    try {
      await restaurantRequest('/messages', {
        method: 'POST',
        body: JSON.stringify({
          to: selected.sender_email || selected.sender_name,
          subject: selected.subject?.startsWith('Re:') ? selected.subject : `Re: ${selected.subject || 'Message'}`,
          body: reply.trim(),
        }),
      });
      setReply('');
      addNotification('Reply sent', 'success');
    } catch {
      addNotification('Failed to send reply', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full min-h-[calc(100vh-9rem)] grid grid-cols-1 lg:grid-cols-[22rem_1fr] gap-4 animate-fade-up">
      <section className="glass rounded-3xl overflow-hidden flex flex-col min-h-[28rem]">
        <div className="p-4 flex items-center justify-between" style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-forest-300" />
            <p className="text-white font-semibold">Inbox</p>
          </div>
          <span className="glass-green text-forest-200 text-xs px-2 py-0.5 rounded-full">{messages.length}</span>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1,2,3].map(i => <div key={i} className="glass rounded-2xl h-20 animate-pulse" />)}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquare className="w-12 h-12 text-forest-300/25 mb-3" />
            <p className="text-white font-semibold">No messages yet</p>
            <p className="text-forest-200/45 text-sm mt-1">Customer messages to this restaurant will show here.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 overflow-auto">
            {messages.map(message => {
              const active = selected?.id === message.id;
              return (
                <button key={message.id} onClick={() => openMessage(message)}
                  className={`w-full p-4 text-left transition-all ${active ? 'glass-green' : 'hover:glass'}`}>
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="text-white text-sm font-semibold truncate">{message.subject || 'New message'}</p>
                    {!message.is_read && <span className="w-2 h-2 rounded-full bg-ember-400 flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-forest-200/60 text-xs truncate">From: {message.sender_name || message.sender_email || 'Customer'}</p>
                  <p className="text-forest-200/35 text-xs mt-1">{new Date(message.created_at).toLocaleString('en-PH')}</p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="glass rounded-3xl overflow-hidden flex flex-col min-h-[28rem]">
        {selected ? (
          <>
            <div className="p-5" style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 btn-glow-green rounded-2xl flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-heading font-bold truncate">{selected.subject || 'New message'}</p>
                  <p className="text-forest-200/55 text-sm">{selected.sender_name || 'Customer'}</p>
                  {selected.sender_email && <p className="text-forest-200/35 text-xs">{selected.sender_email}</p>}
                </div>
              </div>
            </div>

            <div className="flex-1 p-5 overflow-auto space-y-4">
              <div className="glass-dark rounded-2xl p-4 border border-white/5">
                <p className="text-forest-100/80 text-sm leading-relaxed whitespace-pre-wrap">{selected.body}</p>
                <p className="text-forest-200/35 text-xs mt-3">{new Date(selected.created_at).toLocaleString('en-PH')}</p>
              </div>
            </div>

            <form onSubmit={sendReply} className="p-4 space-y-3" style={{ borderTop:'1px solid rgba(255,255,255,.07)' }}>
              <div className="flex items-center gap-2 text-forest-200/60 text-xs font-semibold uppercase tracking-wide">
                <Reply className="w-3.5 h-3.5" /> Reply to {selected.sender_name || 'customer'}
              </div>
              <textarea value={reply} onChange={e => setReply(e.target.value)} rows={4}
                placeholder="Write your reply..."
                className="w-full input-glass py-3 text-sm resize-none" />
              <button type="submit" disabled={!reply.trim() || sending}
                className="btn-glow-orange text-white text-sm font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 ml-auto">
                <Send className="w-4 h-4" /> {sending ? 'Sending...' : 'Send Reply'}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquare className="w-14 h-14 text-forest-300/25 mb-3" />
            <p className="text-white font-semibold">Select a message</p>
            <p className="text-forest-200/45 text-sm mt-1">Open a customer message to view and reply.</p>
          </div>
        )}
      </section>
    </div>
  );
}

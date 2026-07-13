import { useEffect, useState } from 'react';
import { restaurantRequest } from '../../context/RestaurantContext';
import { useNotification } from '../../context/NotificationContext';
import { Check, Inbox, MessageSquare, Pencil, Reply, Send, Trash2, User } from 'lucide-react';

export default function RestaurantMessages() {
  const { addNotification } = useNotification();
  const [messages, setMessages] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const conversationKey = (message) => {
    if (message.box === 'sent') return `user:${message.recipient_user_id || message.recipient_label}`;
    return `user:${message.sender_id}`;
  };

  const conversations = Object.values(messages.reduce((acc, message) => {
    const key = conversationKey(message);
    if (!acc[key]) {
      acc[key] = {
        key,
        name: message.box === 'sent'
          ? message.recipient_label
          : (message.sender_name || message.sender_email || 'Customer'),
        email: message.box === 'sent' ? null : message.sender_email,
        messages: [],
      };
    }
    acc[key].messages.push(message);
    acc[key].latest = acc[key].messages.reduce((latest, item) => (
      !latest || new Date(item.created_at) > new Date(latest.created_at) ? item : latest
    ), null);
    acc[key].unread = acc[key].messages.some(item => item.box === 'inbox' && !item.is_read);
    return acc;
  }, {})).sort((a, b) => new Date(b.latest.created_at) - new Date(a.latest.created_at));

  const selectedConversation = conversations.find(c => c.key === selectedKey) || conversations[0] || null;
  const thread = selectedConversation
    ? [...selectedConversation.messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    : [];

  const load = async () => {
    try {
      setLoading(true);
      const [inboxRes, sentRes] = await Promise.all([
        restaurantRequest('/messages?box=inbox'),
        restaurantRequest('/messages?box=sent'),
      ]);
      const inbox = (inboxRes.data || []).map(message => ({ ...message, box: 'inbox' }));
      const sent = (sentRes.data || []).map(message => ({ ...message, box: 'sent' }));
      const next = [...inbox, ...sent];
      setMessages(next);
      setSelectedKey(current => current || (next[0] ? conversationKey(next[0]) : null));
    } catch {
      addNotification('Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openConversation = async (conversation) => {
    setSelectedKey(conversation.key);
    const unread = conversation.messages.filter(message => message.box === 'inbox' && !message.is_read);
    if (unread.length) {
      await Promise.all(unread.map(message =>
        restaurantRequest(`/messages/${message.id}/read`, { method: 'PATCH' }).catch(() => null)
      ));
      setMessages(prev => prev.map(message =>
        unread.some(item => item.id === message.id) ? { ...message, is_read: true } : message
      ));
    }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!selectedConversation || !reply.trim() || sending) return;
    setSending(true);
    try {
      const recipient = selectedConversation.email || selectedConversation.name;
      const latestSubject = selectedConversation.latest?.subject || 'Message';
      const saved = await restaurantRequest('/messages', {
        method: 'POST',
        body: JSON.stringify({
          to: recipient,
          subject: latestSubject.startsWith('Re:') ? latestSubject : `Re: ${latestSubject}`,
          body: reply.trim(),
        }),
      });
      setMessages(prev => [{ ...saved, box: 'sent' }, ...prev]);
      setReply('');
      addNotification('Reply sent', 'success');
    } catch {
      addNotification('Failed to send reply', 'error');
    } finally {
      setSending(false);
    }
  };

  const startEdit = (message) => setEditing({ id: message.id, subject: message.subject || 'New message', body: message.body || '' });
  const cancelEdit = () => setEditing(null);

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editing?.body.trim() || savingEdit) return;
    setSavingEdit(true);
    try {
      const saved = await restaurantRequest(`/messages/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ subject: editing.subject, body: editing.body }),
      });
      setMessages(prev => prev.map(message => message.id === editing.id ? { ...message, ...saved } : message));
      setEditing(null);
      addNotification('Message updated', 'success');
    } catch {
      addNotification('Failed to update message', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await restaurantRequest(`/messages/${id}`, { method: 'DELETE' });
      setMessages(prev => prev.filter(message => message.id !== id));
      addNotification('Message deleted', 'success');
    } catch {
      addNotification('Failed to delete message', 'error');
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
          <span className="glass-green text-forest-200 text-xs px-2 py-0.5 rounded-full">{conversations.length}</span>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1,2,3].map(i => <div key={i} className="glass rounded-2xl h-20 animate-pulse" />)}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquare className="w-12 h-12 text-forest-300/25 mb-3" />
            <p className="text-white font-semibold">No messages yet</p>
            <p className="text-forest-200/45 text-sm mt-1">Customer messages to this restaurant will show here.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 overflow-auto">
            {conversations.map(conversation => {
              const active = selectedConversation?.key === conversation.key;
              const latest = conversation.latest;
              return (
                <button key={conversation.key} onClick={() => openConversation(conversation)}
                  className={`w-full p-4 text-left transition-all ${active ? 'glass-green' : 'hover:glass'}`}>
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="text-white text-sm font-semibold truncate">{conversation.name}</p>
                    {conversation.unread && <span className="w-2 h-2 rounded-full bg-ember-400 flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-forest-200/60 text-xs truncate">{latest.box === 'sent' ? 'You: ' : ''}{latest.body}</p>
                  <p className="text-forest-200/35 text-xs mt-1">{new Date(latest.created_at).toLocaleString('en-PH')}</p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="glass rounded-3xl overflow-hidden flex flex-col min-h-[28rem]">
        {selectedConversation ? (
          <>
            <div className="p-5" style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 btn-glow-green rounded-2xl flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-heading font-bold truncate">{selectedConversation.name}</p>
                  <p className="text-forest-200/55 text-sm">Conversation</p>
                  {selectedConversation.email && <p className="text-forest-200/35 text-xs">{selectedConversation.email}</p>}
                </div>
              </div>
            </div>

            <div className="flex-1 p-5 overflow-auto space-y-4">
              {thread.map(message => (
                <div key={message.id} className={`rounded-2xl p-4 border border-white/5 max-w-[85%] ${message.box === 'sent' ? 'ml-auto glass-green' : 'glass-dark'}`}>
                  {editing?.id === message.id ? (
                    <form onSubmit={saveEdit} className="space-y-3">
                      <input value={editing.subject} onChange={e => setEditing(edit => ({ ...edit, subject: e.target.value }))}
                        className="w-full input-glass py-2 text-sm" placeholder="Subject" />
                      <textarea value={editing.body} onChange={e => setEditing(edit => ({ ...edit, body: e.target.value }))}
                        rows={4} className="w-full input-glass py-2 text-sm resize-none" placeholder="Message" />
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={cancelEdit} className="glass text-forest-100 text-xs font-semibold px-3 py-2 rounded-lg">Cancel</button>
                        <button type="submit" disabled={!editing.body.trim() || savingEdit}
                          className="btn-glow-green text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 disabled:opacity-50">
                          <Check className="w-3.5 h-3.5" /> Save
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-forest-100/80 text-sm leading-relaxed whitespace-pre-wrap flex-1">{message.body}</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {message.box === 'sent' && (
                            <button type="button" onClick={() => startEdit(message)} className="w-7 h-7 glass rounded-lg flex items-center justify-center text-forest-100 hover:glass-green" title="Edit message">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button type="button" onClick={() => deleteMessage(message.id)} className="w-7 h-7 glass rounded-lg flex items-center justify-center text-forest-100 hover:glass-orange" title="Delete message">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-forest-200/35 text-xs mt-3">
                        {message.box === 'sent' ? 'You' : (message.sender_name || 'Customer')} · {new Date(message.created_at).toLocaleString('en-PH')}
                        {message.updated_at && message.updated_at !== message.created_at ? ' · edited' : ''}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={sendReply} className="p-4 space-y-3" style={{ borderTop:'1px solid rgba(255,255,255,.07)' }}>
              <div className="flex items-center gap-2 text-forest-200/60 text-xs font-semibold uppercase tracking-wide">
                <Reply className="w-3.5 h-3.5" /> Reply to {selectedConversation.name || 'customer'}
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

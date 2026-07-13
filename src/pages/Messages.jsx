import { useEffect, useState } from 'react';
import { Check, Inbox, MessageSquare, Pencil, Plus, Reply, Send, Trash2, User, X } from 'lucide-react';
import { messagesApi } from '../services/api';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ to: '', subject: '', body: '' });
  const [reply, setReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [editing, setEditing] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const conversationKey = (message) => {
    if (message.box === 'sent') return `user:${message.recipient_user_id || message.recipient_label}`;
    return `user:${message.sender_id}`;
  };

  const restaurantNameFrom = (message) => (
    message.sender_restaurant_name ||
    message.recipient_restaurant_name ||
    (message.box === 'sent' ? message.recipient_label : null)
  );

  const restaurantImageFrom = (message) => message.sender_restaurant_image || message.recipient_restaurant_image || null;

  const conversations = Object.values(messages.reduce((acc, message) => {
    const key = conversationKey(message);
    if (!acc[key]) {
      acc[key] = {
        key,
        name: 'Conversation',
        email: message.box === 'sent' ? null : message.sender_email,
        image: null,
        messages: [],
      };
    }
    acc[key].messages.push(message);
    acc[key].latest = acc[key].messages.reduce((latest, item) => (
      !latest || new Date(item.created_at || item.createdAt) > new Date(latest.created_at || latest.createdAt) ? item : latest
    ), null);
    acc[key].unread = acc[key].messages.some(item => item.box === 'inbox' && !item.is_read);
    acc[key].name = acc[key].messages.map(restaurantNameFrom).find(Boolean)
      || acc[key].messages.map(item => item.box === 'sent' ? (item.recipient_label || item.to) : (item.sender_name || item.sender_email)).find(Boolean)
      || 'Conversation';
    acc[key].image = acc[key].messages.map(restaurantImageFrom).find(Boolean) || null;
    acc[key].email = acc[key].messages.map(item => item.box === 'inbox' ? item.sender_email : null).find(Boolean) || acc[key].email;
    return acc;
  }, {})).sort((a, b) => new Date(b.latest.created_at || b.latest.createdAt) - new Date(a.latest.created_at || a.latest.createdAt));

  const selectedConversation = conversations.find(c => c.key === selectedKey) || conversations[0] || null;
  const thread = selectedConversation
    ? [...selectedConversation.messages].sort((a, b) => new Date(a.created_at || a.createdAt) - new Date(b.created_at || b.createdAt))
    : [];

  const loadMessages = async () => {
    try {
      const [sent, inbox] = await Promise.all([
        messagesApi.list('sent'),
        messagesApi.list('inbox'),
      ]);
      const inboxMessages = (inbox.data || []).map(message => ({ ...message, box: 'inbox' }));
      const sentMessages = (sent.data || []).map(message => ({ ...message, box: 'sent' }));
      const next = [...inboxMessages, ...sentMessages].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setMessages(next);
      setSelectedKey(current => current || (next[0] ? conversationKey(next[0]) : null));
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const openConversation = async (conversation) => {
    setSelectedKey(conversation.key);
    const unread = conversation.messages.filter(message => message.box === 'inbox' && !message.is_read);
    if (unread.length) {
      await Promise.all(unread.map(message => messagesApi.markRead(message.id).catch(() => null)));
      setMessages(prev => prev.map(message =>
        unread.some(item => item.id === message.id) ? { ...message, is_read: true } : message
      ));
    }
  };

  useEffect(() => { loadMessages(); }, []);

  const createMessage = async (e) => {
    e.preventDefault();
    if (!form.to.trim() || !form.body.trim()) return;
    const localMessage = {
      id: Date.now(), recipient_label: form.to.trim(), to: form.to.trim(), box: 'sent',
      subject: form.subject.trim() || 'New message', body: form.body.trim(),
      created_at: new Date().toISOString(), createdAt: new Date().toISOString(),
    };
    try {
      const saved = await messagesApi.create({ to: form.to, subject: form.subject, body: form.body });
      setMessages(prev => [{ ...saved, box: 'sent' }, ...prev]);
      setSelectedKey(conversationKey({ ...saved, box: 'sent' }));
    } catch {
      setMessages(prev => [localMessage, ...prev]);
    }
    setForm({ to: '', subject: '', body: '' });
    setShowComposer(false);
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!selectedConversation || !reply.trim() || sendingReply) return;
    setSendingReply(true);
    try {
      const latestSubject = selectedConversation.latest?.subject || 'Message';
      const saved = await messagesApi.create({
        to: selectedConversation.email || selectedConversation.name,
        subject: latestSubject.startsWith('Re:') ? latestSubject : `Re: ${latestSubject}`,
        body: reply,
      });
      setMessages(prev => [{ ...saved, box: 'sent' }, ...prev]);
      setReply('');
    } finally {
      setSendingReply(false);
    }
  };

  const startEdit = (message) => setEditing({ id: message.id, subject: message.subject || 'New message', body: message.body || '' });
  const cancelEdit = () => setEditing(null);

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editing?.body.trim() || savingEdit) return;
    setSavingEdit(true);
    try {
      const saved = await messagesApi.update(editing.id, { subject: editing.subject, body: editing.body });
      setMessages(prev => prev.map(message => message.id === editing.id ? { ...message, ...saved } : message));
      setEditing(null);
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    await messagesApi.remove(id);
    setMessages(prev => prev.filter(message => message.id !== id));
  };

  return (
    <div className="h-full flex flex-col animate-fade-up space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-heading font-bold text-white">Messages</h1>
        <button onClick={() => setShowComposer(true)}
          className="btn-glow-orange text-white text-sm px-4 py-2.5 rounded-xl font-semibold flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Create Message
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[22rem_1fr] gap-4 min-h-[calc(100vh-13rem)]">
        <section className="glass rounded-3xl overflow-hidden flex flex-col">
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
            <div className="flex-1 flex items-center justify-center py-20 px-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <MessageSquare className="w-14 h-14 text-forest-300/30" />
                <p className="text-white font-semibold">No messages yet</p>
                <p className="text-forest-200/50 text-sm">Create a message for a restaurant or support.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/5 overflow-auto">
              {conversations.map(conversation => {
                const active = selectedConversation?.key === conversation.key;
                const latest = conversation.latest;
                return (
                  <button key={conversation.key} onClick={() => openConversation(conversation)}
                    className={`w-full p-4 text-left transition-all flex gap-3 ${active ? 'glass-green' : 'hover:glass'}`}>
                    <div className="w-10 h-10 btn-glow-green rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {conversation.image
                        ? <img src={conversation.image} alt={conversation.name} className="w-full h-full object-cover" />
                        : <User className="w-4 h-4 text-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <p className="text-white text-sm font-semibold truncate">{conversation.name}</p>
                        {conversation.unread && <span className="w-2 h-2 rounded-full bg-ember-400 flex-shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-forest-200/60 text-xs truncate">{latest.box === 'sent' ? 'You: ' : ''}{latest.body}</p>
                      <p className="text-forest-200/35 text-xs mt-1">{new Date(latest.created_at || latest.createdAt).toLocaleString('en-PH')}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="glass rounded-3xl overflow-hidden flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-5 flex items-start gap-3" style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
                <div className="w-11 h-11 btn-glow-green rounded-2xl flex items-center justify-center flex-shrink-0">
                  {selectedConversation.image
                    ? <img src={selectedConversation.image} alt={selectedConversation.name} className="w-full h-full rounded-2xl object-cover" />
                    : <User className="w-5 h-5 text-white" />}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-heading font-bold truncate">{selectedConversation.name}</p>
                  <p className="text-forest-200/55 text-sm">Conversation</p>
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
                          {message.box === 'sent' ? 'You' : (restaurantNameFrom(message) || message.sender_name || 'Sender')} · {new Date(message.created_at || message.createdAt).toLocaleString('en-PH')}
                          {message.updated_at && message.updated_at !== message.created_at ? ' · edited' : ''}
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={sendReply} className="p-4 space-y-3" style={{ borderTop:'1px solid rgba(255,255,255,.07)' }}>
                <div className="flex items-center gap-2 text-forest-200/60 text-xs font-semibold uppercase tracking-wide">
                  <Reply className="w-3.5 h-3.5" /> Reply to {selectedConversation.name}
                </div>
                <textarea value={reply} onChange={e => setReply(e.target.value)} rows={4}
                  placeholder="Write your reply..."
                  className="w-full input-glass py-3 text-sm resize-none" />
                <button type="submit" disabled={!reply.trim() || sendingReply}
                  className="btn-glow-orange text-white text-sm font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 ml-auto">
                  <Send className="w-4 h-4" /> {sendingReply ? 'Sending...' : 'Send Reply'}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare className="w-14 h-14 text-forest-300/25 mb-3" />
              <p className="text-white font-semibold">Select a message</p>
              <p className="text-forest-200/45 text-sm mt-1">Open a message to view the conversation.</p>
            </div>
          )}
        </section>
      </div>

      {showComposer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,.68)', backdropFilter: 'blur(8px)' }}>
          <form onSubmit={createMessage} className="glass w-full max-w-md rounded-3xl p-5 card-3d animate-fade-up space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-white font-heading font-bold text-lg">Create Message</p>
              <button type="button" onClick={() => setShowComposer(false)}
                className="w-8 h-8 glass rounded-xl flex items-center justify-center text-forest-100 hover:glass-orange transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
              placeholder="To: restaurant or support"
              className="w-full input-glass py-3 text-sm" />
            <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Subject"
              className="w-full input-glass py-3 text-sm" />
            <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder="Write your message..."
              rows={5}
              className="w-full input-glass py-3 text-sm resize-none" />
            <button type="submit" disabled={!form.to.trim() || !form.body.trim()}
              className="w-full btn-glow-green text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              <Send className="w-4 h-4" /> Send Message
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

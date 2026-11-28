import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ArrowLeft, Check, CheckCheck, MessageSquare, Pencil, Plus, Send, Trash2, User, X } from 'lucide-react';
import { messagesApi } from '../services/api';
import { useDialog } from '../context/DialogContext';

const DESKTOP_QUERY = '(min-width: 37.5rem)';

const formatTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
};

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isDesktop;
};

export default function Messages() {
  const isDesktop = useIsDesktop();
  const threadEndRef = useRef(null);
  const [actionId, setActionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [creating, setCreating] = useState(false);
  const [composeError, setComposeError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ to: '', subject: '', body: '' });
  const [reply, setReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [editing, setEditing] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);

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

  // Opened from a "New message from ..." notification (?with=<their user id>): show that conversation
  const [params, setParams] = useSearchParams();
  const withUser = params.get('with');
  useEffect(() => {
    if (!withUser || !messages.length) return;
    const key = `user:${withUser}`;
    if (messages.some(m => conversationKey(m) === key)) { setSelectedKey(key); setMobileThreadOpen(true); }
    setParams(p => { p.delete('with'); return p; }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withUser, messages.length]);
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
    setMobileThreadOpen(true);
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
    if (!form.to.trim() || !form.body.trim() || creating) return;
    setCreating(true);
    setComposeError('');
    try {
      const saved = await messagesApi.create({ to: form.to, subject: form.subject, body: form.body });
      setMessages(prev => [{ ...saved, box: 'sent' }, ...prev]);
      setSelectedKey(conversationKey({ ...saved, box: 'sent' }));
      setMobileThreadOpen(true);
      setForm({ to: '', subject: '', body: '' });
      setShowComposer(false);
    } catch (err) {
      // Keep the draft and say why; never show a message that wasn't really sent
      setComposeError(err?.message || 'Message not sent. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const closeComposer = () => { setShowComposer(false); setComposeError(''); };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!selectedConversation || !reply.trim() || sendingReply) return;
    setSendingReply(true);
    try {
      const latestSubject = selectedConversation.latest?.subject || 'Message';
      const partnerId = Number(selectedConversation.key.replace('user:', ''));
      const saved = await messagesApi.create({
        ...(Number.isInteger(partnerId) && partnerId > 0 ? { toUserId: partnerId } : {}),
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

  const ask = useDialog();
  const deleteMessage = async (id) => {
    if (!(await ask({ title: 'Delete this message?', confirmLabel: 'Delete', danger: true }))) return;
    await messagesApi.remove(id);
    setMessages(prev => prev.filter(message => message.id !== id));
  };

  const closeMobileThread = () => {
    setEditing(null);
    setActionId(null);
    setMobileThreadOpen(false);
  };

  // Keep the newest message in view
  useEffect(() => {
    const el = threadEndRef.current;
    if (el) el.scrollIntoView({ block: 'end' });
  }, [selectedConversation?.key, thread.length, mobileThreadOpen]);

  const avatar = (conversation, size = 'w-11 h-11') => (
    <div className={`${size} rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-white/10 ring-2 ring-white/10`}>
      {conversation?.image
        ? <img src={conversation.image} alt="" className="w-full h-full object-cover" />
        : <User className="w-1/2 h-1/2 text-forest-100" />}
    </div>
  );

  const threadView = selectedConversation ? (
    <>
      {/* Chat header */}
      <div className="chat-header flex items-center gap-3 px-3 sm:px-4 py-3 flex-shrink-0">
        <button type="button" onClick={closeMobileThread} aria-label="Back"
          className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0">
          <ArrowLeft className="w-6 h-6" />
        </button>
        {avatar(selectedConversation)}
        <div className="min-w-0 flex-1">
          <p className="text-white font-heading font-bold text-[1.05rem] truncate">{selectedConversation.name}</p>
          <p className="text-forest-200/60 text-xs truncate">{selectedConversation.image ? 'Restaurant' : (selectedConversation.email || 'Conversation')}</p>
        </div>
      </div>

      {/* Bubbles */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-4 py-4 space-y-3 scrollbar-hide"
        onClick={() => setActionId(null)}>
        {thread.map(message => {
          const mine = message.box === 'sent';
          const at = message.created_at || message.createdAt;
          const edited = message.updated_at && message.updated_at !== message.created_at;
          if (editing?.id === message.id) {
            return (
              <form key={message.id} onSubmit={saveEdit} onClick={e => e.stopPropagation()}
                className="ml-auto max-w-[85%] glass rounded-3xl p-3 space-y-2">
                <textarea value={editing.body} onChange={e => setEditing(edit => ({ ...edit, body: e.target.value }))}
                  rows={3} autoFocus className="w-full input-glass py-2 text-sm resize-none" placeholder="Message" />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={cancelEdit} className="glass text-forest-100 text-xs font-semibold px-3 py-2 rounded-full">Cancel</button>
                  <button type="submit" disabled={!editing.body.trim() || savingEdit}
                    className="btn-glow-orange text-white text-xs font-bold px-3 py-2 rounded-full flex items-center gap-1 disabled:opacity-50">
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                </div>
              </form>
            );
          }
          return (
            <div key={message.id} className={`flex items-start gap-2 ${mine ? 'justify-end' : ''}`}>
              {!mine && avatar(selectedConversation, 'w-8 h-8')}
              <div className={`max-w-[78%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                <button type="button" onClick={e => { e.stopPropagation(); setActionId(id => id === message.id ? null : message.id); }}
                  className={`chat-bubble ${mine ? 'chat-bubble-mine' : 'chat-bubble-theirs'}`}>
                  {message.body}
                </button>
                <p className="text-forest-200/45 text-[11px] mt-1 px-1 flex items-center gap-1">
                  {formatTime(at)}{edited ? ' · edited' : ''}
                  {mine && <CheckCheck className="w-3.5 h-3.5 text-ember-400" />}
                </p>
                {actionId === message.id && (
                  <div className="flex gap-1.5 mt-1" onClick={e => e.stopPropagation()}>
                    {mine && (
                      <button type="button" onClick={() => { startEdit(message); setActionId(null); }}
                        className="glass text-forest-100 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1">
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                    )}
                    <button type="button" onClick={() => { setActionId(null); deleteMessage(message.id); }}
                      className="glass text-red-300 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={threadEndRef} />
      </div>

      {/* Composer */}
      <form onSubmit={sendReply} className="flex items-center gap-2 px-3 sm:px-4 pt-2 pb-[max(.75rem,env(safe-area-inset-bottom))] flex-shrink-0">
        <input value={reply} onChange={e => setReply(e.target.value)}
          placeholder="Type your message..." aria-label={`Reply to ${selectedConversation.name}`}
          className="flex-1 min-w-0 input-glass rounded-full px-5 py-3 text-sm" />
        <button type="submit" disabled={!reply.trim() || sendingReply} aria-label="Send"
          className="w-12 h-12 rounded-full btn-glow-orange text-white flex items-center justify-center flex-shrink-0 disabled:opacity-60">
          <Send className="w-5 h-5 -ml-0.5" />
        </button>
      </form>
    </>
  ) : (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <MessageSquare className="w-14 h-14 text-forest-300/25 mb-3" />
      <p className="text-white font-semibold">Select a message</p>
      <p className="text-forest-200/45 text-sm mt-1">Open a message to view the conversation.</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col animate-fade-up gap-4 pb-24 lg:pb-0">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[2rem] sm:text-2xl leading-none font-heading font-bold text-white">Messages</h1>
          <p className="text-forest-200/55 text-sm mt-1">{conversations.length} conversation{conversations.length === 1 ? '' : 's'}</p>
        </div>
        <button onClick={() => setShowComposer(true)}
          className="btn-glow-orange text-white text-sm px-4 py-3 sm:py-2.5 rounded-full font-semibold flex items-center gap-1.5 whitespace-nowrap">
          <Plus className="w-4 h-4" /> <span className="hidden min-[380px]:inline">New Message</span><span className="min-[380px]:hidden">New</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[22rem_1fr] gap-4 min-h-0 lg:h-[calc(100vh-11rem)]">
        {/* Inbox: one floating card per conversation */}
        <section className="flex flex-col gap-3 min-h-0 lg:overflow-y-auto scrollbar-hide lg:pr-1">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="glass rounded-3xl h-20 animate-pulse" />)
          ) : conversations.length === 0 ? (
            <div className="glass rounded-3xl flex items-center justify-center py-16 px-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <MessageSquare className="w-14 h-14 text-forest-300/30" />
                <p className="text-white font-semibold">No messages yet</p>
                <p className="text-forest-200/50 text-sm">Create a message for a restaurant or support.</p>
              </div>
            </div>
          ) : conversations.map(conversation => {
            const active = isDesktop && selectedConversation?.key === conversation.key;
            const latest = conversation.latest;
            return (
              <button key={conversation.key} onClick={() => openConversation(conversation)}
                className={`inbox-card w-full p-3.5 text-left flex items-center gap-3 ${active ? 'is-active' : ''}`}>
                {avatar(conversation, 'w-12 h-12')}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`text-white text-[.95rem] truncate ${conversation.unread ? 'font-bold' : 'font-semibold'}`}>{conversation.name}</p>
                    <p className={`text-[11px] flex-shrink-0 ${conversation.unread ? 'text-ember-400 font-semibold' : 'text-forest-200/45'}`}>{formatTime(latest.created_at || latest.createdAt)}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className={`text-sm truncate ${conversation.unread ? 'text-forest-100' : 'text-forest-200/60'}`}>{latest.box === 'sent' ? 'You: ' : ''}{latest.body}</p>
                    {conversation.unread && <span className="w-2.5 h-2.5 rounded-full bg-ember-500 flex-shrink-0" />}
                  </div>
                </div>
              </button>
            );
          })}
        </section>

        {/* Desktop: conversation beside the list */}
        {isDesktop && (
          <section className="glass rounded-3xl overflow-hidden flex flex-col min-h-0">
            {threadView}
          </section>
        )}
      </div>

      {/* Phone: the conversation opens over the whole screen */}
      {!isDesktop && mobileThreadOpen && selectedConversation && createPortal(
        <div className="chat-screen fixed inset-0 z-[60] flex flex-col animate-fade-up">
          {threadView}
        </div>,
        document.body
      )}

      {/* New message: full screen on phones, a large panel on desktop */}
      {showComposer && createPortal(
        <div className="fixed inset-0 z-[60] flex items-stretch sm:items-center justify-center lg:p-6"
          style={{ background: isDesktop ? 'rgba(0,0,0,.68)' : 'var(--app-bg)', backdropFilter: isDesktop ? 'blur(8px)' : undefined }}>
          <form onSubmit={createMessage}
            className={`chat-screen w-full flex flex-col animate-fade-up ${isDesktop ? 'max-w-2xl h-[85vh] rounded-3xl overflow-hidden glass' : 'h-full'}`}>
            <div className="chat-header flex items-center gap-3 px-3 sm:px-4 py-3 flex-shrink-0">
              <button type="button" onClick={closeComposer} aria-label="Close"
                className="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0">
                {isDesktop ? <X className="w-5 h-5" /> : <ArrowLeft className="w-6 h-6" />}
              </button>
              <p className="flex-1 text-white font-heading font-bold text-lg">New Message</p>
              <button type="submit" disabled={!form.to.trim() || !form.body.trim() || creating}
                className="btn-glow-orange text-white text-sm font-bold px-4 py-2.5 rounded-full flex items-center gap-1.5 disabled:opacity-50">
                <Send className="w-4 h-4" /> {creating ? 'Sending...' : 'Send'}
              </button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col gap-3 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] overflow-y-auto">
              <label className="compose-field flex items-center gap-3 input-glass rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-ember-500/60">
                <span className="text-forest-200/60 text-sm w-14 flex-shrink-0">To</span>
                <input value={form.to} onChange={e => { setForm(f => ({ ...f, to: e.target.value })); setComposeError(''); }}
                  placeholder="Restaurant name or email" autoFocus
                  className="flex-1 min-w-0 bg-transparent outline-none focus:outline-none focus-visible:outline-none text-white text-[.95rem] placeholder:text-forest-200/40" />
              </label>
              <label className="compose-field flex items-center gap-3 input-glass rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-ember-500/60">
                <span className="text-forest-200/60 text-sm w-14 flex-shrink-0">Subject</span>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Optional"
                  className="flex-1 min-w-0 bg-transparent outline-none focus:outline-none focus-visible:outline-none text-white text-[.95rem] placeholder:text-forest-200/40" />
              </label>
              {composeError && (
                <p role="alert" className="text-sm text-red-300 bg-red-500/10 rounded-2xl px-4 py-3">{composeError}</p>
              )}
              <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Write your message..."
                className="flex-1 min-h-[12rem] w-full input-glass rounded-3xl px-4 py-4 text-[.95rem] leading-relaxed resize-none" />
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}

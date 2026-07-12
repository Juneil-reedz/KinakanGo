import { useEffect, useState } from 'react';
import { MessageSquare, Plus, Send, X } from 'lucide-react';

const STORAGE_KEY = 'kkg_messages';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [showComposer, setShowComposer] = useState(false);
  const [form, setForm] = useState({ to: '', subject: '', body: '' });

  useEffect(() => {
    try {
      setMessages(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const createMessage = (e) => {
    e.preventDefault();
    if (!form.to.trim() || !form.body.trim()) return;
    setMessages(prev => [{
      id: Date.now(),
      to: form.to.trim(),
      subject: form.subject.trim() || 'New message',
      body: form.body.trim(),
      createdAt: new Date().toISOString(),
    }, ...prev]);
    setForm({ to: '', subject: '', body: '' });
    setShowComposer(false);
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

      {messages.length === 0 ? (
        <div className="glass rounded-3xl flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3 text-center px-6">
            <MessageSquare className="w-14 h-14 text-forest-300/30" />
            <p className="text-white font-semibold">No messages yet</p>
            <p className="text-forest-200/50 text-sm">Create a message for a restaurant or support.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map(message => (
            <div key={message.id} className="glass rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-white font-semibold text-sm">{message.subject}</p>
                  <p className="text-forest-200/50 text-xs">To: {message.to}</p>
                </div>
                <span className="text-forest-200/35 text-xs flex-shrink-0">
                  {new Date(message.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-forest-100/70 text-sm leading-relaxed">{message.body}</p>
            </div>
          ))}
        </div>
      )}

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
              <Send className="w-4 h-4" /> Save Message
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

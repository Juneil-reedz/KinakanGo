import { useState } from 'react';
import { Search, Send, Clock, ArrowLeft } from 'lucide-react';

const CHATS = [
  {
    id:1, name:'Pizza Palace', time:'10:30 AM', unread:2,
    avatar:'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop',
    messages:[
      { id:1, text:'Hi! I just placed an order', sent:true,  time:'10:15 AM' },
      { id:2, text:'Thank you for your order! We are preparing it now.', sent:false, time:'10:20 AM' },
      { id:3, text:'Your order is on the way!', sent:false, time:'10:30 AM' },
    ]
  },
  {
    id:2, name:"Burger King's", time:'Yesterday', unread:0,
    avatar:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop',
    messages:[
      { id:1, text:'Can I add extra cheese?', sent:true, time:'2:30 PM' },
      { id:2, text:'Of course! We have added it to your order.', sent:false, time:'2:35 PM' },
    ]
  },
  {
    id:3, name:'Healthy Bites', time:'2 days ago', unread:0,
    avatar:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&h=100&fit=crop',
    messages:[
      { id:1, text:'The salad was amazing!', sent:true, time:'1:00 PM' },
      { id:2, text:'Thank you for your feedback! We are glad you enjoyed it.', sent:false, time:'1:10 PM' },
    ]
  },
];

export default function Messages() {
  const [selected, setSelected] = useState(null);
  const [input, setInput]       = useState('');
  const [chats, setChats]       = useState(CHATS);

  const sendMessage = () => {
    if (!input.trim() || !selected) return;
    const msg = { id: Date.now(), text: input.trim(), sent: true, time: new Date().toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit' }) };
    setChats(prev => prev.map(c => c.id === selected.id ? { ...c, messages:[...c.messages, msg], lastMessage: msg.text } : c));
    setSelected(s => ({ ...s, messages:[...s.messages, msg] }));
    setInput('');
  };

  return (
    <div className="h-full flex flex-col animate-fade-up">
      {!selected && (
        <h1 className="text-2xl font-heading font-bold text-white mb-4">Messages</h1>
      )}

      <div className="glass rounded-3xl overflow-hidden flex-1 flex flex-col" style={{ minHeight:0 }}>
        <div className="grid grid-cols-1 md:grid-cols-3 flex-1" style={{ minHeight:0 }}>

          {/* Chat list */}
          <div className={`flex flex-col md:border-r border-white/8 ${selected ? 'hidden md:flex' : 'flex'}`}>
            {/* Search */}
            <div className="p-3" style={{ borderBottom:'1px solid rgba(255,255,255,.08)' }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/50" />
                <input placeholder="Search messages…" className="w-full input-glass pl-9 py-2 text-sm" />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {chats.map(chat => (
                <button key={chat.id} onClick={() => setSelected(chat)}
                  className={`w-full p-4 text-left transition-all flex items-center gap-3 ${selected?.id === chat.id ? 'glass-green' : 'hover:glass'}`}
                  style={{ borderBottom:'1px solid rgba(255,255,255,.06)' }}>
                  <div className="relative flex-shrink-0">
                    <img src={chat.avatar} alt={chat.name} className="w-11 h-11 rounded-2xl object-cover" />
                    {chat.unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 btn-glow-orange text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-white font-semibold text-sm truncate">{chat.name}</p>
                      <span className="text-forest-200/40 text-xs flex-shrink-0 ml-2">{chat.time}</span>
                    </div>
                    <p className="text-forest-200/50 text-xs truncate">{chat.messages[chat.messages.length-1]?.text}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat window */}
          <div className={`md:col-span-2 flex flex-col ${selected ? 'flex' : 'hidden md:flex'}`} style={{ minHeight:0 }}>
            {selected ? (
              <>
                {/* Header */}
                <div className="p-4 flex items-center gap-3" style={{ borderBottom:'1px solid rgba(255,255,255,.08)' }}>
                  <button onClick={() => setSelected(null)} className="md:hidden w-8 h-8 glass rounded-xl flex items-center justify-center text-forest-200 hover:glass-green transition-all">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <img src={selected.avatar} alt={selected.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold text-sm">{selected.name}</p>
                    <p className="text-forest-400 text-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-forest-400 rounded-full animate-pulse" />Active now
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
                  {selected.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${msg.sent ? 'btn-glow-orange text-white' : 'glass text-forest-100'}`}>
                        <p className="text-sm">{msg.text}</p>
                        <div className="flex items-center gap-1 mt-1 opacity-70">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">{msg.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="p-3 flex items-center gap-2" style={{ borderTop:'1px solid rgba(255,255,255,.08)' }}>
                  <input value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message…"
                    className="flex-1 input-glass py-2.5 text-sm" />
                  <button onClick={sendMessage}
                    className="w-10 h-10 btn-glow-orange rounded-xl flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform">
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-50">
                <span className="text-5xl">💬</span>
                <p className="text-white font-semibold">Select a conversation</p>
                <p className="text-forest-200/50 text-sm">Choose a chat from the list</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

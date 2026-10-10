import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Trash2, X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const TYPE_STYLE = {
  success: { icon: CheckCircle2,  cls: 'glass-green text-forest-300' },
  error:   { icon: AlertCircle,   cls: 'bg-red-500/15 text-red-400' },
  warning: { icon: AlertTriangle, cls: 'glass-orange text-ember-400' },
  info:    { icon: Info,          cls: 'glass text-forest-200' },
};

const dayLabel = (date) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-PH', { weekday: 'long', month: 'short', day: 'numeric' });
};

const timeLabel = (date) => new Date(date).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

export default function Notifications() {
  const { notifications, markAllRead, removeNotification, clearAll } = useNotification();

  // Remember what was unread when the page opened so it stays highlighted for this visit,
  // then mark everything read (clears the bell badge)
  const [newIds] = useState(() => new Set(notifications.filter(n => !n.read).map(n => n.id)));
  useEffect(() => { markAllRead(); }, [markAllRead]);

  const groups = useMemo(() => {
    const out = [];
    for (const n of notifications) {
      const label = dayLabel(n.createdAt);
      const last = out[out.length - 1];
      if (last?.label === label) last.items.push(n);
      else out.push({ label, items: [n] });
    }
    return out;
  }, [notifications]);

  const handleClearAll = () => {
    if (window.confirm('Clear all notifications?')) clearAll();
  };

  return (
    <div className="max-w-2xl space-y-4 pb-20 lg:pb-0 animate-fade-up">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Notifications</h1>
          {newIds.size > 0 && <p className="text-forest-200/60 text-sm">{newIds.size} new</p>}
        </div>
        {notifications.length > 0 && (
          <div className="flex gap-2">
            <button onClick={markAllRead} aria-label="Mark all read" title="Mark all read"
              className="glass hover:glass-green transition-all text-forest-200 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap">
              <CheckCheck className="w-4 h-4" /> <span className="hidden md:inline">Mark all read</span>
            </button>
            <button onClick={handleClearAll} aria-label="Clear all" title="Clear all"
              className="glass hover:text-red-400 transition-all text-forest-200 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap">
              <Trash2 className="w-4 h-4" /> <span className="hidden md:inline">Clear all</span>
            </button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="glass rounded-3xl py-16 px-6 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 glass rounded-3xl flex items-center justify-center">
            <Bell className="w-8 h-8 text-forest-300/40" />
          </div>
          <p className="text-white font-semibold">You're all caught up</p>
          <p className="text-forest-200/50 text-sm">Updates about your orders and account will show up here.</p>
        </div>
      ) : (
        groups.map(group => (
          <section key={group.label} className="space-y-2">
            <p className="text-forest-200/50 text-xs font-semibold uppercase tracking-wide px-1">{group.label}</p>
            <div className="glass rounded-2xl overflow-hidden divide-y divide-white/5">
              {group.items.map(n => {
                const { icon: Icon, cls } = TYPE_STYLE[n.type] || TYPE_STYLE.info;
                const isNew = newIds.has(n.id);
                return (
                  <div key={n.id} className={`flex items-start gap-3 px-4 py-3.5 ${isNew ? 'bg-white/5' : ''}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cls}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${isNew ? 'text-white font-medium' : 'text-forest-100/80'}`}>{n.message}</p>
                      <p className="text-forest-200/40 text-xs mt-1 flex items-center gap-2">
                        {timeLabel(n.createdAt)}
                        {isNew && <span className="w-1.5 h-1.5 rounded-full bg-ember-400" aria-label="New" />}
                      </p>
                    </div>
                    <button onClick={() => removeNotification(n.id)} aria-label="Delete notification"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-forest-300/50 hover:text-red-400 hover:glass transition-all flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

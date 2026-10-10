import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNotification } from './NotificationContext';

// Server notifications for one part of the app (customer, restaurant panel or rider panel).
// `request` is that part's authenticated fetch helper; `audience` picks which notifications.
// Polls the unread count so the bell stays current and a toast appears when something new arrives.
const POLL_MS = 30000;

const NotificationFeedContext = createContext(null);

export function NotificationFeedProvider({ request, audience, enabled = true, basePath = '', children }) {
  const { addNotification } = useNotification();
  const [items, setItems]     = useState([]);
  const [unread, setUnread]   = useState(0);
  const [loading, setLoading] = useState(false);
  const lastSeenId = useRef(null); // newest notification id we've already seen (no toast for it)

  const q = `audience=${audience}`;

  const poll = useCallback(async () => {
    if (!enabled) return;
    try {
      const { unread: n, latest } = await request(`/notifications/unread?${q}`);
      setUnread(n);
      if (latest) {
        if (lastSeenId.current !== null && latest.id > lastSeenId.current && !latest.read) {
          addNotification(latest.title, latest.type === 'error' ? 'error' : latest.type === 'warning' ? 'warning' : latest.type === 'success' ? 'success' : 'info');
        }
        lastSeenId.current = Math.max(lastSeenId.current ?? 0, latest.id);
      } else if (lastSeenId.current === null) {
        lastSeenId.current = 0;
      }
    } catch { /* offline or signed out: try again next tick */ }
  }, [request, q, enabled, addNotification]);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const { data, unread: n } = await request(`/notifications?${q}&limit=50`);
      setItems(data);
      setUnread(n);
      if (data[0]) lastSeenId.current = Math.max(lastSeenId.current ?? 0, data[0].id);
    } catch { /* keep what we have */ } finally {
      setLoading(false);
    }
  }, [request, q, enabled]);

  useEffect(() => {
    if (!enabled) { setItems([]); setUnread(0); lastSeenId.current = null; return; }
    poll();
    const t = setInterval(() => { if (document.visibilityState === 'visible') poll(); }, POLL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') poll(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [enabled, poll]);

  const markRead = useCallback(async (id) => {
    setItems(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    setUnread(n => Math.max(0, n - 1));
    try { await request(`/notifications/${id}/read`, { method: 'PATCH' }); } catch { /* ignore */ }
  }, [request]);

  const markAllRead = useCallback(async () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
    try { await request('/notifications/read-all', { method: 'POST', body: JSON.stringify({ audience }) }); } catch { /* ignore */ }
  }, [request, audience]);

  const remove = useCallback(async (id) => {
    setItems(prev => prev.filter(n => n.id !== id));
    try { await request(`/notifications/${id}`, { method: 'DELETE' }); } catch { /* ignore */ }
  }, [request]);

  const clearAll = useCallback(async () => {
    setItems([]);
    setUnread(0);
    try { await request(`/notifications?${q}`, { method: 'DELETE' }); } catch { /* ignore */ }
  }, [request, q]);

  return (
    <NotificationFeedContext.Provider value={{ items, unread, loading, load, markRead, markAllRead, remove, clearAll, basePath }}>
      {children}
    </NotificationFeedContext.Provider>
  );
}

export const useNotificationFeed = () => useContext(NotificationFeedContext);

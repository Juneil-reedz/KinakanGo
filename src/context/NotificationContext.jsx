import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import ToastContainer from '../components/ToastContainer';

const NotificationContext = createContext();

// Notifications are kept in this browser so the Notifications page survives reloads
const STORAGE_KEY = 'kkg_notifications';
const MAX_KEPT    = 50;

const loadSaved = () => {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(list) ? list.slice(0, MAX_KEPT) : [];
  } catch {
    return [];
  }
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts]             = useState([]);
  const [notifications, setNotifications] = useState(loadSaved);

  useEffect(() => {
    try {
      if (notifications.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* storage full or unavailable: keep them in memory only */ }
  }, [notifications]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    // Show toast
    setToasts(prev => [...prev, { id, message, type, duration }]);
    // Add to persistent list
    setNotifications(prev => [
      { id, message, type, read: false, createdAt: new Date().toISOString() },
      ...prev.slice(0, MAX_KEPT - 1),
    ]);
    return id;
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      addNotification,
      addToast: addNotification,
      showSuccess: (m, d) => addNotification(m, 'success', d),
      showError:   (m, d) => addNotification(m, 'error',   d),
      showWarning: (m, d) => addNotification(m, 'warning', d),
      showInfo:    (m, d) => addNotification(m, 'info',    d),
      notifications,
      unreadCount,
      markAllRead,
      markRead,
      removeNotification,
      clearAll,
    }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </NotificationContext.Provider>
  );
};

import { createContext, useContext, useState, useCallback } from 'react';
import ToastContainer from '../components/ToastContainer';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts]             = useState([]);
  const [notifications, setNotifications] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    // Show toast
    setToasts(prev => [...prev, { id, message, type, duration }]);
    // Add to persistent list
    setNotifications(prev => [
      { id, message, type, read: false, createdAt: new Date() },
      ...prev.slice(0, 19), // keep last 20
    ]);
    return id;
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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
      clearAll,
    }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </NotificationContext.Provider>
  );
};

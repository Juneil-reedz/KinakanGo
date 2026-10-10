import { createContext, useContext, useState, useCallback } from 'react';
import ToastContainer from '../components/ToastContainer';

// Pop-up toasts. The persistent notification list lives on the server (see NotificationFeed).
const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  return (
    <NotificationContext.Provider value={{
      addNotification,
      addToast: addNotification,
      showSuccess: (m, d) => addNotification(m, 'success', d),
      showError:   (m, d) => addNotification(m, 'error',   d),
      showWarning: (m, d) => addNotification(m, 'warning', d),
      showInfo:    (m, d) => addNotification(m, 'info',    d),
    }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </NotificationContext.Provider>
  );
};

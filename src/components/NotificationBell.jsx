import { useLocation, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotificationFeed } from '../context/NotificationFeed';

// Bell with unread badge; opens this area's Notifications page (e.g. /notifications, /owner/notifications)
export default function NotificationBell({ to, className = '' }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { unread = 0 } = useNotificationFeed() || {};
  return (
    <button onClick={() => navigate(to)} aria-label={`Notifications${unread ? ` (${unread} new)` : ''}`}
      className={`relative w-9 h-9 rounded-xl flex items-center justify-center text-forest-100 hover:glass-green transition-all flex-shrink-0
        ${pathname === to ? 'glass-green' : 'glass'} ${className}`}>
      <Bell className="w-5 h-5" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 btn-glow-orange rounded-full text-white text-[10px] flex items-center justify-center font-bold">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}

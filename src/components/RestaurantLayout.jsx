import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRestaurant } from '../context/RestaurantContext';
import { useNotification } from '../context/NotificationContext';
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, BarChart3, Settings, ChevronLeft, ChevronRight, Store, Home, LogOut, MessageSquare, ToggleLeft, ToggleRight } from 'lucide-react';

const NAV = [
  { path:'/owner/dashboard', label:'Dashboard', icon:LayoutDashboard },
  { path:'/owner/orders',    label:'Orders',    icon:ShoppingBag },
  { path:'/owner/messages',  label:'Messages',  icon:MessageSquare },
  { path:'/owner/menu',      label:'Menu',      icon:UtensilsCrossed },
  { path:'/owner/reports',   label:'Reports',   icon:BarChart3 },
  { path:'/owner/settings',  label:'Settings',  icon:Settings },
];

export default function RestaurantLayout({ children }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const { restaurant, isLoading, logout, updateRestaurant } = useRestaurant();
  const { addNotification } = useNotification();
  const [collapsed, setCollapsed] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    if (!isLoading && !restaurant) navigate('/owner/login', { replace: true });
  }, [restaurant, isLoading, navigate]);

  const isActive = (p) => location.pathname === p;

  const handleLogout = () => { logout(); navigate('/owner/login'); };

  const toggleOpen = async () => {
    if (savingStatus) return;
    const next = !(restaurant?.is_open ?? true);
    setSavingStatus(true);
    try {
      await updateRestaurant({ isOpen: next });
      addNotification(next ? 'Restaurant is now open' : 'Restaurant is now closed', 'success');
    } catch {
      addNotification('Failed to update restaurant status', 'error');
    } finally {
      setSavingStatus(false);
    }
  };

  if (isLoading || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-ember-400/30 border-t-ember-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`glass-dark flex-shrink-0 relative transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}
        style={{ borderRight:'1px solid rgba(255,255,255,.07)' }}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`p-5 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}
            style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
            <div className="w-12 h-12 btn-glow-orange rounded-2xl flex items-center justify-center flex-shrink-0">
              <Store className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <div>
                <p className="text-white font-heading font-bold text-sm truncate">{restaurant?.name || 'Restaurant'}</p>
                <p className="text-forest-200/50 text-xs">Owner Portal</p>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-5 space-y-1">
            {NAV.map(({ path, label, icon:Icon }) => (
              <Link key={path} to={path} title={collapsed ? label : ''}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${collapsed ? 'justify-center' : ''}
                  ${isActive(path) ? 'btn-glow-orange text-white' : 'text-forest-100/60 hover:glass hover:text-white'}`}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            ))}
          </nav>

          {/* User */}
          <div className="px-3 pb-5 space-y-2" style={{ borderTop:'1px solid rgba(255,255,255,.07)', paddingTop:'1rem' }}>
            {!collapsed && restaurant && (
              <div className="glass rounded-xl px-3 py-2.5 mb-2">
                <p className="text-white text-xs font-semibold truncate">{restaurant.name}</p>
                <p className={`text-xs truncate ${(restaurant.is_open ?? true) ? 'text-forest-300' : 'text-red-300'}`}>
                  {(restaurant.is_open ?? true) ? 'Open for orders' : 'Closed - hidden from customers'}
                </p>
              </div>
            )}
            <button onClick={toggleOpen} disabled={savingStatus} title={collapsed ? ((restaurant?.is_open ?? true) ? 'Close Restaurant' : 'Open Restaurant') : ''}
              className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm transition-all disabled:opacity-60 ${collapsed ? 'justify-center' : ''} ${(restaurant?.is_open ?? true) ? 'glass-green text-forest-100' : 'bg-red-500/20 text-red-200 hover:bg-red-500/30'}`}>
              {(restaurant?.is_open ?? true)
                ? <ToggleRight className="w-4 h-4 flex-shrink-0" />
                : <ToggleLeft className="w-4 h-4 flex-shrink-0" />}
              {!collapsed && ((restaurant?.is_open ?? true) ? 'Open' : 'Closed')}
            </button>
            <button onClick={() => navigate('/')} title={collapsed ? 'Customer Home' : ''}
              className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-forest-200/50 hover:text-white hover:glass-green text-sm transition-all ${collapsed ? 'justify-center' : ''}`}>
              <Home className="w-4 h-4 flex-shrink-0" />{!collapsed && 'Customer Home'}
            </button>
            <button onClick={handleLogout} title={collapsed ? 'Logout' : ''}
              className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-forest-200/50 hover:text-white hover:glass-orange text-sm transition-all ${collapsed ? 'justify-center' : ''}`}>
              <LogOut className="w-4 h-4 flex-shrink-0" />{!collapsed && 'Logout'}
            </button>
          </div>

          {/* Collapse toggle */}
          <button onClick={() => setCollapsed(c=>!c)}
            className="absolute -right-3 top-24 w-6 h-6 glass rounded-full flex items-center justify-center hover:glass-orange transition-all z-10">
            {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-forest-200" /> : <ChevronLeft className="w-3.5 h-3.5 text-forest-200" />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="glass-dark px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
          <div>
            <h2 className="text-white font-heading font-bold">{NAV.find(n => location.pathname.startsWith(n.path))?.label || 'Dashboard'}</h2>
            <p className="text-forest-200/50 text-xs">Your recent activity</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleOpen} disabled={savingStatus}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-60 ${(restaurant?.is_open ?? true) ? 'glass-green text-forest-100' : 'bg-red-500/20 text-red-200'}`}>
              {(restaurant?.is_open ?? true) ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {(restaurant?.is_open ?? true) ? 'Open' : 'Closed'}
            </button>
            <div className="w-9 h-9 btn-glow-orange rounded-xl flex items-center justify-center font-bold text-white text-sm">
              {restaurant?.name?.charAt(0) || 'R'}
            </div>
          </div>
        </header>
        <main className="flex-1 p-5 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

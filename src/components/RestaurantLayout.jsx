import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRestaurant } from '../context/RestaurantContext';
import { useNotification } from '../context/NotificationContext';
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, BarChart3, Settings, ChevronLeft, ChevronRight, Store, Home, LogOut, MessageSquare, ToggleLeft, ToggleRight, AlertTriangle, Wallet, Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';

const NAV = [
  { path:'/owner/dashboard', label:'Dashboard', icon:LayoutDashboard },
  { path:'/owner/orders',    label:'Orders',    icon:ShoppingBag },
  { path:'/owner/issues',    label:'Problems',  icon:AlertTriangle },
  { path:'/owner/messages',  label:'Messages',  icon:MessageSquare },
  { path:'/owner/menu',      label:'Menu',      icon:UtensilsCrossed },
  { path:'/owner/rider-pay', label:'Rider Pay', icon:Wallet },
  { path:'/owner/reports',   label:'Reports',   icon:BarChart3 },
  { path:'/owner/settings',  label:'Settings',  icon:Settings },
];

export default function RestaurantLayout({ children }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const { restaurant, isLoading, logout, updateRestaurant } = useRestaurant();
  const { addNotification } = useNotification();
  const [collapsedDesktop, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false); // phone drawer
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    if (!isLoading && !restaurant) navigate('/owner/login', { replace: true });
  }, [restaurant, isLoading, navigate]);

  const isActive = (p) => location.pathname === p;
  // Close the phone drawer whenever the page changes
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/owner/login', { replace: true }); };

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

  // Shared by the desktop sidebar and the phone drawer (the drawer is never collapsed)
  const sidebarContent = (mobile) => {
    const collapsed = mobile ? false : collapsedDesktop;
    return (
          <div className="flex flex-col h-full min-h-0">
            {/* Logo */}
            <div className={`p-5 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}
              style={{ borderBottom:'1px solid rgba(var(--fg-rgb),.07)' }}>
              <div className="w-12 h-12 btn-glow-orange rounded-2xl flex items-center justify-center flex-shrink-0">
                <Store className="w-6 h-6 text-white" />
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-white font-heading font-bold text-sm truncate">{restaurant?.name || 'Restaurant'}</p>
                  <p className="text-forest-200/50 text-xs">Owner Portal</p>
                </div>
              )}
              {mobile && (
                <button onClick={() => setMobileOpen(false)} aria-label="Close menu"
                  className="w-9 h-9 glass rounded-xl flex items-center justify-center text-forest-100 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
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
            <div className="px-3 pb-5 space-y-2" style={{ borderTop:'1px solid rgba(var(--fg-rgb),.07)', paddingTop:'1rem' }}>
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

          </div>
    );
  };

  // Phone bottom bar: the busiest pages, plus "More" for the rest
  const BOTTOM = NAV.filter(n => ['/owner/dashboard','/owner/orders','/owner/issues','/owner/messages'].includes(n.path));

  return (
    <div className="min-h-screen flex">
      {/* Phone drawer */}
      {mobileOpen && <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/60 z-40 xl:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 glass-dark transform transition-transform duration-300 xl:hidden overflow-y-auto ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ borderRight:'1px solid rgba(var(--fg-rgb),.07)', background:'var(--panel-bg)' }} aria-hidden={!mobileOpen}>
        {sidebarContent(true)}
      </aside>

      {/* Desktop / tablet sidebar */}
      <aside className={`hidden xl:block glass-dark flex-shrink-0 relative transition-all duration-300 ${collapsedDesktop ? 'w-20' : 'w-64'}`}
        style={{ borderRight:'1px solid rgba(var(--fg-rgb),.07)' }}>
        {sidebarContent(false)}
        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(c=>!c)}
          className="absolute -right-3 top-24 w-6 h-6 glass rounded-full flex items-center justify-center hover:glass-orange transition-all z-10">
          {collapsedDesktop ? <ChevronRight className="w-3.5 h-3.5 text-forest-200" /> : <ChevronLeft className="w-3.5 h-3.5 text-forest-200" />}
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="glass-dark px-4 py-3 xl:px-6 xl:py-4 flex items-center justify-between gap-2 flex-shrink-0 sticky top-0 z-30 xl:static"
          style={{ borderBottom:'1px solid rgba(var(--fg-rgb),.07)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setMobileOpen(true)} aria-label="Open menu"
              className="xl:hidden w-9 h-9 glass rounded-xl flex items-center justify-center text-forest-100 flex-shrink-0">
              <Menu className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h2 className="text-white font-heading font-bold truncate">{NAV.find(n => location.pathname.startsWith(n.path))?.label || (location.pathname.startsWith('/owner/notifications') ? 'Notifications' : 'Dashboard')}</h2>
              <p className="text-forest-200/50 text-xs truncate hidden lg:block">Your recent activity</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell to="/owner/notifications" />
            <button onClick={toggleOpen} disabled={savingStatus}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-60 ${(restaurant?.is_open ?? true) ? 'glass-green text-forest-100' : 'bg-red-500/20 text-red-200'}`}>
              {(restaurant?.is_open ?? true) ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {(restaurant?.is_open ?? true) ? 'Open' : 'Closed'}
            </button>
            <div className="hidden lg:flex w-9 h-9 btn-glow-orange rounded-xl items-center justify-center font-bold text-white text-sm">
              {restaurant?.name?.charAt(0) || 'R'}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 pb-24 xl:p-6 xl:pb-6 overflow-auto">{children}</main>

        {/* Phone bottom bar */}
        <nav aria-label="Main" className="xl:hidden fixed bottom-0 left-0 right-0 z-30 glass-dark px-2 py-2 grid grid-cols-5 gap-1"
          style={{ borderTop:'1px solid rgba(var(--fg-rgb),.07)', background:'var(--panel-bg)' }}>
          {BOTTOM.map(({ path, label, icon:Icon }) => (
            <Link key={path} to={path}
              className={`rounded-xl py-2 flex flex-col items-center gap-1 text-[11px] font-semibold transition-all
                ${isActive(path) ? 'btn-glow-orange text-white' : 'text-forest-200/60'}`}>
              <Icon className="w-4 h-4" />{label}
            </Link>
          ))}
          <button onClick={() => setMobileOpen(true)}
            className={`rounded-xl py-2 flex flex-col items-center gap-1 text-[11px] font-semibold transition-all
              ${BOTTOM.some(n => isActive(n.path)) ? 'text-forest-200/60' : 'btn-glow-orange text-white'}`}>
            <Menu className="w-4 h-4" />More
          </button>
        </nav>
      </div>
    </div>
  );
}

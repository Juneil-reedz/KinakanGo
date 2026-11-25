import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useRestaurant } from '../context/RestaurantContext';
import { useRider } from '../context/RiderContext';
import {
  Home as HomeIcon, ShoppingBag, Heart, MessageCircle, Clock,
  Settings, Bell, ShoppingCart, Menu,
  ChevronLeft, CreditCard, MapPin, Plus, Minus, X,
  Crown, Utensils, Star, Zap, User, Store, Bike, Loader2, LogOut
} from 'lucide-react';

import CustomerBottomNav from './CustomerBottomNav';
import { useNotificationFeed } from '../context/NotificationFeed';

const NAV = [
  { key: 'dashboard',    label: 'Dashboard',    icon: HomeIcon,        path: '/' },
  { key: 'food-order',   label: 'Food Order',   icon: ShoppingBag,     path: '/restaurants' },
  { key: 'favorite',     label: 'Favorites',    icon: Heart,           path: '/favorites' },
  { key: 'message',      label: 'Messages',     icon: MessageCircle,   path: '/messages' },
  { key: 'notification', label: 'Notifications', icon: Bell,           path: '/notifications' },
  { key: 'order-history',label: 'Orders',       icon: Clock,           path: '/orders' },
  { key: 'setting',      label: 'Settings',     icon: Settings,        path: '/settings' },
];

export default function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { enterFromCustomer: enterRestaurant } = useRestaurant();
  const { enterFromCustomer: enterRider } = useRider();
  const { allItems: cartItems, updateQuantity, removeFromCart } = useCart();
  const drawerTotal = cartItems.reduce((n, i) => n + i.price * i.quantity, 0);
  const manyStores  = new Set(cartItems.map(i => String(i.restaurantId))).size > 1;
  const [collapsed, setCollapsed]       = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [dashLoading, setDashLoading]   = useState(false);

  const goToRestaurantDashboard = async () => {
    setDashLoading(true);
    try {
      await enterRestaurant();
      navigate('/owner/dashboard');
    } catch {
      navigate('/owner/login');
    } finally {
      setDashLoading(false);
    }
  };

  const goToRiderDashboard = async () => {
    setDashLoading(true);
    try {
      await enterRider();
      navigate('/rider/dashboard');
    } catch {
      navigate('/rider/login');
    } finally {
      setDashLoading(false);
    }
  };


  const getActive = () => {
    const p = location.pathname;
    if (p === '/') return 'dashboard';
    if (p.startsWith('/restaurants') || p.startsWith('/restaurant/')) return 'food-order';
    if (p === '/favorites') return 'favorite';
    if (p === '/messages') return 'message';
    if (p === '/orders') return 'order-history';
    if (p === '/settings') return 'setting';
    return 'other'; // profile, tracking, cart…: no home-only header
  };
  const active = getActive(); // drives the header and right panel

  // Menu highlight: only light up an item when we're actually in that section
  const getNavKey = () => {
    const p = location.pathname;
    if (p === '/') return 'dashboard';
    if (p.startsWith('/restaurants') || p.startsWith('/restaurant/') || p === '/search') return 'food-order';
    if (p === '/favorites') return 'favorite';
    if (p === '/messages') return 'message';
    if (p === '/orders' || p.startsWith('/order-')) return 'order-history';
    if (p === '/settings' || p === '/change-password') return 'setting';
    if (p === '/notifications') return 'notification';
    return null;
  };
  const navKey = getNavKey();

  const { unread: unreadNotifications = 0 } = useNotificationFeed() || {};

  const handleNav = (path) => { navigate(path); setMobileOpen(false); };

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/login', { replace: true });
  };

  const handleUpdateQty = (id, delta) => {
    const item = cartItems.find(i => i.id === id);
    if (!item) return;
    const qty = item.quantity + delta;
    qty > 0 ? updateQuantity(id, qty) : removeFromCart(id);
  };

  const rightPanelPages = ['favorite','message','order-history','setting','upgrade'];
  const showVideoPanel = rightPanelPages.includes(active);

  return (
    <div className="flex h-screen overflow-hidden relative">

      {/* ── Ambient background orbs ── */}
      <div className="orb w-96 h-96 bg-forest-600/20 top-[-5rem] left-[-5rem]" />
      <div className="orb w-80 h-80 bg-ember-500/10 bottom-10 right-10" />
      <div className="orb w-60 h-60 bg-forest-400/15 top-1/2 left-1/3" />

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
             onClick={() => setMobileOpen(false)} />
      )}

      {/* ══════════════════════════════
          LEFT SIDEBAR
      ══════════════════════════════ */}
      <aside className={`
        flex flex-col glass-dark clay-forest-bar z-50 h-full transition-all duration-300
        ${collapsed ? 'w-20' : 'w-64'}
        fixed lg:relative
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `} style={{ boxShadow: '4px 0 32px rgba(0,0,0,.4), 1px 0 0 rgba(var(--fg-rgb),.06)' }}>

        {/* Logo row */}
        <div className={`flex items-center ${collapsed ? 'justify-center py-5' : 'justify-between px-4 py-3'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <button onClick={() => { navigate('/profile', { state: { tab: 'profile' } }); setMobileOpen(false); }} aria-label="Profile"
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-ember-400/60 flex items-center justify-center glass flex-shrink-0">
                {user?.avatar
                  ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  : <User className="w-5 h-5 text-forest-100" />}
              </button>
              <div className="min-w-0">
                <p className="font-heading font-bold text-white text-sm leading-tight truncate">{user?.name || 'Guest'}</p>
                <p className="text-forest-200 text-xs truncate">{user?.email || 'Welcome to KinakanGo'}</p>
              </div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="flex-shrink-0 w-8 h-8 rounded-lg glass flex items-center justify-center text-forest-200 hover:text-white hover:glass-green transition-all">
            {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>


        {/* Nav items */}
        <nav className="flex-1 px-3 overflow-y-auto scrollbar-hide space-y-1">
          {NAV.map(({ key, label, icon: Icon, path }) => {
            const isActive = navKey === key;
            return (
              <button key={key} onClick={() => handleNav(path)} title={collapsed ? label : ''}
                aria-label={key === 'notification' && unreadNotifications > 0 ? `${label} (${unreadNotifications} new)` : label}
                className={`
                  relative w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'}
                  px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
                  ${isActive
                    ? 'clay-active'
                    : 'text-forest-100/70 hover:text-white hover:glass-green'}
                `}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
                {key === 'notification' && unreadNotifications > 0 && (
                  <span className={`${collapsed ? 'absolute top-1 right-1' : 'ml-auto'} min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center
                    btn-glow-orange text-white`}>
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
                {!collapsed && isActive && !(key === 'notification' && unreadNotifications > 0) && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-ember-500" />}
              </button>
            );
          })}
          <button onClick={handleLogout} title={collapsed ? 'Logout' : ''}
            className={`
              w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'}
              px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
              text-red-300/80 hover:text-white hover:glass-orange
            `}>
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="truncate">Logout</span>}
          </button>
        </nav>

        {/* Upgrade / Dashboard card */}
        {!collapsed && (
          <div className="p-4">
            {user?.has_restaurant ? (
              <div className="glass-green rounded-2xl p-4 relative overflow-hidden">
                <div className="orb w-24 h-24 bg-forest-400/20 -top-4 -right-4" />
                <Store className="w-6 h-6 text-forest-300 mb-2" />
                <p className="text-white font-bold text-sm mb-1">Restaurant Dashboard</p>
                <p className="text-forest-200/70 text-xs mb-3">Manage your restaurant & orders</p>
                <button onClick={goToRestaurantDashboard} disabled={dashLoading}
                  className="w-full py-2 rounded-xl btn-glow-green text-white text-xs font-bold flex items-center justify-center gap-1.5">
                  {dashLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {dashLoading ? 'Opening...' : 'Open Dashboard'}
                </button>
              </div>
            ) : user?.has_rider_profile ? (
              <div className="glass-teal rounded-2xl p-4 relative overflow-hidden">
                <div className="orb w-24 h-24 bg-tawi-teal/20 -top-4 -right-4" />
                <Bike className="w-6 h-6 text-teal-300 mb-2" />
                <p className="text-white font-bold text-sm mb-1">Rider Dashboard</p>
                <p className="text-forest-200/70 text-xs mb-3">Accept deliveries & track earnings</p>
                <button onClick={goToRiderDashboard}
                  className="w-full py-2 rounded-xl btn-glow-teal text-white text-xs font-bold">
                  Open Dashboard
                </button>
              </div>
            ) : (
              <div className="glass-orange rounded-2xl p-4 relative overflow-hidden">
                <div className="orb w-24 h-24 bg-ember-400/30 -top-4 -right-4" />
                <Zap className="w-6 h-6 text-ember-300 mb-2" />
                <p className="text-white font-bold text-sm mb-1">Upgrade Account</p>
                <p className="text-ember-200/80 text-xs mb-3">Become a restaurant owner or rider</p>
                <button onClick={() => navigate('/upgrade')}
                  className="w-full py-2 rounded-xl btn-glow-orange text-white text-xs font-bold">
                  Upgrade Now
                </button>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ══════════════════════════════
          MAIN CONTENT
      ══════════════════════════════ */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header — dashboard only */}
        {active === 'dashboard' && (
          <header className="glass-dark clay-forest-bar flex-shrink-0 px-4 md:px-6 py-3 flex items-center gap-3" style={{ background: 'transparent', boxShadow: 'none' }}>

            {/* Menu (left) · KinakanGo (centre) · profile (right) */}
            <button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu"
              className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0">
              <Menu className="w-6 h-6" />
            </button>

            <h1 className="brand-wordmark flex-1 text-center text-white text-2xl leading-none select-none">
              Kinakan<span className="text-ember-500">Go</span>
            </h1>

            <button onClick={() => navigate('/cart')} aria-label="Cart"
              className="relative hidden lg:flex w-10 h-10 glass rounded-xl items-center justify-center text-forest-100 hover:glass-green transition-all flex-shrink-0">
              <ShoppingCart className="w-5 h-5" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 btn-glow-orange rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                  {cartItems.length}
                </span>
              )}
            </button>
            <button onClick={() => navigate('/profile', { state: { tab: 'profile' } })} aria-label="Profile"
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-ember-400/60 hover:border-ember-400 transition-all flex items-center justify-center glass flex-shrink-0">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : <User className="w-5 h-5 text-forest-100" />
              }
            </button>
          </header>
        )}

        {/* Other customer pages have no top bar: the menu, theme and
            notification buttons only show on the home dashboard */}

        {/* Page content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-6">
          <div key={location.pathname} className="page-enter"><Outlet /></div>
        </div>
      </main>

      {/* ══════════════════════════════
          RIGHT PANEL
      ══════════════════════════════ */}
      <aside className="hidden xl:flex w-80 flex-col glass-dark overflow-y-auto scrollbar-hide"
        style={{ borderLeft: '1px solid rgba(var(--fg-rgb),.07)', boxShadow: '-4px 0 32px rgba(0,0,0,.3)' }}>

        {showVideoPanel ? (
          /* Video / promo panel */
          <div className="flex flex-col h-full items-center justify-center p-6 gap-6">
            <div className="text-center">
              <div className="flex justify-center gap-4 mb-3 text-ember-400">
                <Utensils className="w-7 h-7 animate-float" />
                <ShoppingBag className="w-7 h-7 animate-float-delay" />
                <Heart className="w-7 h-7 animate-float-delay2" />
              </div>
              <p className="text-2xl font-heading font-bold text-white text-glow-green">Tap it. Get it.</p>
              <p className="text-forest-200 mt-1">Bongao Taste</p>
            </div>
            <video src={`${import.meta.env.BASE_URL}assets/sidebar-video.mp4`}
              className="w-full rounded-2xl border-2 border-white/10 shadow-2xl"
              autoPlay loop muted playsInline />
            <div className="w-full glass rounded-2xl p-4 grid grid-cols-3 gap-3 text-center">
              {[{icon: Clock, label:'30 min'},{icon: MapPin, label:'Track'},{icon: CreditCard, label:'Easy Pay'}].map(({icon:Icon,label}) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <Icon className="w-5 h-5 text-ember-400" />
                  <span className="text-forest-100 text-xs">{label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Cart panel */
          <div className="p-5 flex flex-col gap-5">

            {/* Address */}
            {(() => {
              const defaultAddr = (user?.addresses || []).find(a => a.isDefault) || (user?.addresses || [])[0];
              return (
                <div className="glass rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white text-sm font-semibold">Delivery Address</p>
                    <button
                      onClick={() => { navigate('/addresses'); setMobileOpen(false); }}
                      className="text-ember-400 text-xs font-medium hover:text-ember-300 transition-colors">
                      {defaultAddr ? 'Change' : 'Add Address'}
                    </button>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-forest-300 mt-0.5 flex-shrink-0" />
                    {defaultAddr
                      ? <p className="text-forest-100/70 text-xs">{defaultAddr.label ? `${defaultAddr.label} — ` : ''}{defaultAddr.address || defaultAddr.street || 'No address set'}</p>
                      : <p className="text-forest-100/40 text-xs italic">No delivery address set</p>
                    }
                  </div>
                </div>
              );
            })()}

            {/* Cart items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-semibold text-sm">Order Menu</p>
                {cartItems.length > 0 && (
                  <span className="glass-orange text-ember-300 text-xs px-2 py-0.5 rounded-full">{cartItems.length} items</span>
                )}
              </div>

              {cartItems.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {cartItems.map(item => (
                    <div key={item.id} className="glass rounded-xl p-3 flex items-center gap-3 group relative">
                      <button onClick={() => removeFromCart(item.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 btn-glow-orange rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3 text-white" />
                      </button>
                      <img src={item.image} alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{item.name}</p>
                        <p className="text-ember-400 text-xs font-bold">₱{item.price}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleUpdateQty(item.id,-1)}
                          className="w-6 h-6 glass rounded-lg flex items-center justify-center hover:glass-orange transition-all">
                          <Minus className="w-3 h-3 text-forest-200" />
                        </button>
                        <span className="text-white text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button onClick={() => handleUpdateQty(item.id,1)}
                          className="w-6 h-6 glass rounded-lg flex items-center justify-center hover:glass-green transition-all">
                          <Plus className="w-3 h-3 text-forest-200" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass rounded-2xl py-8 flex flex-col items-center gap-2 mb-4">
                  <ShoppingCart className="w-10 h-10 text-forest-300/40" />
                  <p className="text-forest-200/50 text-sm">Your cart is empty</p>
                </div>
              )}

              {/* Coupon */}
              <button className="w-full text-left glass rounded-xl px-4 py-3 text-xs text-forest-200/60 hover:glass-green hover:text-forest-100 transition-all mb-3 border-dashed">
                🎟 Have a coupon code?
              </button>

              {/* Total */}
              <div className="glass-green rounded-xl p-3 flex justify-between items-center mb-3">
                <span className="text-forest-100 text-sm font-medium">Total</span>
                <span className="text-white font-heading font-bold text-xl">₱{drawerTotal.toFixed(2)}</span>
              </div>

              <button onClick={() => cartItems.length > 0 && navigate(manyStores ? '/cart' : '/checkout')}
                disabled={cartItems.length === 0}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
                  cartItems.length === 0
                    ? 'glass text-forest-200/30 cursor-not-allowed'
                    : 'btn-glow-orange text-white'
                }`}>
                Checkout →
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ── Mobile Bottom Nav ── */}
      <CustomerBottomNav />
    </div>
  );
}

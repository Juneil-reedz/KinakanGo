import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  Home as HomeIcon, ShoppingBag, Heart, MessageCircle, Clock,
  Settings, Search, Bell, ShoppingCart, Menu,
  ChevronLeft, CreditCard, MapPin, Plus, Minus, X,
  Crown, Utensils, Star, Zap, User
} from 'lucide-react';

const NAV = [
  { key: 'dashboard',    label: 'Dashboard',    icon: HomeIcon,        path: '/' },
  { key: 'food-order',   label: 'Food Order',   icon: ShoppingBag,     path: '/restaurants' },
  { key: 'favorite',     label: 'Favorites',    icon: Heart,           path: '/favorites' },
  { key: 'message',      label: 'Messages',     icon: MessageCircle,   path: '/messages' },
  { key: 'order-history',label: 'Orders',       icon: Clock,           path: '/orders' },
  { key: 'setting',      label: 'Settings',     icon: Settings,        path: '/settings' },
];

export default function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { cartItems, updateQuantity, removeFromCart, getCartTotal } = useCart();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getActive = () => {
    const p = location.pathname;
    if (p === '/') return 'dashboard';
    if (p.startsWith('/restaurants') || p.startsWith('/restaurant/')) return 'food-order';
    if (p === '/favorites') return 'favorite';
    if (p === '/messages') return 'message';
    if (p === '/orders') return 'order-history';
    if (p === '/settings') return 'setting';
    return 'dashboard';
  };
  const active = getActive();

  const handleNav = (path) => { navigate(path); setMobileOpen(false); };

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
        flex flex-col glass-dark z-50 h-full transition-all duration-300
        ${collapsed ? 'w-20' : 'w-64'}
        fixed lg:relative
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `} style={{ boxShadow: '4px 0 32px rgba(0,0,0,.4), 1px 0 0 rgba(255,255,255,.06)' }}>

        {/* Logo row */}
        <div className={`flex items-center ${collapsed ? 'justify-center py-5' : 'justify-between px-4 py-3'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl btn-glow-green flex items-center justify-center flex-shrink-0">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-bold text-white text-sm leading-tight truncate">KinakanGo</p>
                <p className="text-forest-200 text-xs truncate">Bongao Taste</p>
              </div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="flex-shrink-0 w-8 h-8 rounded-lg glass flex items-center justify-center text-forest-200 hover:text-white hover:glass-green transition-all">
            {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User chip */}
        {!collapsed && (
          <div className="mx-4 mb-4 p-3 glass-green rounded-2xl flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-forest-300/40 flex items-center justify-center glass-dark">
                {user?.avatar
                  ? <img src={user.avatar} alt="user" className="w-full h-full object-cover" />
                  : <User className="w-5 h-5 text-forest-300/70" />
                }
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-forest-300 rounded-full border-2 border-forest-900" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white font-semibold text-sm truncate">{user?.name || 'Patricia'}</p>
              <p className="text-forest-200 text-xs truncate flex items-center gap-1">
                <Crown className="w-3 h-3 text-ember-300" /> Premium
              </p>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-3 overflow-y-auto scrollbar-hide space-y-1">
          {NAV.map(({ key, label, icon: Icon, path }) => {
            const isActive = active === key;
            return (
              <button key={key} onClick={() => handleNav(path)} title={collapsed ? label : ''}
                className={`
                  w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'}
                  px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
                  ${isActive
                    ? 'btn-glow-orange text-white shadow-lg'
                    : 'text-forest-100/70 hover:text-white hover:glass-green'}
                `}>
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                {!collapsed && <span className="truncate">{label}</span>}
                {!collapsed && isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />}
              </button>
            );
          })}
        </nav>

        {/* Upgrade card */}
        {!collapsed && (
          <div className="p-4">
            <div className="glass-orange rounded-2xl p-4 relative overflow-hidden">
              <div className="orb w-24 h-24 bg-ember-400/30 -top-4 -right-4" />
              <Zap className="w-6 h-6 text-ember-300 mb-2" />
              <p className="text-white font-bold text-sm mb-1">Upgrade Account</p>
              <p className="text-ember-200/80 text-xs mb-3">Unlock all features & benefits</p>
              <button onClick={() => navigate('/upgrade')}
                className="w-full py-2 rounded-xl btn-glow-orange text-white text-xs font-bold">
                Upgrade Now
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ══════════════════════════════
          MAIN CONTENT
      ══════════════════════════════ */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header — dashboard only */}
        {active === 'dashboard' && (
          <header className="glass-dark flex-shrink-0 px-4 md:px-6 py-3 flex items-center gap-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,.07)', boxShadow: '0 4px 24px rgba(0,0,0,.3)' }}>

            {/* Mobile menu btn */}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-9 h-9 glass rounded-xl flex items-center justify-center text-forest-100">
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden lg:flex items-center gap-2 min-w-0">
              <span className="text-forest-100/60 text-sm">Hello,</span>
              <span className="text-white font-semibold text-sm truncate">{user?.name || 'Patricia'}</span>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/60" />
              <input
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter' && searchQuery.trim()) { navigate(`/restaurants?search=${encodeURIComponent(searchQuery)}`); setSearchQuery(''); } }}
                placeholder="Search food or restaurants…"
                className="w-full input-glass pl-10 pr-4 py-2 text-sm"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => navigate('/cart')} className="relative hidden lg:flex w-9 h-9 glass rounded-xl items-center justify-center text-forest-100 hover:glass-green transition-all">
                <ShoppingCart className="w-5 h-5" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 btn-glow-orange rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                    {cartItems.length}
                  </span>
                )}
              </button>
              <button className="relative w-9 h-9 glass rounded-xl hidden xs:flex items-center justify-center text-forest-100 hover:glass-green transition-all">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-ember-400 rounded-full" />
              </button>
              <button onClick={() => navigate('/profile')}
                className="w-9 h-9 rounded-full overflow-hidden border-2 border-ember-400/50 hover:border-ember-400 transition-all flex items-center justify-center glass-dark">
                {user?.avatar
                  ? <img src={user.avatar} alt="user" className="w-full h-full object-cover" />
                  : <User className="w-5 h-5 text-forest-300/70" />
                }
              </button>
            </div>
          </header>
        )}

        {/* Page content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-6">
          <Outlet />
        </div>
      </main>

      {/* ══════════════════════════════
          RIGHT PANEL
      ══════════════════════════════ */}
      <aside className="hidden xl:flex w-80 flex-col glass-dark overflow-y-auto scrollbar-hide"
        style={{ borderLeft: '1px solid rgba(255,255,255,.07)', boxShadow: '-4px 0 32px rgba(0,0,0,.3)' }}>

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
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white text-sm font-semibold">Delivery Address</p>
                <button className="text-ember-400 text-xs font-medium hover:text-ember-300">Change</button>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-forest-300 mt-0.5 flex-shrink-0" />
                <p className="text-forest-100/70 text-xs">Elm Street, 23</p>
              </div>
            </div>

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
                <span className="text-white font-heading font-bold text-xl">₱{getCartTotal().toFixed(2)}</span>
              </div>

              <button onClick={() => cartItems.length > 0 && navigate('/checkout')}
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
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden z-30 glass-dark"
        style={{ borderTop: '1px solid rgba(255,255,255,.08)', boxShadow: '0 -4px 24px rgba(0,0,0,.4)' }}>
        <div className="flex items-center justify-around px-2 py-2">
          {[
            { key:'dashboard',    icon:HomeIcon,      path:'/' },
            { key:'food-order',   icon:ShoppingBag,   path:'/restaurants' },
            { key:'cart',         icon:ShoppingCart,  path:'/cart', badge: cartItems.length },
            { key:'favorite',     icon:Heart,         path:'/favorites' },
            { key:'order-history',icon:Clock,         path:'/orders' },
          ].map(({ key, icon: Icon, path, badge }) => {
            const isAct = key === 'cart' ? location.pathname === '/cart' : active === key;
            return (
              <button key={key} onClick={() => navigate(path)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl flex-1 relative transition-all
                  ${isAct ? 'text-ember-400' : 'text-forest-200/50 hover:text-forest-100'}`}>
                <Icon className="w-5 h-5" />
                {badge > 0 && (
                  <span className="absolute top-1 right-1/2 translate-x-2 w-4 h-4 btn-glow-orange rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                    {badge}
                  </span>
                )}
                {isAct && <div className="w-1 h-1 rounded-full bg-ember-400 mt-1" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

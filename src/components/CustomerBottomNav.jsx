import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Home as HomeIcon, ShoppingBag, ShoppingCart, Heart, Clock } from 'lucide-react';

const ITEMS = [
  { key: 'dashboard',     label: 'Home',      icon: HomeIcon,     path: '/' },
  { key: 'food-order',    label: 'Food',      icon: ShoppingBag,  path: '/restaurants' },
  { key: 'cart',          label: 'Cart',      icon: ShoppingCart, path: '/cart' },
  { key: 'favorite',      label: 'Favorites', icon: Heart,        path: '/favorites' },
  { key: 'order-history', label: 'Orders',    icon: Clock,        path: '/orders' },
];

// Only highlight a tab when we're in that section (not on Profile, Settings, etc.)
const getActiveKey = (pathname) => {
  if (pathname === '/') return 'dashboard';
  if (pathname.startsWith('/restaurants') || pathname.startsWith('/restaurant/') || pathname === '/search') return 'food-order';
  if (pathname.startsWith('/order-')) return 'order-history';
  const match = ITEMS.find(i => i.path !== '/' && pathname === i.path);
  return match ? match.key : null;
};

// Mobile bottom nav shared by CustomerLayout and standalone customer pages (e.g. Cart).
// The orange circle slides to the active tab and its icon rises into it.
// `fixed` = pin to the viewport bottom; pass false to place it inside your own fixed container.
export default function CustomerBottomNav({ fixed = true }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { cartItems } = useCart();
  const activeKey = getActiveKey(pathname);
  const activeIndex = ITEMS.findIndex(i => i.key === activeKey);

  return (
    <nav className={`${fixed ? 'fixed bottom-0 left-0 right-0 z-30' : ''} lg:hidden bottom-nav nav-dock`}>
      <div className="relative grid grid-cols-5 px-2 pt-2 pb-[max(.6rem,env(safe-area-inset-bottom))]">
        <div className="absolute inset-y-0 left-2 right-2 pointer-events-none">
          <span aria-hidden="true" className="nav-dock-bubble"
            style={{ left: `${(Math.max(activeIndex, 0) + 0.5) * 20}%`, opacity: activeIndex < 0 ? 0 : 1 }} />
        </div>
        {ITEMS.map(({ key, label, icon: Icon, path }) => {
          const isAct = key === activeKey;
          const badge = key === 'cart' ? cartItems.length : 0;
          return (
            <button key={key} onClick={() => navigate(path)} aria-label={label}
              aria-current={isAct ? 'page' : undefined}
              className={`nav-dock-item ${isAct ? 'is-active' : ''}`}>
              <span className="nav-dock-icon">
                <Icon className="w-[1.35rem] h-[1.35rem]" />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full btn-glow-orange text-white text-[9px] flex items-center justify-center font-bold">
                    {badge}
                  </span>
                )}
              </span>
              <span className="nav-dock-label">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

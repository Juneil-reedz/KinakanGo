import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Home as HomeIcon, ShoppingBag, ShoppingCart, Heart, Clock } from 'lucide-react';

// Left two, the raised cart in the middle, right two (like the reference)
const SIDE_ITEMS = [
  { key: 'dashboard',     label: 'Home',      icon: HomeIcon,    path: '/' },
  { key: 'food-order',    label: 'Food',      icon: ShoppingBag, path: '/restaurants' },
  null,
  { key: 'favorite',      label: 'Favorites', icon: Heart,       path: '/favorites' },
  { key: 'order-history', label: 'Orders',    icon: Clock,       path: '/orders' },
];

// Only highlight a tab when we're in that section (not on Profile, Settings, etc.)
const getActiveKey = (pathname) => {
  if (pathname === '/') return 'dashboard';
  if (pathname.startsWith('/restaurants') || pathname.startsWith('/restaurant/') || pathname === '/search') return 'food-order';
  if (pathname.startsWith('/order-')) return 'order-history';
  if (pathname === '/cart') return 'cart';
  const match = SIDE_ITEMS.find(i => i && i.path !== '/' && pathname === i.path);
  return match ? match.key : null;
};

// Mobile bottom nav shared by CustomerLayout and standalone customer pages (e.g. Cart).
// `fixed` = pin to the viewport bottom; pass false to place it inside your own fixed container.
export default function CustomerBottomNav({ fixed = true }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { cartItems } = useCart();
  const activeKey = getActiveKey(pathname);
  const cartActive = activeKey === 'cart';

  return (
    <nav className={`${fixed ? 'fixed bottom-0 left-0 right-0 z-30' : ''} lg:hidden bottom-nav nav-dock`}>
      <div className="grid grid-cols-5 items-end px-2 pt-2 pb-[max(.6rem,env(safe-area-inset-bottom))]">
        {SIDE_ITEMS.map((item, i) => {
          if (!item) {
            return (
              <div key="cart" className="flex justify-center">
                <button onClick={() => navigate('/cart')} aria-label="Cart"
                  className={`nav-dock-cart ${cartActive ? 'is-active' : ''}`}>
                  <ShoppingCart className="w-6 h-6" />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-white text-ember-600 text-[10px] flex items-center justify-center font-bold shadow">
                      {cartItems.length}
                    </span>
                  )}
                </button>
              </div>
            );
          }
          const { key, label, icon: Icon, path } = item;
          const isAct = key === activeKey;
          return (
            <button key={key || i} onClick={() => navigate(path)} aria-label={label}
              aria-current={isAct ? 'page' : undefined}
              className={`nav-dock-item ${isAct ? 'is-active' : ''}`}>
              <Icon className="w-[1.35rem] h-[1.35rem]" fill={isAct && key === 'favorite' ? 'currentColor' : 'none'} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

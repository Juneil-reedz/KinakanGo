import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Home as HomeIcon, ShoppingBag, ShoppingCart, Heart, Clock } from 'lucide-react';

const ITEMS = [
  { key: 'dashboard',     icon: HomeIcon,     path: '/' },
  { key: 'food-order',    icon: ShoppingBag,  path: '/restaurants' },
  { key: 'cart',          icon: ShoppingCart, path: '/cart' },
  { key: 'favorite',      icon: Heart,        path: '/favorites' },
  { key: 'order-history', icon: Clock,        path: '/orders' },
];

const getActiveKey = (pathname) => {
  if (pathname.startsWith('/restaurants') || pathname.startsWith('/restaurant/')) return 'food-order';
  const match = ITEMS.find(i => i.path !== '/' && pathname === i.path);
  return match ? match.key : 'dashboard';
};

// Mobile bottom nav shared by CustomerLayout and standalone customer pages (e.g. Cart).
// `fixed` = pin to the viewport bottom; pass false to place it inside your own fixed container.
export default function CustomerBottomNav({ fixed = true }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { cartItems } = useCart();
  const activeKey = getActiveKey(pathname);

  return (
    <nav className={`${fixed ? 'fixed bottom-0 left-0 right-0 z-30' : ''} lg:hidden glass-dark`}
      style={{ borderTop: '1px solid rgba(var(--fg-rgb),.08)', boxShadow: '0 -4px 24px rgba(0,0,0,.4)' }}>
      <div className="flex items-center justify-around px-2 py-2">
        {ITEMS.map(({ key, icon: Icon, path }) => {
          const isAct = key === activeKey;
          const badge = key === 'cart' ? cartItems.length : 0;
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
  );
}

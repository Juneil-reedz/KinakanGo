import { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Utensils } from 'lucide-react';
import useGoBack from '../hooks/useGoBack';

// Shared frame for Sign in / Sign up: the KinakanGo wordmark, a card and a
// link at the bottom to the other page. Swipe left on Sign in to get Sign up, swipe right to go back.
const TABS = [
  { key: 'login',    label: 'Sign in', path: '/login' },
  { key: 'register', label: 'Sign up', path: '/register' },
];

export default function AuthShell({ active, title, subtitle, children }) {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const location = useLocation();
  const start = useRef(null);
  const idx = TABS.findIndex(t => t.key === active);
  const dir = location.state?.authDir; // which side the page slides in from

  const go = (to) => {
    const next = TABS.findIndex(t => t.key === to);
    if (next === idx) return;
    navigate(TABS[next].path, { replace: true, state: { ...location.state, authDir: next > idx ? 'left' : 'right' } });
  };

  const onTouchStart = (e) => {
    // Sideways drags inside a text box move the cursor, so they never switch pages
    if (e.target.closest('input, textarea, select')) { start.current = null; return; }
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY, at: Date.now() };
  };
  const onTouchEnd = (e) => {
    const s = start.current; start.current = null;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5 || Date.now() - s.at > 800) return;
    if (dx < 0 && idx < TABS.length - 1) go(TABS[idx + 1].key);
    else if (dx > 0 && idx > 0) go(TABS[idx - 1].key);
    else if (dx > 0 && idx === 0) goBack('/welcome');
  };

  return (
    <div className={`min-h-screen relative overflow-hidden px-5 pb-10 flex flex-col items-center ${active === 'register' ? 'pt-5' : 'pt-10'}`}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className={`text-center page-rise ${active === 'register' ? 'mb-12' : 'mb-14'}`}>
          <h1 className="brand-wordmark text-white text-[2.6rem] leading-none select-none">
            Kinakan<span className="text-ember-500">Go</span>
          </h1>
          <p className="text-forest-200/70 text-sm mt-2 font-medium">Tap it. Get it.</p>
        </div>

        {/* Card with the round plate hanging over its top edge */}
        <div key={active} className={`auth-card relative rounded-[2rem] px-6 pb-7 pt-14 ${dir === 'left' ? 'auth-in-left' : dir === 'right' ? 'auth-in-right' : 'page-rise'}`}
          style={!dir ? { animationDelay: '.1s' } : undefined}>
          <div className="auth-plate absolute left-1/2 -top-10 -translate-x-1/2 w-20 h-20 rounded-full btn-glow-orange flex items-center justify-center">
            <Utensils className="w-9 h-9 text-white" />
          </div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-heading font-bold text-white">{title}</h2>
            <p className="text-forest-200/60 text-sm mt-1">{subtitle}</p>
          </div>
          {children}
          <p className="text-center text-forest-200/60 text-sm mt-6">
            {active === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" onClick={() => go(active === 'login' ? 'register' : 'login')}
              className="text-ember-400 font-semibold hover:text-ember-300 transition-colors">
              {active === 'login' ? 'Register' : 'Login'}
            </button>
          </p>
        </div>

        {/* Swipe hint */}
        <div className="flex items-center justify-center gap-2 mt-6" aria-hidden="true">
          {TABS.map(t => (
            <span key={t.key} className={`h-1.5 rounded-full transition-all ${t.key === active ? 'w-5 bg-ember-500' : 'w-1.5 bg-[rgba(var(--fg-rgb),.25)]'}`} />
          ))}
        </div>
        <p className="text-center text-forest-200/40 text-xs mt-2 lg:hidden">
          {idx === 0 ? 'Swipe left to sign up' : 'Swipe right to sign in'}
        </p>
      </div>
    </div>
  );
}

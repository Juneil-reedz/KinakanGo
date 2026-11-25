import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import KinakanLogo from './KinakanLogo';

// Opening screen: the KinakanGo logo animates in, then after 2 seconds it fades
// away to reveal the app (the login page for someone signed out, home otherwise).
// Shown once each time the app is opened, and not on the staff panels.
const KEY = 'kkg_splash_seen';
const seen = () => { try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; } };

export default function Splash() {
  const { pathname } = useLocation();
  const staff = /^\/(owner|rider|admin)(\/|$)/.test(pathname);
  const [phase, setPhase] = useState(() => (staff || seen() ? 'done' : 'show'));

  useEffect(() => {
    if (phase !== 'show') return;
    try { sessionStorage.setItem(KEY, '1'); } catch { /* private mode */ }
    const t1 = setTimeout(() => setPhase('out'), 2000);
    const t2 = setTimeout(() => setPhase('done'), 2450);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  if (phase === 'done') return null;
  return (
    <div className={`splash fixed inset-0 z-[200] flex flex-col items-center justify-center ${phase === 'out' ? 'splash-out' : ''}`}
      role="status" aria-label="Loading KinakanGo">
      <div className="splash-plate w-24 h-24 rounded-full btn-glow-orange flex items-center justify-center">
        <KinakanLogo className="w-16 h-16 text-white" />
      </div>
      <h1 className="splash-word brand-wordmark text-white text-[2.8rem] leading-none mt-6 select-none">
        Kinakan<span className="splash-go text-ember-500 inline-block">Go</span>
      </h1>
      <p className="splash-tag text-forest-200/70 text-sm mt-2 font-medium">Tap it. Get it.</p>
      <div className="splash-bar mt-8 h-1 w-28 rounded-full overflow-hidden bg-[rgba(var(--fg-rgb),.1)]">
        <span className="block h-full rounded-full bg-ember-500" />
      </div>
    </div>
  );
}

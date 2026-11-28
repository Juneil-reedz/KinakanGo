import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import KinakanLogo from './KinakanLogo';
import { playSplashJingle } from '../utils/splashSound';

// Opening screen, about 5 seconds: the brand badge builds itself (sunset, Bud
// Bongao rising from the sea, the bridge, then our rider driving in with a
// steaming food box), the name drops in letter by letter and "Go!" stamps on.
// Then it fades to the app: Login when signed out, Home when signed in.
// Shown once each time the app is opened, and not on the staff panels.
const KEY = 'kkg_splash_seen';
const SHOW_MS = 4600, FADE_MS = 450;
const seen = () => { try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; } };
const NAME = 'Kinakan'.split('');

export default function Splash() {
  const { pathname } = useLocation();
  const staff = /^\/(owner|rider|admin)(\/|$)/.test(pathname);
  const [phase, setPhase] = useState(() => (staff || seen() ? 'done' : 'show'));

  const sound = useRef(null);
  const [needsTap, setNeedsTap] = useState(false); // sound is waiting for a tap

  // Start the scene (and its jingle) once
  useEffect(() => {
    if (phase !== 'show') return;
    try { sessionStorage.setItem(KEY, '1'); } catch { /* private mode */ }
    if (!sound.current) sound.current = playSplashJingle(performance.now(), { onLocked: setNeedsTap });
    const t = setTimeout(() => setPhase(p => (p === 'show' ? 'out' : p)), SHOW_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // Fade out, then remove the splash
  useEffect(() => {
    if (phase !== 'out') return;
    const t = setTimeout(() => setPhase('done'), FADE_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // Free the audio once the splash is gone
  useEffect(() => { if (phase === 'done') sound.current?.stop(); }, [phase]);

  // A tap skips the scene, unless that tap was the one that switched the sound on
  const onTap = () => { if (!sound.current?.tapUnlockedSound()) setPhase('out'); };

  if (phase === 'done') return null;
  return (
    <div className={`splash fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden ${phase === 'out' ? 'splash-out' : ''}`}
      role="status" aria-label="Opening KinakanGo" onClick={onTap}>
      <div className="sp-glow" aria-hidden="true" />
      <KinakanLogo animated className="sp-badge w-52 h-52 relative" />

      <h1 className="brand-wordmark text-white text-[3rem] leading-none mt-7 select-none flex items-end" aria-label="KinakanGo">
        {NAME.map((ch, i) => (
          <span key={i} aria-hidden="true" className="sp-letter inline-block" style={{ animationDelay: `${2.55 + i * 0.07}s` }}>{ch}</span>
        ))}
        <span aria-hidden="true" className="sp-go relative inline-block text-ember-500 ml-0.5">
          <span className="sp-speed absolute right-full top-1/2 -translate-y-1/2 mr-1" />
          Go!
        </span>
      </h1>
      <p className="sp-tag text-forest-200/75 text-sm mt-3 font-medium tracking-wide">Tap it. Get it. <span className="text-ember-400">Bongao&rsquo;s food, delivered.</span></p>
      {needsTap && (
        <p className="sp-tap absolute bottom-10 left-0 right-0 text-center text-forest-200/60 text-xs font-medium">
          Tap anywhere for sound
        </p>
      )}
    </div>
  );
}

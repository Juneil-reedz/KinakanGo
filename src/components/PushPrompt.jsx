import { useEffect, useState } from 'react';
import { BellRing, Share, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { pushStatus } from '../utils/push';

const LATER_KEY = (audience) => `kkg_push_later_${audience}`;
const LATER_DAYS = 14;

const snoozed = (audience) => {
  try { return Date.now() < Number(localStorage.getItem(LATER_KEY(audience)) || 0); } catch { return false; }
};

// The "turn on phone notifications" card. `inline` shows it on the
// Notifications page (always, until it's on); otherwise it floats above the
// bottom nav a few seconds after the app opens, and "Not now" hides it for two weeks.
export default function PushPrompt({ audience, onEnable, inline = false }) {
  const [status, setStatus] = useState(pushStatus);
  const [visible, setVisible] = useState(inline);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { pathname } = useLocation();

  useEffect(() => {
    if (inline || snoozed(audience)) return;
    const t = setTimeout(() => setVisible(true), 6000); // after the splash
    return () => clearTimeout(t);
  }, [inline, audience]);

  if (!visible || !['off', 'install', 'blocked'].includes(status)) return null;
  // the floating card stays away from the Notifications page (it has its own) and the splash
  if (!inline && (status === 'blocked' || pathname.endsWith('/notifications'))) return null;

  const later = () => {
    try { localStorage.setItem(LATER_KEY(audience), String(Date.now() + LATER_DAYS * 864e5)); } catch { /* ignore */ }
    setVisible(false);
  };
  const turnOn = async () => {
    setBusy(true); setError('');
    try { setStatus(await onEnable()); } catch (e) {
      setError(e?.name === 'AbortError'
        ? "This browser can't receive notifications. Try Chrome on Android, or KinakanGo from your iPhone's Home Screen."
        : "Couldn't turn them on. Please try again.");
    } finally { setBusy(false); }
  };

  const body = status === 'install' ? (
    <p className="text-forest-200/70 text-xs mt-0.5 leading-relaxed">
      On iPhone, tap <Share className="inline w-3.5 h-3.5 -mt-0.5" /> <b>Share</b>, then <b>Add to Home Screen</b>.
      Open KinakanGo from your Home Screen and turn notifications on there.
    </p>
  ) : status === 'blocked' ? (
    <p className="text-forest-200/70 text-xs mt-0.5 leading-relaxed">
      Notifications are blocked for KinakanGo. Allow them in your phone's settings for this app or site, then come back.
    </p>
  ) : (
    <p className="text-forest-200/70 text-xs mt-0.5">Know the moment your order is accepted, on the way, or delivered.</p>
  );

  return (
    <div className={inline ? 'glass rounded-2xl p-4' :
      'fixed z-40 left-3 right-3 bottom-24 lg:bottom-6 lg:left-auto lg:right-6 lg:w-96 rounded-2xl p-4 shadow-2xl animate-fade-up border border-white/10'}
      style={inline ? undefined : { background: 'var(--panel-bg)' }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl btn-glow-orange flex items-center justify-center flex-shrink-0">
          <BellRing className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold">Get notifications on your phone</p>
          {body}
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          {status === 'off' && (
            <div className="flex gap-2 mt-3">
              <button onClick={turnOn} disabled={busy}
                className="btn-glow-orange text-white text-xs font-semibold px-4 py-2 rounded-xl disabled:opacity-60">
                {busy ? 'Turning on…' : 'Turn on'}
              </button>
              {!inline && <button onClick={later} className="glass text-forest-100 text-xs font-medium px-4 py-2 rounded-xl">Not now</button>}
            </div>
          )}
        </div>
        {!inline && (
          <button onClick={later} aria-label="Close" className="text-forest-200/50 hover:text-white -mt-1 -mr-1 p-1">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Phone notifications (Web Push). Works on Android (Chrome, Samsung Internet,
// Firefox) and on iPhone / iPad (iOS 16.4+) once KinakanGo is added to the
// Home Screen; Apple only allows web notifications for Home Screen apps.

const BASE = import.meta.env.BASE_URL;

export const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

// 'on' | 'off' (can ask) | 'blocked' (said no in the browser) |
// 'install' (iPhone: add to Home Screen first) | 'unsupported'
export function pushStatus() {
  if (typeof window === 'undefined') return 'unsupported';
  if (isIos() && !isStandalone()) return 'install';
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  if (Notification.permission === 'granted') return 'on';
  return 'off';
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register(`${BASE}sw.js`, { scope: BASE }).catch(() => {});
}

const toBytes = (b64) => {
  const s = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, c => c.charCodeAt(0));
};

// Subscribes this device and tells the server. `request` is the signed-in
// part of the app's fetch helper. With ask=false it only re-syncs when the
// person already allowed notifications (no permission pop-up).
export async function enablePush(request, audience, { ask = true } = {}) {
  if (!pushSupported()) return 'unsupported';
  let perm = Notification.permission;
  if (perm === 'default' && ask) perm = await Notification.requestPermission();
  if (perm !== 'granted') return perm === 'denied' ? 'blocked' : 'off';
  registerServiceWorker();
  const reg = await navigator.serviceWorker.ready;
  const { publicKey } = await request('/notifications/push/key');
  let sub = await reg.pushManager.getSubscription();
  // the server's key changed: the old subscription won't work any more
  const keyOf = (s) => {
    const k = s?.options?.applicationServerKey;
    return k ? btoa(String.fromCharCode(...new Uint8Array(k))) : null;
  };
  const want = btoa(String.fromCharCode(...toBytes(publicKey)));
  if (sub && keyOf(sub) && keyOf(sub) !== want) { await sub.unsubscribe().catch(() => {}); sub = null; }
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(publicKey) });
  await request('/notifications/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription: sub.toJSON(), audience }) });
  return 'on';
}

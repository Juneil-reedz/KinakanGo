// KinakanGo service worker: shows phone notifications sent by the server
// (Web Push) and opens the right page when one is tapped. It doesn't cache
// anything, so the app always loads fresh.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

const HOME = { customer: '/notifications', restaurant: '/owner/notifications', rider: '/rider/notifications' };

// Same as targetOf() on the Notifications page: older links only point at a
// list, so send "Order #27 ..." straight to that order.
function targetOf(d) {
  const id = (/#(\d+)/.exec(`${d.title || ''} ${d.body || ''}`) || [])[1];
  const link = d.link || HOME[d.audience] || '/';
  if (!id) return link;
  if (link === '/owner/orders') return `/owner/orders?order=${id}`;
  if (link === '/owner/issues') return `/owner/issues?order=${id}`;
  if (link === '/orders') return `/order-receipt/${id}`;
  return link;
}

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: e.data && e.data.text() }; }
  const base = new URL(self.registration.scope).pathname.replace(/\/$/, '');
  e.waitUntil(self.registration.showNotification(d.title || 'KinakanGo', {
    body: d.body || '',
    icon: `${base}/icons/icon-192.png`,
    badge: `${base}/icons/badge-96.png`,
    tag: d.tag || undefined,
    vibrate: [80, 40, 80, 40, 160],
    data: { url: base + targetOf(d) },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || self.registration.scope, self.location.origin).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const win = wins.find(w => w.url.startsWith(self.registration.scope));
    if (win) {
      await win.focus();
      // let the open app move to the page itself (keeps the app's state)
      win.postMessage({ type: 'kkg-open', url });
      return;
    }
    await self.clients.openWindow(url);
  })());
});

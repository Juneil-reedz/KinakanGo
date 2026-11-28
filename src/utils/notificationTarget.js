// Where tapping a notification goes. Older notifications only point at a list
// page; send them to the order they mention ("Order #27 delivered").
// public/sw.js has a copy of this for phone notifications.
export function notificationTarget(n) {
  const id = (/#(\d+)/.exec(`${n.title || ''} ${n.message || ''}`) || [])[1];
  if (!id) return n.link;
  if (n.link === '/owner/orders') return `/owner/orders?order=${id}`;
  if (n.link === '/owner/issues') return `/owner/issues?order=${id}`;
  if (n.link === '/orders') return `/order-receipt/${id}`;
  return n.link;
}

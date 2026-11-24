// Small in-memory rate limiter (one API instance on Render, so memory is enough).
// limit({ windowMs, max, key }) allows `max` requests per key per window and then
// answers 429 with how long to wait. `key` builds the bucket from the request.
const buckets = new Map();

function limit({ windowMs, max, key, message }) {
  return (req, res, next) => {
    const id = key(req);
    if (!id) return next();
    const now = Date.now();
    let b = buckets.get(id);
    if (!b || b.reset <= now) { b = { count: 0, reset: now + windowMs }; buckets.set(id, b); }
    b.count += 1;
    if (b.count > max) {
      const wait = Math.ceil((b.reset - now) / 1000);
      res.set('Retry-After', String(wait));
      const mins = Math.ceil(wait / 60);
      return res.status(429).json({
        error: message || `Too many attempts. Please try again in ${mins} minute${mins === 1 ? '' : 's'}.`,
        retryAfter: wait,
      });
    }
    next();
  };
}

// Drop expired buckets now and then so memory stays small
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) if (b.reset <= now) buckets.delete(k);
}, 10 * 60 * 1000).unref();

const ip    = (req) => req.ip || 'unknown';
const email = (req) => String(req.body?.email || '').trim().toLowerCase();

module.exports = { limit, ip, email, _buckets: buckets };

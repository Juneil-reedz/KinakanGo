const router = require('express').Router();
const pool   = require('../config/db');
const { authenticate } = require('../middleware/auth');

// The signed-in user's notifications for one part of the app (?audience=customer|restaurant|rider)
router.use(authenticate);

const AUDIENCES = ['customer', 'restaurant', 'rider'];
const audienceOf = (req) => (AUDIENCES.includes(req.query.audience || req.body?.audience) ? (req.query.audience || req.body.audience) : 'customer');

const toItem = (r) => ({
  id: r.id, type: r.type, title: r.title, message: r.message, link: r.link,
  read: r.is_read, createdAt: r.created_at,
});

async function unreadCount(userId, audience) {
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS n FROM notifications WHERE user_id = $1 AND audience = $2 AND is_read = false',
    [userId, audience]
  );
  return rows[0].n;
}

router.get('/', async (req, res) => {
  const audience = audienceOf(req);
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const { rows } = await pool.query(
    `SELECT * FROM notifications WHERE user_id = $1 AND audience = $2
     ORDER BY created_at DESC LIMIT $3`,
    [req.user.id, audience, limit]
  );
  res.json({ data: rows.map(toItem), unread: await unreadCount(req.user.id, audience) });
});

// Cheap endpoint the app polls for the bell badge; includes the newest item so
// a toast can be shown when something new arrives
router.get('/unread', async (req, res) => {
  const audience = audienceOf(req);
  const { rows } = await pool.query(
    `SELECT * FROM notifications WHERE user_id = $1 AND audience = $2 ORDER BY created_at DESC LIMIT 1`,
    [req.user.id, audience]
  );
  res.json({ unread: await unreadCount(req.user.id, audience), latest: rows[0] ? toItem(rows[0]) : null });
});

router.post('/read-all', async (req, res) => {
  await pool.query(
    'UPDATE notifications SET is_read = true WHERE user_id = $1 AND audience = $2 AND is_read = false',
    [req.user.id, audienceOf(req)]
  );
  res.json({ unread: 0 });
});

router.patch('/:id/read', async (req, res) => {
  await pool.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [parseInt(req.params.id), req.user.id]);
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [parseInt(req.params.id), req.user.id]);
  res.json({ ok: true });
});

router.delete('/', async (req, res) => {
  await pool.query('DELETE FROM notifications WHERE user_id = $1 AND audience = $2', [req.user.id, audienceOf(req)]);
  res.json({ ok: true });
});

module.exports = router;

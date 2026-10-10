const router = require('express').Router();
const pool   = require('../config/db');
const { authenticate } = require('../middleware/auth');

// Saved delivery addresses for the signed-in user. Exactly one address is the
// default whenever the user has any.
router.use(authenticate);

const toAddress = (r) => ({
  id: r.id, label: r.label, address: r.address, city: r.city || '', province: r.province || '',
  zip: r.zip || '', notes: r.notes || '', isDefault: r.is_default,
});

const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : null) || null;

async function listFor(userId, client = pool) {
  const { rows } = await client.query(
    'SELECT * FROM customer_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC',
    [userId]
  );
  return rows.map(toAddress);
}

// Keep exactly one default: make `id` the default, or the oldest address if none is set
async function settleDefault(client, userId, id = null) {
  if (id) {
    await client.query('UPDATE customer_addresses SET is_default = (id = $2) WHERE user_id = $1', [userId, id]);
  } else {
    await client.query(
      `UPDATE customer_addresses SET is_default = true
       WHERE id = (SELECT id FROM customer_addresses WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1)
         AND NOT EXISTS (SELECT 1 FROM customer_addresses WHERE user_id = $1 AND is_default)`,
      [userId]
    );
  }
}

async function inTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

router.get('/', async (req, res) => {
  res.json({ data: await listFor(req.user.id) });
});

router.post('/', async (req, res) => {
  const b = req.body || {};
  const address = clean(b.address, 500);
  if (!address) return res.status(400).json({ error: 'Street address is required' });

  const data = await inTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO customer_addresses (user_id, label, address, city, province, zip, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [req.user.id, clean(b.label, 60) || 'Home', address, clean(b.city, 120), clean(b.province, 120), clean(b.zip, 20), clean(b.notes, 300)]
    );
    await settleDefault(client, req.user.id, b.isDefault ? rows[0].id : null);
    return listFor(req.user.id, client);
  });
  res.status(201).json({ data });
});

router.patch('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const b = req.body || {};
  if ('address' in b && !clean(b.address, 500)) return res.status(400).json({ error: 'Street address is required' });

  const data = await inTransaction(async (client) => {
    const { rowCount } = await client.query(
      `UPDATE customer_addresses SET
         label    = CASE WHEN $3::boolean THEN COALESCE($4, 'Home') ELSE label END,
         address  = CASE WHEN $5::boolean THEN $6 ELSE address END,
         city     = CASE WHEN $7::boolean THEN $8 ELSE city END,
         province = CASE WHEN $9::boolean THEN $10 ELSE province END,
         zip      = CASE WHEN $11::boolean THEN $12 ELSE zip END,
         notes    = CASE WHEN $13::boolean THEN $14 ELSE notes END
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id,
       'label' in b, clean(b.label, 60), 'address' in b, clean(b.address, 500),
       'city' in b, clean(b.city, 120), 'province' in b, clean(b.province, 120),
       'zip' in b, clean(b.zip, 20), 'notes' in b, clean(b.notes, 300)]
    );
    if (!rowCount) return null;
    if (b.isDefault === true) await settleDefault(client, req.user.id, id);
    return listFor(req.user.id, client);
  });
  if (!data) return res.status(404).json({ error: 'Address not found' });
  res.json({ data });
});

router.delete('/:id', async (req, res) => {
  const data = await inTransaction(async (client) => {
    const { rowCount } = await client.query(
      'DELETE FROM customer_addresses WHERE id = $1 AND user_id = $2', [parseInt(req.params.id), req.user.id]
    );
    if (!rowCount) return null;
    await settleDefault(client, req.user.id);
    return listFor(req.user.id, client);
  });
  if (!data) return res.status(404).json({ error: 'Address not found' });
  res.json({ data });
});

module.exports = router;

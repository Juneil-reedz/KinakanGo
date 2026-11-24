const router = require('express').Router();
const pool = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { requireApprovedRider, isApprovedRider } = require('../utils/riders');
const { notify } = require('../utils/notify');
const { PAIR_SQL, pairBalance, round2 } = require('../utils/riderPay');

router.use(authenticate);
const peso = (n) => `₱${Number(n).toFixed(2)}`;

const ENTRY_COLS = `s.id, s.restaurant_id, s.rider_id, s.order_id, s.kind, s.amount, s.delivery_fee, s.cash_collected,
  s.status, s.reference, s.note, s.disputed_reason, s.created_by, s.created_at, s.confirmed_at`;

// Rider: one line per restaurant they deliver for
router.get('/rider', requireApprovedRider, async (req, res) => {
  const { rows } = await pool.query(PAIR_SQL('WHERE s.rider_id = $1'), [req.user.id]);
  res.json({ data: rows });
});

// Restaurant owner: one line per rider who delivered for their restaurant(s)
router.get('/restaurant', async (req, res) => {
  const { rows } = await pool.query(PAIR_SQL('WHERE r.owner_id = $1'), [req.user.id]);
  res.json({ data: rows });
});

// Admin: every pair, plus payments someone says never arrived
router.get('/admin', requireRole('admin'), async (_req, res) => {
  const { rows } = await pool.query(PAIR_SQL(''));
  const { rows: disputes } = await pool.query(
    `SELECT ${ENTRY_COLS}, r.name AS restaurant_name, u.name AS rider_name
     FROM rider_settlements s JOIN restaurants r ON r.id = s.restaurant_id JOIN users u ON u.id = s.rider_id
     WHERE s.kind = 'payment' AND s.status = 'disputed' ORDER BY s.created_at`
  );
  res.json({ data: rows, disputes });
});

// Who is asking about this restaurant/rider pair
async function sideOf(req, restaurantId, riderId) {
  if (req.user.role === 'admin') return 'admin';
  const { rows } = await pool.query('SELECT owner_id FROM restaurants WHERE id = $1', [restaurantId]);
  if (rows[0]?.owner_id === req.user.id && req.body?.as !== 'rider' && req.query?.as !== 'rider') return 'restaurant';
  if (riderId === req.user.id && await isApprovedRider(req.user.id)) return 'rider';
  return null;
}

// The lines between one restaurant and one rider
router.get('/pair', async (req, res) => {
  const restaurantId = parseInt(req.query.restaurantId), riderId = parseInt(req.query.riderId);
  if (!restaurantId || !riderId || !(await sideOf(req, restaurantId, riderId))) return res.status(404).json({ error: 'Not found' });
  const { rows } = await pool.query(
    `SELECT ${ENTRY_COLS} FROM rider_settlements s
     WHERE s.restaurant_id = $1 AND s.rider_id = $2 ORDER BY s.created_at DESC LIMIT 200`, [restaurantId, riderId]
  );
  res.json({ data: rows, ...(await pairBalance(pool, restaurantId, riderId)) });
});

// The payer says they sent money by GCash (or cash). It counts once the other side confirms.
router.post('/pay', async (req, res) => {
  const restaurantId = parseInt(req.body.restaurantId), riderId = parseInt(req.body.riderId);
  const amount = round2(req.body.amount);
  const reference = String(req.body.reference || '').trim().slice(0, 120);
  const note = String(req.body.note || '').trim().slice(0, 300) || null;
  if (!restaurantId || !riderId) return res.status(400).json({ error: 'Choose who you paid' });
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'Enter an amount above ₱0' });
  if (reference.length < 3) return res.status(400).json({ error: 'Add the GCash reference number (or say "cash")' });
  const side = await sideOf(req, restaurantId, riderId);
  if (side !== 'restaurant' && side !== 'rider') return res.status(404).json({ error: 'Not found' });

  const client = await pool.connect();
  let id;
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1, $2)', [restaurantId, riderId]);
    const { balance, pending } = await pairBalance(client, restaurantId, riderId);
    // What the payer still owes once payments waiting for confirmation are counted
    const owed = side === 'restaurant' ? round2(balance + pending) : round2(-(balance + pending));
    if (owed <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "You don't owe anything right now" });
    }
    if (amount > owed) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `You only owe ${peso(owed)}` });
    }
    const { rows } = await client.query(
      `INSERT INTO rider_settlements (restaurant_id, rider_id, kind, amount, status, reference, note, created_by)
       VALUES ($1, $2, 'payment', $3, 'sent', $4, $5, $6) RETURNING id`,
      [restaurantId, riderId, side === 'restaurant' ? -amount : amount, reference, note, req.user.id]
    );
    id = rows[0].id;
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  const { rows: names } = await pool.query(
    'SELECT r.name, r.owner_id, u.name AS rider_name FROM restaurants r, users u WHERE r.id = $1 AND u.id = $2', [restaurantId, riderId]
  );
  const n = names[0];
  if (side === 'restaurant') {
    await notify(riderId, {
      audience: 'rider', type: 'success', link: '/rider/earnings',
      title: `${n.name} sent you ${peso(amount)}`, message: `Ref: ${reference}. Check your GCash and tap "I got it".`,
    });
  } else {
    await notify(n.owner_id, {
      audience: 'restaurant', type: 'success', link: '/owner/rider-pay',
      title: `${n.rider_name} sent you ${peso(amount)}`, message: `Ref: ${reference}. Check your GCash and tap "I got it".`,
    });
  }
  res.status(201).json({ id, message: 'Recorded. The other side will confirm.' });
});

async function loadPayment(id) {
  const { rows } = await pool.query(
    `SELECT s.*, r.owner_id, r.name AS restaurant_name, u.name AS rider_name
     FROM rider_settlements s JOIN restaurants r ON r.id = s.restaurant_id JOIN users u ON u.id = s.rider_id
     WHERE s.id = $1 AND s.kind = 'payment'`, [parseInt(id) || 0]
  );
  return rows[0] || null;
}
// A payment to the rider has a negative amount (it lowers what the restaurant owes)
const receiverIsRider = (p) => Number(p.amount) < 0;
const isReceiver = (p, user) => (receiverIsRider(p) ? p.rider_id === user.id : p.owner_id === user.id);
const isPayer = (p, user) => p.created_by === user.id;
const tell = (p, toRider, title, message) => notify(toRider ? p.rider_id : p.owner_id, {
  audience: toRider ? 'rider' : 'restaurant', type: 'info', title, message,
  link: toRider ? '/rider/earnings' : '/owner/rider-pay',
});

// Receiver: the money arrived
router.post('/:id/confirm', async (req, res) => {
  const p = await loadPayment(req.params.id);
  if (!p || !isReceiver(p, req.user)) return res.status(404).json({ error: 'Payment not found' });
  const { rowCount } = await pool.query(
    "UPDATE rider_settlements SET status = 'confirmed', confirmed_at = NOW() WHERE id = $1 AND status IN ('sent','disputed')", [p.id]
  );
  if (!rowCount) return res.status(409).json({ error: 'This payment was already settled' });
  const amt = peso(Math.abs(p.amount));
  await tell(p, !receiverIsRider(p), `${receiverIsRider(p) ? p.rider_name : p.restaurant_name} confirmed your ${amt} payment`, null);
  res.json({ message: 'Confirmed' });
});

// Receiver: the money did not arrive. KinakanGo (admin) looks into it.
router.post('/:id/dispute', async (req, res) => {
  const p = await loadPayment(req.params.id);
  if (!p || !isReceiver(p, req.user)) return res.status(404).json({ error: 'Payment not found' });
  const reason = String(req.body.reason || '').trim().slice(0, 300) || 'The money did not arrive';
  const { rowCount } = await pool.query(
    "UPDATE rider_settlements SET status = 'disputed', disputed_reason = $2 WHERE id = $1 AND status = 'sent'", [p.id, reason]
  );
  if (!rowCount) return res.status(409).json({ error: 'This payment was already settled' });
  await tell(p, !receiverIsRider(p), `Your ${peso(Math.abs(p.amount))} payment was not received`,
    `${reason}. Check the reference "${p.reference}". KinakanGo will review it.`);
  res.json({ message: 'KinakanGo will review it' });
});

// Payer: take back a payment that was recorded by mistake (before it is confirmed)
router.post('/:id/cancel', async (req, res) => {
  const p = await loadPayment(req.params.id);
  if (!p || !isPayer(p, req.user)) return res.status(404).json({ error: 'Payment not found' });
  const { rowCount } = await pool.query(
    "UPDATE rider_settlements SET status = 'cancelled' WHERE id = $1 AND status IN ('sent','disputed')", [p.id]
  );
  if (!rowCount) return res.status(409).json({ error: 'A confirmed payment cannot be taken back' });
  res.json({ message: 'Cancelled' });
});

// Admin settles a disputed payment: it arrived (confirmed) or it didn't (cancelled)
router.post('/:id/resolve', requireRole('admin'), async (req, res) => {
  const p = await loadPayment(req.params.id);
  if (!p) return res.status(404).json({ error: 'Payment not found' });
  const arrived = req.body.received === true;
  const { rowCount } = await pool.query(
    `UPDATE rider_settlements SET status = $2::varchar, confirmed_at = CASE WHEN $2::varchar = 'confirmed' THEN NOW() ELSE NULL END,
       note = COALESCE($3, note)
     WHERE id = $1 AND status IN ('sent','disputed')`,
    [p.id, arrived ? 'confirmed' : 'cancelled', String(req.body.note || '').trim().slice(0, 300) || null]
  );
  if (!rowCount) return res.status(409).json({ error: 'This payment was already settled' });
  const msg = arrived ? 'KinakanGo checked it: the payment counts.' : 'KinakanGo checked it: the payment did not arrive, so it was removed.';
  await tell(p, true, `${peso(Math.abs(p.amount))} payment between ${p.restaurant_name} and you`, msg);
  await tell(p, false, `${peso(Math.abs(p.amount))} payment between you and ${p.rider_name}`, msg);
  res.json({ message: arrived ? 'Marked as received' : 'Removed' });
});

// Rider: the GCash number restaurants send delivery fees to
router.patch('/rider/gcash', requireApprovedRider, async (req, res) => {
  const number = String(req.body.gcashNumber || '').replace(/[^\d+]/g, '');
  if (!/^(\+?63|0)9\d{9}$/.test(number)) return res.status(400).json({ error: 'Enter your GCash number, e.g. 09171234567' });
  const name = String(req.body.gcashName || '').trim().slice(0, 120) || null;
  await pool.query(
    `INSERT INTO rider_profiles (user_id, gcash_number, gcash_name) VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET gcash_number = $2, gcash_name = $3`, [req.user.id, number, name]
  );
  res.json({ gcashNumber: number, gcashName: name });
});

router.get('/rider/gcash', requireApprovedRider, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT rp.gcash_number, rp.gcash_name, u.phone FROM users u LEFT JOIN rider_profiles rp ON rp.user_id = u.id WHERE u.id = $1', [req.user.id]
  );
  res.json({ gcashNumber: rows[0]?.gcash_number || null, gcashName: rows[0]?.gcash_name || null, phone: rows[0]?.phone || null });
});

module.exports = router;

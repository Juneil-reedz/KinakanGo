const pool = require('../config/db');

// A rider is someone an admin approved as a rider (approved rider upgrade request),
// or an account whose role is 'rider'. A rider_profiles row alone is not enough:
// older code created one for anyone who toggled "online".
const APPROVED_RIDER_SQL = (userCol) => `(
  EXISTS (SELECT 1 FROM users ru WHERE ru.id = ${userCol} AND ru.role = 'rider' AND ru.is_active = true)
  OR EXISTS (
    SELECT 1 FROM upgrade_requests ur JOIN users uu ON uu.id = ur.user_id
    WHERE ur.user_id = ${userCol} AND ur.status = 'approved' AND uu.is_active = true
      AND (ur.plan ILIKE '%rider%' OR ur.notes ILIKE '%"role":"rider"%')
  )
)`;

async function isApprovedRider(userId) {
  const { rows } = await pool.query(`SELECT ${APPROVED_RIDER_SQL('$1::int')} AS ok`, [userId]);
  return !!rows[0]?.ok;
}

// Express middleware for rider-only endpoints
async function requireApprovedRider(req, res, next) {
  try {
    if (await isApprovedRider(req.user.id)) return next();
    return res.status(403).json({ error: 'Only approved riders can do this' });
  } catch (err) {
    return next(err);
  }
}

// Give a free, online rider the oldest ready order nobody has taken yet.
// One UPDATE does the check and the claim, so two riders can't take the same
// order, and a rider already on a delivery gets nothing. Orders this rider
// declined are skipped. Returns the order id, or null.
async function claimWaitingOrder(riderId) {
  const { rows } = await pool.query(
    `UPDATE orders SET rider_id = $1
     WHERE id = (
       SELECT o.id FROM orders o
       WHERE o.status = 'ready' AND o.rider_id IS NULL
         AND NOT EXISTS (SELECT 1 FROM order_rider_declines d WHERE d.order_id = o.id AND d.rider_id = $1)
       ORDER BY o.created_at ASC LIMIT 1
       FOR UPDATE SKIP LOCKED
     )
     AND rider_id IS NULL
     AND EXISTS (SELECT 1 FROM rider_profiles rp WHERE rp.user_id = $1 AND rp.is_available = true)
     AND NOT EXISTS (SELECT 1 FROM orders busy WHERE busy.rider_id = $1 AND busy.status IN ('ready','picked_up'))
     RETURNING id`,
    [riderId]
  );
  if (!rows.length) return null;
  const { notify } = require('./notify');
  await notify(riderId, {
    audience: 'rider', type: 'warning', link: '/rider/dashboard',
    title: `New delivery request · #${rows[0].id}`, message: 'An order is ready for pickup. Accept or decline it in your dashboard.',
  });
  return rows[0].id;
}

module.exports = { APPROVED_RIDER_SQL, isApprovedRider, requireApprovedRider, claimWaitingOrder };

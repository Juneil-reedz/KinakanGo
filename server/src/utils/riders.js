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

module.exports = { APPROVED_RIDER_SQL, isApprovedRider, requireApprovedRider };

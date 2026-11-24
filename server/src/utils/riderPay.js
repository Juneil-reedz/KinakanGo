const pool = require('../config/db');

// Rider pay between a restaurant and a rider, kept as one running balance.
//
// Every delivered order adds a line automatically:
//   amount = delivery fee - cash the rider collected
// GCash order: the restaurant got the money, so it owes the rider the fee (+).
// Cash order: the rider collected the whole amount, keeps the fee and owes the
// restaurant the rest (-).
//
// Money is sent outside the app (GCash). The payer records it ("Paid" with the
// reference) and the receiver confirms it; only confirmed payments change the
// balance. Positive balance = the restaurant owes the rider.
const round2 = (n) => Math.round(Number(n) * 100) / 100;

async function recordDelivery(orderId) {
  const { rows } = await pool.query(
    `SELECT id, restaurant_id, rider_id, delivery_fee, payment_method, total, credit_used
     FROM orders WHERE id = $1 AND status = 'delivered' AND rider_id IS NOT NULL`, [orderId]
  );
  const o = rows[0];
  if (!o) return null;
  const fee = round2(o.delivery_fee || 0);
  const cash = o.payment_method === 'cash' ? round2(Number(o.total) - Number(o.credit_used || 0)) : 0;
  const amount = round2(fee - cash);
  const { rows: ins } = await pool.query(
    `INSERT INTO rider_settlements (restaurant_id, rider_id, order_id, kind, amount, delivery_fee, cash_collected, status)
     VALUES ($1, $2, $3, 'delivery', $4, $5, $6, 'done')
     ON CONFLICT (order_id) DO NOTHING RETURNING id`,
    [o.restaurant_id, o.rider_id, o.id, amount, fee, cash]
  );
  return ins[0] ? { amount, fee, cash } : null;
}

// Balance (confirmed) and pending (sent or disputed payments) for each pair
const PAIR_SQL = (where) => `
  SELECT s.restaurant_id, s.rider_id,
         r.name AS restaurant_name, r.owner_id, r.gcash_number AS restaurant_gcash, r.gcash_name AS restaurant_gcash_name,
         u.name AS rider_name, COALESCE(rp.gcash_number, u.phone) AS rider_gcash, rp.gcash_name AS rider_gcash_name,
         COALESCE(SUM(s.amount) FILTER (WHERE s.kind = 'delivery' OR s.status = 'confirmed'), 0) AS balance,
         COALESCE(SUM(s.amount) FILTER (WHERE s.kind = 'payment' AND s.status IN ('sent','disputed')), 0) AS pending,
         COUNT(*) FILTER (WHERE s.kind = 'delivery')::int AS deliveries,
         COUNT(*) FILTER (WHERE s.kind = 'payment' AND s.status = 'sent')::int AS waiting,
         COUNT(*) FILTER (WHERE s.kind = 'payment' AND s.status = 'disputed')::int AS disputed,
         MAX(s.created_at) AS last_at
  FROM rider_settlements s
  JOIN restaurants r ON r.id = s.restaurant_id
  JOIN users u ON u.id = s.rider_id
  LEFT JOIN rider_profiles rp ON rp.user_id = s.rider_id
  ${where}
  GROUP BY s.restaurant_id, s.rider_id, r.name, r.owner_id, r.gcash_number, r.gcash_name, u.name, u.phone, rp.gcash_number, rp.gcash_name
  ORDER BY ABS(COALESCE(SUM(s.amount) FILTER (WHERE s.kind = 'delivery' OR s.status = 'confirmed'), 0)) DESC, MAX(s.created_at) DESC`;

async function pairBalance(client, restaurantId, riderId) {
  const { rows } = await client.query(
    `SELECT COALESCE(SUM(amount) FILTER (WHERE kind = 'delivery' OR status = 'confirmed'), 0) AS balance,
            COALESCE(SUM(amount) FILTER (WHERE kind = 'payment' AND status IN ('sent','disputed')), 0) AS pending
     FROM rider_settlements WHERE restaurant_id = $1 AND rider_id = $2`, [restaurantId, riderId]
  );
  return { balance: round2(rows[0].balance), pending: round2(rows[0].pending) };
}

module.exports = { recordDelivery, PAIR_SQL, pairBalance, round2 };

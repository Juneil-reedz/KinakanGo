const pool = require('../config/db');

// Store credit: money a restaurant owes a customer (from a refund), spent on a
// later order at that same restaurant. Kept as a ledger: + when given or returned,
// − when used on an order. The balance is the sum.

const round2 = (n) => Math.round(Number(n) * 100) / 100;

async function balance(customerId, restaurantId, db = pool) {
  const { rows } = await db.query(
    'SELECT COALESCE(SUM(amount), 0) AS bal FROM store_credits WHERE customer_id = $1 AND restaurant_id = $2',
    [customerId, restaurantId]
  );
  return round2(rows[0].bal);
}

// All restaurants where the customer has credit left
async function balances(customerId) {
  const { rows } = await pool.query(
    `SELECT s.restaurant_id, r.name AS restaurant_name, SUM(s.amount) AS balance
     FROM store_credits s JOIN restaurants r ON r.id = s.restaurant_id
     WHERE s.customer_id = $1
     GROUP BY s.restaurant_id, r.name
     HAVING SUM(s.amount) > 0
     ORDER BY r.name`,
    [customerId]
  );
  return rows.map(r => ({ ...r, balance: round2(r.balance) }));
}

async function give(db, { customerId, restaurantId, amount, issueId = null, orderId = null, note }) {
  await db.query(
    `INSERT INTO store_credits (customer_id, restaurant_id, amount, issue_id, order_id, note)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [customerId, restaurantId, round2(amount), issueId, orderId, note || null]
  );
}

// Credit used on an order that is then cancelled goes back to the customer (once)
async function returnForCancelledOrder(orderId) {
  await pool.query(
    `INSERT INTO store_credits (customer_id, restaurant_id, amount, order_id, note)
     SELECT o.customer_id, o.restaurant_id, o.credit_used, o.id, 'Returned: order #' || o.id || ' was cancelled'
     FROM orders o
     WHERE o.id = $1 AND o.credit_used > 0
       AND NOT EXISTS (SELECT 1 FROM store_credits s WHERE s.order_id = o.id AND s.amount > 0 AND s.issue_id IS NULL)`,
    [orderId]
  );
}

module.exports = { balance, balances, give, returnForCancelledOrder, round2 };

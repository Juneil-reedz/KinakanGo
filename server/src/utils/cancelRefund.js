const pool = require('../config/db');
const { notify } = require('./notify');
const storeCredit = require('./storeCredit');

const peso = (n) => `₱${Number(n).toFixed(2)}`;

// A GCash order that is cancelled (by the customer, the restaurant or the admin)
// was already paid: the customer sent the money to the restaurant's GCash before
// ordering. Create the refund right away so nobody has to remember it:
//  - store credit: added at once, the order is marked refunded
//  - GCash: shows on the restaurant's Problems page as "Send the refund"
// Cash orders were never paid, and store credit used is returned separately.
async function refundCancelledOrder(orderId, { method = 'gcash', gcash = null } = {}) {
  const { rows } = await pool.query(
    `SELECT o.id, o.customer_id, o.restaurant_id, o.payment_method, o.total, o.credit_used,
            o.proof_image IS NOT NULL AS has_proof, u.phone AS customer_phone,
            r.owner_id, r.name AS restaurant_name
     FROM orders o JOIN users u ON u.id = o.customer_id JOIN restaurants r ON r.id = o.restaurant_id
     WHERE o.id = $1 AND o.status = 'cancelled'`,
    [orderId]
  );
  const o = rows[0];
  if (!o || o.payment_method !== 'gcash' || !o.has_proof) return null;
  const paid = storeCredit.round2(Number(o.total) - Number(o.credit_used || 0));
  if (paid <= 0) return null;

  const asCredit = method === 'credit';
  const client = await pool.connect();
  let issueId = null;
  try {
    await client.query('BEGIN');
    // One automatic refund per order, even if cancel is pressed twice
    await client.query('SELECT pg_advisory_xact_lock(434343, $1)', [o.id]);
    const { rows: existing } = await client.query(
      "SELECT 1 FROM issues WHERE order_id = $1 AND type = 'payment' AND refund_approved IS NOT NULL", [o.id]
    );
    if (existing.length) { await client.query('ROLLBACK'); return null; }
    const { rows: ins } = await client.query(
      `INSERT INTO issues (order_id, customer_id, type, priority, description, status, handler,
          refund_requested, refund_approved, refund_status, refund_method, refund_gcash,
          resolution_notes, resolved_at, refund_received_at)
       VALUES ($1,$2,'payment','high',$3,'resolved','restaurant',$4,$4,$5,$6,$7,$8,NOW(),
               CASE WHEN $5::varchar = 'credited' THEN NOW() ELSE NULL END)
       RETURNING id`,
      [o.id, o.customer_id, `Order #${o.id} was cancelled after a GCash payment of ${peso(paid)}.`,
       paid, asCredit ? 'credited' : 'to_send', asCredit ? 'credit' : 'gcash',
       asCredit ? null : (gcash || o.customer_phone || null),
       'Automatic refund for a cancelled order']
    );
    issueId = ins[0].id;
    if (asCredit) {
      await storeCredit.give(client, {
        customerId: o.customer_id, restaurantId: o.restaurant_id, amount: paid,
        issueId, orderId: o.id, note: `Refund for cancelled order #${o.id}`,
      });
    }
    await client.query(
      `UPDATE orders SET payment_status = $2 WHERE id = $1`, [o.id, asCredit ? 'refunded' : 'paid']
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  if (asCredit) {
    await notify(o.customer_id, {
      audience: 'customer', type: 'success', link: `/order-receipt/${o.id}`,
      title: `${peso(paid)} store credit added at ${o.restaurant_name}`,
      message: `Your GCash payment for cancelled order #${o.id} was returned as store credit.`,
    });
  } else {
    await notify(o.owner_id, {
      audience: 'restaurant', type: 'warning', link: '/owner/issues',
      title: `Send a ${peso(paid)} GCash refund for cancelled order #${o.id}`,
      message: `The customer already paid by GCash. Send it back${gcash || o.customer_phone ? ` to ${gcash || o.customer_phone}` : ''} and tap "Refund sent".`,
    });
    await notify(o.customer_id, {
      audience: 'customer', type: 'info', link: `/order-receipt/${o.id}`,
      title: `${o.restaurant_name} will return your ${peso(paid)} GCash payment`,
      message: `Order #${o.id} was cancelled. You can also take it as store credit right away from the order page.`,
    });
  }
  return { issueId, amount: paid, method: asCredit ? 'credit' : 'gcash' };
}

module.exports = { refundCancelledOrder };

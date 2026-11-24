const pool = require('../config/db');
const { notify } = require('./notify');
const storeCredit = require('./storeCredit');

const peso = (n) => `₱${Number(n).toFixed(2)}`;

// A GCash order that is cancelled was paid by sending money to the restaurant's
// GCash before ordering, but the screenshot the customer uploads proves nothing:
// it could be fake. So the restaurant must say whether the money arrived before
// any refund (GCash or store credit) is given.
//  - Already accepted (payment_status 'paid'), or the restaurant says it arrived:
//    the refund is approved at once (store credit added, or "Send the refund").
//  - The restaurant says it never arrived: recorded as declined; the customer can
//    ask KinakanGo to review it.
//  - Nobody has checked yet (customer cancels a pending order): a report waits on
//    the restaurant's Problems page as "Check your GCash".
// Cash orders were never paid, and store credit used is returned separately.
async function refundCancelledOrder(orderId, { method = 'gcash', gcash = null, paymentReceived = null } = {}) {
  const { rows } = await pool.query(
    `SELECT o.id, o.customer_id, o.restaurant_id, o.payment_method, o.payment_status, o.total, o.credit_used,
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

  const state = o.payment_status === 'paid' || paymentReceived === true ? 'approved'
    : paymentReceived === false ? 'never_arrived' : 'check';
  const asCredit = method === 'credit';
  const refundGcash = asCredit ? null : (gcash || o.customer_phone || null);
  const client = await pool.connect();
  let issueId = null;
  try {
    await client.query('BEGIN');
    // One automatic refund per order, even if cancel is pressed twice
    await client.query('SELECT pg_advisory_xact_lock(434343, $1)', [o.id]);
    const { rows: existing } = await client.query(
      "SELECT 1 FROM issues WHERE order_id = $1 AND type = 'payment'", [o.id]
    );
    if (existing.length) { await client.query('ROLLBACK'); return null; }
    const approved = state === 'approved';
    const refundStatus = approved ? (asCredit ? 'credited' : 'to_send') : null;
    const description = state === 'check'
      ? `Order #${o.id} was cancelled before you accepted it. The customer says they paid ${peso(paid)} by GCash. Check your GCash: if the money arrived, approve the refund; if it never arrived, decline.`
      : `Order #${o.id} was cancelled after a GCash payment of ${peso(paid)}.`;
    const { rows: ins } = await client.query(
      `INSERT INTO issues (order_id, customer_id, type, priority, description, status, handler,
          refund_requested, refund_approved, refund_status, refund_method, refund_gcash,
          resolution_notes, resolved_at, refund_received_at, payment_check)
       VALUES ($1,$2,'payment','high',$3,$4,'restaurant',$5,$6,$7,$8,$9,$10,
               CASE WHEN $4::varchar = 'pending' THEN NULL ELSE NOW() END,
               CASE WHEN $7::varchar = 'credited' THEN NOW() ELSE NULL END, true)
       RETURNING id`,
      [o.id, o.customer_id, description,
       state === 'approved' ? 'resolved' : state === 'never_arrived' ? 'denied' : 'pending',
       paid, approved ? paid : null, refundStatus, asCredit ? 'credit' : 'gcash', refundGcash,
       state === 'approved' ? 'Automatic refund for a cancelled order'
         : state === 'never_arrived' ? 'The restaurant says the GCash payment never arrived.' : null]
    );
    issueId = ins[0].id;
    if (approved && asCredit) {
      await storeCredit.give(client, {
        customerId: o.customer_id, restaurantId: o.restaurant_id, amount: paid,
        issueId, orderId: o.id, note: `Refund for cancelled order #${o.id}`,
      });
      await client.query("UPDATE orders SET payment_status = 'refunded' WHERE id = $1", [o.id]);
    } else if (approved) {
      await client.query("UPDATE orders SET payment_status = 'paid' WHERE id = $1", [o.id]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const link = `/order-receipt/${o.id}`;
  if (state === 'check') {
    await notify(o.owner_id, {
      audience: 'restaurant', type: 'warning', link: `/owner/issues?order=${o.id}`,
      title: `Check your GCash for cancelled order #${o.id}`,
      message: `The customer says they paid ${peso(paid)}. If it arrived, approve the refund on your Problems page. If not, decline it.`,
    });
    await notify(o.customer_id, {
      audience: 'customer', type: 'info', link,
      title: `${o.restaurant_name} is checking your ${peso(paid)} GCash payment`,
      message: `Once they confirm it arrived, you get it back ${asCredit ? 'as store credit' : 'by GCash'}.`,
    });
  } else if (state === 'never_arrived') {
    await notify(o.customer_id, {
      audience: 'customer', type: 'error', link,
      title: `${o.restaurant_name} says your GCash payment for order #${o.id} never arrived`,
      message: 'If you did pay, open the order and ask KinakanGo to review it. Keep your GCash receipt.',
    });
  } else if (asCredit) {
    await notify(o.customer_id, {
      audience: 'customer', type: 'success', link,
      title: `${peso(paid)} store credit added at ${o.restaurant_name}`,
      message: `Your GCash payment for cancelled order #${o.id} was returned as store credit.`,
    });
  } else {
    await notify(o.owner_id, {
      audience: 'restaurant', type: 'warning', link: `/owner/issues?order=${o.id}`,
      title: `Send a ${peso(paid)} GCash refund for cancelled order #${o.id}`,
      message: `Send it back${refundGcash ? ` to ${refundGcash}` : ''} and tap "Refund sent".`,
    });
    await notify(o.customer_id, {
      audience: 'customer', type: 'info', link,
      title: `${o.restaurant_name} will return your ${peso(paid)} GCash payment`,
      message: `Order #${o.id} was cancelled. You'll be told when it's sent.`,
    });
  }
  return { issueId, amount: paid, method: asCredit ? 'credit' : 'gcash', state };
}

module.exports = { refundCancelledOrder };

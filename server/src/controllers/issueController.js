const pool = require('../config/db');
const { notify } = require('../utils/notify');
const storeCredit = require('../utils/storeCredit');

const TYPES = ['refund', 'quality', 'payment', 'rider', 'missing'];
const peso = (n) => `₱${Number(n).toFixed(2)}`;
// How long the restaurant has to answer before the customer can go to the admin
const RESTAURANT_WAIT_HOURS = 24;

// Who reviews a report and who sends the money back:
// - The restaurant reviews problems with the food or payment and sends any refund
//   itself (GCash went to the restaurant's number, cash went to the restaurant).
// - Delivery (rider) problems go straight to the admin.
// - If the restaurant declines, doesn't answer, or the customer never gets the
//   refund, the customer can ask the admin to review. When the admin approves a
//   refund, the restaurant is told to send it.
// - An order counts as refunded only when the customer confirms they got the money.
// - If the customer chose store credit, an approved refund is added to their credit
//   at that restaurant right away (nothing to send, nothing to confirm).

const ISSUE_COLS = `i.id, i.order_id, i.type, i.status, i.priority, i.description, i.handler,
  i.refund_requested, i.refund_approved, i.refund_status, i.refund_sent_note, i.refund_sent_at,
  i.refund_received_at, i.resolution_notes, i.escalated_at, i.escalation_reason, i.refund_method, i.refund_gcash,
  i.created_at, i.resolved_at, i.payment_check`;

const parseAmount = (v, max) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.round(n * 100) / 100, Number(max)) : null;
};

// Approved refund given as store credit: add it and mark the order refunded
async function creditRefund(client, issue, amount) {
  await storeCredit.give(client, {
    customerId: issue.customer_id, restaurantId: issue.restaurant_id, amount,
    issueId: issue.id, orderId: issue.order_id, note: `Refund for order #${issue.order_id}`,
  });
  await client.query("UPDATE orders SET payment_status = 'refunded' WHERE id = $1", [issue.order_id]);
}

// Issue + its order's restaurant owner and customer
async function loadIssue(id) {
  const { rows } = await pool.query(
    `SELECT i.*, o.total AS order_total, o.restaurant_id, r.owner_id, r.name AS restaurant_name
     FROM issues i JOIN orders o ON o.id = i.order_id JOIN restaurants r ON r.id = o.restaurant_id
     WHERE i.id = $1`, [parseInt(id) || 0]
  );
  return rows[0] || null;
}

// Customer reports a problem with one of their own orders (optionally asking for a refund)
async function submit(req, res) {
  const orderId = parseInt(req.body.orderId);
  const type = String(req.body.type || '');
  const description = String(req.body.description || '').trim().slice(0, 1000);
  if (!Number.isInteger(orderId)) return res.status(400).json({ error: 'Choose the order this is about' });
  if (!TYPES.includes(type)) return res.status(400).json({ error: 'Choose what went wrong' });
  if (description.length < 5) return res.status(400).json({ error: 'Please describe the problem' });

  const { rows: orders } = await pool.query(
    `SELECT o.id, o.customer_id, o.status, o.total, r.owner_id
     FROM orders o JOIN restaurants r ON r.id = o.restaurant_id WHERE o.id = $1`, [orderId]
  );
  const order = orders[0];
  if (!order || order.customer_id !== req.user.id) return res.status(404).json({ error: 'Order not found' });
  if (order.status === 'pending') {
    return res.status(400).json({ error: 'This order is still waiting for the restaurant. You can cancel it instead.' });
  }
  const { rows: open } = await pool.query(
    `SELECT 1 FROM issues WHERE order_id = $1
       AND (status = 'pending' OR refund_status IN ('to_send','sent','not_received'))`, [orderId]
  );
  if (open.length) return res.status(409).json({ error: 'You already reported this order. We will get back to you soon.' });

  // A refund request is for at most the order total
  let refund = null;
  if (req.body.refundRequested != null && req.body.refundRequested !== '') {
    refund = parseAmount(req.body.refundRequested, order.total);
    if (refund == null) return res.status(400).json({ error: 'Enter a refund amount above ₱0' });
  }
  // How the customer wants the money back
  let refundMethod = null, refundGcash = null;
  if (refund != null) {
    refundMethod = String(req.body.refundMethod || '');
    if (!['gcash', 'cash', 'credit'].includes(refundMethod)) {
      return res.status(400).json({ error: 'Choose how you want your refund' });
    }
    if (refundMethod === 'gcash') {
      refundGcash = String(req.body.refundGcash || '').replace(/[^\d+]/g, '');
      if (!/^(\+?63|0)9\d{9}$/.test(refundGcash)) {
        return res.status(400).json({ error: 'Enter your GCash number, e.g. 09171234567' });
      }
    }
  }
  const priority = refund != null || type === 'missing' ? 'high' : 'medium';
  const handler = type === 'rider' ? 'admin' : 'restaurant';

  const { rows } = await pool.query(
    `INSERT INTO issues (order_id, customer_id, type, priority, description, refund_requested, handler, refund_method, refund_gcash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [orderId, req.user.id, type, priority, description, refund, handler, refundMethod, refundGcash]
  );
  if (handler === 'restaurant') {
    await notify(order.owner_id, {
      audience: 'restaurant', type: 'warning', link: `/owner/issues?order=${orderId}`,
      title: `A customer reported a problem with order #${orderId}`,
      message: refund != null
        ? `They are asking for a ${peso(refund)} refund${refundMethod === 'credit' ? ' as store credit' : refundMethod === 'gcash' ? ' to GCash' : ' in cash'}.`
        : description.slice(0, 200),
    });
  }
  const { rows: saved } = await pool.query(`SELECT ${ISSUE_COLS} FROM issues i WHERE i.id = $1`, [rows[0].id]);
  res.status(201).json(saved[0]);
}

// The customer's own reports (for showing status on the order page)
async function mine(req, res) {
  const params = [req.user.id];
  let cond = 'i.customer_id = $1';
  if (req.query.orderId) { cond += ' AND i.order_id = $2'; params.push(parseInt(req.query.orderId) || 0); }
  const { rows } = await pool.query(
    `SELECT ${ISSUE_COLS} FROM issues i WHERE ${cond} ORDER BY i.created_at DESC LIMIT 50`, params
  );
  res.json({ data: rows, restaurantWaitHours: RESTAURANT_WAIT_HOURS });
}

// Customer asks the admin to review: the restaurant declined, didn't answer in
// time, or the refund never arrived.
async function escalate(req, res) {
  const issue = await loadIssue(req.params.id);
  if (!issue || issue.customer_id !== req.user.id) return res.status(404).json({ error: 'Report not found' });
  const reason = String(req.body.reason || '').trim().slice(0, 1000) || null;
  const waited = (t) => t && Date.now() - new Date(t).getTime() >= RESTAURANT_WAIT_HOURS * 3600e3;

  let refundStatus = issue.refund_status;
  let allowed = false;
  if (issue.handler === 'restaurant') {
    if (issue.status === 'denied') allowed = true;
    else if (issue.status === 'pending' && waited(issue.created_at)) allowed = true;
    else if (issue.refund_status === 'to_send' && waited(issue.resolved_at)) allowed = true;
  }
  // "I didn't get the refund" works whoever decided it
  if (issue.refund_status === 'sent') { allowed = true; refundStatus = 'not_received'; }
  if (!allowed) {
    return res.status(400).json({
      error: issue.handler === 'admin'
        ? 'KinakanGo is already reviewing this report'
        : `Please give the restaurant ${RESTAURANT_WAIT_HOURS} hours to answer first`,
    });
  }

  await pool.query(
    `UPDATE issues SET handler = 'admin', status = 'pending', refund_status = $2,
       escalated_at = NOW(), escalation_reason = $3
     WHERE id = $1`,
    [issue.id, refundStatus, reason]
  );
  await notify(issue.owner_id, {
    audience: 'restaurant', type: 'warning', link: `/owner/issues?order=${issue.order_id}`,
    title: `The customer asked KinakanGo to review order #${issue.order_id}`,
    message: refundStatus === 'not_received' ? 'They say the refund has not arrived.' : reason,
  });
  res.json({ message: 'Sent to KinakanGo for review' });
}

// Customer confirms the refund arrived: now the order counts as refunded
async function received(req, res) {
  const { rows } = await pool.query(
    `UPDATE issues SET refund_status = 'received', refund_received_at = NOW(), status = 'resolved'
     WHERE id = $1 AND customer_id = $2 AND refund_status IN ('to_send','sent','not_received')
     RETURNING order_id, refund_approved`,
    [parseInt(req.params.id) || 0, req.user.id]
  );
  if (!rows.length) return res.status(400).json({ error: 'There is no refund to confirm on this report' });
  await pool.query("UPDATE orders SET payment_status = 'refunded' WHERE id = $1", [rows[0].order_id]);
  const issue = await loadIssue(req.params.id);
  await notify(issue.owner_id, {
    audience: 'restaurant', type: 'success', link: `/owner/issues?order=${issue.order_id}`,
    title: `The customer received the ${peso(rows[0].refund_approved)} refund for order #${rows[0].order_id}`,
  });
  res.json({ message: 'Thanks for confirming' });
}

// Customer takes a refund that hasn't been sent yet as store credit instead (instant)
async function toCredit(req, res) {
  const issue = await loadIssue(req.params.id);
  if (!issue || issue.customer_id !== req.user.id) return res.status(404).json({ error: 'Report not found' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE issues SET refund_status = 'credited', refund_method = 'credit', refund_received_at = NOW()
       WHERE id = $1 AND refund_status = 'to_send' AND refund_approved > 0
       RETURNING refund_approved`,
      [issue.id]
    );
    if (!rows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This refund can no longer be changed to store credit' });
    }
    await creditRefund(client, issue, Number(rows[0].refund_approved));
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  await notify(issue.owner_id, {
    audience: 'restaurant', type: 'info', link: `/owner/issues?order=${issue.order_id}`,
    title: `No need to send the refund for order #${issue.order_id}`,
    message: `The customer took ${peso(issue.refund_approved)} as store credit at your restaurant instead.`,
  });
  res.json({ message: 'Added as store credit' });
}

// ── Restaurant owner ─────────────────────────────────────────────────────────

async function restaurantList(req, res) {
  const { rows } = await pool.query(
    `SELECT ${ISSUE_COLS}, u.name AS customer_name, u.phone AS customer_phone,
            o.total AS order_total, o.payment_method, o.created_at AS order_created_at
     FROM issues i
     JOIN orders o      ON o.id = i.order_id
     JOIN restaurants r ON r.id = o.restaurant_id
     JOIN users u       ON u.id = i.customer_id
     WHERE r.owner_id = $1
     ORDER BY (i.handler = 'restaurant' AND i.status = 'pending') DESC,
              (i.refund_status IN ('to_send','not_received')) DESC,
              i.created_at DESC
     LIMIT 200`,
    [req.user.id]
  );
  res.json({ data: rows });
}

// The restaurant accepts the report, with or without a refund it will send
async function restaurantResolve(req, res) {
  const issue = await loadIssue(req.params.id);
  if (!issue || issue.owner_id !== req.user.id) return res.status(404).json({ error: 'Report not found' });
  const amount = req.body.refundApproved == null || req.body.refundApproved === '' ? null : parseAmount(req.body.refundApproved, issue.order_total);
  if (req.body.refundApproved != null && req.body.refundApproved !== '' && amount == null) {
    return res.status(400).json({ error: 'Enter a refund amount above ₱0' });
  }
  const notes = String(req.body.notes || '').trim().slice(0, 1000) || null;
  const asCredit = !!amount && issue.refund_method === 'credit';
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rowCount } = await client.query(
      `UPDATE issues SET status = 'resolved', refund_approved = $2, refund_status = $3,
         resolution_notes = $4, resolved_by = $5, resolved_at = NOW(),
         refund_received_at = CASE WHEN $3::varchar = 'credited' THEN NOW() ELSE refund_received_at END
       WHERE id = $1 AND handler = 'restaurant' AND status = 'pending'`,
      [issue.id, amount, asCredit ? 'credited' : amount ? 'to_send' : null, notes, req.user.id]
    );
    if (!rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This report was already answered or is with KinakanGo' });
    }
    if (asCredit) await creditRefund(client, issue, amount);
    // Approving a GCash check means the money did arrive
    else if (issue.payment_check && amount) await client.query("UPDATE orders SET payment_status = 'paid' WHERE id = $1", [issue.order_id]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  await notify(issue.customer_id, {
    audience: 'customer', type: 'success', link: `/order-receipt/${issue.order_id}`,
    title: asCredit
      ? `${peso(amount)} store credit added at ${issue.restaurant_name}`
      : amount
        ? `${issue.restaurant_name} approved a ${peso(amount)} refund for order #${issue.order_id}`
        : `${issue.restaurant_name} answered your report about order #${issue.order_id}`,
    message: asCredit ? `It's used automatically on your next order there. ${notes || ''}`.trim()
      : amount ? `They will send it to you. ${notes || ''}`.trim() : notes,
  });
  res.json({ message: 'Saved', credited: asCredit });
}

async function restaurantDeny(req, res) {
  const issue = await loadIssue(req.params.id);
  if (!issue || issue.owner_id !== req.user.id) return res.status(404).json({ error: 'Report not found' });
  const notes = String(req.body.notes || '').trim().slice(0, 1000);
  if (notes.length < 3) return res.status(400).json({ error: 'Tell the customer why' });
  const { rowCount } = await pool.query(
    `UPDATE issues SET status = 'denied', resolution_notes = $2, resolved_by = $3, resolved_at = NOW()
     WHERE id = $1 AND handler = 'restaurant' AND status = 'pending'`,
    [issue.id, notes, req.user.id]
  );
  if (!rowCount) return res.status(409).json({ error: 'This report was already answered or is with KinakanGo' });
  await notify(issue.customer_id, {
    audience: 'customer', type: 'error', link: `/order-receipt/${issue.order_id}`,
    title: `${issue.restaurant_name} declined your report about order #${issue.order_id}`,
    message: `${notes} If you disagree, open the order and ask KinakanGo to review.`,
  });
  res.json({ message: 'Declined' });
}

// The restaurant sent the money back (GCash or cash) and says how
async function refundSent(req, res) {
  const issue = await loadIssue(req.params.id);
  if (!issue || issue.owner_id !== req.user.id) return res.status(404).json({ error: 'Report not found' });
  const note = String(req.body.note || '').trim().slice(0, 300);
  if (note.length < 3) return res.status(400).json({ error: 'Say how you sent it, e.g. "GCash ref 1234567"' });
  const { rowCount } = await pool.query(
    `UPDATE issues SET refund_status = 'sent', refund_sent_note = $2, refund_sent_at = NOW()
     WHERE id = $1 AND refund_status IN ('to_send','not_received')`,
    [issue.id, note]
  );
  if (!rowCount) return res.status(409).json({ error: 'There is no refund waiting to be sent on this report' });
  await notify(issue.customer_id, {
    audience: 'customer', type: 'success', link: `/order-receipt/${issue.order_id}`,
    title: `${issue.restaurant_name} sent your ${peso(issue.refund_approved)} refund for order #${issue.order_id}`,
    message: `${note}. Open the order to confirm you got it.`,
  });
  res.json({ message: 'Marked as sent' });
}

// ── Admin ────────────────────────────────────────────────────────────────────

async function list(req, res) {
  const { type, status, handler } = req.query;
  const page  = Math.max(parseInt(req.query.page)  || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 100, 1), 200);
  const offset = (page - 1) * limit;
  const where  = [];
  const params = [];
  let   idx    = 1;

  if (type)    { where.push(`i.type = $${idx++}`);    params.push(type); }
  if (status)  { where.push(`i.status = $${idx++}`);  params.push(status); }
  if (handler) { where.push(`i.handler = $${idx++}`); params.push(handler); }

  const cond = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT i.*, u.name AS customer_name, u.email AS customer_email, r.name AS restaurant_name, o.total AS order_total
     FROM issues i
     JOIN orders o      ON i.order_id = o.id
     JOIN users u       ON i.customer_id = u.id
     JOIN restaurants r ON o.restaurant_id = r.id
     ${cond}
     ORDER BY i.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset]
  );
  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) AS total FROM issues i ${cond}`, params
  );
  res.json({ data: rows, total: parseInt(countRows[0].total), page, limit });
}

// Admin decision on a report that is with the admin. Approving a refund tells the
// restaurant to send it; the order is marked refunded once the customer confirms.
async function resolve(req, res) {
  const issue = await loadIssue(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });
  const notes = String(req.body.notes || '').trim().slice(0, 1000) || null;
  // Refund amount in pesos (older admin pages sent `true`: then refund what was asked for)
  const raw = req.body.refundApproved === true ? (issue.refund_requested || issue.order_total) : req.body.refundApproved;
  const amount = parseAmount(raw, issue.order_total);
  // A refund already confirmed or credited stays as it is
  const settled = ['received', 'credited'].includes(issue.refund_status);
  const asCredit = !!amount && !settled && issue.refund_method === 'credit';
  const refundStatus = amount
    ? (settled ? issue.refund_status
      : asCredit ? 'credited'
      : issue.refund_status === 'sent' && Number(issue.refund_approved) === amount ? 'sent' : 'to_send')
    : issue.refund_status;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE issues SET status = 'resolved', handler = 'admin',
         refund_approved = CASE WHEN $6::boolean THEN refund_approved ELSE COALESCE($2, refund_approved) END,
         refund_status = $3, resolution_notes = $4, resolved_by = $5, resolved_at = NOW(),
         refund_received_at = CASE WHEN $3::varchar = 'credited' AND refund_received_at IS NULL THEN NOW() ELSE refund_received_at END
       WHERE id = $1`,
      [issue.id, amount, refundStatus, notes, req.user.id, settled]
    );
    if (asCredit) await creditRefund(client, issue, amount);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  await notify(issue.customer_id, {
    audience: 'customer', type: 'success', link: `/order-receipt/${issue.order_id}`,
    title: asCredit
      ? `${peso(amount)} store credit added at ${issue.restaurant_name}`
      : amount
        ? `KinakanGo approved a ${peso(amount)} refund for order #${issue.order_id}`
        : `Your report about order #${issue.order_id} was resolved`,
    message: asCredit ? `KinakanGo approved your refund. It's used automatically on your next order there. ${notes || ''}`.trim()
      : amount ? `${issue.restaurant_name} will send it to you. ${notes || ''}`.trim() : notes,
  });
  if (amount && refundStatus === 'to_send') {
    await notify(issue.owner_id, {
      audience: 'restaurant', type: 'warning', link: `/owner/issues?order=${issue.order_id}`,
      title: `KinakanGo approved a ${peso(amount)} refund for order #${issue.order_id}`,
      message: `Please send it to the customer and tap "Refund sent". ${notes || ''}`.trim(),
    });
  }
  res.json({ message: 'Resolved' });
}

async function deny(req, res) {
  const issue = await loadIssue(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });
  const notes = String(req.body.notes || '').trim().slice(0, 1000) || null;
  await pool.query(
    `UPDATE issues SET status = 'denied', handler = 'admin', resolution_notes = $2, resolved_by = $3, resolved_at = NOW(),
       refund_status = CASE WHEN refund_status = 'received' THEN 'received' ELSE NULL END
     WHERE id = $1`,
    [issue.id, notes, req.user.id]
  );
  await notify(issue.customer_id, {
    audience: 'customer', type: 'error', link: `/order-receipt/${issue.order_id}`,
    title: `KinakanGo declined your report about order #${issue.order_id}`,
    message: notes,
  });
  res.json({ message: 'Denied' });
}

module.exports = {
  submit, mine, escalate, received, toCredit,
  restaurantList, restaurantResolve, restaurantDeny, refundSent,
  list, resolve, deny,
};

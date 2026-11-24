const pool = require('../config/db');
const { notify } = require('../utils/notify');

const TYPES = ['refund', 'quality', 'payment', 'rider', 'missing'];

// Customer reports a problem with one of their own orders (optionally asking for a refund)
async function submit(req, res) {
  const orderId = parseInt(req.body.orderId);
  const type = String(req.body.type || '');
  const description = String(req.body.description || '').trim().slice(0, 1000);
  if (!Number.isInteger(orderId)) return res.status(400).json({ error: 'Choose the order this is about' });
  if (!TYPES.includes(type)) return res.status(400).json({ error: 'Choose what went wrong' });
  if (description.length < 5) return res.status(400).json({ error: 'Please describe the problem' });

  const { rows: orders } = await pool.query(
    'SELECT id, customer_id, status, total FROM orders WHERE id = $1', [orderId]
  );
  const order = orders[0];
  if (!order || order.customer_id !== req.user.id) return res.status(404).json({ error: 'Order not found' });
  if (order.status === 'pending') {
    return res.status(400).json({ error: 'This order is still waiting for the restaurant. You can cancel it instead.' });
  }
  const { rows: open } = await pool.query(
    "SELECT 1 FROM issues WHERE order_id = $1 AND status = 'pending'", [orderId]
  );
  if (open.length) return res.status(409).json({ error: 'You already reported this order. We will get back to you soon.' });

  // A refund request is for at most the order total
  let refund = req.body.refundRequested == null || req.body.refundRequested === '' ? null : Number(req.body.refundRequested);
  if (refund != null) {
    if (!Number.isFinite(refund) || refund <= 0) return res.status(400).json({ error: 'Enter a refund amount above ₱0' });
    refund = Math.min(Math.round(refund * 100) / 100, Number(order.total));
  }
  const priority = refund != null || type === 'missing' ? 'high' : 'medium';

  const { rows } = await pool.query(
    `INSERT INTO issues (order_id, customer_id, type, priority, description, refund_requested)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, order_id, type, status, description, refund_requested, created_at`,
    [orderId, req.user.id, type, priority, description, refund]
  );
  res.status(201).json(rows[0]);
}

// The customer's own reports (for showing status on the order page)
async function mine(req, res) {
  const params = [req.user.id];
  let cond = 'customer_id = $1';
  if (req.query.orderId) { cond += ' AND order_id = $2'; params.push(parseInt(req.query.orderId) || 0); }
  const { rows } = await pool.query(
    `SELECT id, order_id, type, status, description, refund_requested, refund_approved, resolution_notes, created_at, resolved_at
     FROM issues WHERE ${cond} ORDER BY created_at DESC LIMIT 50`, params
  );
  res.json({ data: rows });
}

async function list(req, res) {
  const { type, status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const where  = [];
  const params = [];
  let   idx    = 1;

  if (type)   { where.push(`i.type = $${idx++}`);   params.push(type); }
  if (status) { where.push(`i.status = $${idx++}`); params.push(status); }

  const cond = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT i.*, u.name AS customer_name, r.name AS restaurant_name, o.total AS order_total
     FROM issues i
     JOIN orders o      ON i.order_id = o.id
     JOIN users u       ON i.customer_id = u.id
     JOIN restaurants r ON o.restaurant_id = r.id
     ${cond}
     ORDER BY i.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, parseInt(limit), offset]
  );
  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) AS total FROM issues i ${cond}`, params
  );
  res.json({ data: rows, total: parseInt(countRows[0].total), page: parseInt(page), limit: parseInt(limit) });
}

async function resolve(req, res) {
  const { notes } = req.body;
  // Refund amount in pesos (older admin pages sent `true`: then refund what was asked for)
  const { rows: cur } = await pool.query(
    'SELECT i.refund_requested, o.total FROM issues i JOIN orders o ON o.id = i.order_id WHERE i.id = $1', [req.params.id]
  );
  if (!cur.length) return res.status(404).json({ error: 'Issue not found' });
  let refundApproved = req.body.refundApproved === true ? Number(cur[0].refund_requested || cur[0].total) : Number(req.body.refundApproved);
  refundApproved = Number.isFinite(refundApproved) && refundApproved > 0 ? Math.min(refundApproved, Number(cur[0].total)) : null;
  await pool.query(
    `UPDATE issues SET
       status = 'resolved', refund_approved = $1, resolution_notes = $2,
       resolved_by = $3, resolved_at = NOW()
     WHERE id = $4`,
    [refundApproved || null, notes || null, req.user.id, req.params.id]
  );

  if (refundApproved) {
    const { rows } = await pool.query('SELECT order_id FROM issues WHERE id = $1', [req.params.id]);
    if (rows.length) {
      await pool.query(
        "UPDATE orders SET payment_status = 'refunded' WHERE id = $1", [rows[0].order_id]
      );
    }
  }
  const { rows: issue } = await pool.query('SELECT customer_id, order_id FROM issues WHERE id = $1', [req.params.id]);
  if (issue[0]) await notify(issue[0].customer_id, {
    audience: 'customer', type: 'success', link: '/customer-service',
    title: refundApproved ? `Refund of ₱${refundApproved.toFixed(2)} approved for order #${issue[0].order_id}` : `Your report about order #${issue[0].order_id} was resolved`,
    message: notes || null,
  });
  res.json({ message: 'Resolved' });
}

async function deny(req, res) {
  const { notes } = req.body;
  await pool.query(
    `UPDATE issues SET status = 'denied', resolution_notes = $1, resolved_by = $2, resolved_at = NOW()
     WHERE id = $3`,
    [notes || null, req.user.id, req.params.id]
  );
  const { rows: issue } = await pool.query('SELECT customer_id, order_id FROM issues WHERE id = $1', [req.params.id]);
  if (issue[0]) await notify(issue[0].customer_id, {
    audience: 'customer', type: 'error', link: '/customer-service',
    title: `Your report about order #${issue[0].order_id} was declined`,
    message: notes || null,
  });
  res.json({ message: 'Denied' });
}

module.exports = { submit, mine, list, resolve, deny };

const pool = require('../config/db');

async function submit(req, res) {
  const { orderId, type, priority, description, refundRequested } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO issues (order_id, customer_id, type, priority, description, refund_requested) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
    [orderId, req.user.id, type, priority || 'medium', description, refundRequested || null]
  );
  res.status(201).json({ id: rows[0].id });
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
  const { refundApproved, notes } = req.body;
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
  res.json({ message: 'Resolved' });
}

async function deny(req, res) {
  const { notes } = req.body;
  await pool.query(
    `UPDATE issues SET status = 'denied', resolution_notes = $1, resolved_by = $2, resolved_at = NOW()
     WHERE id = $3`,
    [notes || null, req.user.id, req.params.id]
  );
  res.json({ message: 'Denied' });
}

module.exports = { submit, list, resolve, deny };

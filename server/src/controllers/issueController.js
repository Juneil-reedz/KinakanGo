const pool = require('../config/db');

async function submit(req, res) {
  const { orderId, type, priority, description, refundRequested } = req.body;
  const [result] = await pool.query(
    'INSERT INTO issues (order_id, customer_id, type, priority, description, refund_requested) VALUES (?,?,?,?,?,?)',
    [orderId, req.user.id, type, priority || 'medium', description, refundRequested || null]
  );
  res.status(201).json({ id: result.insertId });
}

async function list(req, res) {
  const { type, status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const where  = ['1=1'];
  const params = [];

  if (type)   { where.push('i.type = ?');   params.push(type); }
  if (status) { where.push('i.status = ?'); params.push(status); }

  const [rows] = await pool.query(
    `SELECT i.*, u.name AS customer_name, r.name AS restaurant_name, o.total AS order_total
     FROM issues i
     JOIN orders o      ON i.order_id = o.id
     JOIN users u       ON i.customer_id = u.id
     JOIN restaurants r ON o.restaurant_id = r.id
     WHERE ${where.join(' AND ')}
     ORDER BY i.created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM issues i WHERE ${where.join(' AND ')}`, params
  );
  res.json({ data: rows, total, page: parseInt(page), limit: parseInt(limit) });
}

async function resolve(req, res) {
  const { refundApproved, notes } = req.body;
  await pool.query(
    `UPDATE issues SET
       status = 'resolved', refund_approved = ?, resolution_notes = ?,
       resolved_by = ?, resolved_at = NOW()
     WHERE id = ?`,
    [refundApproved || null, notes || null, req.user.id, req.params.id]
  );

  if (refundApproved) {
    const [rows] = await pool.query('SELECT order_id FROM issues WHERE id = ?', [req.params.id]);
    if (rows.length) {
      await pool.query(
        "UPDATE orders SET payment_status = 'refunded' WHERE id = ?", [rows[0].order_id]
      );
    }
  }
  res.json({ message: 'Resolved' });
}

async function deny(req, res) {
  const { notes } = req.body;
  await pool.query(
    `UPDATE issues SET status = 'denied', resolution_notes = ?, resolved_by = ?, resolved_at = NOW()
     WHERE id = ?`,
    [notes || null, req.user.id, req.params.id]
  );
  res.json({ message: 'Denied' });
}

module.exports = { submit, list, resolve, deny };

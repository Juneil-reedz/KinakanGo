const pool = require('../config/db');

async function submitRequest(req, res) {
  const { plan, amount, payment_method, reference_number, proof_image, notes } = req.body;
  const userId = req.user.id;

  if (!plan || !amount || !payment_method) {
    return res.status(400).json({ error: 'Plan, amount and payment method are required' });
  }
  if (!proof_image) {
    return res.status(400).json({ error: 'Proof of payment is required' });
  }

  // Check for existing pending request
  const { rows: existing } = await pool.query(
    `SELECT id, status FROM upgrade_requests WHERE user_id = $1 AND status = 'pending'`,
    [userId]
  );
  if (existing.length) {
    return res.status(409).json({ error: 'You already have a pending upgrade request' });
  }

  const { rows } = await pool.query(
    `INSERT INTO upgrade_requests (user_id, plan, amount, payment_method, reference_number, proof_image, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [userId, plan, amount, payment_method, reference_number || null, proof_image || null, notes || null]
  );

  res.status(201).json({ id: rows[0].id, message: 'Upgrade request submitted. Pending admin review.' });
}

async function myRequest(req, res) {
  const { rows } = await pool.query(
    `SELECT id, plan, amount, payment_method, reference_number, status, admin_note, notes, created_at, reviewed_at
     FROM upgrade_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [req.user.id]
  );
  res.json(rows[0] || null);
}

async function listRequests(req, res) {
  const { status } = req.query;
  let q = `SELECT ur.*, u.name as user_name, u.email as user_email
           FROM upgrade_requests ur JOIN users u ON u.id = ur.user_id`;
  const params = [];
  if (status) { q += ` WHERE ur.status = $1`; params.push(status); }
  q += ` ORDER BY ur.created_at DESC`;
  const { rows } = await pool.query(q, params);
  res.json(rows);
}

async function approveRequest(req, res) {
  const { id } = req.params;
  const { admin_note } = req.body;

  const { rows: reqRows } = await pool.query(
    `SELECT * FROM upgrade_requests WHERE id = $1`, [id]
  );
  if (!reqRows.length) return res.status(404).json({ error: 'Request not found' });
  const request = reqRows[0];
  if (request.status !== 'pending') return res.status(400).json({ error: 'Request already reviewed' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update request status
    await client.query(
      `UPDATE upgrade_requests SET status='approved', admin_note=$1, reviewed_by=$2, reviewed_at=NOW() WHERE id=$3`,
      [admin_note || null, req.user.id, id]
    );

    // Upgrade user role
    await client.query(
      `UPDATE users SET role='restaurant_owner' WHERE id=$1`,
      [request.user_id]
    );

    // Create a starter restaurant record if none exists
    const { rows: existing } = await client.query(
      `SELECT id FROM restaurants WHERE owner_id=$1`, [request.user_id]
    );
    if (!existing.length) {
      const { rows: userRows } = await client.query(`SELECT name FROM users WHERE id=$1`, [request.user_id]);
      await client.query(
        `INSERT INTO restaurants (owner_id, name, description, category, address, delivery_fee, min_order, is_approved, is_open)
         VALUES ($1,$2,'New restaurant on KinakanGo','Filipino','Tawi-Tawi',50,100,true,false)`,
        [request.user_id, `${userRows[0]?.name || 'New'}'s Restaurant`]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Request approved. User upgraded to restaurant owner.' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function rejectRequest(req, res) {
  const { id } = req.params;
  const { admin_note } = req.body;

  const { rows } = await pool.query(
    `UPDATE upgrade_requests SET status='rejected', admin_note=$1, reviewed_by=$2, reviewed_at=NOW()
     WHERE id=$3 AND status='pending' RETURNING id`,
    [admin_note || null, req.user.id, id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Request not found or already reviewed' });
  res.json({ message: 'Request rejected.' });
}

module.exports = { submitRequest, myRequest, listRequests, approveRequest, rejectRequest };

const pool = require('../config/db');

async function submit(req, res) {
  const { type, data } = req.body;
  if (!['rider', 'restaurant'].includes(type)) {
    return res.status(400).json({ error: 'Invalid application type' });
  }
  const { rows } = await pool.query(
    'INSERT INTO applications (user_id, type, data) VALUES ($1,$2,$3) RETURNING id',
    [req.user.id, type, data]
  );
  res.status(201).json({ id: rows[0].id });
}

async function list(req, res) {
  const { type, status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const where  = [];
  const params = [];
  let   idx    = 1;

  if (type)   { where.push(`a.type = $${idx++}`);   params.push(type); }
  if (status) { where.push(`a.status = $${idx++}`); params.push(status); }

  const cond = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT a.id, a.type, a.status, a.created_at, a.updated_at,
            u.name AS applicant_name, u.email AS applicant_email
     FROM applications a JOIN users u ON a.user_id = u.id
     ${cond}
     ORDER BY a.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, parseInt(limit), offset]
  );
  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) AS total FROM applications a ${cond}`, params
  );
  res.json({ data: rows, total: parseInt(countRows[0].total), page: parseInt(page), limit: parseInt(limit) });
}

async function getOne(req, res) {
  const { rows } = await pool.query(
    `SELECT a.*, u.name AS applicant_name, u.email AS applicant_email, u.phone AS applicant_phone
     FROM applications a JOIN users u ON a.user_id = u.id WHERE a.id = $1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Application not found' });
  res.json(rows[0]);
}

async function approve(req, res) {
  const { rows } = await pool.query('SELECT * FROM applications WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  const app = rows[0];

  await pool.query(
    'UPDATE applications SET status = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3',
    ['approved', req.user.id, req.params.id]
  );

  if (app.type === 'rider') {
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', ['rider', app.user_id]);
  } else if (app.type === 'restaurant') {
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', ['restaurant_owner', app.user_id]);
  }

  res.json({ message: 'Approved' });
}

async function reject(req, res) {
  const { reason } = req.body;
  await pool.query(
    'UPDATE applications SET status = $1, reject_reason = $2, reviewed_by = $3, reviewed_at = NOW() WHERE id = $4',
    ['rejected', reason || null, req.user.id, req.params.id]
  );
  res.json({ message: 'Rejected' });
}

module.exports = { submit, list, getOne, approve, reject };

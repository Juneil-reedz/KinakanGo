const pool = require('../config/db');

async function submit(req, res) {
  const { type, data } = req.body;
  if (!['rider', 'restaurant'].includes(type)) {
    return res.status(400).json({ error: 'Invalid application type' });
  }
  const [result] = await pool.query(
    'INSERT INTO applications (user_id, type, data) VALUES (?,?,?)',
    [req.user.id, type, JSON.stringify(data)]
  );
  res.status(201).json({ id: result.insertId });
}

async function list(req, res) {
  const { type, status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const where  = ['1=1'];
  const params = [];

  if (type)   { where.push('a.type = ?');   params.push(type); }
  if (status) { where.push('a.status = ?'); params.push(status); }

  const [rows] = await pool.query(
    `SELECT a.id, a.type, a.status, a.created_at, a.updated_at,
            u.name AS applicant_name, u.email AS applicant_email
     FROM applications a JOIN users u ON a.user_id = u.id
     WHERE ${where.join(' AND ')}
     ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM applications a WHERE ${where.join(' AND ')}`, params
  );
  res.json({ data: rows, total, page: parseInt(page), limit: parseInt(limit) });
}

async function getOne(req, res) {
  const [rows] = await pool.query(
    `SELECT a.*, u.name AS applicant_name, u.email AS applicant_email, u.phone AS applicant_phone
     FROM applications a JOIN users u ON a.user_id = u.id WHERE a.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Application not found' });
  res.json(rows[0]);
}

async function approve(req, res) {
  const [rows] = await pool.query('SELECT * FROM applications WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  const app = rows[0];

  await pool.query(
    'UPDATE applications SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
    ['approved', req.user.id, req.params.id]
  );

  // Promote user role on approval
  if (app.type === 'rider') {
    await pool.query('UPDATE users SET role = ? WHERE id = ?', ['rider', app.user_id]);
  } else if (app.type === 'restaurant') {
    await pool.query('UPDATE users SET role = ? WHERE id = ?', ['restaurant_owner', app.user_id]);
  }

  res.json({ message: 'Approved' });
}

async function reject(req, res) {
  const { reason } = req.body;
  await pool.query(
    'UPDATE applications SET status = ?, reject_reason = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
    ['rejected', reason || null, req.user.id, req.params.id]
  );
  res.json({ message: 'Rejected' });
}

module.exports = { submit, list, getOne, approve, reject };

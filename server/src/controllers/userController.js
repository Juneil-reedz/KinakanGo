const pool = require('../config/db');

async function list(req, res) {
  const { role, status, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const where = ['1=1'];
  const params = [];

  if (role)   { where.push('role = ?');        params.push(role); }
  if (status === 'active') { where.push('is_active = 1'); }
  if (status === 'banned') { where.push('is_active = 0'); }
  if (search) { where.push('(name LIKE ? OR email LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }

  const [rows] = await pool.query(
    `SELECT id, name, email, phone, role, avatar_url, is_active, created_at
     FROM users WHERE ${where.join(' AND ')}
     ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM users WHERE ${where.join(' AND ')}`, params
  );
  res.json({ data: rows, total, page: parseInt(page), limit: parseInt(limit) });
}

async function getOne(req, res) {
  const [rows] = await pool.query(
    'SELECT id, name, email, phone, role, avatar_url, is_active, created_at FROM users WHERE id = ?',
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
}

async function update(req, res) {
  const { name, phone, avatarUrl } = req.body;
  await pool.query(
    'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), avatar_url = COALESCE(?, avatar_url) WHERE id = ?',
    [name || null, phone || null, avatarUrl || null, req.params.id]
  );
  res.json({ message: 'Updated' });
}

async function ban(req, res) {
  const { reason } = req.body;
  await pool.query('UPDATE users SET is_active = 0, ban_reason = ? WHERE id = ?', [reason || null, req.params.id]);
  res.json({ message: 'User banned' });
}

async function unban(req, res) {
  await pool.query('UPDATE users SET is_active = 1, ban_reason = NULL WHERE id = ?', [req.params.id]);
  res.json({ message: 'User unbanned' });
}

module.exports = { list, getOne, update, ban, unban };

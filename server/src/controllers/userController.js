const pool = require('../config/db');

async function list(req, res) {
  const { role, status, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const where  = [];
  const params = [];
  let   idx    = 1;

  // Riders keep 'customer' role; identify them via rider_profiles join
  const isRiderQuery = role === 'rider';

  if (role && !isRiderQuery) { where.push(`u.role = $${idx++}`); params.push(role); }
  if (isRiderQuery)          { where.push(`rp.user_id IS NOT NULL`); }
  if (status === 'active')   { where.push('u.is_active = true'); }
  if (status === 'banned')   { where.push('u.is_active = false'); }
  if (search) {
    where.push(`(u.name ILIKE $${idx++} OR u.email ILIKE $${idx++})`);
    params.push(`%${search}%`, `%${search}%`);
  }

  const cond = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, u.role, u.avatar_url, u.is_active, u.created_at,
            rp.vehicle_type, rp.plate_number
     FROM users u
     LEFT JOIN rider_profiles rp ON rp.user_id = u.id
     ${cond}
     ORDER BY u.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, parseInt(limit), offset]
  );
  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) AS total FROM users u LEFT JOIN rider_profiles rp ON rp.user_id = u.id ${cond}`, params
  );
  res.json({ data: rows, total: parseInt(countRows[0].total), page: parseInt(page), limit: parseInt(limit) });
}

async function getOne(req, res) {
  const { rows } = await pool.query(
    'SELECT id, name, email, phone, role, avatar_url, is_active, created_at FROM users WHERE id = $1',
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
}

async function update(req, res) {
  const { name, phone, avatarUrl } = req.body;
  await pool.query(
    `UPDATE users SET
       name       = COALESCE($1, name),
       phone      = COALESCE($2, phone),
       avatar_url = COALESCE($3, avatar_url)
     WHERE id = $4`,
    [name || null, phone || null, avatarUrl || null, req.params.id]
  );
  res.json({ message: 'Updated' });
}

async function ban(req, res) {
  const { reason } = req.body;
  await pool.query(
    'UPDATE users SET is_active = false, ban_reason = $1 WHERE id = $2',
    [reason || null, req.params.id]
  );
  res.json({ message: 'User banned' });
}

async function unban(req, res) {
  await pool.query(
    'UPDATE users SET is_active = true, ban_reason = NULL WHERE id = $1',
    [req.params.id]
  );
  res.json({ message: 'User unbanned' });
}

module.exports = { list, getOne, update, ban, unban };

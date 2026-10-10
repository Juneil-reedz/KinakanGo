const pool = require('../config/db');
const { imageUrlSql, resolveImageUrls } = require('../routes/images');

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
    `SELECT u.id, u.name, u.email, u.phone, u.role, ${imageUrlSql('u', 'users', 'avatar_url')} AS avatar_url, u.is_active, u.created_at,
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
  rows.forEach(r => resolveImageUrls(req, r, ['avatar_url']));
  res.json({ data: rows, total: parseInt(countRows[0].total), page: parseInt(page), limit: parseInt(limit) });
}

async function getOne(req, res) {
  const { rows } = await pool.query(
    `SELECT id, name, email, phone, role, ${imageUrlSql('users', 'users', 'avatar_url')} AS avatar_url, is_active, created_at FROM users WHERE id = $1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(resolveImageUrls(req, rows[0], ['avatar_url']));
}

async function update(req, res) {
  // Users may only edit their own profile (admins may edit anyone's)
  if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { name, phone, avatarUrl } = req.body;
  await pool.query(
    `UPDATE users SET
       name       = COALESCE($1, name),
       phone      = COALESCE($2, phone),
       avatar_url = COALESCE($3, avatar_url)
     WHERE id = $4`,
    [name || null, phone || null, avatarUrl || null, req.params.id]
  );
  // Return the photo as a short URL so the client can show it without storing the image itself
  const { rows } = await pool.query(
    `SELECT ${imageUrlSql('users', 'users', 'avatar_url')} AS avatar_url FROM users WHERE id = $1`, [req.params.id]
  );
  res.json({ message: 'Updated', avatarUrl: rows[0] ? resolveImageUrls(req, rows[0], ['avatar_url']).avatar_url : null });
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

const pool = require('../config/db');

async function list(req, res) {
  const { search, cuisine, isOpen, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const where = ['is_approved = 1'];
  const params = [];

  if (search)  { where.push('name LIKE ?');    params.push(`%${search}%`); }
  if (cuisine) { where.push('cuisine = ?');    params.push(cuisine); }
  if (isOpen !== undefined) { where.push('is_open = ?'); params.push(isOpen === 'true' ? 1 : 0); }

  const [rows] = await pool.query(
    `SELECT id, name, description, address, cuisine, image_url, cover_url,
            is_open, rating, review_count, delivery_fee, min_order
     FROM restaurants WHERE ${where.join(' AND ')}
     ORDER BY rating DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM restaurants WHERE ${where.join(' AND ')}`, params
  );
  res.json({ data: rows, total, page: parseInt(page), limit: parseInt(limit) });
}

async function getOne(req, res) {
  const [rows] = await pool.query(
    `SELECT r.*, u.name AS owner_name, u.email AS owner_email
     FROM restaurants r JOIN users u ON r.owner_id = u.id
     WHERE r.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Restaurant not found' });
  res.json(rows[0]);
}

async function create(req, res) {
  const { name, description, address, cuisine, deliveryFee, minOrder } = req.body;
  const ownerId = req.user.id;
  const [result] = await pool.query(
    'INSERT INTO restaurants (owner_id, name, description, address, cuisine, delivery_fee, min_order) VALUES (?,?,?,?,?,?,?)',
    [ownerId, name, description || null, address, cuisine || null, deliveryFee || 0, minOrder || 0]
  );
  res.status(201).json({ id: result.insertId });
}

async function update(req, res) {
  const { name, description, address, cuisine, imageUrl, coverUrl, deliveryFee, minOrder, isOpen } = req.body;
  await pool.query(
    `UPDATE restaurants SET
       name         = COALESCE(?, name),
       description  = COALESCE(?, description),
       address      = COALESCE(?, address),
       cuisine      = COALESCE(?, cuisine),
       image_url    = COALESCE(?, image_url),
       cover_url    = COALESCE(?, cover_url),
       delivery_fee = COALESCE(?, delivery_fee),
       min_order    = COALESCE(?, min_order),
       is_open      = COALESCE(?, is_open)
     WHERE id = ?`,
    [name||null, description||null, address||null, cuisine||null,
     imageUrl||null, coverUrl||null, deliveryFee??null, minOrder??null, isOpen??null,
     req.params.id]
  );
  res.json({ message: 'Updated' });
}

async function remove(req, res) {
  await pool.query('DELETE FROM restaurants WHERE id = ?', [req.params.id]);
  res.json({ message: 'Deleted' });
}

async function approve(req, res) {
  await pool.query('UPDATE restaurants SET is_approved = 1 WHERE id = ?', [req.params.id]);
  res.json({ message: 'Approved' });
}

async function myRestaurant(req, res) {
  const [rows] = await pool.query(
    'SELECT * FROM restaurants WHERE owner_id = ? LIMIT 1', [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'No restaurant found' });
  res.json(rows[0]);
}

module.exports = { list, getOne, create, update, remove, approve, myRestaurant };

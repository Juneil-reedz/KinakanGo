const pool = require('../config/db');

async function list(req, res) {
  const { search, cuisine, isOpen, includeClosed, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const where  = ['is_approved = true'];
  const params = [];
  let   idx    = 1;

  if (search)  { where.push(`name ILIKE $${idx++}`);    params.push(`%${search}%`); }
  if (cuisine) { where.push(`cuisine = $${idx++}`);     params.push(cuisine); }
  if (isOpen !== undefined) {
    where.push(`is_open = $${idx++}`);
    params.push(isOpen === 'true');
  } else if (includeClosed !== 'true') {
    where.push('is_open = true');
  }

  const { rows } = await pool.query(
    `SELECT id, name, description, address, cuisine, image_url, cover_url,
            is_open, rating, review_count, delivery_fee, min_order
     FROM restaurants WHERE ${where.join(' AND ')}
     ORDER BY rating DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, parseInt(limit), offset]
  );
  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) AS total FROM restaurants WHERE ${where.join(' AND ')}`, params
  );
  res.json({ data: rows, total: parseInt(countRows[0].total), page: parseInt(page), limit: parseInt(limit) });
}

async function getOne(req, res) {
  const { rows } = await pool.query(
    `SELECT r.*, u.name AS owner_name, u.email AS owner_email
     FROM restaurants r JOIN users u ON r.owner_id = u.id
     WHERE r.id = $1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Restaurant not found' });
  res.json(rows[0]);
}

async function create(req, res) {
  const { name, description, address, cuisine, deliveryFee, minOrder } = req.body;
  const ownerId = req.user.id;
  const { rows } = await pool.query(
    `INSERT INTO restaurants (owner_id, name, description, address, cuisine, delivery_fee, min_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [ownerId, name, description || null, address, cuisine || null, deliveryFee || 0, minOrder || 0]
  );
  res.status(201).json({ id: rows[0].id });
}

async function update(req, res) {
  // Allow the restaurant's own owner (any role) or an admin
  if (req.user.role !== 'admin') {
    const { rows: own } = await pool.query('SELECT owner_id FROM restaurants WHERE id = $1', [req.params.id]);
    if (!own.length || own[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }
  const { name, description, address, cuisine, imageUrl, coverUrl, deliveryFee, minOrder, isOpen, gcashNumber, gcashName } = req.body;
  const { rows } = await pool.query(
    `UPDATE restaurants SET
       name         = COALESCE($1,  name),
       description  = COALESCE($2,  description),
       address      = COALESCE($3,  address),
       cuisine      = COALESCE($4,  cuisine),
       image_url    = COALESCE($5,  image_url),
       cover_url    = COALESCE($6,  cover_url),
       delivery_fee = COALESCE($7,  delivery_fee),
       min_order    = COALESCE($8,  min_order),
       is_open      = COALESCE($9,  is_open),
       gcash_number = COALESCE($10, gcash_number),
       gcash_name   = COALESCE($11, gcash_name)
     WHERE id = $12 RETURNING *`,
    [name ?? null, description ?? null, address ?? null, cuisine ?? null,
     imageUrl ?? null, coverUrl ?? null, deliveryFee ?? null, minOrder ?? null, isOpen ?? null,
     gcashNumber ?? null, gcashName ?? null,
     req.params.id]
  );
  res.json(rows[0] || { message: 'Updated' });
}

async function remove(req, res) {
  await pool.query('DELETE FROM restaurants WHERE id = $1', [req.params.id]);
  res.json({ message: 'Deleted' });
}

async function approve(req, res) {
  await pool.query('UPDATE restaurants SET is_approved = true WHERE id = $1', [req.params.id]);
  res.json({ message: 'Approved' });
}

async function myRestaurant(req, res) {
  const { rows } = await pool.query(
    'SELECT * FROM restaurants WHERE owner_id = $1 LIMIT 1', [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'No restaurant found' });
  res.json(rows[0]);
}

module.exports = { list, getOne, create, update, remove, approve, myRestaurant };

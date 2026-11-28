const pool = require('../config/db');
const { restaurantNameTaken, nameTakenMessage } = require('../utils/restaurantName');
const { firstImageError, unlessOwn } = require('../utils/image');
const { imageUrlSql, resolveImageUrls } = require('../routes/images');

async function list(req, res) {
  const { search, cuisine, isOpen, includeClosed, sortBy } = req.query;
  const page   = Math.max(parseInt(req.query.page) || 1, 1);
  const limit  = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 200);
  const offset = (page - 1) * limit;
  const ORDER = {
    rating:      'rating DESC, review_count DESC',
    deliveryFee: 'delivery_fee ASC, rating DESC',
  };
  const orderBy = ORDER[sortBy] || 'rating DESC';
  const where  = ['is_approved = true'];
  const params = [];
  let   idx    = 1;

  if (search)  { where.push(`(name ILIKE $${idx} OR cuisine ILIKE $${idx} OR description ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
  if (cuisine) { where.push(`cuisine = $${idx++}`);     params.push(cuisine); }
  if (isOpen !== undefined) {
    where.push(`is_open = $${idx++}`);
    params.push(isOpen === 'true');
  } else if (includeClosed !== 'true') {
    where.push('is_open = true');
  }

  const { rows } = await pool.query(
    `SELECT id, name, description, address, cuisine, image_url,
            ${imageUrlSql('restaurants', 'restaurant-covers', 'cover_url')} AS cover_url,
            is_open, rating, review_count, delivery_fee, min_order
     FROM restaurants WHERE ${where.join(' AND ')}
     ORDER BY ${orderBy} LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset]
  );
  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) AS total FROM restaurants WHERE ${where.join(' AND ')}`, params
  );
  rows.forEach(r => resolveImageUrls(req, r, ['cover_url']));
  res.json({ data: rows, total: parseInt(countRows[0].total), page, limit });
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
  if (await restaurantNameTaken(name)) return res.status(409).json({ error: nameTakenMessage(name) });
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
  const { name, description, address, cuisine, deliveryFee, minOrder, isOpen, gcashNumber, gcashName } = req.body;
  const imageUrl = unlessOwn(req.body.imageUrl), coverUrl = unlessOwn(req.body.coverUrl);
  const badImage = firstImageError({ Logo: imageUrl, 'Cover photo': coverUrl });
  if (badImage) return res.status(400).json({ error: badImage });
  for (const [label, v] of [['Delivery fee', deliveryFee], ['Minimum order', minOrder]]) {
    if (v != null && v !== '' && (!Number.isFinite(Number(v)) || Number(v) < 0 || Number(v) > 100000)) {
      return res.status(400).json({ error: `${label} must be ₱0 or more` });
    }
  }
  if (name != null && String(name).trim() && await restaurantNameTaken(name, { exceptId: Number(req.params.id) })) {
    return res.status(409).json({ error: nameTakenMessage(name) });
  }
  const { rows } = await pool.query(
    `UPDATE restaurants SET
       name         = COALESCE($1,  name),
       description  = COALESCE($2,  description),
       address      = COALESCE($3,  address),
       cuisine      = COALESCE($4,  cuisine),
       image_url    = COALESCE($5,  image_url),
       cover_url    = CASE WHEN $6::text = '' THEN NULL ELSE COALESCE($6, cover_url) END,
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

// A restaurant with orders can't be deleted (order history, refunds and store
// credit point to it), so it is suspended instead: hidden, closed and unapproved.
async function remove(req, res) {
  const { rows: used } = await pool.query('SELECT 1 FROM orders WHERE restaurant_id = $1 LIMIT 1', [req.params.id]);
  if (used.length) {
    const { rowCount } = await pool.query(
      'UPDATE restaurants SET is_approved = false, is_open = false WHERE id = $1', [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Restaurant not found' });
    return res.json({ message: 'This restaurant has past orders, so it was suspended instead of deleted. It is hidden from customers.', suspended: true });
  }
  const { rowCount } = await pool.query('DELETE FROM restaurants WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Restaurant not found' });
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

const pool = require('../config/db');

async function listAll(req, res) {
  const { category, search, sortBy } = req.query;
  const limit  = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 200);
  const where  = ['m.is_available = true', 'm.is_archived = false', 'r.is_approved = true', 'r.is_open = true'];
  const params = [];
  let   idx    = 1;

  // Category chips use plural ids ("burgers"); match "Burger", "Burgers", "Beef Burgers"...
  if (category) { where.push(`c.name ILIKE $${idx++}`); params.push(`%${String(category).replace(/e?s$/i, '')}%`); }
  if (search) {
    where.push(`(m.name ILIKE $${idx} OR m.description ILIKE $${idx} OR c.name ILIKE $${idx} OR r.name ILIKE $${idx})`);
    params.push(`%${String(search).trim()}%`); idx++;
  }
  const ORDER = {
    rating: 'm.avg_rating DESC, m.rating_count DESC, m.id DESC',
    price:  'm.price ASC, m.id DESC',
  };
  const orderBy = ORDER[sortBy] || 'r.rating DESC, m.id DESC';

  const { rows } = await pool.query(
    `SELECT m.id, m.name, m.description, m.price, m.image_url,
            m.is_vegetarian, m.prep_time_mins,
            m.avg_rating, m.rating_count,
            c.name AS category_name,
            r.id AS restaurant_id, r.name AS restaurant_name, r.rating
     FROM menu_items m
     JOIN restaurants r ON m.restaurant_id = r.id
     LEFT JOIN menu_categories c ON m.category_id = c.id
     WHERE ${where.join(' AND ')}
     ORDER BY ${orderBy}
     LIMIT $${idx++}`,
    [...params, limit]
  );
  res.json(rows);
}

// Single public menu item — lets the food detail page load when opened directly
async function getItem(req, res) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid item id' });
  const { rows } = await pool.query(
    `SELECT m.id, m.name, m.description, m.price, m.image_url,
            m.is_vegetarian, m.is_available, m.prep_time_mins,
            m.avg_rating, m.rating_count,
            c.name AS category_name,
            r.id AS restaurant_id, r.name AS restaurant_name, r.rating
     FROM menu_items m
     JOIN restaurants r ON m.restaurant_id = r.id
     LEFT JOIN menu_categories c ON m.category_id = c.id
     WHERE m.id = $1 AND r.is_approved = true AND m.is_archived = false`,
    [id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Item not found' });
  res.json(rows[0]);
}

async function listItems(req, res) {
  const restaurantId = parseInt(req.params.restaurantId);
  if (isNaN(restaurantId)) return res.status(400).json({ error: 'Invalid restaurant id' });
  const includeClosed = req.query.includeClosed === 'true';
  const { rows } = await pool.query(
    `SELECT m.*, c.name AS category_name
     FROM menu_items m
     JOIN restaurants r ON r.id = m.restaurant_id
     LEFT JOIN menu_categories c ON m.category_id = c.id
     WHERE m.restaurant_id = $1 AND m.is_archived = false
       AND ($2 = true OR r.is_open = true)
     ORDER BY c.sort_order, m.name`,
    [restaurantId, includeClosed]
  );
  res.json(rows);
}

// A food needs a name and a price from ₱0 to ₱100,000 (on create; on update only what is sent)
function validateItem(body, creating) {
  if (creating || body.name !== undefined) {
    if (!String(body.name || '').trim()) return 'Enter the food name';
  }
  if (creating || (body.price !== undefined && body.price !== null)) {
    const p = Number(body.price);
    if (body.price === '' || body.price === null || !Number.isFinite(p) || p < 0 || p > 100000) {
      return 'Enter a price from ₱0 to ₱100,000';
    }
  }
  return null;
}

// A category id sent by the page must belong to this restaurant
async function ownCategory(categoryId, restaurantId) {
  if (categoryId == null || categoryId === '') return null;
  const { rows } = await pool.query(
    'SELECT id FROM menu_categories WHERE id = $1 AND restaurant_id = $2', [parseInt(categoryId) || 0, restaurantId]
  );
  return rows[0]?.id ?? null;
}

async function createItem(req, res) {
  const bad = validateItem(req.body, true);
  if (bad) return res.status(400).json({ error: bad });
  const { name, description, price, image, imageUrl, category, categoryId, isVegetarian, prepTimeMins } = req.body;
  const imgUrl = image || imageUrl || null;

  // Resolve or create category row from text name
  let catId = await ownCategory(categoryId, req.params.restaurantId);
  if (!catId && category) {
    const { rows: ex } = await pool.query(
      'SELECT id FROM menu_categories WHERE restaurant_id = $1 AND LOWER(name) = LOWER($2)',
      [req.params.restaurantId, category]
    );
    if (ex.length > 0) {
      catId = ex[0].id;
    } else {
      const { rows: cr } = await pool.query(
        'INSERT INTO menu_categories (restaurant_id, name) VALUES ($1, $2) RETURNING id',
        [req.params.restaurantId, category]
      );
      catId = cr[0].id;
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO menu_items
       (restaurant_id, category_id, name, description, price, image_url, is_vegetarian, prep_time_mins)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [req.params.restaurantId, catId, String(name).trim(), description || null,
     price, imgUrl, isVegetarian || false, prepTimeMins ?? 15]
  );
  // Attach category name so frontend can display it immediately
  res.status(201).json({ ...rows[0], category_name: category || null });
}

async function updateItem(req, res) {
  const bad = validateItem(req.body, false);
  if (bad) return res.status(400).json({ error: bad });
  const { name, description, price, image, imageUrl, category, categoryId, isVegetarian, prepTimeMins, isAvailable } = req.body;
  const imgUrl = image !== undefined ? image : imageUrl;

  // Resolve or create category row from text name
  let catId = await ownCategory(categoryId, req.params.restaurantId);
  if (catId === null && category) {
    const { rows: ex } = await pool.query(
      'SELECT id FROM menu_categories WHERE restaurant_id = $1 AND LOWER(name) = LOWER($2)',
      [req.params.restaurantId, category]
    );
    if (ex.length > 0) {
      catId = ex[0].id;
    } else {
      const { rows: cr } = await pool.query(
        'INSERT INTO menu_categories (restaurant_id, name) VALUES ($1, $2) RETURNING id',
        [req.params.restaurantId, category]
      );
      catId = cr[0].id;
    }
  }

  const { rows } = await pool.query(
    `UPDATE menu_items SET
       name           = COALESCE($1, name),
       description    = COALESCE($2, description),
       price          = COALESCE($3, price),
       image_url      = COALESCE($4, image_url),
       category_id    = COALESCE($5, category_id),
       is_vegetarian  = COALESCE($6, is_vegetarian),
       prep_time_mins = COALESCE($7, prep_time_mins),
       is_available   = COALESCE($8, is_available)
     WHERE id = $9 AND restaurant_id = $10 AND is_archived = false
     RETURNING *`,
    [name != null ? String(name).trim() : null, description ?? null, price ?? null, imgUrl ?? null, catId,
     isVegetarian ?? null, prepTimeMins ?? null, isAvailable ?? null,
     req.params.itemId, req.params.restaurantId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Food not found' });
  res.json({ ...rows[0], category_name: category || null });
}

// A food that was ever ordered can't be deleted (old orders and ratings point to it),
// so it is archived instead: hidden everywhere and no longer orderable.
async function deleteItem(req, res) {
  const { rows: used } = await pool.query(
    'SELECT 1 FROM order_items WHERE menu_item_id = $1 LIMIT 1', [req.params.itemId]
  );
  if (used.length) {
    const { rowCount } = await pool.query(
      `UPDATE menu_items SET is_archived = true, is_available = false
       WHERE id = $1 AND restaurant_id = $2`,
      [req.params.itemId, req.params.restaurantId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Food not found' });
    return res.json({ message: 'Removed from your menu. Past orders still show it.', archived: true });
  }
  const { rowCount } = await pool.query(
    'DELETE FROM menu_items WHERE id = $1 AND restaurant_id = $2',
    [req.params.itemId, req.params.restaurantId]
  );
  if (!rowCount) return res.status(404).json({ error: 'Food not found' });
  res.json({ message: 'Deleted' });
}

module.exports = { listAll, getItem, listItems, createItem, updateItem, deleteItem };

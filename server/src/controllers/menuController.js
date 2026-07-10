const pool = require('../config/db');

async function listAll(req, res) {
  const { category, limit = 20 } = req.query;
  const where  = ['m.is_available = true', 'r.is_approved = true'];
  const params = [];
  let   idx    = 1;

  if (category) { where.push(`c.name ILIKE $${idx++}`); params.push(category); }

  const { rows } = await pool.query(
    `SELECT m.id, m.name, m.description, m.price, m.image_url,
            m.is_vegetarian, m.prep_time_mins,
            c.name AS category_name,
            r.id AS restaurant_id, r.name AS restaurant_name, r.rating
     FROM menu_items m
     JOIN restaurants r ON m.restaurant_id = r.id
     LEFT JOIN menu_categories c ON m.category_id = c.id
     WHERE ${where.join(' AND ')}
     ORDER BY r.rating DESC, m.id DESC
     LIMIT $${idx++}`,
    [...params, parseInt(limit)]
  );
  res.json(rows);
}

async function listItems(req, res) {
  const { rows } = await pool.query(
    `SELECT m.*, c.name AS category_name
     FROM menu_items m
     LEFT JOIN menu_categories c ON m.category_id = c.id
     WHERE m.restaurant_id = $1
     ORDER BY c.sort_order, m.name`,
    [req.params.restaurantId]
  );
  res.json(rows);
}

async function createItem(req, res) {
  const { name, description, price, image, imageUrl, category, categoryId, isVegetarian, prepTimeMins } = req.body;
  const imgUrl = image || imageUrl || null;

  // Resolve or create category row from text name
  let catId = categoryId || null;
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
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [req.params.restaurantId, catId, name, description || null,
     price, imgUrl, isVegetarian || false, prepTimeMins || 15]
  );
  res.status(201).json({ id: rows[0].id });
}

async function updateItem(req, res) {
  const { name, description, price, image, imageUrl, category, categoryId, isVegetarian, prepTimeMins, isAvailable } = req.body;
  const imgUrl = image !== undefined ? image : imageUrl;

  // Resolve or create category row from text name
  let catId = categoryId ?? null;
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

  await pool.query(
    `UPDATE menu_items SET
       name           = COALESCE($1, name),
       description    = COALESCE($2, description),
       price          = COALESCE($3, price),
       image_url      = COALESCE($4, image_url),
       category_id    = COALESCE($5, category_id),
       is_vegetarian  = COALESCE($6, is_vegetarian),
       prep_time_mins = COALESCE($7, prep_time_mins),
       is_available   = COALESCE($8, is_available)
     WHERE id = $9 AND restaurant_id = $10`,
    [name ?? null, description ?? null, price ?? null, imgUrl ?? null, catId,
     isVegetarian ?? null, prepTimeMins ?? null, isAvailable ?? null,
     req.params.itemId, req.params.restaurantId]
  );
  res.json({ message: 'Updated' });
}

async function deleteItem(req, res) {
  await pool.query(
    'DELETE FROM menu_items WHERE id = $1 AND restaurant_id = $2',
    [req.params.itemId, req.params.restaurantId]
  );
  res.json({ message: 'Deleted' });
}

module.exports = { listAll, listItems, createItem, updateItem, deleteItem };

const pool = require('../config/db');

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
  const { name, description, price, imageUrl, categoryId, isVegetarian, prepTimeMins } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO menu_items
       (restaurant_id, category_id, name, description, price, image_url, is_vegetarian, prep_time_mins)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [req.params.restaurantId, categoryId || null, name, description || null,
     price, imageUrl || null, isVegetarian || false, prepTimeMins || 15]
  );
  res.status(201).json({ id: rows[0].id });
}

async function updateItem(req, res) {
  const { name, description, price, imageUrl, categoryId, isVegetarian, prepTimeMins, isAvailable } = req.body;
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
    [name ?? null, description ?? null, price ?? null, imageUrl ?? null, categoryId ?? null,
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

module.exports = { listItems, createItem, updateItem, deleteItem };

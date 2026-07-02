const pool = require('../config/db');

async function listItems(req, res) {
  const [rows] = await pool.query(
    `SELECT m.*, c.name AS category_name
     FROM menu_items m
     LEFT JOIN menu_categories c ON m.category_id = c.id
     WHERE m.restaurant_id = ?
     ORDER BY c.sort_order, m.name`,
    [req.params.restaurantId]
  );
  res.json(rows);
}

async function createItem(req, res) {
  const { name, description, price, imageUrl, categoryId, isVegetarian, prepTimeMins } = req.body;
  const [result] = await pool.query(
    `INSERT INTO menu_items
       (restaurant_id, category_id, name, description, price, image_url, is_vegetarian, prep_time_mins)
     VALUES (?,?,?,?,?,?,?,?)`,
    [req.params.restaurantId, categoryId||null, name, description||null,
     price, imageUrl||null, isVegetarian ? 1 : 0, prepTimeMins || 15]
  );
  res.status(201).json({ id: result.insertId });
}

async function updateItem(req, res) {
  const { name, description, price, imageUrl, categoryId, isVegetarian, prepTimeMins, isAvailable } = req.body;
  await pool.query(
    `UPDATE menu_items SET
       name           = COALESCE(?, name),
       description    = COALESCE(?, description),
       price          = COALESCE(?, price),
       image_url      = COALESCE(?, image_url),
       category_id    = COALESCE(?, category_id),
       is_vegetarian  = COALESCE(?, is_vegetarian),
       prep_time_mins = COALESCE(?, prep_time_mins),
       is_available   = COALESCE(?, is_available)
     WHERE id = ? AND restaurant_id = ?`,
    [name||null, description||null, price??null, imageUrl||null, categoryId??null,
     isVegetarian??null, prepTimeMins??null, isAvailable??null,
     req.params.itemId, req.params.restaurantId]
  );
  res.json({ message: 'Updated' });
}

async function deleteItem(req, res) {
  await pool.query(
    'DELETE FROM menu_items WHERE id = ? AND restaurant_id = ?',
    [req.params.itemId, req.params.restaurantId]
  );
  res.json({ message: 'Deleted' });
}

module.exports = { listItems, createItem, updateItem, deleteItem };

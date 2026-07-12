const router = require('express').Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT mi.id, mi.name, mi.description, mi.price, mi.image_url,
              mi.category_id, c.name AS category_name,
              r.id AS restaurant_id, r.name AS restaurant_name, r.rating
       FROM customer_favorites cf
       JOIN menu_items mi ON mi.id = cf.menu_item_id
       JOIN restaurants r ON r.id = mi.restaurant_id
       LEFT JOIN menu_categories c ON c.id = mi.category_id
       WHERE cf.user_id = $1
       ORDER BY cf.created_at DESC`,
      [req.user.id]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error('favorites list error:', err);
    res.status(500).json({ error: 'Failed to load favorites' });
  }
});

router.post('/:menuItemId', async (req, res) => {
  try {
    const menuItemId = parseInt(req.params.menuItemId, 10);
    if (!menuItemId) return res.status(400).json({ error: 'Invalid menu item' });

    const { rows: items } = await pool.query('SELECT id FROM menu_items WHERE id = $1', [menuItemId]);
    if (!items.length) return res.status(404).json({ error: 'Menu item not found' });

    await pool.query(
      `INSERT INTO customer_favorites (user_id, menu_item_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, menu_item_id) DO NOTHING`,
      [req.user.id, menuItemId]
    );
    res.status(201).json({ ok: true, id: menuItemId });
  } catch (err) {
    console.error('favorites add error:', err);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

router.delete('/:menuItemId', async (req, res) => {
  try {
    const menuItemId = parseInt(req.params.menuItemId, 10);
    if (!menuItemId) return res.status(400).json({ error: 'Invalid menu item' });
    await pool.query(
      'DELETE FROM customer_favorites WHERE user_id = $1 AND menu_item_id = $2',
      [req.user.id, menuItemId]
    );
    res.json({ ok: true, id: menuItemId });
  } catch (err) {
    console.error('favorites remove error:', err);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

module.exports = router;

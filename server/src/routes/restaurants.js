const router = require('express').Router();
const ctrl   = require('../controllers/restaurantController');
const menu   = require('../controllers/menuController');
const { authenticate, requireRole } = require('../middleware/auth');
const pool   = require('../config/db');

// Menu changes: only the restaurant's own owner (any role) or an admin
async function requireRestaurantOwner(req, res, next) {
  if (req.user.role === 'admin') return next();
  const id = parseInt(req.params.restaurantId);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid restaurant id' });
  const { rows } = await pool.query('SELECT 1 FROM restaurants WHERE id = $1 AND owner_id = $2', [id, req.user.id]);
  if (!rows.length) return res.status(403).json({ error: 'Forbidden' });
  next();
}

// Public
router.get('/', ctrl.list);

// Static paths must come before param routes
router.get('/owner/me', authenticate, ctrl.myRestaurant);

router.get('/:restaurantId/menu', menu.listItems);

// Public catch-all by id
router.get('/:id', ctrl.getOne);

router.use(authenticate);
router.post('/',        requireRole('restaurant_owner', 'admin'), ctrl.create);
router.patch('/:id',    ctrl.update);   // owner check done inside controller
router.delete('/:id',   requireRole('admin'), ctrl.remove);
router.post('/:id/approve', requireRole('admin'), ctrl.approve);

// Menu management
router.post('/:restaurantId/menu',            requireRestaurantOwner, menu.createItem);
router.patch('/:restaurantId/menu/:itemId',   requireRestaurantOwner, menu.updateItem);
router.delete('/:restaurantId/menu/:itemId',  requireRestaurantOwner, menu.deleteItem);

module.exports = router;

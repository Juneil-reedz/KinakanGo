const router = require('express').Router();
const ctrl   = require('../controllers/restaurantController');
const menu   = require('../controllers/menuController');
const { authenticate, requireRole } = require('../middleware/auth');

// Public
router.get('/',    ctrl.list);
router.get('/:id', ctrl.getOne);
router.get('/:restaurantId/menu', menu.listItems);

// Restaurant owner
router.use(authenticate);
router.get('/owner/me', requireRole('restaurant_owner'), ctrl.myRestaurant);
router.post('/',        requireRole('restaurant_owner', 'admin'), ctrl.create);
router.patch('/:id',    requireRole('restaurant_owner', 'admin'), ctrl.update);
router.delete('/:id',   requireRole('admin'), ctrl.remove);
router.post('/:id/approve', requireRole('admin'), ctrl.approve);

// Menu management (owner only)
router.post('/:restaurantId/menu',            requireRole('restaurant_owner', 'admin'), menu.createItem);
router.patch('/:restaurantId/menu/:itemId',   requireRole('restaurant_owner', 'admin'), menu.updateItem);
router.delete('/:restaurantId/menu/:itemId',  requireRole('restaurant_owner', 'admin'), menu.deleteItem);

module.exports = router;

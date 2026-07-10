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
// /owner/me: any authenticated user — controller filters by owner_id so only the actual owner gets data
router.get('/owner/me', ctrl.myRestaurant);
router.post('/',        requireRole('restaurant_owner', 'admin'), ctrl.create);
router.patch('/:id',    requireRole('restaurant_owner', 'admin'), ctrl.update);
router.delete('/:id',   requireRole('admin'), ctrl.remove);
router.post('/:id/approve', requireRole('admin'), ctrl.approve);

// Menu management
router.post('/:restaurantId/menu',            menu.createItem);
router.patch('/:restaurantId/menu/:itemId',   menu.updateItem);
router.delete('/:restaurantId/menu/:itemId',  menu.deleteItem);

module.exports = router;

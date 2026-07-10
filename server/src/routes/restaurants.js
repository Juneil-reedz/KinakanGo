const router = require('express').Router();
const ctrl   = require('../controllers/restaurantController');
const menu   = require('../controllers/menuController');
const { authenticate, requireRole } = require('../middleware/auth');

// Public
router.get('/', ctrl.list);
router.get('/:restaurantId/menu', menu.listItems);

// /owner/me must be before /:id or Express matches id="owner"
router.get('/owner/me', authenticate, ctrl.myRestaurant);

// Public catch-all by id
router.get('/:id', ctrl.getOne);

router.use(authenticate);
router.post('/',        requireRole('restaurant_owner', 'admin'), ctrl.create);
router.patch('/:id',    requireRole('restaurant_owner', 'admin'), ctrl.update);
router.delete('/:id',   requireRole('admin'), ctrl.remove);
router.post('/:id/approve', requireRole('admin'), ctrl.approve);

// Menu management
router.post('/:restaurantId/menu',            menu.createItem);
router.patch('/:restaurantId/menu/:itemId',   menu.updateItem);
router.delete('/:restaurantId/menu/:itemId',  menu.deleteItem);

module.exports = router;

const router = require('express').Router();
const ctrl   = require('../controllers/restaurantController');
const menu   = require('../controllers/menuController');
const { authenticate, requireRole } = require('../middleware/auth');

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
router.post('/:restaurantId/menu',            menu.createItem);
router.patch('/:restaurantId/menu/:itemId',   menu.updateItem);
router.delete('/:restaurantId/menu/:itemId',  menu.deleteItem);

module.exports = router;

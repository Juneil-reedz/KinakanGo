const router = require('express').Router();
const ctrl   = require('../controllers/orderController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.post('/',                 requireRole('customer'), ctrl.placeOrder);
router.get('/',                  ctrl.listOrders);
router.get('/:id',               ctrl.getOrder);
router.patch('/:id/status',      requireRole('restaurant_owner', 'rider', 'admin'), ctrl.updateStatus);
router.patch('/:id/assign-rider', requireRole('admin'), ctrl.assignRider);

module.exports = router;

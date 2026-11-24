const router = require('express').Router();
const ctrl   = require('../controllers/issueController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.post('/',                requireRole('customer'), ctrl.submit);
router.get('/mine',             ctrl.mine);
router.post('/:id/escalate',    ctrl.escalate);       // customer: ask the admin to review
router.post('/:id/received',    ctrl.received);       // customer: refund arrived

// Restaurant owner: reports about their own orders
router.get('/restaurant',                ctrl.restaurantList);
router.post('/:id/restaurant-resolve',   ctrl.restaurantResolve);
router.post('/:id/restaurant-deny',      ctrl.restaurantDeny);
router.post('/:id/refund-sent',          ctrl.refundSent);

router.get('/',                 requireRole('admin'), ctrl.list);
router.post('/:id/resolve',     requireRole('admin'), ctrl.resolve);
router.post('/:id/deny',        requireRole('admin'), ctrl.deny);

module.exports = router;

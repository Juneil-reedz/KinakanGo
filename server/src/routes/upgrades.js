const router = require('express').Router();
const ctrl   = require('../controllers/upgradeController');
const { authenticate, requireRole } = require('../middleware/auth');

router.post('/',        authenticate, ctrl.submitRequest);
router.get('/mine',     authenticate, ctrl.myRequest);
router.get('/',         authenticate, requireRole('admin'), ctrl.listRequests);
router.patch('/:id/approve', authenticate, requireRole('admin'), ctrl.approveRequest);
router.patch('/:id/reject',  authenticate, requireRole('admin'), ctrl.rejectRequest);

module.exports = router;

const router = require('express').Router();
const ctrl   = require('../controllers/applicationController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.post('/',              ctrl.submit);
router.get('/',               requireRole('admin'), ctrl.list);
router.get('/:id',            requireRole('admin'), ctrl.getOne);
router.post('/:id/approve',   requireRole('admin'), ctrl.approve);
router.post('/:id/reject',    requireRole('admin'), ctrl.reject);

module.exports = router;

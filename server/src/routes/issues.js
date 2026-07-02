const router = require('express').Router();
const ctrl   = require('../controllers/issueController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.post('/',                requireRole('customer'), ctrl.submit);
router.get('/',                 requireRole('admin'), ctrl.list);
router.post('/:id/resolve',     requireRole('admin'), ctrl.resolve);
router.post('/:id/deny',        requireRole('admin'), ctrl.deny);

module.exports = router;

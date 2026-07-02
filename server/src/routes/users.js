const router = require('express').Router();
const ctrl   = require('../controllers/userController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.get('/',           requireRole('admin'), ctrl.list);
router.get('/:id',        requireRole('admin'), ctrl.getOne);
router.patch('/:id',      ctrl.update);
router.post('/:id/ban',   requireRole('admin'), ctrl.ban);
router.post('/:id/unban', requireRole('admin'), ctrl.unban);

module.exports = router;

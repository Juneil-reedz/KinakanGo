const router = require('express').Router();
const ctrl   = require('../controllers/promoController');
const { authenticate, requireRole } = require('../middleware/auth');

router.post('/validate', authenticate, ctrl.validate);
router.get('/public', ctrl.publicList);
router.get('/owner', authenticate, ctrl.ownerList);
router.post('/owner', authenticate, ctrl.ownerCreate);

router.use(authenticate, requireRole('admin'));
router.get('/',           ctrl.list);
router.post('/',          ctrl.create);
router.patch('/:id',      ctrl.update);
router.delete('/:id',     ctrl.remove);

module.exports = router;

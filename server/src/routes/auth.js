const router = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name required'),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  ],
  validate,
  ctrl.register
);

router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  ctrl.login
);

router.post('/refresh', ctrl.refresh);
router.post('/logout',  ctrl.logout);
router.get('/me', authenticate, ctrl.me);

module.exports = router;

const router = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { limit, ip, email } = require('../middleware/rateLimit');

const MIN = 60 * 1000;
// Password guessing: 10 tries per account per 15 min, 50 per network
const loginLimit = [
  limit({ windowMs: 15 * MIN, max: 50, key: r => `login-ip:${ip(r)}` }),
  limit({ windowMs: 15 * MIN, max: 10, key: r => email(r) && `login:${email(r)}` }),
];
// Reset codes: 3 emails per account and 10 per network every 15 min
const forgotLimit = [
  limit({ windowMs: 15 * MIN, max: 10, key: r => `forgot-ip:${ip(r)}` }),
  limit({ windowMs: 15 * MIN, max: 3,  key: r => email(r) && `forgot:${email(r)}` }),
];
const otpLimit      = limit({ windowMs: 15 * MIN, max: 20, key: r => `otp-ip:${ip(r)}` });
const registerLimit = limit({ windowMs: 60 * MIN, max: 10, key: r => `register-ip:${ip(r)}` });
const changeLimit   = limit({ windowMs: 15 * MIN, max: 10, key: r => `change:${r.user?.id}` });

router.post('/register',
  registerLimit,
  [
    body('name').trim().notEmpty().withMessage('Name required'),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  ],
  validate,
  ctrl.register
);

router.post('/login',
  loginLimit,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  ctrl.login
);

router.post('/refresh',         ctrl.refresh);
router.post('/logout',          ctrl.logout);
router.get('/me',               authenticate, ctrl.me);
router.post('/forgot-password', forgotLimit, ctrl.forgotPassword);
router.post('/verify-reset-otp', otpLimit, ctrl.verifyResetOtp);
router.post('/reset-password',  otpLimit, ctrl.resetPassword);
router.post('/change-password', authenticate, changeLimit, ctrl.changePassword);

module.exports = router;

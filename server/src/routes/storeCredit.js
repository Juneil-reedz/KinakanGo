const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const credit = require('../utils/storeCredit');

router.use(authenticate);

// The signed-in customer's store credit: at one restaurant, or everywhere they have some
router.get('/', async (req, res) => {
  if (req.query.restaurantId) {
    const rid = parseInt(req.query.restaurantId);
    if (!Number.isInteger(rid)) return res.status(400).json({ error: 'Invalid restaurant' });
    return res.json({ restaurantId: rid, balance: await credit.balance(req.user.id, rid) });
  }
  res.json({ data: await credit.balances(req.user.id) });
});

module.exports = router;

const router = require('express').Router();
const ctrl   = require('../controllers/orderController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.post('/',                     requireRole('customer'), ctrl.placeOrder);
router.get('/',                      ctrl.listOrders);
router.get('/:id',                   ctrl.getOrder);
router.patch('/:id/status',          ctrl.updateStatus);
router.patch('/:id/assign-rider',    requireRole('admin'), ctrl.assignRider);
router.patch('/:id/rider-response',  ctrl.riderResponse);

// Return the assigned rider's current GPS location for a given order.
// Customers and restaurant owners poll this while the order is in transit.
router.get('/:id/rider-location', async (req, res) => {
  const pool = require('../config/db');
  try {
    const { rows } = await pool.query(
      `SELECT rp.current_lat AS lat, rp.current_lng AS lng, rp.location_updated_at AS updated_at,
              u.name AS rider_name
       FROM orders o
       JOIN rider_profiles rp ON rp.user_id = o.rider_id
       JOIN users u ON u.id = o.rider_id
       WHERE o.id = $1`,
      [req.params.id]
    );
    if (!rows.length || rows[0].lat == null) {
      return res.status(404).json({ error: 'Location not available yet' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('rider-location error:', err);
    res.status(500).json({ error: 'Failed to get rider location' });
  }
});

module.exports = router;

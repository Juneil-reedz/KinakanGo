const router = require('express').Router();
const pool   = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// List all approved riders — admin only
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT u.id, u.name, u.email, u.phone, u.role,
              u.avatar_url AS image, u.is_active, u.created_at,
              ur.notes,
              rp.is_available, rp.total_deliveries, rp.rating
       FROM users u
       JOIN upgrade_requests ur ON ur.user_id = u.id
       LEFT JOIN rider_profiles rp ON rp.user_id = u.id
       WHERE ur.status = 'approved'
         AND (ur.plan ILIKE '%rider%' OR ur.notes ILIKE '%"role":"rider"%')
       ORDER BY u.created_at DESC`
    );
    const riders = rows.map(r => {
      let vehicleType = null, plateNumber = null;
      try {
        const n = r.notes ? JSON.parse(r.notes) : null;
        vehicleType = n?.vehicleType || null;
        plateNumber = n?.plateNumber || null;
      } catch {}
      return { ...r, vehicleType, vehicleNumber: plateNumber, notes: undefined };
    });
    res.json({ data: riders, total: riders.length });
  } catch (err) {
    console.error('riders list error:', err);
    res.status(500).json({ error: 'Failed to load riders' });
  }
});

// Toggle rider's own availability status.
// When coming online, immediately try to claim one unassigned 'ready' order.
router.patch('/availability', async (req, res) => {
  const { is_available } = req.body;
  if (typeof is_available !== 'boolean') {
    return res.status(400).json({ error: 'is_available must be a boolean' });
  }
  try {
    await pool.query(
      `INSERT INTO rider_profiles (user_id, is_available)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET is_available = $2`,
      [req.user.id, is_available]
    );

    let assignedOrderId = null;
    if (is_available) {
      // 1. Look for a genuinely unassigned ready order
      let { rows } = await pool.query(
        `SELECT id FROM orders
         WHERE status = 'ready' AND rider_id IS NULL
         ORDER BY created_at ASC LIMIT 1`
      );

      // 2. If nothing unassigned, look for orders assigned to a "ghost" rider —
      //    i.e. rider_id points to a user who has no rider_profiles row, meaning
      //    they were assigned by the old upgrade_requests fallback and never responded.
      if (!rows.length) {
        ({ rows } = await pool.query(
          `SELECT o.id FROM orders o
           LEFT JOIN rider_profiles rp ON rp.user_id = o.rider_id
           WHERE o.status = 'ready'
             AND o.rider_id IS NOT NULL
             AND rp.user_id IS NULL
           ORDER BY o.created_at ASC LIMIT 1`
        ));
      }

      if (rows.length) {
        assignedOrderId = rows[0].id;
        await pool.query('UPDATE orders SET rider_id = $1 WHERE id = $2', [req.user.id, assignedOrderId]);
        console.log(`availability: assigned order ${assignedOrderId} to rider ${req.user.id}`);
      }
    }

    res.json({ is_available, assignedOrderId });
  } catch (err) {
    console.error('availability update error:', err);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// Update rider's live GPS coordinates (called every ~10 s from the rider app)
router.patch('/location', async (req, res) => {
  const { lat, lng } = req.body;
  if (lat == null || lng == null) return res.status(400).json({ error: 'lat and lng required' });
  try {
    await pool.query(
      `UPDATE rider_profiles
       SET current_lat = $1, current_lng = $2, location_updated_at = NOW()
       WHERE user_id = $3`,
      [lat, lng, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('location update error:', err);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

module.exports = router;

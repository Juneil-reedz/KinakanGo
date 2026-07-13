const router = require('express').Router();
const pool   = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.get('/me', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone,
              rp.is_available, rp.total_deliveries, rp.today_deliveries,
              rp.total_earnings, rp.today_earnings, rp.rating,
              rp.vehicle_type, rp.plate_number, rp.zone
       FROM users u
       LEFT JOIN rider_profiles rp ON rp.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Rider not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('rider me error:', err);
    res.status(500).json({ error: 'Failed to load rider profile' });
  }
});

router.post('/admin-requests', async (req, res) => {
  try {
    const { requestType, amount, period, details } = req.body;
    if (!['payout', 'report'].includes(requestType)) {
      return res.status(400).json({ error: 'requestType must be payout or report' });
    }

    const cleanAmount = amount === '' || amount == null ? null : Number(amount);
    if (cleanAmount != null && (!Number.isFinite(cleanAmount) || cleanAmount <= 0)) {
      return res.status(400).json({ error: 'amount must be greater than 0' });
    }

    const { rows } = await pool.query(
      `INSERT INTO rider_admin_requests (rider_id, request_type, amount, period, details)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, request_type, amount, period, details, status, created_at`,
      [req.user.id, requestType, cleanAmount, period || null, details || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('rider admin request create error:', err);
    res.status(500).json({ error: 'Failed to send request to admin' });
  }
});

router.get('/admin-requests', requireRole('admin'), async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT rar.id, rar.rider_id, rar.request_type, rar.amount, rar.period, rar.details,
              rar.status, rar.resolution_notes, rar.created_at, rar.resolved_at,
              u.name AS rider_name, u.email AS rider_email, u.phone AS rider_phone,
              admin.name AS resolved_by_name
       FROM rider_admin_requests rar
       JOIN users u ON u.id = rar.rider_id
       LEFT JOIN users admin ON admin.id = rar.resolved_by
       ORDER BY rar.created_at DESC
       LIMIT 100`
    );
    res.json({ data: rows, total: rows.length });
  } catch (err) {
    console.error('rider admin request list error:', err);
    res.status(500).json({ error: 'Failed to load rider requests' });
  }
});

router.post('/admin-requests/:id/resolve', requireRole('admin'), async (req, res) => {
  try {
    await pool.query(
      `UPDATE rider_admin_requests
       SET status = 'resolved', resolution_notes = $1, resolved_by = $2, resolved_at = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [req.body.notes || null, req.user.id, req.params.id]
    );
    res.json({ message: 'Request resolved' });
  } catch (err) {
    console.error('rider admin request resolve error:', err);
    res.status(500).json({ error: 'Failed to resolve rider request' });
  }
});

router.post('/admin-requests/:id/deny', requireRole('admin'), async (req, res) => {
  try {
    await pool.query(
      `UPDATE rider_admin_requests
       SET status = 'denied', resolution_notes = $1, resolved_by = $2, resolved_at = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [req.body.notes || null, req.user.id, req.params.id]
    );
    res.json({ message: 'Request denied' });
  } catch (err) {
    console.error('rider admin request deny error:', err);
    res.status(500).json({ error: 'Failed to deny rider request' });
  }
});

// List all approved riders — admin only
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT u.id, u.name, u.email, u.phone, u.role,
               u.avatar_url AS image, u.is_active, u.created_at,
               ur.notes,
               rp.is_available, rp.rating,
               COALESCE(stats.total_deliveries, rp.total_deliveries, 0) AS total_deliveries,
               COALESCE(stats.completed_today, rp.today_deliveries, 0) AS completed_today,
               COALESCE(stats.earnings, rp.total_earnings, 0) AS earnings
        FROM users u
        JOIN upgrade_requests ur ON ur.user_id = u.id
        LEFT JOIN rider_profiles rp ON rp.user_id = u.id
        LEFT JOIN (
          SELECT rider_id,
                 COUNT(*)::int AS total_deliveries,
                 COUNT(*) FILTER (WHERE delivered_at::date = CURRENT_DATE)::int AS completed_today,
                 COALESCE(SUM(delivery_fee), 0) AS earnings
          FROM orders
          WHERE status = 'delivered' AND rider_id IS NOT NULL
          GROUP BY rider_id
        ) stats ON stats.rider_id = u.id
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
      return {
        ...r,
        status: r.is_available ? 'active' : 'offline',
        totalDeliveries: Number(r.total_deliveries || 0),
        completedToday: Number(r.completed_today || 0),
        earnings: Number(r.earnings || 0),
        vehicleType,
        vehicleNumber: plateNumber,
        notes: undefined,
      };
    });
    res.json({ data: riders, total: riders.length });
  } catch (err) {
    console.error('riders list error:', err);
    res.status(500).json({ error: 'Failed to load riders' });
  }
});

router.get('/:id/deliveries', requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.status, o.total, o.delivery_fee, o.delivery_address,
              o.delivered_at, o.created_at, o.delivery_proof_image,
              r.name AS restaurant_name, r.address AS restaurant_address,
              u.name AS customer_name, u.phone AS customer_phone
       FROM orders o
       JOIN restaurants r ON r.id = o.restaurant_id
       JOIN users u ON u.id = o.customer_id
       WHERE o.rider_id = $1 AND o.status = 'delivered'
       ORDER BY o.delivered_at DESC NULLS LAST, o.created_at DESC
       LIMIT 100`,
      [req.params.id]
    );
    res.json({ data: rows, total: rows.length });
  } catch (err) {
    console.error('rider deliveries list error:', err);
    res.status(500).json({ error: 'Failed to load rider deliveries' });
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

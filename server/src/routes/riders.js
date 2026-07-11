const router = require('express').Router();
const pool   = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// List all approved riders — joins upgrade_requests so no dependency on rider_profiles existing
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT u.id, u.name, u.email, u.phone, u.role,
              u.avatar_url AS image, u.is_active, u.created_at,
              ur.notes
       FROM users u
       JOIN upgrade_requests ur ON ur.user_id = u.id
       WHERE ur.status = 'approved'
         AND (ur.plan ILIKE '%rider%' OR ur.notes ILIKE '%"role":"rider"%')
       ORDER BY u.created_at DESC`
    );
    // Parse vehicle info from notes
    const riders = rows.map(r => {
      let vehicleType = null, plateNumber = null;
      try {
        const n = r.notes ? JSON.parse(r.notes) : null;
        vehicleType  = n?.vehicleType  || null;
        plateNumber  = n?.plateNumber  || null;
      } catch {}
      return { ...r, vehicleType, vehicleNumber: plateNumber, notes: undefined };
    });
    res.json({ data: riders, total: riders.length });
  } catch (err) {
    console.error('riders list error:', err);
    res.status(500).json({ error: 'Failed to load riders' });
  }
});

module.exports = router;

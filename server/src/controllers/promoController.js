const pool = require('../config/db');

const mapPromo = (promo) => ({
  ...promo,
  discountType: promo.discount_type,
  discountValue: Number(promo.discount_value || 0),
  minOrder: Number(promo.min_order || 0),
  maxUses: promo.max_uses,
  usedCount: promo.used_count,
  startsAt: promo.starts_at,
  expiresAt: promo.expires_at,
  isActive: promo.is_active,
  status: promo.is_active ? 'active' : 'inactive',
  ownerId: promo.owner_id,
});

const activeWhere = `is_active = true
  AND (starts_at IS NULL OR starts_at <= NOW())
  AND (expires_at IS NULL OR expires_at > NOW())
  AND (max_uses IS NULL OR used_count < max_uses)`;

async function list(req, res) {
  const { status } = req.query;
  const where  = [];
  const params = [];
  let   idx    = 1;

  if (status === 'active')   { where.push('is_active = true AND (expires_at IS NULL OR expires_at > NOW())'); }
  if (status === 'inactive') { where.push('is_active = false'); }
  if (status === 'expired')  { where.push('expires_at IS NOT NULL AND expires_at <= NOW()'); }

  const cond = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT * FROM promo_codes ${cond} ORDER BY created_at DESC`, params
  );
  res.json(rows.map(mapPromo));
}

async function publicList(_req, res) {
  const { rows } = await pool.query(
    `SELECT * FROM promo_codes WHERE ${activeWhere} ORDER BY created_at DESC LIMIT 10`
  );
  res.json({ data: rows.map(mapPromo) });
}

async function ensureRestaurantOwner(userId) {
  const { rows } = await pool.query('SELECT id FROM restaurants WHERE owner_id = $1 LIMIT 1', [userId]);
  return rows[0] || null;
}

async function ownerList(req, res) {
  const restaurant = await ensureRestaurantOwner(req.user.id);
  if (!restaurant) return res.status(403).json({ error: 'Restaurant account required' });

  const { rows } = await pool.query(
    'SELECT * FROM promo_codes WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 10',
    [req.user.id]
  );
  res.json({ data: rows.map(mapPromo) });
}

async function ownerCreate(req, res) {
  const restaurant = await ensureRestaurantOwner(req.user.id);
  if (!restaurant) return res.status(403).json({ error: 'Restaurant account required' });

  const discountType = req.body.discountType || (req.body.type === 'percentage' ? 'percent' : req.body.type) || 'percent';
  const discountValue = req.body.discountValue ?? req.body.value;
  const minOrder = req.body.minOrder || 0;
  const maxUses = req.body.maxUses ?? req.body.usageLimit ?? null;
  const startsAt = req.body.startsAt || req.body.startDate || null;
  const expiresAt = req.body.expiresAt || req.body.endDate || null;
  const code = String(req.body.code || '').trim().toUpperCase();
  const { description } = req.body;

  if (!code || !discountValue) return res.status(400).json({ error: 'Promo code and discount are required' });

  const { rows } = await pool.query(
    `INSERT INTO promo_codes
       (code, description, discount_type, discount_value, min_order, max_uses, starts_at, expires_at, owner_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [code, description || null, discountType, discountValue, minOrder || 0, maxUses || null, startsAt || null, expiresAt || null, req.user.id]
  );
  res.status(201).json(mapPromo(rows[0]));
}

async function create(req, res) {
  const discountType = req.body.discountType || (req.body.type === 'percentage' ? 'percent' : req.body.type) || 'percent';
  const discountValue = req.body.discountValue ?? req.body.value;
  const minOrder = req.body.minOrder || 0;
  const maxUses = req.body.maxUses ?? req.body.usageLimit ?? null;
  const startsAt = req.body.startsAt || req.body.startDate || null;
  const expiresAt = req.body.expiresAt || req.body.endDate || null;
  const { code, description } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO promo_codes
       (code, description, discount_type, discount_value, min_order, max_uses, starts_at, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [code, description || null, discountType || 'percent', discountValue, minOrder || 0,
     maxUses || null, startsAt || null, expiresAt || null]
  );
  res.status(201).json(mapPromo(rows[0]));
}

async function update(req, res) {
  const discountValue = req.body.discountValue ?? req.body.value;
  const minOrder = req.body.minOrder;
  const maxUses = req.body.maxUses ?? req.body.usageLimit;
  const expiresAt = req.body.expiresAt || req.body.endDate;
  const isActive = req.body.isActive ?? (req.body.status ? req.body.status === 'active' : undefined);
  const { description } = req.body;
  const { rows } = await pool.query(
    `UPDATE promo_codes SET
       description    = COALESCE($1, description),
       discount_value = COALESCE($2, discount_value),
       min_order      = COALESCE($3, min_order),
       max_uses       = COALESCE($4, max_uses),
       is_active      = COALESCE($5, is_active),
       expires_at     = COALESCE($6, expires_at)
     WHERE id = $7
     RETURNING *`,
    [description ?? null, discountValue ?? null, minOrder ?? null,
     maxUses ?? null, isActive ?? null, expiresAt ?? null, req.params.id]
  );
  res.json(rows[0] ? mapPromo(rows[0]) : { message: 'Updated' });
}

async function remove(req, res) {
  await pool.query('DELETE FROM promo_codes WHERE id = $1', [req.params.id]);
  res.json({ message: 'Deleted' });
}

async function validate(req, res) {
  const { code, orderTotal } = req.body;
  const { rows } = await pool.query(
    `SELECT * FROM promo_codes WHERE code = $1 AND is_active = true
       AND (starts_at IS NULL OR starts_at <= NOW())
       AND (expires_at IS NULL OR expires_at > NOW())
       AND (max_uses IS NULL OR used_count < max_uses)`,
    [code]
  );
  if (!rows.length) return res.status(404).json({ error: 'Invalid or expired promo code' });
  const promo = rows[0];
  if (orderTotal < promo.min_order) {
    return res.status(400).json({ error: `Minimum order ₱${promo.min_order} required` });
  }
  const discount = promo.discount_type === 'percent'
    ? (orderTotal * promo.discount_value) / 100
    : promo.discount_value;
  res.json({ valid: true, discount, promo });
}

module.exports = { list, publicList, ownerList, ownerCreate, create, update, remove, validate };

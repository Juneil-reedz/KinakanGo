const pool = require('../config/db');

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
  res.json(rows);
}

async function create(req, res) {
  const { code, description, discountType, discountValue, minOrder, maxUses, startsAt, expiresAt } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO promo_codes
       (code, description, discount_type, discount_value, min_order, max_uses, starts_at, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [code, description || null, discountType || 'percent', discountValue, minOrder || 0,
     maxUses || null, startsAt || null, expiresAt || null]
  );
  res.status(201).json({ id: rows[0].id });
}

async function update(req, res) {
  const { description, discountValue, minOrder, maxUses, isActive, expiresAt } = req.body;
  await pool.query(
    `UPDATE promo_codes SET
       description    = COALESCE($1, description),
       discount_value = COALESCE($2, discount_value),
       min_order      = COALESCE($3, min_order),
       max_uses       = COALESCE($4, max_uses),
       is_active      = COALESCE($5, is_active),
       expires_at     = COALESCE($6, expires_at)
     WHERE id = $7`,
    [description ?? null, discountValue ?? null, minOrder ?? null,
     maxUses ?? null, isActive ?? null, expiresAt ?? null, req.params.id]
  );
  res.json({ message: 'Updated' });
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

module.exports = { list, create, update, remove, validate };

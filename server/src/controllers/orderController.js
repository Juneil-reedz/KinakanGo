const crypto = require('crypto');
const pool = require('../config/db');
const { sendEmail } = require('../utils/email');
const { imageUrlSql, resolveImageUrls } = require('../routes/images');

// Finds a random rider who is online (is_available = true) and not currently
// on an active delivery, then assigns them to the order.
// Returns the assigned rider's user_id, or null if no available rider exists.
async function autoAssignRider(orderId) {
  try {
    const { rows } = await pool.query(
      `SELECT rp.user_id
       FROM rider_profiles rp
       WHERE rp.is_available = true
         AND rp.user_id NOT IN (
           SELECT rider_id FROM orders
           WHERE status IN ('ready', 'picked_up') AND rider_id IS NOT NULL
         )
       ORDER BY RANDOM()
       LIMIT 1`
    );
    if (!rows.length) {
      console.log(`autoAssignRider: no available rider for order ${orderId} — will assign when a rider comes online`);
      return null;
    }
    const riderId = rows[0].user_id;
    await pool.query('UPDATE orders SET rider_id = $1 WHERE id = $2', [riderId, orderId]);
    console.log(`autoAssignRider: assigned rider ${riderId} to order ${orderId}`);
    return riderId;
  } catch (err) {
    console.error('autoAssignRider error:', err.message);
    return null;
  }
}

// ── Order verification ───────────────────────────────────────────────────────
// Before an order is placed, a 6-digit code is emailed to the account's email
// address with a summary of the order, so the account holder (e.g. a parent)
// approves every order. The code only works for that exact cart.

const ORDER_CODE_TTL_MS      = 10 * 60 * 1000;
const ORDER_CODE_MAX_TRIES   = 5;
const ORDER_CODE_RESEND_MS   = 60 * 1000;

// Same restaurant + same items/quantities => same fingerprint
function cartFingerprint(restaurantId, items) {
  const lines = (items || [])
    .map(i => `${parseInt(i.menuItemId)}x${parseInt(i.quantity)}`)
    .sort()
    .join(',');
  return crypto.createHash('sha256').update(`${parseInt(restaurantId)}|${lines}`).digest('hex');
}

const maskEmail = (email) => {
  const [name, domain] = String(email).split('@');
  if (!domain) return email;
  return `${name.slice(0, 2)}${'*'.repeat(Math.min(6, Math.max(1, name.length - 2)))}@${domain}`;
};

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function requestOrderCode(req, res) {
  const { restaurantId, items } = req.body;
  if (!restaurantId || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Your cart is empty' });
  }

  const { rows: recent } = await pool.query(
    `SELECT created_at FROM order_verifications
     WHERE user_id = $1 AND created_at > NOW() - ($2 || ' milliseconds')::interval
     ORDER BY created_at DESC LIMIT 1`,
    [req.user.id, ORDER_CODE_RESEND_MS]
  );
  if (recent.length) {
    const wait = Math.ceil((ORDER_CODE_RESEND_MS - (Date.now() - new Date(recent[0].created_at).getTime())) / 1000);
    return res.status(429).json({ error: `Please wait ${wait}s before requesting another code`, retryAfter: wait });
  }

  // Price the cart the same way placeOrder does, for the summary in the email
  const ids = items.map(i => parseInt(i.menuItemId));
  const { rows: menuRows } = await pool.query(
    `SELECT m.id, m.name, m.price, r.name AS restaurant_name, r.delivery_fee
     FROM menu_items m JOIN restaurants r ON r.id = m.restaurant_id
     WHERE m.id = ANY($1::int[]) AND m.restaurant_id = $2`,
    [ids, parseInt(restaurantId)]
  );
  if (menuRows.length !== new Set(ids).size) {
    return res.status(400).json({ error: 'One or more items are unavailable' });
  }
  const byId = Object.fromEntries(menuRows.map(r => [r.id, r]));
  const subtotal = items.reduce((s, i) => s + Number(byId[parseInt(i.menuItemId)].price) * parseInt(i.quantity), 0);
  const deliveryFee = Number(menuRows[0].delivery_fee || 0);
  const estTotal = subtotal + deliveryFee + subtotal * 0.08;

  const { rows: users } = await pool.query('SELECT name, email FROM users WHERE id = $1', [req.user.id]);
  const user = users[0];
  if (!user?.email) return res.status(400).json({ error: 'Your account has no email address' });

  const code = crypto.randomInt(100000, 1000000).toString();
  await pool.query('DELETE FROM order_verifications WHERE user_id = $1 AND used = false', [req.user.id]);
  const { rows: inserted } = await pool.query(
    `INSERT INTO order_verifications (user_id, code, cart_hash, expires_at)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [req.user.id, code, cartFingerprint(restaurantId, items), new Date(Date.now() + ORDER_CODE_TTL_MS)]
  );

  const peso = (n) => `&#8369;${Number(n).toFixed(2)}`;
  const itemRows = items.map(i => {
    const m = byId[parseInt(i.menuItemId)];
    return `<tr><td style="padding:4px 0">${escapeHtml(m.name)} &times; ${parseInt(i.quantity)}</td>
            <td style="padding:4px 0;text-align:right">${peso(Number(m.price) * parseInt(i.quantity))}</td></tr>`;
  }).join('');

  try {
    await sendEmail({
      to: user.email,
      subject: `Your KinakanGo order code: ${code}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
          <h2 style="margin:0 0 8px">Confirm this order</h2>
          <p>Hi ${escapeHtml(user.name)}, someone is placing an order on your KinakanGo account.
             Share this code only if you approve it:</p>
          <p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#e8540a;margin:16px 0">${code}</p>
          <p style="margin:0 0 4px"><strong>${escapeHtml(menuRows[0].restaurant_name)}</strong></p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">${itemRows}
            <tr><td style="padding:8px 0 0;border-top:1px solid #ddd"><strong>Estimated total</strong></td>
                <td style="padding:8px 0 0;border-top:1px solid #ddd;text-align:right"><strong>${peso(estTotal)}</strong></td></tr>
          </table>
          <p style="color:#666;font-size:13px;margin-top:16px">The code expires in 10 minutes and only works for this exact order.
             If you didn't expect this, don't share the code &mdash; no order will be placed without it.</p>
        </div>`,
    });
  } catch (err) {
    console.error('order code email failed:', err.message);
    await pool.query('DELETE FROM order_verifications WHERE id = $1', [inserted[0].id]);
    return res.status(503).json({ error: "Couldn't send the verification email. Please try again in a moment." });
  }

  res.json({ sentTo: maskEmail(user.email), expiresInMinutes: ORDER_CODE_TTL_MS / 60000, resendAfter: ORDER_CODE_RESEND_MS / 1000 });
}

// Checks the code for this cart and marks it used. Returns null if OK,
// otherwise { status, body } to send back.
async function consumeOrderCode(userId, restaurantId, items, code) {
  if (!code) return { status: 400, body: { error: 'Enter the verification code sent to your email', code: 'VERIFICATION_REQUIRED' } };

  const { rows } = await pool.query(
    `SELECT * FROM order_verifications
     WHERE user_id = $1 AND used = false AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  const row = rows[0];
  if (!row) return { status: 400, body: { error: 'Code expired. Please request a new one.', code: 'CODE_EXPIRED' } };
  if (row.cart_hash !== cartFingerprint(restaurantId, items)) {
    return { status: 400, body: { error: 'Your cart changed. Please request a new code.', code: 'CART_CHANGED' } };
  }
  if (row.attempts >= ORDER_CODE_MAX_TRIES) {
    return { status: 400, body: { error: 'Too many wrong attempts. Please request a new code.', code: 'CODE_EXPIRED' } };
  }
  if (row.code !== String(code).trim()) {
    await pool.query('UPDATE order_verifications SET attempts = attempts + 1 WHERE id = $1', [row.id]);
    const left = ORDER_CODE_MAX_TRIES - row.attempts - 1;
    return { status: 400, body: { error: `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left.`, code: 'INVALID_CODE' } };
  }
  // Atomic: a code can only ever place one order
  const { rowCount } = await pool.query('UPDATE order_verifications SET used = true WHERE id = $1 AND used = false', [row.id]);
  if (!rowCount) return { status: 400, body: { error: 'This code was already used.', code: 'CODE_EXPIRED' } };
  return null;
}

async function placeOrder(req, res) {
  const { restaurantId, items, deliveryAddress, specialInstructions, paymentMethod, promoCode, proofImage, contactInfo } = req.body;
  const customerId = req.user.id;

  // Every order must be approved with the code emailed to the account holder
  const verifyFail = await consumeOrderCode(customerId, restaurantId, items, req.body.verificationCode);
  if (verifyFail) return res.status(verifyFail.status).json(verifyFail.body);

  // Persist phone number to user profile so it shows on orders
  if (contactInfo?.phone) {
    await pool.query('UPDATE users SET phone = $1 WHERE id = $2', [contactInfo.phone, customerId]);
  }

  const ids = items.map(i => i.menuItemId);
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
  const { rows: menuRows } = await pool.query(
    `SELECT id, price, name, is_available FROM menu_items WHERE id IN (${placeholders}) AND restaurant_id = $${ids.length + 1}`,
    [...ids, restaurantId]
  );
  if (menuRows.length !== ids.length) {
    return res.status(400).json({ error: 'One or more items unavailable or not from this restaurant' });
  }
  const itemMap = Object.fromEntries(menuRows.map(r => [r.id, r]));

  let discount = 0;
  if (promoCode) {
    const { rows: promos } = await pool.query(
      `SELECT * FROM promo_codes WHERE code = $1 AND is_active = true
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [promoCode]
    );
    if (promos.length) {
      const p = promos[0];
      const gross = items.reduce((s, i) => s + itemMap[i.menuItemId].price * i.quantity, 0);
      if (gross >= p.min_order) {
        discount = p.discount_type === 'percent'
          ? (gross * p.discount_value) / 100
          : p.discount_value;
        await pool.query('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = $1', [p.id]);
      }
    }
  }

  const { rows: restRows } = await pool.query('SELECT delivery_fee FROM restaurants WHERE id = $1', [restaurantId]);
  const deliveryFee = restRows[0]?.delivery_fee || 0;
  const subtotal    = items.reduce((s, i) => s + itemMap[i.menuItemId].price * i.quantity, 0) - discount;
  const tax         = subtotal * 0.08;
  const total       = subtotal + parseFloat(deliveryFee) + tax;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders
         (customer_id, restaurant_id, status, delivery_address, special_instructions,
          subtotal, delivery_fee, tax, total, payment_method, proof_image)
       VALUES ($1,$2,'pending',$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [customerId, restaurantId, deliveryAddress, specialInstructions || null,
       subtotal, deliveryFee, tax, total, paymentMethod || 'cash', proofImage || null]
    );
    const orderId = orderRows[0].id;

    for (const item of items) {
      const mi = itemMap[item.menuItemId];
      await client.query(
        'INSERT INTO order_items (order_id, menu_item_id, name, price, quantity, notes) VALUES ($1,$2,$3,$4,$5,$6)',
        [orderId, item.menuItemId, mi.name, mi.price, item.quantity, item.notes || null]
      );
    }
    await client.query('COMMIT');
    res.status(201).json({ id: orderId, orderId, total });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listOrders(req, res) {
  const { status, page = 1, limit = 20, restaurant_id, rider_orders } = req.query;
  const offset = (page - 1) * limit;
  const { id, role } = req.user;

  const where  = [];
  const params = [];
  let   idx    = 1;

  if (rider_orders === 'true') {
    // Rider fetching their own assigned orders
    where.push(`o.rider_id = $${idx++}`); params.push(id);
  } else if (restaurant_id) {
    where.push(`o.restaurant_id = $${idx++}`); params.push(parseInt(restaurant_id));
  } else if (role === 'customer') {
    where.push(`o.customer_id = $${idx++}`); params.push(id);
  } else if (role === 'rider') {
    where.push(`o.rider_id = $${idx++}`);    params.push(id);
  } else if (role === 'restaurant_owner') {
    where.push(`o.restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = $${idx++})`);
    params.push(id);
  }
  if (status) { where.push(`o.status = $${idx++}`); params.push(status); }

  const cond = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT o.id, o.restaurant_id, o.status, o.total, o.subtotal, o.delivery_fee, o.tax,
            o.payment_method, o.payment_status,
            o.created_at, o.delivered_at, o.delivery_address, NULL AS delivery_proof_image, o.rider_id,
            r.name AS restaurant_name, ${imageUrlSql('r', 'restaurants')} AS restaurant_image,
            r.address AS restaurant_address,
            u.name  AS customer_name,
            ru.name  AS rider_name,
            ru.phone AS rider_phone
     FROM orders o
     JOIN restaurants r ON o.restaurant_id = r.id
     JOIN users u ON o.customer_id = u.id
     LEFT JOIN users ru ON ru.id = o.rider_id
     ${cond} ORDER BY o.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, parseInt(limit), offset]
  );
  rows.forEach(r => resolveImageUrls(req, r, ['restaurant_image']));
  res.json({ data: rows, page: parseInt(page), limit: parseInt(limit) });
}

// Only the order's customer, assigned rider, restaurant owner, or an admin may view it.
// Expects `order` to carry customer_id, rider_id and restaurant_owner_id.
function canAccessOrder(user, order) {
  return user.role === 'admin'
    || order.customer_id === user.id
    || order.rider_id === user.id
    || order.restaurant_owner_id === user.id;
}

async function getOrder(req, res) {
  const { rows } = await pool.query(
    `SELECT o.*,
            r.name  AS restaurant_name, ${imageUrlSql('r', 'restaurants')} AS restaurant_image,
            r.address AS restaurant_address, r.phone AS restaurant_phone, r.owner_id AS restaurant_owner_id,
            u.name  AS customer_name, u.phone AS customer_phone,
            ru.name  AS rider_name,   ru.phone AS rider_phone
     FROM orders o
     JOIN restaurants r ON o.restaurant_id = r.id
     JOIN users u ON o.customer_id = u.id
     LEFT JOIN users ru ON ru.id = o.rider_id
     WHERE o.id = $1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Order not found' });
  const order = rows[0];
  if (!canAccessOrder(req.user, order)) return res.status(404).json({ error: 'Order not found' });

  // Proof images are large base64 blobs; customers never display them, and the
  // tracking page refetches this endpoint, so don't ship them to customers.
  if (req.user.role === 'customer') {
    delete order.proof_image;
    delete order.delivery_proof_image;
  }
  delete order.restaurant_owner_id;
  resolveImageUrls(req, order, ['restaurant_image']);

  const { rows: items } = await pool.query(
    `SELECT oi.*, ${imageUrlSql('mi', 'menu-items')} AS image_url
     FROM order_items oi
     LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
     WHERE oi.order_id = $1`,
    [req.params.id]
  );
  items.forEach(i => resolveImageUrls(req, i, ['image_url']));
  res.json({ ...order, items });
}

async function updateStatus(req, res) {
  const { status, cancelledReason, deliveryProof } = req.body;
  const allowed = ['accepted','preparing','ready','picked_up','delivered','cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  if (status === 'delivered' && !deliveryProof) {
    return res.status(400).json({ error: 'Proof of delivery is required' });
  }

  const { rows: beforeRows } = await pool.query(
    'SELECT status, rider_id, delivery_fee FROM orders WHERE id = $1',
    [req.params.id]
  );
  if (!beforeRows.length) return res.status(404).json({ error: 'Order not found' });
  const before = beforeRows[0];

  const { rows: updatedRows } = await pool.query(
    `UPDATE orders SET
       status           = $1,
       cancelled_reason = CASE WHEN $2 = 'cancelled' THEN $3 ELSE cancelled_reason END,
       delivered_at     = CASE WHEN $4 = 'delivered'  THEN NOW() ELSE delivered_at END,
       delivery_proof_image = CASE WHEN $4 = 'delivered' THEN $5 ELSE delivery_proof_image END
     WHERE id = $6
     RETURNING id, status`,
    [status, status, cancelledReason || null, status, deliveryProof || null, req.params.id]
  );
  if (!updatedRows.length) return res.status(404).json({ error: 'Order not found' });

  // When order is ready for pickup, auto-assign an available rider
  if (status === 'ready') {
    const riderId = await autoAssignRider(req.params.id);
    return res.json({ message: 'Status updated', riderId: riderId || null });
  }

  // When delivered, free the rider back to available
  if (status === 'delivered') {
    if (before.rider_id) {
      await pool.query(
        `INSERT INTO rider_profiles (user_id, is_available, total_deliveries, today_deliveries, total_earnings, today_earnings)
         VALUES ($1, true, $2, $2, $3, $3)
         ON CONFLICT (user_id) DO UPDATE SET
           is_available = true,
           total_deliveries = rider_profiles.total_deliveries + $2,
           today_deliveries = rider_profiles.today_deliveries + $2,
           total_earnings = rider_profiles.total_earnings + $3,
           today_earnings = rider_profiles.today_earnings + $3`,
        [before.rider_id, before.status === 'delivered' ? 0 : 1, before.status === 'delivered' ? 0 : Number(before.delivery_fee || 0)]
      ).catch(() => {});
    }
  }

  res.json({ message: 'Status updated', order: updatedRows[0] });
}

// Rider accepts or rejects an assigned order
async function riderResponse(req, res) {
  const orderId  = parseInt(req.params.id);
  const riderId  = req.user.id;
  const { accept } = req.body;

  const { rows } = await pool.query(
    'SELECT id, rider_id, status FROM orders WHERE id = $1',
    [orderId]
  );
  const order = rows[0];
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.rider_id !== riderId) return res.status(403).json({ error: 'This order is not assigned to you' });
  if (order.status !== 'ready') return res.status(400).json({ error: 'Order is no longer awaiting pickup' });

  if (accept) {
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['picked_up', orderId]);
    // Mark rider as busy
    await pool.query(
      'UPDATE rider_profiles SET is_available = false WHERE user_id = $1',
      [riderId]
    ).catch(() => {});
    return res.json({ message: 'Order accepted', status: 'picked_up' });
  } else {
    // Rider rejected — clear assignment and try next rider
    await pool.query('UPDATE orders SET rider_id = NULL WHERE id = $1', [orderId]);
    const nextRider = await autoAssignRider(orderId);
    return res.json({ message: 'Order rejected', nextRiderId: nextRider || null });
  }
}

async function assignRider(req, res) {
  const { riderId } = req.body;
  await pool.query('UPDATE orders SET rider_id = $1 WHERE id = $2', [riderId, req.params.id]);
  res.json({ message: 'Rider assigned' });
}

module.exports = { requestOrderCode, placeOrder, listOrders, getOrder, canAccessOrder, updateStatus, assignRider, riderResponse, autoAssignRider };

const { promoDiscount, promoAudienceOk } = require('./promoController');
const { APPROVED_RIDER_SQL, isApprovedRider } = require('../utils/riders');
const crypto = require('crypto');
const pool = require('../config/db');
const { firstImageError } = require('../utils/image');
const { sendEmail } = require('../utils/email');
const { notify } = require('../utils/notify');
const storeCredit = require('../utils/storeCredit');
const { refundCancelledOrder } = require('../utils/cancelRefund');
const { recordDelivery } = require('../utils/riderPay');

// Who may set which order status (admins may set any)
const RESTAURANT_STATUSES = ['accepted', 'preparing', 'ready', 'cancelled'];
const RIDER_STATUSES      = ['picked_up', 'delivered'];
const FINAL_STATUSES      = ['delivered', 'cancelled', 'refunded'];
// Which status may follow which (admins can override). Restaurants accept straight
// into 'preparing'; 'picked_up' repeats harmlessly when the rider confirms pickup.
const NEXT_STATUSES = {
  pending:   ['accepted', 'preparing', 'cancelled'],
  accepted:  ['preparing', 'ready', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready:     ['picked_up', 'cancelled'],
  picked_up: ['picked_up', 'delivered'],
};

// What the customer is told at each status change
const STATUS_NOTICE = {
  accepted:  { type: 'success', title: 'Order accepted',            message: (o) => `${o.restaurant_name} accepted your order.` },
  preparing: { type: 'info',    title: 'Your food is being prepared', message: (o) => `${o.restaurant_name} is cooking your order.` },
  ready:     { type: 'info',    title: 'Order ready for pickup',    message: () => 'Your order is ready and waiting for a rider.' },
  picked_up: { type: 'info',    title: 'Rider on the way',          message: (o) => `${o.rider_name || 'Your rider'} picked up your order and is heading to you.` },
  delivered: { type: 'success', title: 'Order delivered',           message: () => 'Enjoy your meal! Let us know if anything was wrong.' },
  cancelled: { type: 'error',   title: 'Order cancelled',           message: (o, reason) => reason ? `Reason: ${reason}` : `${o.restaurant_name} cancelled your order.` },
};

// Tell the people involved in an order that its status changed
async function notifyOrderStatus(orderId, status, reason) {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.customer_id, o.rider_id, r.owner_id, r.name AS restaurant_name, ru.name AS rider_name
       FROM orders o JOIN restaurants r ON r.id = o.restaurant_id
       LEFT JOIN users ru ON ru.id = o.rider_id WHERE o.id = $1`,
      [orderId]
    );
    const o = rows[0];
    const notice = o && STATUS_NOTICE[status];
    if (!notice) return;
    await notify(o.customer_id, {
      audience: 'customer', type: notice.type, link: '/orders',
      title: `${notice.title} · #${o.id}`, message: notice.message(o, reason),
    });
    if (status === 'picked_up' || status === 'delivered') {
      await notify(o.owner_id, {
        audience: 'restaurant', type: 'info', link: '/owner/orders',
        title: status === 'delivered' ? `Order #${o.id} delivered` : `Order #${o.id} picked up`,
        message: o.rider_name ? `Rider: ${o.rider_name}` : null,
      });
    }
  } catch (err) {
    console.warn('notifyOrderStatus failed:', err.message);
  }
}
const { imageUrlSql, resolveImageUrls } = require('../routes/images');

// Finds a random rider who is online (is_available = true) and not currently
// on an active delivery, then assigns them to the order.
// Returns the assigned rider's user_id, or null if no available rider exists.
async function autoAssignRider(orderId) {
  try {
    // An approved, online rider who isn't on another delivery and hasn't
    // declined this order. The claim only succeeds while the order is still unassigned.
    const { rows } = await pool.query(
      `UPDATE orders SET rider_id = pick.user_id
       FROM (
         SELECT rp.user_id
         FROM rider_profiles rp
         WHERE rp.is_available = true
           AND ${APPROVED_RIDER_SQL('rp.user_id')}
           AND rp.user_id NOT IN (
             SELECT rider_id FROM orders
             WHERE status IN ('ready', 'picked_up') AND rider_id IS NOT NULL
           )
           AND NOT EXISTS (SELECT 1 FROM order_rider_declines d WHERE d.order_id = $1 AND d.rider_id = rp.user_id)
         ORDER BY RANDOM()
         LIMIT 1
       ) pick
       WHERE orders.id = $1 AND orders.rider_id IS NULL AND orders.status = 'ready'
       RETURNING pick.user_id`,
      [orderId]
    );
    if (!rows.length) {
      console.log(`autoAssignRider: no available rider for order ${orderId} — will assign when a rider comes online`);
      return null;
    }
    const riderId = rows[0].user_id;
    console.log(`autoAssignRider: assigned rider ${riderId} to order ${orderId}`);
    await notify(riderId, {
      audience: 'rider', type: 'warning', link: '/rider/dashboard',
      title: `New delivery request · #${orderId}`, message: 'An order is ready for pickup. Accept or decline it in your dashboard.',
    });
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
  const badProof = firstImageError({ 'GCash proof': proofImage });
  if (badProof) return res.status(400).json({ error: badProof });

  // Basic cart checks before anything else
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Your cart is empty' });
  }
  const seen = new Set();
  for (const i of items) {
    const q = Number(i?.quantity);
    if (!Number.isInteger(q) || q < 1 || q > 99) {
      return res.status(400).json({ error: 'Each item quantity must be a whole number from 1 to 99' });
    }
    if (seen.has(String(i.menuItemId))) {
      return res.status(400).json({ error: 'The same item appears twice in the cart' });
    }
    seen.add(String(i.menuItemId));
  }
  if (!['cash', 'gcash'].includes(paymentMethod || 'cash')) {
    return res.status(400).json({ error: 'Unsupported payment method' });
  }
  const useCredit = req.body.useCredit === true;
  // With store credit the GCash proof may not be needed (checked once the amount due is known)
  if (paymentMethod === 'gcash' && !proofImage && !useCredit) {
    return res.status(400).json({ error: 'Please upload your GCash payment proof' });
  }

  const { rows: restRows } = await pool.query(
    'SELECT delivery_fee, min_order, is_open, is_approved FROM restaurants WHERE id = $1', [restaurantId]
  );
  if (!restRows.length || !restRows[0].is_approved) {
    return res.status(400).json({ error: 'This restaurant is not available' });
  }
  if (!restRows[0].is_open) {
    return res.status(400).json({ error: 'This restaurant is closed right now' });
  }

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
  if (menuRows.length !== ids.length || menuRows.some(r => !r.is_available)) {
    return res.status(400).json({ error: 'One or more items unavailable or not from this restaurant' });
  }
  const itemMap = Object.fromEntries(menuRows.map(r => [r.id, r]));
  const gross = items.reduce((s, i) => s + Number(itemMap[i.menuItemId].price) * Number(i.quantity), 0);

  const minOrder = Number(restRows[0].min_order || 0);
  if (gross < minOrder) {
    return res.status(400).json({ error: `This restaurant's minimum order is ₱${minOrder.toFixed(2)} of food` });
  }

  // Same rules as /promos/validate, plus: a restaurant's own promo only works there.
  // The usage count is claimed atomically so max_uses can't be exceeded.
  let discount = 0;
  let promoId  = null;
  if (promoCode) {
    const { rows: promos } = await pool.query(
      `SELECT p.* FROM promo_codes p
       WHERE UPPER(p.code) = UPPER($1) AND p.is_active = true
         AND (p.starts_at  IS NULL OR p.starts_at  <= NOW())
         AND (p.expires_at IS NULL OR p.expires_at >  NOW())
         AND (p.max_uses   IS NULL OR p.used_count < p.max_uses)
         AND (p.owner_id   IS NULL OR p.owner_id = (SELECT owner_id FROM restaurants WHERE id = $2))`,
      [String(promoCode).trim(), restaurantId]
    );
    if (promos.length && gross >= Number(promos[0].min_order) && await promoAudienceOk(promos[0], req.user.id)) {
      const p = promos[0];
      discount = promoDiscount(p, gross);
      promoId = p.id;
    }
  }

  const deliveryFee = Number(restRows[0].delivery_fee || 0);
  const subtotal    = gross - discount;
  const tax         = subtotal * 0.08;
  const total       = subtotal + parseFloat(deliveryFee) + tax;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (promoId) {
      const { rowCount } = await client.query(
        'UPDATE promo_codes SET used_count = used_count + 1 WHERE id = $1 AND (max_uses IS NULL OR used_count < max_uses)',
        [promoId]
      );
      if (!rowCount) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'This promo code has just run out. Please place the order again without it.' });
      }
    }
    // Store credit at this restaurant pays part (or all) of the order. One order at a
    // time per customer, so the same credit can't be spent twice.
    let creditUsed = 0;
    if (useCredit) {
      await client.query('SELECT pg_advisory_xact_lock(424242, $1)', [customerId]);
      const available = await storeCredit.balance(customerId, restaurantId, client);
      creditUsed = storeCredit.round2(Math.min(available, total));
    }
    const amountDue = storeCredit.round2(total - creditUsed);
    if (paymentMethod === 'gcash' && amountDue > 0 && !proofImage) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Please upload your GCash payment proof' });
    }
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders
         (customer_id, restaurant_id, status, delivery_address, special_instructions,
          subtotal, delivery_fee, tax, total, payment_method, proof_image, credit_used, payment_status)
       VALUES ($1,$2,'pending',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [customerId, restaurantId, deliveryAddress, specialInstructions || null,
       subtotal, deliveryFee, tax, total, paymentMethod || 'cash',
       paymentMethod === 'gcash' && amountDue > 0 ? proofImage : null,
       creditUsed, amountDue > 0 ? 'pending' : 'paid']
    );
    const orderId = orderRows[0].id;
    if (creditUsed > 0) {
      await storeCredit.give(client, { customerId, restaurantId, amount: -creditUsed, orderId, note: `Used on order #${orderId}` });
    }

    for (const item of items) {
      const mi = itemMap[item.menuItemId];
      await client.query(
        'INSERT INTO order_items (order_id, menu_item_id, name, price, quantity, notes) VALUES ($1,$2,$3,$4,$5,$6)',
        [orderId, item.menuItemId, mi.name, mi.price, item.quantity, item.notes || null]
      );
    }
    await client.query('COMMIT');
    res.status(201).json({ id: orderId, orderId, total, creditUsed, amountDue });

    // Email the customer a receipt as proof of the order (never blocks the order)
    sendOrderReceipt(orderId).catch(err => console.error('receipt email failed:', err.message));

    // After responding: tell the customer and the restaurant
    const { rows: rest } = await pool.query('SELECT owner_id, name FROM restaurants WHERE id = $1', [restaurantId]);
    const count = items.reduce((n, i) => n + Number(i.quantity), 0);
    await notify(customerId, {
      audience: 'customer', type: 'success', link: '/orders',
      title: `Order placed · #${orderId}`, message: `We sent your order to ${rest[0]?.name || 'the restaurant'}. We'll update you as it progresses.`,
    });
    await notify(rest[0]?.owner_id, {
      audience: 'restaurant', type: 'warning', link: '/owner/orders',
      title: `New order · #${orderId}`,
      message: `${count} item${count === 1 ? '' : 's'} · ₱${Number(total).toFixed(2)} · ${paymentMethod || 'cash'}`
        + (creditUsed > 0 ? ` · ₱${creditUsed.toFixed(2)} paid with store credit` : ''),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listOrders(req, res) {
  const { status, restaurant_id, rider_orders } = req.query;
  const page   = Math.max(parseInt(req.query.page) || 1, 1);
  const limit  = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 1000);
  const offset = (page - 1) * limit;
  const { id, role } = req.user;

  const where  = [];
  const params = [];
  let   idx    = 1;

  if (rider_orders === 'true') {
    // Rider fetching their own assigned orders
    where.push(`o.rider_id = $${idx++}`); params.push(id);
  } else if (restaurant_id) {
    // Only that restaurant's owner (or an admin) may list its orders
    const rid = parseInt(restaurant_id);
    if (!Number.isInteger(rid)) return res.status(400).json({ error: 'Invalid restaurant_id' });
    if (role !== 'admin') {
      const { rows: owned } = await pool.query(
        'SELECT 1 FROM restaurants WHERE id = $1 AND owner_id = $2', [rid, id]
      );
      if (!owned.length) return res.status(403).json({ error: 'Forbidden' });
    }
    where.push(`o.restaurant_id = $${idx++}`); params.push(rid);
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
            o.payment_method, o.payment_status, o.credit_used,
            o.created_at, o.delivered_at, o.delivery_address, NULL AS delivery_proof_image, o.rider_id,
            r.name AS restaurant_name, ${imageUrlSql('r', 'restaurants')} AS restaurant_image,
            r.address AS restaurant_address,
            u.name  AS customer_name,
            ru.name  AS rider_name,
            ru.phone AS rider_phone,
            rv.food_rating, rv.restaurant_rating
     FROM orders o
     JOIN restaurants r ON o.restaurant_id = r.id
     JOIN users u ON o.customer_id = u.id
     LEFT JOIN users ru ON ru.id = o.rider_id
     LEFT JOIN reviews rv ON rv.order_id = o.id
     ${cond} ORDER BY o.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset]
  );
  rows.forEach(r => resolveImageUrls(req, r, ['restaurant_image']));
  res.json({ data: rows, page, limit });
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
            ru.name  AS rider_name,   ru.phone AS rider_phone,
            rv.food_rating, rv.restaurant_rating, rv.rider_rating, rv.comment AS review_comment
     FROM orders o
     JOIN restaurants r ON o.restaurant_id = r.id
     JOIN users u ON o.customer_id = u.id
     LEFT JOIN users ru ON ru.id = o.rider_id
     LEFT JOIN reviews rv ON rv.order_id = o.id
     WHERE o.id = $1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Order not found' });
  const order = rows[0];
  if (!canAccessOrder(req.user, order)) return res.status(404).json({ error: 'Order not found' });

  // Proof images are large base64 blobs; customers never display them, and the
  // tracking page refetches this endpoint, so don't ship them to customers.
  // Check the user's relation to this order, not their role: restaurant owners and
  // riders who upgraded from a customer account still carry role 'customer'.
  const isStaffForOrder = req.user.role === 'admin'
    || order.restaurant_owner_id === req.user.id
    || order.rider_id === req.user.id;
  if (!isStaffForOrder) {
    delete order.proof_image;
    delete order.delivery_proof_image;
  }
  delete order.restaurant_owner_id;
  resolveImageUrls(req, order, ['restaurant_image']);

  const { rows: items } = await pool.query(
    `SELECT oi.*, ${imageUrlSql('mi', 'menu-items')} AS image_url, oir.rating AS my_rating
     FROM order_items oi
     LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
     LEFT JOIN order_item_ratings oir ON oir.order_id = oi.order_id AND oir.menu_item_id = oi.menu_item_id
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
  // A cancelled GCash order is refunded: the customer picks store credit or GCash
  const refundMethod = req.body.refundMethod === 'credit' ? 'credit' : 'gcash';
  let refundGcash = null;
  if (status === 'cancelled' && req.body.refundGcash) {
    refundGcash = String(req.body.refundGcash).replace(/[^\d+]/g, '');
    if (!/^(\+?63|0)9\d{9}$/.test(refundGcash)) {
      return res.status(400).json({ error: 'Enter your GCash number, e.g. 09171234567' });
    }
  }
  if (status === 'delivered' && !deliveryProof) {
    return res.status(400).json({ error: 'Proof of delivery is required' });
  }
  const badProof = firstImageError({ 'Delivery proof': deliveryProof });
  if (badProof) return res.status(400).json({ error: badProof });

  const { rows: beforeRows } = await pool.query(
    `SELECT o.status, o.rider_id, o.delivery_fee, o.customer_id, o.payment_method, r.owner_id
     FROM orders o JOIN restaurants r ON r.id = o.restaurant_id WHERE o.id = $1`,
    [req.params.id]
  );
  if (!beforeRows.length) return res.status(404).json({ error: 'Order not found' });
  const before = beforeRows[0];

  // Only the people handling this order may change its status:
  // its restaurant (kitchen steps / cancel), its assigned rider (pickup / delivery), or an admin
  const isAdmin = req.user.role === 'admin';
  const isOwner = before.owner_id === req.user.id;
  const isRider = before.rider_id != null && before.rider_id === req.user.id;
  // The customer may cancel their own order until the restaurant accepts it
  const isCustomer = before.customer_id === req.user.id;
  const allowedFor = [
    ...(isOwner ? RESTAURANT_STATUSES : []),
    ...(isRider ? RIDER_STATUSES : []),
    ...(isCustomer && before.status === 'pending' ? ['cancelled'] : []),
  ];
  if (!isAdmin && !allowedFor.includes(status)) {
    return res.status(403).json({ error: 'You are not allowed to change this order' });
  }
  if (!isAdmin && FINAL_STATUSES.includes(before.status)) {
    return res.status(409).json({ error: `This order is already ${before.status}` });
  }
  if (!isAdmin && !(NEXT_STATUSES[before.status] || []).includes(status)) {
    return res.status(409).json({ error: `An order that is ${before.status.replace('_', ' ')} can't be changed to ${status.replace('_', ' ')}` });
  }

  const { rows: updatedRows } = await pool.query(
    `UPDATE orders SET
       status           = $1,
       cancelled_reason = CASE WHEN $2 = 'cancelled' THEN $3 ELSE cancelled_reason END,
       delivered_at     = CASE WHEN $4 = 'delivered'  THEN NOW() ELSE delivered_at END,
       delivery_proof_image = CASE WHEN $4 = 'delivered' THEN $5 ELSE delivery_proof_image END,
       payment_status   = CASE
         WHEN payment_status = 'refunded' THEN payment_status
         WHEN $4 = 'delivered' THEN 'paid'
         WHEN payment_method = 'gcash' AND $4 IN ('accepted','preparing','ready','picked_up') THEN 'paid'
         ELSE payment_status END
     WHERE id = $6 AND ($7::boolean OR status = $8)
     RETURNING id, status`,
    [status, status, cancelledReason || null, status, deliveryProof || null, req.params.id, isAdmin, before.status]
  );
  // Someone else changed the order a moment ago (e.g. the restaurant accepted it as the customer cancelled)
  if (!updatedRows.length) return res.status(409).json({ error: 'This order was just updated. Please refresh and try again.' });
  let refund = null;
  if (status === 'cancelled') {
    await storeCredit.returnForCancelledOrder(req.params.id);
    // Only the customer chooses store credit; otherwise the money goes back by GCash
    refund = await refundCancelledOrder(req.params.id, {
      method: isCustomer && !isOwner ? refundMethod : 'gcash',
      gcash: isCustomer && !isOwner ? refundGcash : null,
      // Only the restaurant (or admin) can say whether the GCash money arrived
      paymentReceived: (isOwner || isAdmin) && typeof req.body.paymentReceived === 'boolean' ? req.body.paymentReceived : null,
    });
  }

  await notifyOrderStatus(req.params.id, status, cancelledReason);
  if (status === 'cancelled' && isCustomer && !isOwner && !isAdmin) {
    await notify(before.owner_id, {
      audience: 'restaurant', type: 'error', link: '/owner/orders',
      title: `Order #${req.params.id} cancelled by the customer`,
      message: cancelledReason || null,
    });
  }

  // When order is ready for pickup, auto-assign an available rider
  if (status === 'ready') {
    const riderId = await autoAssignRider(req.params.id);
    return res.json({ message: 'Status updated', riderId: riderId || null });
  }

  // When delivered, free the rider back to available and record what the
  // restaurant and rider now owe each other (delivery fee vs cash collected)
  if (status === 'delivered') {
    await recordDelivery(req.params.id).catch(err => console.warn('rider pay record failed:', err.message));
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

  res.json({ message: 'Status updated', order: updatedRows[0], refund });
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
    await notifyOrderStatus(orderId, 'picked_up');
    return res.json({ message: 'Order accepted', status: 'picked_up' });
  } else {
    // Rider rejected — remember it (so they aren't offered it again), clear the
    // assignment and try the next rider
    await pool.query(
      'INSERT INTO order_rider_declines (order_id, rider_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [orderId, riderId]
    );
    await pool.query('UPDATE orders SET rider_id = NULL WHERE id = $1 AND rider_id = $2', [orderId, riderId]);
    const nextRider = await autoAssignRider(orderId);
    return res.json({ message: 'Order rejected', nextRiderId: nextRider || null });
  }
}

async function assignRider(req, res) {
  const riderId = parseInt(req.body.riderId);
  if (!Number.isInteger(riderId) || !(await isApprovedRider(riderId))) {
    return res.status(400).json({ error: 'That user is not an active rider' });
  }
  const { rows: orderRows } = await pool.query('SELECT status FROM orders WHERE id = $1', [req.params.id]);
  if (!orderRows.length) return res.status(404).json({ error: 'Order not found' });
  if (FINAL_STATUSES.includes(orderRows[0].status)) {
    return res.status(409).json({ error: `This order is already ${orderRows[0].status}` });
  }
  await pool.query('UPDATE orders SET rider_id = $1 WHERE id = $2', [riderId, req.params.id]);
  await notify(riderId, {
    audience: 'rider', type: 'warning', link: '/rider/dashboard',
    title: `New delivery request · #${req.params.id}`, message: 'An admin assigned you this order. Accept or decline it in your dashboard.',
  });
  res.json({ message: 'Rider assigned' });
}

// ── Receipts ─────────────────────────────────────────────────────────────────

const PAYMENT_LABEL = { cash: 'Cash on Delivery', gcash: 'GCash', card: 'Card', online: 'Online' };

async function sendOrderReceipt(orderId) {
  const { rows } = await pool.query(
    `SELECT o.*, r.name AS restaurant_name, r.address AS restaurant_address,
            u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
     FROM orders o
     JOIN restaurants r ON r.id = o.restaurant_id
     JOIN users u ON u.id = o.customer_id
     WHERE o.id = $1`, [orderId]
  );
  const o = rows[0];
  if (!o?.customer_email) return;
  const { rows: items } = await pool.query(
    'SELECT name, price, quantity, notes FROM order_items WHERE order_id = $1 ORDER BY id', [orderId]
  );
  const peso = (n) => `&#8369;${Number(n).toFixed(2)}`;
  const itemsTotal = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const discount = Math.max(0, itemsTotal - Number(o.subtotal));
  const placed = new Date(o.created_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' });
  const row = (l, v, bold) => `<tr><td style="padding:3px 0;${bold ? 'font-weight:bold;border-top:1px solid #ddd;padding-top:8px' : 'color:#555'}">${l}</td>
    <td style="padding:3px 0;text-align:right;${bold ? 'font-weight:bold;border-top:1px solid #ddd;padding-top:8px' : 'color:#555'}">${v}</td></tr>`;
  const itemRows = items.map(i => `<tr>
      <td style="padding:6px 0;border-bottom:1px solid #eee">${escapeHtml(i.name)} &times; ${i.quantity}${i.notes ? `<br><span style="color:#888;font-size:12px">Note: ${escapeHtml(i.notes)}</span>` : ''}</td>
      <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${peso(Number(i.price) * i.quantity)}</td></tr>`).join('');

  await sendEmail({
    to: o.customer_email,
    subject: `KinakanGo receipt · Order #${o.id}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">
        <h2 style="margin:0;color:#e8540a">KinakanGo</h2>
        <p style="margin:4px 0 20px;color:#666">Order receipt</p>
        <table style="width:100%;font-size:14px;margin-bottom:16px">
          <tr><td style="color:#666">Order</td><td style="text-align:right"><strong>#${o.id}</strong></td></tr>
          <tr><td style="color:#666">Placed</td><td style="text-align:right">${placed}</td></tr>
          <tr><td style="color:#666">Customer</td><td style="text-align:right">${escapeHtml(o.customer_name)}</td></tr>
          <tr><td style="color:#666">Restaurant</td><td style="text-align:right">${escapeHtml(o.restaurant_name)}</td></tr>
          <tr><td style="color:#666;vertical-align:top">Deliver to</td><td style="text-align:right">${escapeHtml(o.delivery_address)}</td></tr>
          <tr><td style="color:#666">Payment</td><td style="text-align:right">${PAYMENT_LABEL[o.payment_method] || escapeHtml(o.payment_method)}</td></tr>
        </table>
        <table style="width:100%;border-collapse:collapse;font-size:14px">${itemRows}</table>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px">
          ${row('Items', peso(itemsTotal))}
          ${discount > 0.005 ? row('Promo discount', `&minus;${peso(discount)}`) : ''}
          ${row('Delivery fee', peso(o.delivery_fee))}
          ${row('Tax (8%)', peso(o.tax))}
          ${row('Total', peso(o.total), true)}
          ${Number(o.credit_used) > 0 ? row('Paid with store credit', `&minus;${peso(o.credit_used)}`) + row('To pay', peso(Number(o.total) - Number(o.credit_used)), true) : ''}
        </table>
        <p style="color:#888;font-size:12px;margin-top:20px">Keep this email as proof of your order. You can also see it anytime in KinakanGo under Profile &rarr; Order History.</p>
      </div>`,
  });
}

// Customer asks for the receipt again (once a minute per order)
const lastReceiptSent = new Map();
async function emailReceipt(req, res) {
  const { rows } = await pool.query('SELECT customer_id FROM orders WHERE id = $1', [req.params.id]);
  if (!rows.length || rows[0].customer_id !== req.user.id) return res.status(404).json({ error: 'Order not found' });
  const key = String(req.params.id);
  const last = lastReceiptSent.get(key) || 0;
  if (Date.now() - last < 60 * 1000) {
    return res.status(429).json({ error: 'Receipt already sent. Please wait a minute before sending again.' });
  }
  try {
    await sendOrderReceipt(req.params.id);
  } catch (err) {
    console.error('receipt email failed:', err.message);
    return res.status(503).json({ error: "Couldn't send the receipt email. Please try again later." });
  }
  lastReceiptSent.set(key, Date.now());
  const { rows: u } = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
  res.json({ message: 'Receipt sent', sentTo: maskEmail(u[0]?.email || '') });
}

// ── Reviews ──────────────────────────────────────────────────────────────────

// Customer rates a delivered order once: each food item (1–5 stars, optional
// per item) and the restaurant (1–5 stars, required), plus an optional comment.
async function submitReview(req, res) {
  const restaurantRating = Number(req.body.restaurantRating);
  const riderRating = req.body.riderRating == null || req.body.riderRating === '' ? null : Number(req.body.riderRating);
  const comment = req.body.comment ? String(req.body.comment).trim().slice(0, 500) : null;
  const valid = (n) => Number.isInteger(n) && n >= 1 && n <= 5;
  if (!valid(restaurantRating)) {
    return res.status(400).json({ error: 'Please give the restaurant 1 to 5 stars' });
  }
  const { rows } = await pool.query(
    'SELECT customer_id, restaurant_id, rider_id, status FROM orders WHERE id = $1', [req.params.id]
  );
  const o = rows[0];
  if (!o || o.customer_id !== req.user.id) return res.status(404).json({ error: 'Order not found' });
  if (o.status !== 'delivered') return res.status(400).json({ error: 'You can rate an order once it has been delivered' });
  if (riderRating !== null && (!o.rider_id || !valid(riderRating))) {
    return res.status(400).json({ error: 'Rider rating must be 1 to 5 stars' });
  }

  // Item ratings: only items that are in this order, each at most once
  const { rows: orderItems } = await pool.query('SELECT DISTINCT menu_item_id FROM order_items WHERE order_id = $1', [req.params.id]);
  const inOrder = new Set(orderItems.map(r => r.menu_item_id));
  const itemRatings = new Map();
  for (const r of Array.isArray(req.body.itemRatings) ? req.body.itemRatings : []) {
    const itemId = parseInt(r?.menuItemId);
    const stars  = Number(r?.rating);
    if (!inOrder.has(itemId)) return res.status(400).json({ error: 'That item is not part of this order' });
    if (!valid(stars)) return res.status(400).json({ error: 'Each food rating must be 1 to 5 stars' });
    itemRatings.set(itemId, stars);
  }
  if (!itemRatings.size) return res.status(400).json({ error: 'Please rate at least one food item' });
  const foodAvg = Math.round([...itemRatings.values()].reduce((a, b) => a + b, 0) / itemRatings.size);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rowCount } = await client.query(
      `INSERT INTO reviews (order_id, customer_id, restaurant_id, rider_id, food_rating, restaurant_rating, rider_rating, comment)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (order_id) DO NOTHING`,
      [req.params.id, req.user.id, o.restaurant_id, o.rider_id, foodAvg, restaurantRating, riderRating, comment]
    );
    if (!rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'You already rated this order' });
    }
    for (const [itemId, stars] of itemRatings) {
      await client.query(
        `INSERT INTO order_item_ratings (order_id, menu_item_id, customer_id, rating) VALUES ($1,$2,$3,$4)`,
        [req.params.id, itemId, req.user.id, stars]
      );
      await client.query(
        `UPDATE menu_items SET avg_rating = sub.avg, rating_count = sub.n
         FROM (SELECT ROUND(AVG(rating)::numeric, 2) AS avg, COUNT(*)::int AS n
               FROM order_item_ratings WHERE menu_item_id = $1) sub
         WHERE id = $1`, [itemId]
      );
    }
    await client.query(
      `UPDATE restaurants SET
         rating       = sub.avg,
         review_count = sub.n
       FROM (SELECT ROUND(AVG(COALESCE(restaurant_rating, food_rating))::numeric, 2) AS avg, COUNT(*)::int AS n
             FROM reviews WHERE restaurant_id = $1) sub
       WHERE id = $1`,
      [o.restaurant_id]
    );
    if (riderRating !== null) {
      await client.query(
        `INSERT INTO rider_profiles (user_id, rating)
         SELECT $1, ROUND(AVG(rider_rating)::numeric, 2) FROM reviews WHERE rider_id = $1 AND rider_rating IS NOT NULL
         ON CONFLICT (user_id) DO UPDATE SET rating = EXCLUDED.rating`,
        [o.rider_id]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  if (riderRating !== null) {
    await notify(o.rider_id, {
      audience: 'rider', type: 'info', link: '/rider/earnings',
      title: `New rating · Order #${req.params.id}`,
      message: `A customer rated your delivery ${riderRating}★`,
    });
  }

  const { rows: names } = await pool.query(
    'SELECT id, name FROM menu_items WHERE id = ANY($1::int[])', [[...itemRatings.keys()]]
  );
  const nameOf = Object.fromEntries(names.map(n => [n.id, n.name]));
  const itemsText = [...itemRatings].map(([id, st]) => `${nameOf[id] || 'Item'} ${st}★`).join(', ');
  const { rows: rest } = await pool.query('SELECT owner_id FROM restaurants WHERE id = $1', [o.restaurant_id]);
  await notify(rest[0]?.owner_id, {
    audience: 'restaurant', type: 'info', link: '/owner/orders',
    title: `New rating · Order #${req.params.id}`,
    message: `Restaurant ${restaurantRating}★ · ${itemsText}${comment ? ` · "${comment.slice(0, 120)}"` : ''}`,
  });
  res.status(201).json({ message: 'Thanks for your rating!', restaurantRating, riderRating, comment,
    itemRatings: [...itemRatings].map(([menuItemId, rating]) => ({ menuItemId, rating })) });
}

module.exports = { submitReview, emailReceipt, sendOrderReceipt, notifyOrderStatus, requestOrderCode, placeOrder, listOrders, getOrder, canAccessOrder, updateStatus, assignRider, riderResponse, autoAssignRider };

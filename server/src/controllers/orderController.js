const pool = require('../config/db');

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

async function placeOrder(req, res) {
  const { restaurantId, items, deliveryAddress, specialInstructions, paymentMethod, promoCode, proofImage, contactInfo } = req.body;
  const customerId = req.user.id;

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
            o.created_at, o.delivered_at, o.delivery_address, o.delivery_proof_image, o.rider_id,
            r.name AS restaurant_name, r.image_url AS restaurant_image, r.address AS restaurant_address,
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
  res.json({ data: rows, page: parseInt(page), limit: parseInt(limit) });
}

async function getOrder(req, res) {
  const { rows } = await pool.query(
    `SELECT o.*,
            r.name  AS restaurant_name, r.image_url AS restaurant_image,
            r.address AS restaurant_address, r.phone AS restaurant_phone,
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

  const { rows: items } = await pool.query(
    `SELECT oi.*, mi.image_url
     FROM order_items oi
     LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
     WHERE oi.order_id = $1`,
    [req.params.id]
  );
  res.json({ ...rows[0], items });
}

async function updateStatus(req, res) {
  const { status, cancelledReason, deliveryProof } = req.body;
  const allowed = ['accepted','preparing','ready','picked_up','delivered','cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  if (status === 'delivered' && !deliveryProof) {
    return res.status(400).json({ error: 'Proof of delivery is required' });
  }

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
    const { rows } = await pool.query('SELECT rider_id FROM orders WHERE id = $1', [req.params.id]);
    if (rows[0]?.rider_id) {
      await pool.query(
        'UPDATE rider_profiles SET is_available = true WHERE user_id = $1',
        [rows[0].rider_id]
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

module.exports = { placeOrder, listOrders, getOrder, updateStatus, assignRider, riderResponse, autoAssignRider };

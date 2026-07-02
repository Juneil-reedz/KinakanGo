const pool = require('../config/db');

async function placeOrder(req, res) {
  const { restaurantId, items, deliveryAddress, specialInstructions, paymentMethod, promoCode } = req.body;
  const customerId = req.user.id;

  // Validate items and calculate totals
  const ids = items.map(i => i.menuItemId);
  const [menuRows] = await pool.query(
    'SELECT id, price, name, is_available FROM menu_items WHERE id IN (?) AND restaurant_id = ?',
    [ids, restaurantId]
  );
  if (menuRows.length !== ids.length) {
    return res.status(400).json({ error: 'One or more items unavailable or not from this restaurant' });
  }
  const itemMap = Object.fromEntries(menuRows.map(r => [r.id, r]));

  // Promo
  let discount = 0;
  if (promoCode) {
    const [promos] = await pool.query(
      'SELECT * FROM promo_codes WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > NOW())',
      [promoCode]
    );
    if (promos.length) {
      const p = promos[0];
      const gross = items.reduce((s, i) => s + itemMap[i.menuItemId].price * i.quantity, 0);
      if (gross >= p.min_order) {
        discount = p.discount_type === 'percent'
          ? (gross * p.discount_value) / 100
          : p.discount_value;
        await pool.query('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?', [p.id]);
      }
    }
  }

  const [restaurant] = await pool.query('SELECT delivery_fee FROM restaurants WHERE id = ?', [restaurantId]);
  const deliveryFee = restaurant[0]?.delivery_fee || 0;
  const subtotal    = items.reduce((s, i) => s + itemMap[i.menuItemId].price * i.quantity, 0) - discount;
  const tax         = subtotal * 0.08;
  const total       = subtotal + deliveryFee + tax;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [orderResult] = await conn.query(
      `INSERT INTO orders
         (customer_id, restaurant_id, status, delivery_address, special_instructions,
          subtotal, delivery_fee, tax, total, payment_method)
       VALUES (?,?,'pending',?,?,?,?,?,?,?)`,
      [customerId, restaurantId, deliveryAddress, specialInstructions || null,
       subtotal, deliveryFee, tax, total, paymentMethod || 'cash']
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      const mi = itemMap[item.menuItemId];
      await conn.query(
        'INSERT INTO order_items (order_id, menu_item_id, name, price, quantity, notes) VALUES (?,?,?,?,?,?)',
        [orderId, item.menuItemId, mi.name, mi.price, item.quantity, item.notes || null]
      );
    }
    await conn.commit();
    res.status(201).json({ orderId, total });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function listOrders(req, res) {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const { id, role } = req.user;

  const where  = [];
  const params = [];

  if (role === 'customer')         { where.push('o.customer_id = ?');    params.push(id); }
  if (role === 'rider')            { where.push('o.rider_id = ?');       params.push(id); }
  if (role === 'restaurant_owner') {
    where.push('o.restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = ?)');
    params.push(id);
  }
  if (status) { where.push('o.status = ?'); params.push(status); }

  const cond = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT o.id, o.status, o.total, o.payment_method, o.payment_status,
            o.created_at, r.name AS restaurant_name, r.image_url AS restaurant_image,
            u.name AS customer_name
     FROM orders o
     JOIN restaurants r ON o.restaurant_id = r.id
     JOIN users u ON o.customer_id = u.id
     ${cond} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );
  res.json({ data: rows, page: parseInt(page), limit: parseInt(limit) });
}

async function getOrder(req, res) {
  const [rows] = await pool.query(
    `SELECT o.*, r.name AS restaurant_name, r.image_url AS restaurant_image,
            r.address AS restaurant_address,
            u.name AS customer_name, u.phone AS customer_phone
     FROM orders o
     JOIN restaurants r ON o.restaurant_id = r.id
     JOIN users u ON o.customer_id = u.id
     WHERE o.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Order not found' });

  const [items] = await pool.query(
    'SELECT * FROM order_items WHERE order_id = ?', [req.params.id]
  );
  res.json({ ...rows[0], items });
}

async function updateStatus(req, res) {
  const { status, cancelledReason } = req.body;
  const allowed = ['accepted','preparing','ready','picked_up','delivered','cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  await pool.query(
    `UPDATE orders SET status = ?,
       cancelled_reason = CASE WHEN ? = 'cancelled' THEN ? ELSE cancelled_reason END,
       delivered_at     = CASE WHEN ? = 'delivered'  THEN NOW() ELSE delivered_at END
     WHERE id = ?`,
    [status, status, cancelledReason || null, status, req.params.id]
  );
  res.json({ message: 'Status updated' });
}

async function assignRider(req, res) {
  const { riderId } = req.body;
  await pool.query('UPDATE orders SET rider_id = ? WHERE id = ?', [riderId, req.params.id]);
  res.json({ message: 'Rider assigned' });
}

module.exports = { placeOrder, listOrders, getOrder, updateStatus, assignRider };

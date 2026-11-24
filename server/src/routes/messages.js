const router = require('express').Router();
const { notify } = require('../utils/notify');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

const normalizeSql = (value) => `regexp_replace(lower(${value}), '[^a-z0-9]', '', 'g')`;

// Messages addressed only by restaurant name (older rows without a user id)
const restaurantRecipientSql = `EXISTS (
  SELECT 1 FROM restaurants r
  WHERE r.owner_id = $1
    AND ${normalizeSql('r.name')} = ${normalizeSql('m.recipient_label')}
)`;

// Who a new message goes to. Only exact matches, so a typo never reaches the
// wrong person:
//  - toUserId: replying in an existing conversation (or writing to a restaurant owner)
//  - to: a restaurant's exact name, or an account's exact email address
async function resolveRecipient({ to, toUserId, fromRestaurant }, senderId) {
  const ownsRestaurant = async (userId) =>
    (await pool.query('SELECT name FROM restaurants WHERE owner_id = $1 LIMIT 1', [userId])).rows[0]?.name || null;

  if (toUserId != null && toUserId !== '') {
    const id = parseInt(toUserId);
    const { rows: users } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [id]);
    if (!users.length) return null;
    const { rows: talked } = await pool.query(
      `SELECT 1 FROM messages WHERE (sender_id = $1 AND recipient_user_id = $2) OR (sender_id = $2 AND recipient_user_id = $1) LIMIT 1`,
      [senderId, id]
    );
    const restaurantName = await ownsRestaurant(id);
    if (!talked.length && !restaurantName) return null;
    // Writing from the customer app to a restaurant owner goes to their restaurant inbox
    const isRestaurant = !!restaurantName && !fromRestaurant;
    return { recipient_user_id: id, recipient_label: isRestaurant ? restaurantName : (users[0].name || users[0].email), isRestaurant };
  }

  const needle = String(to || '').trim();
  if (!needle) return null;
  const { rows: restaurants } = await pool.query(
    `SELECT owner_id AS user_id, name FROM restaurants
     WHERE is_approved = true AND ${normalizeSql('name')} = ${normalizeSql('$1')}
     LIMIT 1`,
    [needle]
  );
  if (restaurants.length) {
    return { recipient_user_id: restaurants[0].user_id, recipient_label: restaurants[0].name, isRestaurant: true };
  }
  const { rows: users } = await pool.query(
    'SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [needle]
  );
  if (users.length) {
    return { recipient_user_id: users[0].id, recipient_label: users[0].name || users[0].email, isRestaurant: false };
  }
  return null;
}

router.get('/', async (req, res) => {
  try {
    const box = req.query.box === 'sent' ? 'sent' : 'inbox';
    const where = box === 'sent'
      ? 'm.sender_id = $1'
      : `(
          m.recipient_user_id = $1 OR (
            m.recipient_user_id IS NULL AND ${restaurantRecipientSql}
          )
        )`;
    const { rows } = await pool.query(
      `SELECT m.id, m.sender_id, m.recipient_user_id, m.recipient_label,
              m.subject, m.body, m.is_read, m.created_at, m.updated_at,
              sender.name AS sender_name, sender.email AS sender_email,
              sender_restaurant.name AS sender_restaurant_name,
              sender_restaurant.image_url AS sender_restaurant_image,
              recipient_restaurant.name AS recipient_restaurant_name,
              recipient_restaurant.image_url AS recipient_restaurant_image
       FROM messages m
       JOIN users sender ON sender.id = m.sender_id
       LEFT JOIN restaurants sender_restaurant ON sender_restaurant.owner_id = m.sender_id
       LEFT JOIN restaurants recipient_restaurant ON recipient_restaurant.owner_id = m.recipient_user_id
       WHERE ${where}
       ORDER BY m.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error('messages list error:', err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { to, toUserId, subject, body } = req.body;
    if ((!String(to || '').trim() && !toUserId) || !String(body || '').trim()) {
      return res.status(400).json({ error: 'Recipient and message are required' });
    }
    const recipient = await resolveRecipient(req.body, req.user.id);
    if (!recipient) {
      return res.status(404).json({ error: `We couldn't find "${String(to || '').trim()}". Type the restaurant's exact name or the person's email address.` });
    }
    if (recipient.recipient_user_id === req.user.id) {
      return res.status(400).json({ error: "You can't send a message to yourself" });
    }
    const { rows } = await pool.query(
      `INSERT INTO messages (sender_id, recipient_user_id, recipient_label, subject, body)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, sender_id, recipient_user_id, recipient_label, subject, body, is_read, created_at, updated_at`,
      [req.user.id, recipient.recipient_user_id, recipient.recipient_label, subject || 'New message', body]
    );
    const message = rows[0];
    const { rows: senderRestaurants } = await pool.query('SELECT name, image_url FROM restaurants WHERE owner_id = $1 LIMIT 1', [req.user.id]);
    const { rows: recipientRestaurants } = recipient.recipient_user_id
      ? await pool.query('SELECT name, image_url FROM restaurants WHERE owner_id = $1 LIMIT 1', [recipient.recipient_user_id])
      : { rows: [] };
    // Messages to a restaurant show up in that owner's panel; others in the customer app
    if (recipient.recipient_user_id && recipient.recipient_user_id !== req.user.id) {
      const from = senderRestaurants[0]?.name || req.user.name || 'Someone';
      await notify(recipient.recipient_user_id, {
        audience: recipient.isRestaurant ? 'restaurant' : 'customer', type: 'info',
        link: recipient.isRestaurant ? '/owner/messages' : '/messages',
        title: `New message from ${from}`, message: subject && subject !== 'New message' ? subject : String(body).slice(0, 120),
      });
    }
    res.status(201).json({
      ...message,
      sender_restaurant_name: senderRestaurants[0]?.name || null,
      sender_restaurant_image: senderRestaurants[0]?.image_url || null,
      recipient_restaurant_name: recipientRestaurants[0]?.name || null,
      recipient_restaurant_image: recipientRestaurants[0]?.image_url || null,
    });
  } catch (err) {
    console.error('messages create error:', err);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    await pool.query(
      `UPDATE messages m
       SET is_read = true
       WHERE m.id = $2 AND (m.recipient_user_id = $1 OR (m.recipient_user_id IS NULL AND ${restaurantRecipientSql}))`,
      [req.user.id, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('messages read error:', err);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const subject = String(req.body.subject || '').trim() || 'New message';
    const body = String(req.body.body || '').trim();
    if (!body) return res.status(400).json({ error: 'Message body is required' });

    const { rows } = await pool.query(
      `UPDATE messages
       SET subject = $3, body = $4, updated_at = NOW()
       WHERE id = $2 AND sender_id = $1
       RETURNING id, sender_id, recipient_user_id, recipient_label, subject, body, is_read, created_at, updated_at`,
      [req.user.id, req.params.id, subject, body]
    );
    if (!rows.length) return res.status(404).json({ error: 'Message not found or cannot be edited' });
    res.json(rows[0]);
  } catch (err) {
    console.error('messages update error:', err);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM messages m
       WHERE m.id = $2
         AND (m.sender_id = $1 OR m.recipient_user_id = $1 OR (m.recipient_user_id IS NULL AND ${restaurantRecipientSql}))`,
      [req.user.id, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Message not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('messages delete error:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;

const router = require('express').Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

const normalizeSql = (value) => `regexp_replace(lower(${value}), '[^a-z0-9]', '', 'g')`;

async function resolveRecipient(to) {
  const needle = String(to || '').trim();
  if (!needle) return { recipient_user_id: null, recipient_label: '' };

  const { rows: restaurants } = await pool.query(
    `SELECT owner_id AS user_id, name
     FROM restaurants
     WHERE name ILIKE $1 OR ${normalizeSql('name')} = ${normalizeSql('$2')}
     ORDER BY CASE WHEN lower(name) = lower($2) OR ${normalizeSql('name')} = ${normalizeSql('$2')} THEN 0 ELSE 1 END
     LIMIT 1`,
    [`%${needle}%`, needle]
  );
  if (restaurants.length) {
    return { recipient_user_id: restaurants[0].user_id, recipient_label: restaurants[0].name };
  }

  const { rows: users } = await pool.query(
    `SELECT id, name, email
     FROM users
     WHERE name ILIKE $1 OR email ILIKE $1
     ORDER BY CASE WHEN lower(email) = lower($2) OR lower(name) = lower($2) THEN 0 ELSE 1 END
     LIMIT 1`,
    [`%${needle}%`, needle]
  );
  if (users.length) {
    return { recipient_user_id: users[0].id, recipient_label: users[0].name || users[0].email };
  }

  return { recipient_user_id: null, recipient_label: needle };
}

router.get('/', async (req, res) => {
  try {
    const box = req.query.box === 'sent' ? 'sent' : 'inbox';
    const where = box === 'sent'
      ? 'm.sender_id = $1'
      : `(
          m.recipient_user_id = $1 OR (
            m.recipient_user_id IS NULL AND EXISTS (
              SELECT 1 FROM restaurants r
              WHERE r.owner_id = $1
                AND (${normalizeSql('r.name')} = ${normalizeSql('m.recipient_label')} OR r.name ILIKE m.recipient_label)
            )
          )
        )`;
    const { rows } = await pool.query(
      `SELECT m.id, m.sender_id, m.recipient_user_id, m.recipient_label,
              m.subject, m.body, m.is_read, m.created_at,
              sender.name AS sender_name, sender.email AS sender_email,
              sender_restaurant.name AS sender_restaurant_name,
              CASE WHEN sender_restaurant.image_url LIKE 'data:%' THEN NULL ELSE sender_restaurant.image_url END AS sender_restaurant_image,
              recipient_restaurant.name AS recipient_restaurant_name,
              CASE WHEN recipient_restaurant.image_url LIKE 'data:%' THEN NULL ELSE recipient_restaurant.image_url END AS recipient_restaurant_image
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
    const { to, subject, body } = req.body;
    if (!String(to || '').trim() || !String(body || '').trim()) {
      return res.status(400).json({ error: 'Recipient and message are required' });
    }
    const recipient = await resolveRecipient(to);
    const { rows } = await pool.query(
      `INSERT INTO messages (sender_id, recipient_user_id, recipient_label, subject, body)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, sender_id, recipient_user_id, recipient_label, subject, body, is_read, created_at`,
      [req.user.id, recipient.recipient_user_id, recipient.recipient_label, subject || 'New message', body]
    );
    const message = rows[0];
    const { rows: senderRestaurants } = await pool.query(
      `SELECT name, CASE WHEN image_url LIKE 'data:%' THEN NULL ELSE image_url END AS image_url
       FROM restaurants WHERE owner_id = $1 LIMIT 1`,
      [req.user.id]
    );
    const { rows: recipientRestaurants } = recipient.recipient_user_id
      ? await pool.query(
        `SELECT name, CASE WHEN image_url LIKE 'data:%' THEN NULL ELSE image_url END AS image_url
         FROM restaurants WHERE owner_id = $1 LIMIT 1`,
        [recipient.recipient_user_id]
      )
      : { rows: [] };
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
      'UPDATE messages SET is_read = true WHERE id = $1 AND recipient_user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('messages read error:', err);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

module.exports = router;

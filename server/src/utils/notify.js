const pool = require('../config/db');
const { sendPush } = require('./push');

// Stores an in-app notification (and sends it to their phone, see push.js) for a user. `audience` says which part of the
// app shows it: 'customer', 'restaurant' (owner panel) or 'rider' (rider panel).
// Never throws: a failed notification must not break the action that caused it.
async function notify(userId, { audience = 'customer', type = 'info', title, message = null, link = null }) {
  if (!userId || !title) return;
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, audience, type, title, message, link)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, audience, type, String(title).slice(0, 160), message ? String(message).slice(0, 500) : null, link]
    );
  } catch (err) {
    console.warn('notify failed:', err.message);
    return;
  }
  // Also pop it up on the person's phone, if they turned that on. Not awaited:
  // the action that caused it shouldn't wait on the push services.
  sendPush(userId, audience, { title: String(title).slice(0, 160), body: message ? String(message).slice(0, 300) : '', link, audience });
}

module.exports = { notify };

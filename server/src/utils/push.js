const webpush = require('web-push');
const pool    = require('../config/db');

// Phone and browser push notifications (Web Push). Each device that turned
// notifications on has a row in push_subscriptions; notify() sends to them.
//
// Web Push needs a key pair (VAPID). Set VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
// on the server to choose your own; otherwise a pair is made on first start
// and kept in the database, so devices stay subscribed across restarts.

let ready = null;

async function setup() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id         SERIAL PRIMARY KEY,
      user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      audience   VARCHAR(12) NOT NULL DEFAULT 'customer',
      endpoint   TEXT NOT NULL,
      p256dh     TEXT NOT NULL,
      auth       TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (endpoint, audience)
    )`);
  await pool.query('CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON push_subscriptions (user_id, audience)');
  await pool.query('CREATE TABLE IF NOT EXISTS app_settings (key VARCHAR(60) PRIMARY KEY, value TEXT NOT NULL)');

  let publicKey = process.env.VAPID_PUBLIC_KEY, privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    const { rows } = await pool.query("SELECT key, value FROM app_settings WHERE key IN ('vapid_public', 'vapid_private')");
    const saved = Object.fromEntries(rows.map(r => [r.key, r.value]));
    if (saved.vapid_public && saved.vapid_private) {
      ({ vapid_public: publicKey, vapid_private: privateKey } = saved);
    } else {
      const keys = webpush.generateVAPIDKeys();
      // ON CONFLICT: if two servers start at once, both end up with the first pair saved
      await pool.query(
        `INSERT INTO app_settings (key, value) VALUES ('vapid_public', $1), ('vapid_private', $2) ON CONFLICT (key) DO NOTHING`,
        [keys.publicKey, keys.privateKey]);
      const again = await pool.query("SELECT key, value FROM app_settings WHERE key IN ('vapid_public', 'vapid_private')");
      const s = Object.fromEntries(again.rows.map(r => [r.key, r.value]));
      publicKey = s.vapid_public; privateKey = s.vapid_private;
    }
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'https://kinakan-go.vercel.app', publicKey, privateKey);
  return { publicKey };
}

const init = () => {
  if (!ready) ready = setup().catch(err => { ready = null; throw err; });
  return ready;
};

async function publicKey() {
  return (await init()).publicKey;
}

async function saveSubscription(userId, audience, sub) {
  await init();
  await pool.query(
    `INSERT INTO push_subscriptions (user_id, audience, endpoint, p256dh, auth)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (endpoint, audience) DO UPDATE SET user_id = $1, p256dh = $4, auth = $5`,
    [userId, audience, sub.endpoint, sub.keys.p256dh, sub.keys.auth]);
}

async function removeSubscription(userId, endpoint) {
  await init();
  await pool.query('DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2', [userId, endpoint]);
}

// Sends one notification to every device the user turned notifications on for
// this part of the app. Never throws.
async function sendPush(userId, audience, payload) {
  try {
    await init();
    const { rows } = await pool.query(
      'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1 AND audience = $2',
      [userId, audience]);
    const body = JSON.stringify(payload);
    await Promise.all(rows.map(async (r) => {
      try {
        await webpush.sendNotification({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } }, body,
          { TTL: 60 * 60 * 12, urgency: 'high' });
      } catch (err) {
        // 404 / 410: the device turned notifications off or the app was removed
        if (err.statusCode === 404 || err.statusCode === 410) {
          await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [r.id]).catch(() => {});
        } else {
          console.warn('push failed:', err.statusCode || '', err.message);
        }
      }
    }));
  } catch (err) {
    console.warn('push setup failed:', err.message);
  }
}

module.exports = { init, publicKey, saveSubscription, removeSubscription, sendPush };

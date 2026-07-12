const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const { Resend } = require('resend');
const pool   = require('../config/db');

const resend = new Resend(process.env.RESEND_API_KEY);

const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';
const REFRESH_MS  = 7 * 24 * 60 * 60 * 1000;

function signAccess(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}
function signRefresh(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}

async function register(req, res) {
  const { name, email, password, phone, role } = req.body;
  const allowed  = ['customer', 'rider', 'restaurant_owner'];
  const userRole = allowed.includes(role) ? role : 'customer';

  const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.length) return res.status(409).json({ error: 'Email already registered' });

  const hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    'INSERT INTO users (name, email, password_hash, phone, role) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role',
    [name, email, hash, phone || null, userRole]
  );
  const user = rows[0];

  const accessToken  = signAccess(user);
  const refreshToken = signRefresh(user);
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1,$2,$3)',
    [user.id, refreshToken, new Date(Date.now() + REFRESH_MS)]
  );

  res.status(201).json({ accessToken, refreshToken, user });
}

async function login(req, res) {
  const { email, password } = req.body;
  const { rows } = await pool.query(
    'SELECT id, name, email, password_hash, role, is_active, avatar_url FROM users WHERE email = $1',
    [email]
  );
  const row = rows[0];
  if (!row) return res.status(401).json({ error: 'Invalid credentials' });
  if (!row.is_active) return res.status(403).json({ error: 'Account suspended' });

  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  // Check extra capabilities (restaurant / rider) — use allSettled so a missing table won't crash login
  const [rResult, rpResult] = await Promise.allSettled([
    pool.query('SELECT id FROM restaurants WHERE owner_id = $1 LIMIT 1', [row.id]),
    pool.query('SELECT user_id FROM rider_profiles WHERE user_id = $1 LIMIT 1', [row.id]),
  ]);
  const rRows  = rResult.status  === 'fulfilled' ? rResult.value.rows  : [];
  const rpRows = rpResult.status === 'fulfilled' ? rpResult.value.rows : [];

  const user = {
    id: row.id, name: row.name, email: row.email, role: row.role, avatarUrl: row.avatar_url,
    has_restaurant: rRows.length > 0,
    has_rider_profile: rpRows.length > 0,
  };
  const accessToken  = signAccess(user);
  const refreshToken = signRefresh(user);
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1,$2,$3)',
    [user.id, refreshToken, new Date(Date.now() + REFRESH_MS)]
  );

  res.json({ accessToken, refreshToken, user });
}

async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  const { rows: tokenRows } = await pool.query(
    'SELECT id FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
    [refreshToken]
  );
  if (!tokenRows.length) return res.status(401).json({ error: 'Refresh token revoked or expired' });

  const { rows: users } = await pool.query(
    'SELECT id, name, email, role FROM users WHERE id = $1', [payload.id]
  );
  const user = users[0];
  if (!user) return res.status(401).json({ error: 'User not found' });

  const newAccess = signAccess(user);
  res.json({ accessToken: newAccess });
}

async function logout(req, res) {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
  }
  res.json({ message: 'Logged out' });
}

async function me(req, res) {
  const { rows } = await pool.query(
    'SELECT id, name, email, phone, role, avatar_url, is_active, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  const [rResult, rpResult] = await Promise.allSettled([
    pool.query('SELECT id FROM restaurants WHERE owner_id = $1 LIMIT 1', [req.user.id]),
    pool.query('SELECT user_id FROM rider_profiles WHERE user_id = $1 LIMIT 1', [req.user.id]),
  ]);
  const rRows2  = rResult.status  === 'fulfilled' ? rResult.value.rows  : [];
  const rpRows2 = rpResult.status === 'fulfilled' ? rpResult.value.rows : [];
  const u = rows[0];
  res.json({ ...u, has_restaurant: rRows2.length > 0, has_rider_profile: rpRows2.length > 0 });
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const { rows } = await pool.query('SELECT id, name FROM users WHERE email = $1', [email]);
  // Always return success to prevent email enumeration
  if (!rows.length) return res.json({ message: 'If that email exists, a reset link was sent.' });

  const user  = rows[0];
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await pool.query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, token, expires]
  );

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: 'KinakanGo <onboarding@resend.dev>',
    to: email,
    subject: 'Reset your KinakanGo password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1a1a1a">Reset your password</h2>
        <p>Hi ${user.name},</p>
        <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;margin:16px 0;padding:12px 24px;background:#e8540a;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
          Reset Password
        </a>
        <p style="color:#666;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  res.json({ message: 'If that email exists, a reset link was sent.' });
}

async function resetPassword(req, res) {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const { rows } = await pool.query(
    'SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW() AND used = false',
    [token]
  );
  if (!rows.length) return res.status(400).json({ error: 'Reset link is invalid or has expired' });

  const resetRow = rows[0];
  const hash = await bcrypt.hash(password, 12);

  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, resetRow.user_id]);
  await pool.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [resetRow.id]);
  await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [resetRow.user_id]);

  res.json({ message: 'Password reset successfully. Please log in.' });
}

module.exports = { register, login, refresh, logout, me, forgotPassword, resetPassword };

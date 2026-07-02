const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db');

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

  const user = { id: row.id, name: row.name, email: row.email, role: row.role, avatarUrl: row.avatar_url };
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
  res.json(rows[0]);
}

module.exports = { register, login, refresh, logout, me };

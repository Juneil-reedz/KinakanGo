const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../config/db');

const ACCESS_TTL  = '15m';
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
  const allowed = ['customer', 'rider', 'restaurant_owner'];
  const userRole = allowed.includes(role) ? role : 'customer';

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) return res.status(409).json({ error: 'Email already registered' });

  const hash = await bcrypt.hash(password, 12);
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?,?,?,?,?)',
    [name, email, hash, phone || null, userRole]
  );

  const user = { id: result.insertId, name, email, role: userRole };
  const accessToken  = signAccess(user);
  const refreshToken = signRefresh(user);

  const expiresAt = new Date(Date.now() + REFRESH_MS);
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?,?,?)',
    [user.id, refreshToken, expiresAt]
  );

  res.status(201).json({ accessToken, refreshToken, user });
}

async function login(req, res) {
  const { email, password } = req.body;
  const [rows] = await pool.query(
    'SELECT id, name, email, password_hash, role, is_active, avatar_url FROM users WHERE email = ?',
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

  const expiresAt = new Date(Date.now() + REFRESH_MS);
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?,?,?)',
    [user.id, refreshToken, expiresAt]
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

  const [rows] = await pool.query(
    'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
    [refreshToken]
  );
  if (!rows.length) return res.status(401).json({ error: 'Refresh token revoked or expired' });

  const [users] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [payload.id]);
  const user = users[0];
  if (!user) return res.status(401).json({ error: 'User not found' });

  const newAccess = signAccess(user);
  res.json({ accessToken: newAccess });
}

async function logout(req, res) {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
  }
  res.json({ message: 'Logged out' });
}

async function me(req, res) {
  const [rows] = await pool.query(
    'SELECT id, name, email, phone, role, avatar_url, is_active, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
}

module.exports = { register, login, refresh, logout, me };

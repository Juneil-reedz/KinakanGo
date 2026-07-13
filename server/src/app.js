require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const pool         = require('./config/db');

pool.query(`
  ALTER TABLE users
    ALTER COLUMN avatar_url TYPE TEXT
`).catch(err => console.warn('users avatar_url column warning:', err.message));

// Ensure rider_profiles table exists (safe to run on every startup)
// Add GPS location columns to rider_profiles if they don't exist yet
pool.query(`
  ALTER TABLE rider_profiles
    ADD COLUMN IF NOT EXISTS current_lat          DECIMAL(10,7) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS current_lng          DECIMAL(10,7) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS location_updated_at  TIMESTAMPTZ   DEFAULT NULL
`).catch(err => console.warn('rider_profiles location columns warning:', err.message));

pool.query(`
  CREATE TABLE IF NOT EXISTS rider_profiles (
    user_id          INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    vehicle_type     VARCHAR(40)    DEFAULT NULL,
    plate_number     VARCHAR(20)    DEFAULT NULL,
    vehicle_model    VARCHAR(80)    DEFAULT NULL,
    zone             VARCHAR(80)    DEFAULT NULL,
    is_available     BOOLEAN        NOT NULL DEFAULT FALSE,
    rating           DECIMAL(3,2)   NOT NULL DEFAULT 0.00,
    total_deliveries INT            NOT NULL DEFAULT 0,
    today_deliveries INT            NOT NULL DEFAULT 0,
    total_earnings   DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    today_earnings   DECIMAL(10,2)  NOT NULL DEFAULT 0.00
  )
`).catch(err => console.warn('rider_profiles init warning:', err.message));

pool.query(`
  CREATE TABLE IF NOT EXISTS customer_favorites (
    user_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    menu_item_id INT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, menu_item_id)
  )
`).catch(err => console.warn('customer_favorites init warning:', err.message));

pool.query(`
  ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS delivery_proof_image TEXT DEFAULT NULL
`).catch(err => console.warn('orders delivery proof column warning:', err.message));

pool.query(`
  CREATE TABLE IF NOT EXISTS messages (
    id                SERIAL PRIMARY KEY,
    sender_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_user_id INT DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
    recipient_label   VARCHAR(160) NOT NULL,
    subject           VARCHAR(160) NOT NULL DEFAULT 'New message',
    body              TEXT NOT NULL,
    is_read           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`).catch(err => console.warn('messages init warning:', err.message));

pool.query(`
  CREATE TABLE IF NOT EXISTS rider_admin_requests (
    id               SERIAL PRIMARY KEY,
    rider_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_type     VARCHAR(20) NOT NULL CHECK (request_type IN ('payout','report')),
    amount           DECIMAL(10,2) DEFAULT NULL,
    period           VARCHAR(20) DEFAULT NULL,
    details          TEXT DEFAULT NULL,
    status           VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','resolved','denied')),
    resolution_notes TEXT DEFAULT NULL,
    resolved_by      INT DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
    resolved_at      TIMESTAMPTZ DEFAULT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`).catch(err => console.warn('rider_admin_requests init warning:', err.message));

const authRoutes   = require('./routes/auth');
const userRoutes   = require('./routes/users');
const restaurantRoutes = require('./routes/restaurants');
const orderRoutes  = require('./routes/orders');
const appRoutes    = require('./routes/applications');
const issueRoutes  = require('./routes/issues');
const promoRoutes  = require('./routes/promos');
const menuRoutes    = require('./routes/menu');
const upgradeRoutes = require('./routes/upgrades');
const riderRoutes   = require('./routes/riders');
const favoriteRoutes = require('./routes/favorites');
const messageRoutes = require('./routes/messages');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth',         authRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/restaurants',  restaurantRoutes);
app.use('/api/orders',       orderRoutes);
app.use('/api/applications', appRoutes);
app.use('/api/issues',       issueRoutes);
app.use('/api/promos',       promoRoutes);
app.use('/api/menu',         menuRoutes);
app.use('/api/upgrades',     upgradeRoutes);
app.use('/api/riders',       riderRoutes);
app.use('/api/favorites',    favoriteRoutes);
app.use('/api/messages',     messageRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;

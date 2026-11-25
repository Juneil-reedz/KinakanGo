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
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`).catch(err => console.warn('messages init warning:', err.message));

pool.query(`
  ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
`).catch(err => console.warn('messages updated_at column warning:', err.message));

// In-app notifications (see utils/notify.js); index runs after the table exists
pool.query(`
  CREATE TABLE IF NOT EXISTS notifications (
    id         SERIAL PRIMARY KEY,
    user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    audience   VARCHAR(12)  NOT NULL DEFAULT 'customer',
    type       VARCHAR(12)  NOT NULL DEFAULT 'info',
    title      VARCHAR(160) NOT NULL,
    message    TEXT         DEFAULT NULL,
    link       VARCHAR(200) DEFAULT NULL,
    is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )
`).then(() => pool.query(`
  -- An older, unused notifications table may already exist: bring it to this layout
  ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS audience VARCHAR(12)  NOT NULL DEFAULT 'customer',
    ADD COLUMN IF NOT EXISTS message  TEXT         DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS link     VARCHAR(200) DEFAULT NULL
`)).then(() => pool.query(`
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'body') THEN
      ALTER TABLE notifications ALTER COLUMN body DROP NOT NULL;
    END IF;
  END $$
`)).then(() => pool.query(
  'CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, audience, created_at DESC)'
)).catch(err => console.warn('notifications init warning:', err.message));

// Codes emailed to the account holder to approve an order (see orderController)
pool.query(`
  CREATE TABLE IF NOT EXISTS order_verifications (
    id         SERIAL PRIMARY KEY,
    user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code       VARCHAR(6)  NOT NULL,
    cart_hash  VARCHAR(64) NOT NULL,
    attempts   INT         NOT NULL DEFAULT 0,
    used       BOOLEAN     NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`).catch(err => console.warn('order_verifications init warning:', err.message));

// Saved addresses also keep city / province / ZIP / delivery notes
pool.query(`
  ALTER TABLE customer_addresses
    ADD COLUMN IF NOT EXISTS city     VARCHAR(120) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS province VARCHAR(120) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS zip      VARCHAR(20)  DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS notes    TEXT         DEFAULT NULL
`).catch(err => console.warn('customer_addresses columns warning:', err.message));

pool.query(`
  CREATE TABLE IF NOT EXISTS order_rider_declines (
    order_id   INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    rider_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (order_id, rider_id)
  )
`).catch(err => console.warn('order_rider_declines init warning:', err.message));

// Order problem reports: the restaurant handles them first (it holds the money);
// the customer can escalate to the admin. Older reports stay with the admin.
pool.query(`
  ALTER TABLE issues
    ADD COLUMN IF NOT EXISTS handler            VARCHAR(12) NOT NULL DEFAULT 'admin',
    ADD COLUMN IF NOT EXISTS refund_status      VARCHAR(14) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS refund_sent_note   TEXT        DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS refund_sent_at     TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS refund_received_at TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS escalated_at       TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS escalation_reason  TEXT        DEFAULT NULL
`).catch(err => console.warn('issues refund columns warning:', err.message));

// Store credit (refunds kept at the restaurant, used on a later order there)
pool.query(`
  CREATE TABLE IF NOT EXISTS store_credits (
    id            SERIAL PRIMARY KEY,
    customer_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    amount        DECIMAL(10,2) NOT NULL,
    order_id      INT DEFAULT NULL REFERENCES orders(id) ON DELETE SET NULL,
    issue_id      INT DEFAULT NULL REFERENCES issues(id) ON DELETE SET NULL,
    note          TEXT DEFAULT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`).then(() => pool.query(`
  CREATE INDEX IF NOT EXISTS idx_store_credits_owner ON store_credits(customer_id, restaurant_id)
`)).then(() => pool.query(`
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS credit_used DECIMAL(10,2) NOT NULL DEFAULT 0
`)).then(() => pool.query(`
  ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false
`)).then(() => pool.query(`
  ALTER TABLE rider_profiles
    ADD COLUMN IF NOT EXISTS gcash_number VARCHAR(30)  DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS gcash_name   VARCHAR(120) DEFAULT NULL
`)).then(() => pool.query(`
  CREATE TABLE IF NOT EXISTS rider_settlements (
    id              SERIAL PRIMARY KEY,
    restaurant_id   INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    rider_id        INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id        INT UNIQUE DEFAULT NULL REFERENCES orders(id) ON DELETE SET NULL,
    kind            VARCHAR(10) NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    delivery_fee    DECIMAL(10,2) DEFAULT NULL,
    cash_collected  DECIMAL(10,2) DEFAULT NULL,
    status          VARCHAR(10) NOT NULL DEFAULT 'done',
    reference       VARCHAR(120) DEFAULT NULL,
    note            TEXT DEFAULT NULL,
    disputed_reason TEXT DEFAULT NULL,
    created_by      INT DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at    TIMESTAMPTZ DEFAULT NULL
  )
`)).then(() => pool.query(`
  CREATE INDEX IF NOT EXISTS idx_rider_settlements_pair ON rider_settlements (restaurant_id, rider_id)
`)).then(() => pool.query(`
  ALTER TABLE issues
    ADD COLUMN IF NOT EXISTS refund_method VARCHAR(10) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS payment_check BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS refund_gcash  VARCHAR(30) DEFAULT NULL
`)).catch(err => console.warn('store credit init warning:', err.message));

pool.query(`
  ALTER TABLE promo_codes
    ADD COLUMN IF NOT EXISTS owner_id     INT          DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS max_discount DECIMAL(8,2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS target_users VARCHAR(10)  NOT NULL DEFAULT 'all'
`).then(() => pool.query(`
  ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rider_rating SMALLINT DEFAULT NULL
`)).catch(err => console.warn('promo_codes columns warning:', err.message));

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

// Order ratings: food + restaurant stars per delivered order
pool.query(`
  CREATE TABLE IF NOT EXISTS reviews (
    id                SERIAL PRIMARY KEY,
    order_id          INT NOT NULL UNIQUE REFERENCES orders(id),
    customer_id       INT NOT NULL REFERENCES users(id),
    restaurant_id     INT NOT NULL REFERENCES restaurants(id),
    rider_id          INT DEFAULT NULL REFERENCES users(id),
    food_rating       SMALLINT NOT NULL CHECK (food_rating BETWEEN 1 AND 5),
    restaurant_rating SMALLINT DEFAULT NULL CHECK (restaurant_rating BETWEEN 1 AND 5),
    rider_rating      SMALLINT DEFAULT NULL,
    comment           TEXT DEFAULT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`).then(() => pool.query(`
  ALTER TABLE reviews ADD COLUMN IF NOT EXISTS restaurant_rating SMALLINT DEFAULT NULL CHECK (restaurant_rating BETWEEN 1 AND 5)
`)).then(() => pool.query(`
  CREATE TABLE IF NOT EXISTS order_item_ratings (
    order_id     INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    customer_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (order_id, menu_item_id)
  )
`)).then(() => pool.query(`
  ALTER TABLE menu_items
    ADD COLUMN IF NOT EXISTS avg_rating   DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS rating_count INT          NOT NULL DEFAULT 0
`)).catch(err => console.warn('reviews init warning:', err.message));

const authRoutes   = require('./routes/auth');
const userRoutes   = require('./routes/users');
const restaurantRoutes = require('./routes/restaurants');
const orderRoutes  = require('./routes/orders');
const appRoutes    = require('./routes/applications');
const issueRoutes  = require('./routes/issues');
const storeCreditRoutes = require('./routes/storeCredit');
const promoRoutes  = require('./routes/promos');
const menuRoutes    = require('./routes/menu');
const upgradeRoutes = require('./routes/upgrades');
const riderRoutes   = require('./routes/riders');
const favoriteRoutes = require('./routes/favorites');
const messageRoutes = require('./routes/messages');
const imageRoutes   = require('./routes/images');
const addressRoutes = require('./routes/addresses');
const notificationRoutes = require('./routes/notifications');
const riderPayRoutes = require('./routes/riderPay');

const app = express();

// Render terminates TLS at its proxy; trust it so req.protocol reports https
app.set('trust proxy', 1);

app.use(helmet());
// CLIENT_URL: one or more allowed web addresses, comma separated. A "*" in an
// entry matches any text, so https://kinakan-go*.vercel.app also lets Vercel's
// preview links in. Unset means any site may call the API.
const allowedOrigins = (process.env.CLIENT_URL || '').split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
const originRules = allowedOrigins.map(o => new RegExp('^' + o.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$'));
app.use(cors({
  origin: allowedOrigins.length
    ? (origin, cb) => cb(null, !origin || originRules.some(r => r.test(origin)))
    : '*',
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
app.use('/api/store-credit', storeCreditRoutes);
app.use('/api/promos',       promoRoutes);
app.use('/api/menu',         menuRoutes);
app.use('/api/upgrades',     upgradeRoutes);
app.use('/api/riders',       riderRoutes);
app.use('/api/favorites',    favoriteRoutes);
app.use('/api/messages',     messageRoutes);
app.use('/api/images',       imageRoutes);
app.use('/api/addresses',    addressRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/rider-pay',    riderPayRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;

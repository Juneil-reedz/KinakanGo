-- KinakanGo PostgreSQL Schema (Supabase)
-- Run this in Supabase → SQL Editor → New Query → Run

-- ─── AUTO-UPDATE TRIGGER ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ─── USERS ───────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(191)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  phone         VARCHAR(30)   DEFAULT NULL,
  role          VARCHAR(20)   NOT NULL DEFAULT 'customer'
                CHECK (role IN ('customer','rider','restaurant_owner','admin')),
  avatar_url    TEXT          DEFAULT NULL,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  ban_reason    TEXT          DEFAULT NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE customer_addresses (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label      VARCHAR(60)  NOT NULL DEFAULT 'Home',
  address    TEXT         NOT NULL,
  lat        DECIMAL(10,7) DEFAULT NULL,
  lng        DECIMAL(10,7) DEFAULT NULL,
  is_default BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── REFRESH TOKENS ──────────────────────────────────────────────────────────

CREATE TABLE refresh_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ  NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── RESTAURANTS ─────────────────────────────────────────────────────────────

CREATE TABLE restaurants (
  id           SERIAL PRIMARY KEY,
  owner_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(160) NOT NULL,
  description  TEXT         DEFAULT NULL,
  address      TEXT         NOT NULL,
  lat          DECIMAL(10,7) DEFAULT NULL,
  lng          DECIMAL(10,7) DEFAULT NULL,
  phone        VARCHAR(30)  DEFAULT NULL,
  email        VARCHAR(191) DEFAULT NULL,
  cuisine      VARCHAR(80)  DEFAULT NULL,
  image_url    VARCHAR(500) DEFAULT NULL,
  cover_url    VARCHAR(500) DEFAULT NULL,
  is_open      BOOLEAN      NOT NULL DEFAULT TRUE,
  is_approved  BOOLEAN      NOT NULL DEFAULT FALSE,
  rating       DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  review_count INT          NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  min_order    DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_restaurants_updated_at BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE restaurant_hours (
  id            SERIAL PRIMARY KEY,
  restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  day_of_week   SMALLINT     NOT NULL,
  open_time     TIME         DEFAULT NULL,
  close_time    TIME         DEFAULT NULL,
  is_closed     BOOLEAN      NOT NULL DEFAULT FALSE
);

-- ─── MENU ────────────────────────────────────────────────────────────────────

CREATE TABLE menu_categories (
  id            SERIAL PRIMARY KEY,
  restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          VARCHAR(80)  NOT NULL,
  sort_order    INT          NOT NULL DEFAULT 0
);

CREATE TABLE menu_items (
  id             SERIAL PRIMARY KEY,
  restaurant_id  INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id    INT DEFAULT NULL REFERENCES menu_categories(id) ON DELETE SET NULL,
  name           VARCHAR(160) NOT NULL,
  description    TEXT         DEFAULT NULL,
  price          DECIMAL(8,2) NOT NULL,
  image_url      VARCHAR(500) DEFAULT NULL,
  is_available   BOOLEAN      NOT NULL DEFAULT TRUE,
  is_vegetarian  BOOLEAN      NOT NULL DEFAULT FALSE,
  prep_time_mins INT          NOT NULL DEFAULT 15,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_menu_items_updated_at BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── ORDERS ──────────────────────────────────────────────────────────────────

CREATE TABLE orders (
  id                   SERIAL PRIMARY KEY,
  customer_id          INT NOT NULL REFERENCES users(id),
  restaurant_id        INT NOT NULL REFERENCES restaurants(id),
  rider_id             INT DEFAULT NULL REFERENCES users(id),
  status               VARCHAR(20) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','accepted','preparing','ready','picked_up','delivered','cancelled','refunded')),
  delivery_address     TEXT        NOT NULL,
  delivery_lat         DECIMAL(10,7) DEFAULT NULL,
  delivery_lng         DECIMAL(10,7) DEFAULT NULL,
  special_instructions TEXT        DEFAULT NULL,
  subtotal             DECIMAL(8,2) NOT NULL,
  delivery_fee         DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  tax                  DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  total                DECIMAL(8,2) NOT NULL,
  payment_method       VARCHAR(10) NOT NULL DEFAULT 'cash'
                       CHECK (payment_method IN ('online','cash','card')),
  payment_status       VARCHAR(10) NOT NULL DEFAULT 'pending'
                       CHECK (payment_status IN ('pending','paid','refunded')),
  transaction_id       VARCHAR(100) DEFAULT NULL,
  estimated_delivery   TIMESTAMPTZ  DEFAULT NULL,
  delivered_at         TIMESTAMPTZ  DEFAULT NULL,
  cancelled_reason     TEXT         DEFAULT NULL,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE order_items (
  id           SERIAL PRIMARY KEY,
  order_id     INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INT NOT NULL REFERENCES menu_items(id),
  name         VARCHAR(160) NOT NULL,
  price        DECIMAL(8,2) NOT NULL,
  quantity     INT          NOT NULL DEFAULT 1,
  notes        TEXT         DEFAULT NULL
);

-- ─── RIDERS ──────────────────────────────────────────────────────────────────

CREATE TABLE rider_profiles (
  user_id          INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type     VARCHAR(40)   DEFAULT NULL,
  plate_number     VARCHAR(20)   DEFAULT NULL,
  vehicle_model    VARCHAR(80)   DEFAULT NULL,
  zone             VARCHAR(80)   DEFAULT NULL,
  is_available     BOOLEAN       NOT NULL DEFAULT FALSE,
  rating           DECIMAL(3,2)  NOT NULL DEFAULT 0.00,
  total_deliveries INT           NOT NULL DEFAULT 0,
  today_deliveries INT           NOT NULL DEFAULT 0,
  total_earnings   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  today_earnings   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  bank_name        VARCHAR(80)   DEFAULT NULL,
  account_number   VARCHAR(40)   DEFAULT NULL,
  account_name     VARCHAR(120)  DEFAULT NULL
);

-- ─── APPLICATIONS ────────────────────────────────────────────────────────────

CREATE TABLE applications (
  id            SERIAL PRIMARY KEY,
  user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          VARCHAR(10)  NOT NULL CHECK (type IN ('rider','restaurant')),
  status        VARCHAR(10)  NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected')),
  data          JSONB        NOT NULL,
  reject_reason TEXT         DEFAULT NULL,
  reviewed_by   INT DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at   TIMESTAMPTZ  DEFAULT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── PROMO CODES ─────────────────────────────────────────────────────────────

CREATE TABLE promo_codes (
  id             SERIAL PRIMARY KEY,
  code           VARCHAR(30)  NOT NULL UNIQUE,
  description    VARCHAR(255) DEFAULT NULL,
  discount_type  VARCHAR(10)  NOT NULL DEFAULT 'percent'
                 CHECK (discount_type IN ('percent','fixed')),
  discount_value DECIMAL(8,2) NOT NULL,
  min_order      DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  max_uses       INT          DEFAULT NULL,
  used_count     INT          NOT NULL DEFAULT 0,
  is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
  starts_at      TIMESTAMPTZ  DEFAULT NULL,
  expires_at     TIMESTAMPTZ  DEFAULT NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── ISSUES ──────────────────────────────────────────────────────────────────

CREATE TABLE issues (
  id               SERIAL PRIMARY KEY,
  order_id         INT NOT NULL REFERENCES orders(id),
  customer_id      INT NOT NULL REFERENCES users(id),
  type             VARCHAR(10)  NOT NULL
                   CHECK (type IN ('refund','quality','payment','rider','missing')),
  priority         VARCHAR(10)  NOT NULL DEFAULT 'medium'
                   CHECK (priority IN ('low','medium','high')),
  description      TEXT         NOT NULL,
  status           VARCHAR(10)  NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','resolved','denied')),
  refund_requested DECIMAL(8,2) DEFAULT NULL,
  refund_approved  DECIMAL(8,2) DEFAULT NULL,
  resolution_notes TEXT         DEFAULT NULL,
  resolved_by      INT DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  resolved_at      TIMESTAMPTZ  DEFAULT NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_issues_updated_at BEFORE UPDATE ON issues
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── REVIEWS ─────────────────────────────────────────────────────────────────

CREATE TABLE reviews (
  id            SERIAL PRIMARY KEY,
  order_id      INT NOT NULL UNIQUE REFERENCES orders(id),
  customer_id   INT NOT NULL REFERENCES users(id),
  restaurant_id INT NOT NULL REFERENCES restaurants(id),
  rider_id      INT DEFAULT NULL REFERENCES users(id),
  food_rating   SMALLINT     NOT NULL CHECK (food_rating BETWEEN 1 AND 5),
  rider_rating  SMALLINT     DEFAULT NULL,
  comment       TEXT         DEFAULT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── FAVORITES ───────────────────────────────────────────────────────────────

CREATE TABLE favorites (
  user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, restaurant_id)
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

CREATE TABLE notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(160) NOT NULL,
  body       TEXT         NOT NULL,
  type       VARCHAR(40)  NOT NULL DEFAULT 'info',
  is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
  meta       JSONB        DEFAULT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_orders_customer    ON orders(customer_id);
CREATE INDEX idx_orders_restaurant  ON orders(restaurant_id);
CREATE INDEX idx_orders_rider       ON orders(rider_id);
CREATE INDEX idx_orders_status      ON orders(status);
CREATE INDEX idx_menu_restaurant    ON menu_items(restaurant_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_issues_status      ON issues(status);

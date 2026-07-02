-- KinakanGo Database Schema
-- Run once against a fresh MySQL database

CREATE DATABASE IF NOT EXISTS kinakango CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kinakango;

-- ─── USERS ───────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(191)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  phone         VARCHAR(30)   DEFAULT NULL,
  role          ENUM('customer','rider','restaurant_owner','admin') NOT NULL DEFAULT 'customer',
  avatar_url    VARCHAR(500)  DEFAULT NULL,
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  ban_reason    TEXT          DEFAULT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Saved delivery addresses per customer
CREATE TABLE customer_addresses (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  label      VARCHAR(60)  NOT NULL DEFAULT 'Home',  -- Home / Work / Other
  address    TEXT         NOT NULL,
  lat        DECIMAL(10,7) DEFAULT NULL,
  lng        DECIMAL(10,7) DEFAULT NULL,
  is_default TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── REFRESH TOKENS ──────────────────────────────────────────────────────────

CREATE TABLE refresh_tokens (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  token      VARCHAR(500) NOT NULL UNIQUE,
  expires_at DATETIME     NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── RESTAURANTS ─────────────────────────────────────────────────────────────

CREATE TABLE restaurants (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner_id     INT UNSIGNED NOT NULL,
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
  is_open      TINYINT(1)   NOT NULL DEFAULT 1,
  is_approved  TINYINT(1)   NOT NULL DEFAULT 0,
  rating       DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  review_count INT UNSIGNED NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  min_order    DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE restaurant_hours (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT UNSIGNED NOT NULL,
  day_of_week   TINYINT      NOT NULL,  -- 0=Sun … 6=Sat
  open_time     TIME         DEFAULT NULL,
  close_time    TIME         DEFAULT NULL,
  is_closed     TINYINT(1)   NOT NULL DEFAULT 0,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── MENU ────────────────────────────────────────────────────────────────────

CREATE TABLE menu_categories (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT UNSIGNED NOT NULL,
  name          VARCHAR(80)  NOT NULL,
  sort_order    INT          NOT NULL DEFAULT 0,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE menu_items (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  restaurant_id   INT UNSIGNED NOT NULL,
  category_id     INT UNSIGNED DEFAULT NULL,
  name            VARCHAR(160) NOT NULL,
  description     TEXT         DEFAULT NULL,
  price           DECIMAL(8,2) NOT NULL,
  image_url       VARCHAR(500) DEFAULT NULL,
  is_available    TINYINT(1)   NOT NULL DEFAULT 1,
  is_vegetarian   TINYINT(1)   NOT NULL DEFAULT 0,
  prep_time_mins  INT          NOT NULL DEFAULT 15,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id)   REFERENCES menu_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── ORDERS ──────────────────────────────────────────────────────────────────

CREATE TABLE orders (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id          INT UNSIGNED NOT NULL,
  restaurant_id        INT UNSIGNED NOT NULL,
  rider_id             INT UNSIGNED DEFAULT NULL,
  status               ENUM('pending','accepted','preparing','ready','picked_up','delivered','cancelled','refunded')
                       NOT NULL DEFAULT 'pending',
  delivery_address     TEXT         NOT NULL,
  delivery_lat         DECIMAL(10,7) DEFAULT NULL,
  delivery_lng         DECIMAL(10,7) DEFAULT NULL,
  special_instructions TEXT         DEFAULT NULL,
  subtotal             DECIMAL(8,2) NOT NULL,
  delivery_fee         DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  tax                  DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  total                DECIMAL(8,2) NOT NULL,
  payment_method       ENUM('online','cash','card') NOT NULL DEFAULT 'cash',
  payment_status       ENUM('pending','paid','refunded') NOT NULL DEFAULT 'pending',
  transaction_id       VARCHAR(100) DEFAULT NULL,
  estimated_delivery   DATETIME     DEFAULT NULL,
  delivered_at         DATETIME     DEFAULT NULL,
  cancelled_reason     TEXT         DEFAULT NULL,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id)  REFERENCES users(id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  FOREIGN KEY (rider_id)     REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id    INT UNSIGNED NOT NULL,
  menu_item_id INT UNSIGNED NOT NULL,
  name        VARCHAR(160) NOT NULL,  -- snapshot at time of order
  price       DECIMAL(8,2) NOT NULL,  -- snapshot
  quantity    INT UNSIGNED NOT NULL DEFAULT 1,
  notes       TEXT         DEFAULT NULL,
  FOREIGN KEY (order_id)     REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
) ENGINE=InnoDB;

-- ─── RIDERS ──────────────────────────────────────────────────────────────────

CREATE TABLE rider_profiles (
  user_id          INT UNSIGNED PRIMARY KEY,
  vehicle_type     VARCHAR(40)  DEFAULT NULL,
  plate_number     VARCHAR(20)  DEFAULT NULL,
  vehicle_model    VARCHAR(80)  DEFAULT NULL,
  zone             VARCHAR(80)  DEFAULT NULL,
  is_available     TINYINT(1)   NOT NULL DEFAULT 0,
  rating           DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  total_deliveries INT UNSIGNED NOT NULL DEFAULT 0,
  today_deliveries INT UNSIGNED NOT NULL DEFAULT 0,
  total_earnings   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  today_earnings   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  bank_name        VARCHAR(80)  DEFAULT NULL,
  account_number   VARCHAR(40)  DEFAULT NULL,
  account_name     VARCHAR(120) DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── APPLICATIONS ────────────────────────────────────────────────────────────

CREATE TABLE applications (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL,
  type         ENUM('rider','restaurant') NOT NULL,
  status       ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  data         JSON         NOT NULL,  -- full form payload
  reject_reason TEXT        DEFAULT NULL,
  reviewed_by  INT UNSIGNED DEFAULT NULL,
  reviewed_at  DATETIME     DEFAULT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── PROMO CODES ─────────────────────────────────────────────────────────────

CREATE TABLE promo_codes (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code            VARCHAR(30)  NOT NULL UNIQUE,
  description     VARCHAR(255) DEFAULT NULL,
  discount_type   ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
  discount_value  DECIMAL(8,2) NOT NULL,
  min_order       DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  max_uses        INT UNSIGNED DEFAULT NULL,
  used_count      INT UNSIGNED NOT NULL DEFAULT 0,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  starts_at       DATETIME     DEFAULT NULL,
  expires_at      DATETIME     DEFAULT NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── ISSUES / REFUND REQUESTS ────────────────────────────────────────────────

CREATE TABLE issues (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id        INT UNSIGNED NOT NULL,
  customer_id     INT UNSIGNED NOT NULL,
  type            ENUM('refund','quality','payment','rider','missing') NOT NULL,
  priority        ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  description     TEXT         NOT NULL,
  status          ENUM('pending','resolved','denied') NOT NULL DEFAULT 'pending',
  refund_requested DECIMAL(8,2) DEFAULT NULL,
  refund_approved  DECIMAL(8,2) DEFAULT NULL,
  resolution_notes TEXT        DEFAULT NULL,
  resolved_by     INT UNSIGNED DEFAULT NULL,
  resolved_at     DATETIME     DEFAULT NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id)    REFERENCES orders(id),
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── REVIEWS ─────────────────────────────────────────────────────────────────

CREATE TABLE reviews (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id      INT UNSIGNED NOT NULL UNIQUE,
  customer_id   INT UNSIGNED NOT NULL,
  restaurant_id INT UNSIGNED NOT NULL,
  rider_id      INT UNSIGNED DEFAULT NULL,
  food_rating   TINYINT      NOT NULL,   -- 1-5
  rider_rating  TINYINT      DEFAULT NULL,
  comment       TEXT         DEFAULT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id)      REFERENCES orders(id),
  FOREIGN KEY (customer_id)   REFERENCES users(id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  FOREIGN KEY (rider_id)      REFERENCES users(id)
) ENGINE=InnoDB;

-- ─── FAVORITES ───────────────────────────────────────────────────────────────

CREATE TABLE favorites (
  user_id       INT UNSIGNED NOT NULL,
  restaurant_id INT UNSIGNED NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, restaurant_id),
  FOREIGN KEY (user_id)       REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

CREATE TABLE notifications (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  title      VARCHAR(160) NOT NULL,
  body       TEXT         NOT NULL,
  type       VARCHAR(40)  NOT NULL DEFAULT 'info',  -- info | order | promo | system
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  meta       JSON         DEFAULT NULL,             -- e.g. { orderId: 123 }
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_orders_customer    ON orders(customer_id);
CREATE INDEX idx_orders_restaurant  ON orders(restaurant_id);
CREATE INDEX idx_orders_rider       ON orders(rider_id);
CREATE INDEX idx_orders_status      ON orders(status);
CREATE INDEX idx_menu_restaurant    ON menu_items(restaurant_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_issues_status      ON issues(status);

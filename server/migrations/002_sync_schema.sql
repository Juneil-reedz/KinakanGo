-- KinakanGo: bring an EXISTING database in line with what the server code expects.
-- Safe to run more than once: every statement checks before it changes anything.
-- New databases don't need this; 001_init.sql already includes all of it.
-- Run in Supabase → SQL Editor → New Query → Run

-- Orders: GCash payment proof + rider delivery photo, and allow 'gcash' as a payment method
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS proof_image          TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS delivery_proof_image TEXT DEFAULT NULL;

DO $$
DECLARE c record;
BEGIN
  -- drop whichever CHECK currently limits payment_method, then add the full list
  FOR c IN
    SELECT con.conname FROM pg_constraint con
    WHERE con.conrelid = 'orders'::regclass AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%payment_method%'
  LOOP
    EXECUTE format('ALTER TABLE orders DROP CONSTRAINT %I', c.conname);
  END LOOP;
  ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
    CHECK (payment_method IN ('online','cash','card','gcash'));
END $$;

-- Restaurants: where customers send GCash payments
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS gcash_number VARCHAR(30)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gcash_name   VARCHAR(120) DEFAULT NULL;

-- Riders: live GPS for order tracking
ALTER TABLE rider_profiles
  ADD COLUMN IF NOT EXISTS current_lat         DECIMAL(10,7) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS current_lng         DECIMAL(10,7) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ   DEFAULT NULL;

-- Promo codes created by restaurant owners
ALTER TABLE promo_codes
  ADD COLUMN IF NOT EXISTS owner_id INT DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL;

-- Saved address details
ALTER TABLE customer_addresses
  ADD COLUMN IF NOT EXISTS city     VARCHAR(120) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS province VARCHAR(120) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS zip      VARCHAR(20)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notes    TEXT         DEFAULT NULL;

-- Favorites by menu item (the code uses this, not the old restaurant-based "favorites")
CREATE TABLE IF NOT EXISTS customer_favorites (
  user_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  menu_item_id INT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, menu_item_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id                SERIAL PRIMARY KEY,
  sender_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_user_id INT DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  recipient_label   VARCHAR(160) NOT NULL,
  subject           VARCHAR(160) NOT NULL DEFAULT 'New message',
  body              TEXT         NOT NULL,
  is_read           BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Account upgrade requests (customer → restaurant owner / rider)
CREATE TABLE IF NOT EXISTS upgrade_requests (
  id               SERIAL PRIMARY KEY,
  user_id          INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan             VARCHAR(80)   NOT NULL,
  amount           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payment_method   VARCHAR(20)   NOT NULL DEFAULT 'none',
  reference_number VARCHAR(100)  DEFAULT NULL,
  proof_image      TEXT          DEFAULT NULL,
  notes            TEXT          DEFAULT NULL,
  status           VARCHAR(10)   NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected')),
  admin_note       TEXT          DEFAULT NULL,
  reviewed_by      INT DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at      TIMESTAMPTZ   DEFAULT NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
-- If the table already existed with fewer columns, add what the code reads/writes
ALTER TABLE upgrade_requests
  ADD COLUMN IF NOT EXISTS amount           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS payment_method   VARCHAR(20)   NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS proof_image      TEXT          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notes            TEXT          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS admin_note       TEXT          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reviewed_by      INT DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at      TIMESTAMPTZ   DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_user ON upgrade_requests(user_id, status);

-- Notifications: the newer layout (audience / message / link)
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS audience VARCHAR(12)  NOT NULL DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS message  TEXT         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS link     VARCHAR(200) DEFAULT NULL;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'notifications' AND column_name = 'body') THEN
    ALTER TABLE notifications ALTER COLUMN body DROP NOT NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, audience, created_at DESC);

-- The old restaurant-based "favorites" table is no longer used. It is left in place
-- so no data is lost; drop it yourself once you've confirmed it's empty:
--   DROP TABLE IF EXISTS favorites;

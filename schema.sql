-- ═══════════════════════════════════════════════════════════════
-- Print Vatika — Supabase Database Schema
-- Paste this entire file into your Supabase SQL Editor and run it.
-- Dashboard → SQL Editor → New query → paste → Run
-- ═══════════════════════════════════════════════════════════════

-- ── 1. ORDERS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT NOT NULL,
  fulfillment TEXT NOT NULL DEFAULT 'pickup',
  address     TEXT,
  notes       TEXT,
  items       JSONB NOT NULL DEFAULT '[]',
  subtotal    INTEGER NOT NULL DEFAULT 0,
  delivery    INTEGER NOT NULL DEFAULT 0,
  total       INTEGER NOT NULL DEFAULT 0,
  payment     TEXT NOT NULL DEFAULT 'PENDING',
  status      TEXT NOT NULL DEFAULT 'PAYMENT_PENDING',
  utr         TEXT,
  user_id     UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. ORDER HISTORY ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_history (
  id         BIGSERIAL PRIMARY KEY,
  order_id   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     TEXT NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. PRODUCTS (admin-editable) ──────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id            TEXT PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'other',
  description   TEXT,
  image         TEXT,
  base_price    INTEGER NOT NULL DEFAULT 0,
  base_unit     TEXT NOT NULL DEFAULT '/ piece',
  options       JSONB NOT NULL DEFAULT '[]',
  quantities    JSONB NOT NULL DEFAULT '[1]',
  qty_discounts JSONB NOT NULL DEFAULT '{}',
  default_qty   INTEGER NOT NULL DEFAULT 1,
  active        BOOLEAN NOT NULL DEFAULT true,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. STORE SETTINGS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  label      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings      ENABLE ROW LEVEL SECURITY;

-- Orders: customers can insert + read, admin can update
DROP POLICY IF EXISTS "orders_insert" ON orders;
DROP POLICY IF EXISTS "orders_select" ON orders;
DROP POLICY IF EXISTS "orders_update" ON orders;
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_select" ON orders FOR SELECT USING (true);
CREATE POLICY "orders_update" ON orders FOR UPDATE USING (true);

-- Order history
DROP POLICY IF EXISTS "history_insert" ON order_history;
DROP POLICY IF EXISTS "history_select" ON order_history;
CREATE POLICY "history_insert" ON order_history FOR INSERT WITH CHECK (true);
CREATE POLICY "history_select" ON order_history FOR SELECT USING (true);

-- Products: anyone reads, admin writes
DROP POLICY IF EXISTS "products_select" ON products;
DROP POLICY IF EXISTS "products_all"    ON products;
CREATE POLICY "products_select" ON products FOR SELECT USING (true);
CREATE POLICY "products_all"    ON products FOR ALL    USING (true);

-- Settings
DROP POLICY IF EXISTS "settings_all" ON settings;
CREATE POLICY "settings_all" ON settings FOR ALL USING (true);

-- ═══════════════════════════════════════════════════════════════
-- AUTO-UPDATE updated_at TRIGGER
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_touch   ON orders;
DROP TRIGGER IF EXISTS products_touch ON products;
CREATE TRIGGER orders_touch   BEFORE UPDATE ON orders   FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER products_touch BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- SEED DEFAULT SETTINGS
-- ═══════════════════════════════════════════════════════════════

INSERT INTO settings (key, value, label) VALUES
  ('shop_name',      'Print Vatika',                                            'Shop Name'),
  ('upi_id',         '09811427517@oksbi',                                         'UPI ID'),
  ('phone',          '09811427517',                                               'Phone Number'),
  ('whatsapp',       '919811427517',                                              'WhatsApp (with country code, no +)'),
  ('address',        'F-298, Himmat Singh Marg, Near Saket Metro, Lado Sarai, New Delhi – 110030', 'Shop Address'),
  ('hours_weekday',  'Mon–Sat: 9 AM – 8 PM',                                     'Weekday Hours'),
  ('hours_weekend',  'Sunday: 10 AM – 5 PM',                                     'Weekend Hours'),
  ('gst_number',     '07AAAAA0000A1Z5',                                           'GST Number')
ON CONFLICT (key) DO NOTHING;

-- The admin password is deliberately not in this file: the file is public, so it
-- must not carry the shop's password. Set it once, in the Supabase SQL editor,
-- before the first admin login:
--
--   INSERT INTO settings (key, value, label)
--   VALUES ('admin_password', 'choose-a-password', 'Admin Password')
--   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
--
-- After that, change it from the admin panel (Settings). Until one is set, both
-- the site's admin login and the storefront's refuse every password — including
-- a blank one — rather than opening the dashboard.

-- ═══════════════════════════════════════════════════════════════
-- REALTIME (enable for orders table)
-- Run this to enable real-time subscriptions in admin
-- ═══════════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Migration helper for existing tables
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID;

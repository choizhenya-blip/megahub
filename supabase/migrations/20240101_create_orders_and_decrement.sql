-- ============================================================
-- MegaHub — Order Storage & Stock Decrement
-- Run once in Supabase SQL Editor (Dashboard → SQL Editor → New query)
--
-- NOTE: Uses `shop_orders` because a pre-existing `orders` table with a
--       different schema already exists in this project.
-- ============================================================

-- ── 1. shop_orders table ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.shop_orders (
  id               uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz    NOT NULL DEFAULT now(),
  customer_name    text           NOT NULL,
  customer_phone   text           NOT NULL,
  customer_address text,
  -- Array of { id, sku, title_ru, qty, price }
  items            jsonb          NOT NULL DEFAULT '[]'::jsonb,
  total_price      numeric(12, 2) NOT NULL,
  -- Per-item free-text comments; keyed by SKU (e.g. "MH-ALG-10": "нужно 60")
  more_comments    jsonb,
  status           text           NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'confirmed', 'shipped', 'cancelled'))
);

-- Index for manager dashboard queries
CREATE INDEX IF NOT EXISTS shop_orders_created_at_idx ON public.shop_orders (created_at DESC);
CREATE INDEX IF NOT EXISTS shop_orders_status_idx     ON public.shop_orders (status);

-- ── 2. Row-Level Security ────────────────────────────────────
-- Service role bypasses RLS automatically.
-- Allow anon/authenticated to INSERT (for server routes using anon key).

ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_orders_insert" ON public.shop_orders;
CREATE POLICY "shop_orders_insert"
  ON public.shop_orders
  FOR INSERT
  WITH CHECK (true);   -- anyone can insert (server-side route validates data)

-- Only service role / authenticated admin can SELECT / UPDATE / DELETE
DROP POLICY IF EXISTS "shop_orders_service_all" ON public.shop_orders;
CREATE POLICY "shop_orders_service_all"
  ON public.shop_orders
  FOR ALL
  USING (auth.role() = 'service_role');

-- ── 3. Reload PostgREST schema cache ─────────────────────────
SELECT pg_notify('pgrst', 'reload schema');

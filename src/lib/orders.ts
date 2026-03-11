/**
 * Orders service — saves confirmed orders to `public.orders` in Supabase.
 * Server-side only.
 *
 * Requires migration: supabase/migrations/20240101_create_orders.sql
 */

import { createClient } from "@supabase/supabase-js";

// ── Types ────────────────────────────────────────────────────

export interface OrderLineItem {
  /** Supabase book id */
  id: string;
  /** Article number / SKU for 1C sync */
  sku: string;
  /** Russian title — canonical for all CRM / 1C integrations */
  title_ru: string;
  qty: number;
  price: number;
}

export type OrderCategory = "B2C" | "B2B/B2G";

export interface InsertOrderPayload {
  customer_name: string;
  customer_phone: string;
  customer_address?: string | null;
  items: OrderLineItem[];
  total_price: number;
  /** Per-item free-text comments; keyed by SKU */
  more_comments?: Record<string, string> | null;
  category: OrderCategory;
}

// ── Helpers ──────────────────────────────────────────────────

function makeServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Service role key bypasses RLS — preferred for server-side writes
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("[orders] Missing Supabase env vars (URL or key).");
  }
  return createClient(url, key);
}

// ── Public API ───────────────────────────────────────────────

/**
 * Inserts an order row into `public.orders`.
 * Returns the new order UUID on success, or `null` on failure (logs the error).
 */
export async function insertOrder(
  payload: InsertOrderPayload
): Promise<string | null> {
  console.log("[orders] 📝 Inserting order into Supabase:", {
    customer_name: payload.customer_name,
    customer_phone: payload.customer_phone,
    items_count: payload.items.length,
    total_price: payload.total_price,
    items: payload.items.map((i) => `[${i.sku}] ${i.title_ru} ×${i.qty}`),
  });

  const sb = makeServerClient();

  const { data, error } = await sb
    .from("shop_orders")
    .insert({
      customer_name: payload.customer_name,
      customer_phone: payload.customer_phone,
      customer_address: payload.customer_address ?? null,
      items: payload.items,          // stored as JSONB
      total_price: payload.total_price,
      more_comments: payload.more_comments ?? null,
      category: payload.category,
      status: "new",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[orders] ❌ Insert failed:", error.code, error.message);
    if (error.hint) console.error("[orders]    Hint:", error.hint);
    return null;
  }

  console.log("[orders] ✅ Order saved. id =", data.id);
  return data.id as string;
}

/** UUID v4 shape — Supabase PKs are always UUIDs; mock IDs like "1" are not. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Decrements `stock_count` for a list of items directly via UPDATE.
 * Skips items whose id is not a valid UUID (mock / demo data).
 */
export async function decrementStock(
  items: Pick<OrderLineItem, "id" | "qty">[]
): Promise<void> {
  if (!items.length) return;

  // Filter to real UUIDs only — mock IDs like "1" cause a DB type error
  const realItems = items.filter((i) => UUID_RE.test(i.id));

  if (!realItems.length) {
    console.log("[orders] ℹ️  All item IDs are mock/non-UUID — skipping stock decrement.");
    return;
  }

  console.log(
    "[orders] 📦 Decrementing stock for",
    realItems.map((i) => `${i.id} -${i.qty}`).join(", ")
  );

  const sb = makeServerClient();

  // 1. Fetch current stock for all affected books in one query
  const ids = realItems.map((i) => i.id);
  const { data: books, error: fetchErr } = await sb
    .from("books")
    .select("id, stock_count")
    .in("id", ids);

  if (fetchErr) {
    console.error("[orders] ❌ Failed to fetch stock for decrement:", fetchErr.message);
    return;
  }

  // 2. Update each book with GREATEST(0, current - qty)
  const updates = (books ?? []).map((book) => {
    const ordered = realItems.find((i) => i.id === book.id);
    if (!ordered) return Promise.resolve();
    const newStock = Math.max(0, (book.stock_count ?? 0) - ordered.qty);
    console.log(
      `[orders]   book ${book.id}: ${book.stock_count} → ${newStock}`
    );
    return sb
      .from("books")
      .update({ stock_count: newStock })
      .eq("id", book.id)
      .then(({ error }) => {
        if (error) {
          console.error(
            `[orders] ❌ Stock update failed for ${book.id}:`,
            error.message
          );
        }
      });
  });

  await Promise.allSettled(updates);
  console.log("[orders] ✅ Stock decrement complete.");
}

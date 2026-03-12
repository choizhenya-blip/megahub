import { NextRequest, NextResponse } from "next/server";
import { buildBitrixLead, BitrixOrderPayload } from "@/lib/bitrix";
import { sendTrelloNotification } from "@/lib/notifications";
import { insertOrder, decrementStock, type OrderLineItem } from "@/lib/orders";
import { sendNewOrderNotification } from "@/lib/telegram";

// ── Types ────────────────────────────────────────────────────

interface IncomingItem {
  id: string;
  sku: string;
  titleRu: string;
  price: number;
  qty: number;
}

interface OrderBody {
  name: string;
  phone: string;
  address?: string;
  items: IncomingItem[];
  totalPrice: number;
  moreComments?: Record<string, string>; // keyed by SKU
  category?: "B2C" | "B2B/B2G";
}

// ── Handler ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: OrderBody;

  // ── Parse body ───────────────────────────────────────────
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  // ── Validate required fields ─────────────────────────────
  if (!body.name?.trim() || !body.phone?.trim() || !body.items?.length) {
    console.error("[submit-order] ❌ Validation failed — missing name/phone/items:", {
      name: body.name,
      phone: body.phone,
      items_count: body.items?.length,
    });
    return NextResponse.json(
      { ok: false, error: "name, phone and items are required" },
      { status: 400 }
    );
  }

  console.log(
    `\n[submit-order] ══════════════ NEW ORDER ══════════════`,
    `\n  Customer : ${body.name} / ${body.phone}`,
    `\n  Address  : ${body.address || "(none)"}`,
    `\n  Items    : ${body.items.map((i) => `[${i.sku}] ×${i.qty}`).join(", ")}`,
    `\n  Total    : ₸ ${body.totalPrice.toLocaleString("ru-KZ")}`,
    `\n  Comments : ${JSON.stringify(body.moreComments ?? {})}`,
    `\n═══════════════════════════════════════════════════════\n`
  );

  // Map to canonical line items
  const lineItems: OrderLineItem[] = body.items.map((i) => ({
    id: i.id,
    sku: i.sku,
    title_ru: i.titleRu,
    qty: i.qty,
    price: i.price,
  }));

  // ── Step 1: Save order to Supabase ───────────────────────
  console.log("[submit-order] ── Step 1: Saving order to Supabase...");
  const category = body.category ?? "B2C";
  const orderId = await insertOrder({
    customer_name: body.name,
    customer_phone: body.phone,
    customer_address: body.address,
    items: lineItems,
    total_price: body.totalPrice,
    more_comments: body.moreComments ?? null,
    category,
  });
  // orderId is null if insert failed — logged inside insertOrder()

  // ── Step 2: Decrement stock in Supabase ──────────────────
  console.log("[submit-order] ── Step 2: Decrementing stock...");
  try {
    await decrementStock(lineItems.map((i) => ({ id: i.id, qty: i.qty })));
  } catch (stockErr) {
    console.error("[submit-order] ⚠️  Stock decrement threw:", stockErr);
    // Non-fatal — order is already saved
  }

  // ── Step 3: Send email to Trello board ───────────────────
  console.log("[submit-order] ── Step 3: Sending Trello email...");
  try {
    await sendTrelloNotification({
      name: body.name,
      phone: body.phone,
      address: body.address,
      totalPrice: body.totalPrice,
      moreComments: body.moreComments,
      category,
      items: lineItems.map((i) => ({
        sku: i.sku,
        titleRu: i.title_ru,
        qty: i.qty,
        price: i.price,
      })),
    });
  } catch (notifyErr) {
    console.error("[submit-order] ⚠️  Trello email failed:", notifyErr);
    // Non-fatal
  }

  // ── Step 4: Telegram notification ───────────────────────
  console.log("[submit-order] ── Step 4: Sending Telegram notification...");
  try {
    await sendNewOrderNotification({
      name: body.name,
      phone: body.phone,
      address: body.address,
      category,
      items: lineItems.map((i) => ({
        titleRu: i.title_ru,
        qty: i.qty,
        price: i.price,
      })),
      totalPrice: body.totalPrice,
    });
  } catch (tgErr) {
    console.error("[submit-order] ⚠️  Telegram notification failed:", tgErr);
    // Non-fatal
  }

  // ── Step 5: Bitrix24 CRM (optional) ─────────────────────
  const webhookUrl = process.env.BITRIX_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("[submit-order] ── Step 4: Bitrix24 skipped (BITRIX_WEBHOOK_URL not set).");
  } else {
    console.log("[submit-order] ── Step 4: Sending lead to Bitrix24...");
    try {
      const bitrixPayload: BitrixOrderPayload = {
        name: body.name,
        phone: body.phone,
        address: body.address ?? "",
        items: lineItems.map((i) => ({
          titleRu: i.title_ru,
          qty: i.qty,
          price: i.price,
        })),
        totalPrice: body.totalPrice,
      };
      const lead = buildBitrixLead(bitrixPayload);
      const res = await fetch(`${webhookUrl}/crm.lead.add.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
      if (!res.ok) {
        console.error("[submit-order] ⚠️  Bitrix24 HTTP error:", res.status, await res.text());
      } else {
        const data = await res.json();
        console.log("[submit-order] ✅ Bitrix24 lead created, id =", data.result);
      }
    } catch (bErr) {
      console.error("[submit-order] ⚠️  Bitrix24 threw:", bErr);
    }
  }

  // ── Step 6: Google Sheets Webhook (customer base) ───────
  const sheetsWebhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!sheetsWebhookUrl) {
    console.log("[submit-order] ── Step 6: Google Sheets skipped (GOOGLE_SHEET_WEBHOOK_URL not set).");
  } else {
    console.log("[submit-order] ── Step 6: Sending to Google Sheets webhook...");
    try {
      // Clean phone: keep only + and digits
      const cleanPhone = body.phone.replace(/[^\d+]/g, "");
      const productsStr = body.items
        .map((i) => `${i.titleRu} × ${i.qty}`)
        .join("; ");

      await fetch(sheetsWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          name:     body.name,
          phone:    cleanPhone,
          email:    (body as unknown as { email?: string }).email ?? "",
          address:  body.address ?? "",
          products: productsStr,
        }),
      });
      console.log("[submit-order] ✅ Google Sheets webhook sent.");
    } catch (gsErr) {
      console.error("[submit-order] ⚠️  Google Sheets webhook failed:", gsErr);
      // Non-fatal — DB and notifications already sent
    }
  }

  console.log("[submit-order] ══════════ ORDER COMPLETE ══════════\n");
  return NextResponse.json({ ok: true, orderId });
}

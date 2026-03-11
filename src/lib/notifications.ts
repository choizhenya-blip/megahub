/**
 * Notifications service — sends order cards to Trello via board email.
 * Server-side only (called from API routes).
 *
 * Required env vars (set in .env.local):
 *   RESEND_API_KEY    — API key from resend.com (starts with "re_")
 *   RESEND_FROM       — verified sender address, e.g. "orders@yourdomain.com"
 *                       (use "onboarding@resend.dev" for testing without a domain)
 *   TRELLO_BOARD_EMAIL — your Trello board's email address
 *                       (Board → Share → Email-to-board)
 */

import { Resend } from "resend";

// ── Types ────────────────────────────────────────────────────

export interface OrderItem {
  sku: string;
  titleRu: string;
  qty: number;
  price: number;
}

export interface TrelloOrderPayload {
  name: string;
  phone: string;
  address?: string;
  items: OrderItem[];
  totalPrice: number;
  moreComments?: Record<string, string>; // keyed by SKU
  category: "B2C" | "B2B/B2G";
}

// ── Email body ───────────────────────────────────────────────

function buildEmailBody(order: TrelloOrderPayload): string {
  const categoryLabel = order.category === "B2C" ? "🟢 B2C (розница)" : "🔵 B2B/B2G (организация)";
  const lines: string[] = [
    `📋 Тип заказа: ${categoryLabel}`,
    ``,
    `Клиент: ${order.name}`,
    `Телефон: ${order.phone}`,
    order.address ? `Адрес: ${order.address}` : "Адрес: не указан",
    "",
    "━━━ Состав заказа ━━━",
    ...order.items.map((item) => {
      const comment = order.moreComments?.[item.sku];
      const commentLine = comment ? `\n   💬 Комментарий: "${comment}"` : "";
      return (
        `• [${item.sku}] ${item.titleRu}` +
        `\n   ${item.qty} шт. × ₸ ${item.price.toLocaleString("ru-KZ")}` +
        ` = ₸ ${(item.qty * item.price).toLocaleString("ru-KZ")}` +
        commentLine
      );
    }),
    "",
    `━━━ Итого: ₸ ${order.totalPrice.toLocaleString("ru-KZ")} ━━━`,
    "",
    "⚠️  Доставка рассчитывается отдельно менеджером.",
    `📅 Дата: ${new Date().toLocaleString("ru-KZ", { timeZone: "Asia/Almaty" })}`,
  ];
  return lines.join("\n");
}

// ── Public API ───────────────────────────────────────────────

export async function sendTrelloNotification(
  order: TrelloOrderPayload
): Promise<void> {
  const apiKey     = process.env.RESEND_API_KEY;
  const from       = process.env.RESEND_FROM ?? "onboarding@resend.dev";
  const boardEmail = process.env.TRELLO_BOARD_EMAIL;

  // ── Dev mode guard ───────────────────────────────────────
  if (!apiKey || !boardEmail) {
    console.log(
      "[notifications] ℹ️  Resend/Trello not fully configured — email skipped.\n" +
      "  Missing:",
      [
        !apiKey     && "RESEND_API_KEY",
        !boardEmail && "TRELLO_BOARD_EMAIL",
      ]
        .filter(Boolean)
        .join(", ")
    );
    console.log("[notifications] 📧 Would have sent:\n  Subject: [ORDER]", order.name);
    console.log(buildEmailBody(order));
    return;
  }

  const subject = `[ORDER] [${order.category}] ${order.name} — ${order.items.length} поз. — ₸ ${order.totalPrice.toLocaleString("ru-KZ")}`;
  const text    = buildEmailBody(order);

  console.log(
    `[notifications] 📤 Sending email via Resend...\n` +
    `  From   : ${from}\n` +
    `  To     : ${boardEmail}\n` +
    `  Subject: ${subject}`
  );

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from,
    to: boardEmail,
    subject,
    text,
  });

  if (error) {
    throw new Error(`[notifications] Resend error: ${error.message}`);
  }

  console.log(`[notifications] ✅ Email sent via Resend. id = ${data?.id}`);
}

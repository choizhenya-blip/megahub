/**
 * Telegram notifications service.
 * Server-side only (called from API routes).
 *
 * Required env vars (set in .env.local):
 *   TELEGRAM_BOT_TOKEN  — Bot token from @BotFather
 *   TELEGRAM_CHAT_ID    — Chat or group ID to send notifications to
 */

import { OrderItem } from "./notifications";

const TELEGRAM_API = "https://api.telegram.org";

// ── List labels with emojis ───────────────────────────────────

const LIST_LABELS: Record<string, string> = {
  "Входящие":          "📥 Входящие",
  "Уточнение заказа":  "🔍 Уточнение заказа",
  "Счет выставлен":    "🧾 Счет выставлен",
  "Оплачено / В сборке": "💰 Оплачено / В сборке",
  "Доставка":          "🚚 Доставка",
  "Выполнено":         "✅ Выполнено",
  "Отказ":             "❌ Отказ",
};

function listLabel(name: string): string {
  return LIST_LABELS[name] ?? name;
}

// ── Low-level send ────────────────────────────────────────────

export async function sendTelegramMessage(text: string): Promise<void> {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log(
      "[telegram] ℹ️  Not configured — message skipped.\n  Missing:",
      [!token && "TELEGRAM_BOT_TOKEN", !chatId && "TELEGRAM_CHAT_ID"]
        .filter(Boolean)
        .join(", ")
    );
    console.log("[telegram] 📨 Would have sent:\n", text);
    return;
  }

  const url = `${TELEGRAM_API}/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[telegram] HTTP ${res.status}: ${body}`);
  }

  console.log("[telegram] ✅ Message sent.");
}

// ── Notification templates ────────────────────────────────────

export interface NewOrderPayload {
  name: string;
  phone: string;
  address?: string;
  items: OrderItem[];
  totalPrice: number;
  moreComments?: Record<string, string>;
  category: "B2C" | "B2B/B2G";
}

export async function sendNewOrderNotification(order: NewOrderPayload): Promise<void> {
  const categoryLabel = order.category === "B2C" ? "🟢 B2C (розница)" : "🔵 B2B/B2G (организация)";

  const itemLines = order.items
    .map((item) => {
      const comment = order.moreComments?.[item.sku];
      const commentPart = comment ? `\n    💬 <i>${comment}</i>` : "";
      return (
        `• [${item.sku}] ${item.titleRu}\n` +
        `    ${item.qty} шт. × ₸${item.price.toLocaleString("ru-KZ")} = ₸${(item.qty * item.price).toLocaleString("ru-KZ")}` +
        commentPart
      );
    })
    .join("\n");

  const text = [
    `📥 <b>Новая заявка</b> — ${categoryLabel}`,
    ``,
    `👤 <b>${order.name}</b>`,
    `📞 ${order.phone}`,
    order.address ? `📍 ${order.address}` : `📍 адрес не указан`,
    ``,
    `<b>Состав заказа:</b>`,
    itemLines,
    ``,
    `💰 <b>Итого: ₸${order.totalPrice.toLocaleString("ru-KZ")}</b>`,
    ``,
    `🕐 ${new Date().toLocaleString("ru-KZ", { timeZone: "Asia/Almaty" })}`,
  ].join("\n");

  await sendTelegramMessage(text);
}

export interface CardMovedPayload {
  cardName:     string;
  cardUrl:      string;
  listBefore:   string;
  listAfter:    string;
  /** Full name of the Trello member who moved the card */
  movedBy:      string;
}

export async function sendCardMovedNotification(payload: CardMovedPayload): Promise<void> {
  const { cardName, cardUrl, listBefore, listAfter, movedBy } = payload;

  const text = [
    `🔄 <b>Смена статуса</b>`,
    ``,
    `📋 <b>${cardName}</b>`,
    ``,
    `${listLabel(listBefore)}`,
    `  ↓`,
    `${listLabel(listAfter)}`,
    ``,
    `👤 Исполнитель: ${movedBy}`,
    `🔗 <a href="${cardUrl}">Открыть в Trello</a>`,
    ``,
    `🕐 ${new Date().toLocaleString("ru-KZ", { timeZone: "Asia/Almaty" })}`,
  ].join("\n");

  await sendTelegramMessage(text);
}

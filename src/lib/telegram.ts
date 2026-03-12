// ── Telegram Bot notifications ───────────────────────────────

export type OrderCategory = "B2C" | "B2B/B2G";

export interface TelegramNewOrderPayload {
  name: string;
  phone: string;
  address?: string;
  items: { titleRu: string; qty: number; price: number }[];
  totalPrice: number;
  category: OrderCategory;
}

export interface TelegramStatusChangePayload {
  cardName: string;
  listBefore: string;
  listAfter: string;
  memberName?: string;
  cardUrl: string;
  category: OrderCategory;
}

// ── Emoji mapping for list names ─────────────────────────────

function listEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("вход") || n.includes("новы")) return "📥";
  if (n.includes("работ") || n.includes("обработ")) return "⚙️";
  if (n.includes("счет") || n.includes("счёт") || n.includes("invoice")) return "🧾";
  if (n.includes("закрыт") || n.includes("выполн") || n.includes("done") || n.includes("closed")) return "✅";
  if (n.includes("отмен") || n.includes("cancel") || n.includes("отказ")) return "❌";
  return "📋";
}

// ── Detect category from Trello card name ─────────────────────
// Card names follow: "[ORDER] [B2C] Name — N поз. — ₸ total"

export function detectCategoryFromCardName(cardName: string): OrderCategory {
  if (cardName.includes("[B2B/B2G]")) return "B2B/B2G";
  return "B2C";
}

// ── Resolve topic thread ID by category ───────────────────────

function getThreadId(category: OrderCategory): number | undefined {
  const envKey = category === "B2C"
    ? process.env.TELEGRAM_TOPIC_B2C
    : process.env.TELEGRAM_TOPIC_B2BG;
  const parsed = envKey ? parseInt(envKey, 10) : NaN;
  return isNaN(parsed) ? undefined : parsed;
}

// ── Formatting ────────────────────────────────────────────────

function formatDateTime(): string {
  return new Date().toLocaleString("ru-RU", {
    timeZone: "Asia/Almaty",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ── Core send ─────────────────────────────────────────────────

async function send(text: string, messageThreadId?: number): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[telegram] ⚠️  TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — skipping");
    return;
  }

  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };

  if (messageThreadId !== undefined) {
    body.message_thread_id = messageThreadId;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[telegram] ❌ sendMessage failed:", err);
  } else {
    console.log("[telegram] ✅ Message sent", messageThreadId ? `to thread ${messageThreadId}` : "");
  }
}

// ── Public API ────────────────────────────────────────────────

export async function sendNewOrderNotification(order: TelegramNewOrderPayload): Promise<void> {
  const categoryBadge = order.category === "B2C" ? "🟢 B2C" : "🔵 B2B/B2G";

  const itemLines = order.items
    .map((i) => ` • ${i.titleRu} ×${i.qty} — ₸${(i.price * i.qty).toLocaleString("ru-KZ")}`)
    .join("\n");

  const addressLine = order.address ? `\n📍 ${order.address}` : "";

  const text = [
    `🆕 <b>Новая заявка</b>  ${categoryBadge}`,
    "",
    `👤 ${order.name}`,
    `📞 ${order.phone}${addressLine}`,
    "",
    `📦 <b>${order.items.length} поз.:</b>`,
    itemLines,
    "",
    `💰 <b>Итого: ₸${order.totalPrice.toLocaleString("ru-KZ")}</b>`,
    "",
    `🕐 ${formatDateTime()}`,
  ].join("\n");

  await send(text, getThreadId(order.category));
}

export async function sendStatusChangeNotification(
  payload: TelegramStatusChangePayload
): Promise<void> {
  const fromEmoji = listEmoji(payload.listBefore);
  const toEmoji = listEmoji(payload.listAfter);
  const memberLine = payload.memberName ? `👤 Исполнитель: ${payload.memberName}\n` : "";

  const text = [
    `🔄 <b>Смена статуса</b>`,
    "",
    `📋 ${payload.cardName}`,
    "",
    `${fromEmoji} ${payload.listBefore}`,
    `  ↓`,
    `${toEmoji} ${payload.listAfter}`,
    "",
    `${memberLine}🔗 <a href="${payload.cardUrl}">Открыть в Trello</a>`,
    "",
    `🕐 ${formatDateTime()}`,
  ].join("\n");

  await send(text, getThreadId(payload.category));
}

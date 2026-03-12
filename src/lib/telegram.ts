// ── Telegram Bot notifications ───────────────────────────────

export interface TelegramNewOrderPayload {
  name: string;
  phone: string;
  address?: string;
  items: { titleRu: string; qty: number; price: number }[];
  totalPrice: number;
  category: "B2C" | "B2B/B2G";
}

export interface TelegramStatusChangePayload {
  cardName: string;
  listBefore: string;
  listAfter: string;
  memberName?: string;
  cardUrl: string;
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

async function send(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[telegram] ⚠️  TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — skipping");
    return;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    console.error("[telegram] ❌ sendMessage failed:", await res.text());
  } else {
    console.log("[telegram] ✅ Message sent");
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

  await send(text);
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

  await send(text);
}

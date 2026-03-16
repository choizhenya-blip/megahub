import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { verifyB2bSessionToken } from "@/lib/b2bAuth";

async function getAuthUser(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("b2b_session")?.value;
  const userId = req.cookies.get("b2b_user_id")?.value;
  if (!token || !userId || !verifyB2bSessionToken(token, userId)) return null;
  return userId;
}

// GET /api/b2b/quotes — list quotes for the authenticated user
export async function GET(req: NextRequest) {
  const userId = await getAuthUser(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from("b2b_quotes")
    .select("id, items, comment, status, manager_notes, created_at")
    .eq("b2b_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ quotes: data });
}

// POST /api/b2b/quotes — submit a new quote request
export async function POST(req: NextRequest) {
  const userId = await getAuthUser(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { items, comment } = body as {
    items: { book_id: string; sku: string; title_ru: string; qty: number }[];
    comment?: string;
  };

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Добавьте хотя бы один товар" }, { status: 400 });
  }

  const db = createSupabaseServiceClient();

  // Fetch user info for notification
  const { data: user } = await db
    .from("b2b_users")
    .select("email, contact_name, company_name")
    .eq("id", userId)
    .single();

  const { data: quote, error } = await db
    .from("b2b_quotes")
    .insert({ b2b_user_id: userId, items, comment: comment || null })
    .select("id, items, comment, status, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify via Telegram (non-blocking)
  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const itemLines = items.map((i) => `• ${i.title_ru} × ${i.qty} шт.`).join("\n");
      const text = [
        "📋 *Новая B2B-заявка*",
        `*Компания:* ${user?.company_name ?? "—"}`,
        `*Контакт:* ${user?.contact_name ?? "—"}`,
        `*Email:* ${user?.email ?? "—"}`,
        "",
        itemLines,
        comment ? `\n*Комментарий:* ${comment}` : "",
      ].filter(Boolean).join("\n");
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "Markdown" }),
      });
    }
  } catch { /* ignore */ }

  return NextResponse.json({ quote }, { status: 201 });
}

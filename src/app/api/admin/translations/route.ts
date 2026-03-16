/**
 * Translation overrides API.
 * Stores per-language flat key=value overrides in admin_settings.
 * Keys: translations_ru, translations_kz, translations_en
 * Value: JSON string of { "section.key": "overridden text", ... }
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/assertAdminServer";

type Lang = "ru" | "kz" | "en";
const VALID_LANGS: Lang[] = ["ru", "kz", "en"];

function settingsKey(lang: Lang) {
  return `translations_${lang}`;
}

// GET /api/admin/translations?lang=ru — returns current overrides for a language
export async function GET(req: NextRequest) {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lang = req.nextUrl.searchParams.get("lang") as Lang | null;
  if (!lang || !VALID_LANGS.includes(lang)) {
    return NextResponse.json({ error: "lang must be ru, kz or en" }, { status: 400 });
  }

  const db = createSupabaseServiceClient();
  const { data } = await db
    .from("admin_settings")
    .select("value")
    .eq("key", settingsKey(lang))
    .maybeSingle();

  let overrides: Record<string, string> = {};
  if (data?.value) {
    try { overrides = JSON.parse(data.value); } catch { /* ignore */ }
  }
  return NextResponse.json({ overrides });
}

// PUT /api/admin/translations — save overrides for a language
export async function PUT(req: NextRequest) {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { lang, overrides } = body as { lang: Lang; overrides: Record<string, string> };

  if (!lang || !VALID_LANGS.includes(lang)) {
    return NextResponse.json({ error: "lang must be ru, kz or en" }, { status: 400 });
  }
  if (!overrides || typeof overrides !== "object") {
    return NextResponse.json({ error: "overrides must be an object" }, { status: 400 });
  }

  const db = createSupabaseServiceClient();
  const { error } = await db
    .from("admin_settings")
    .upsert({ key: settingsKey(lang), value: JSON.stringify(overrides) });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

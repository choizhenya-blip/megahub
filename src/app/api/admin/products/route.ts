import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/assertAdminServer";

export async function GET() {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from("books")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Require at least one title
  const hasTitle = body.title_ru || body.title_kz || body.title_en || body.title;
  if (!hasTitle) {
    return NextResponse.json(
      { error: "Укажите наименование товара хотя бы на одном языке" },
      { status: 400 },
    );
  }
  if (body.price_b2c == null || isNaN(Number(body.price_b2c))) {
    return NextResponse.json({ error: "Укажите стоимость (B2C)" }, { status: 400 });
  }

  const allowed = [
    "isbn", "title", "title_ru", "title_kz", "title_en",
    "author", "subject", "class_level", "class_level_to",
    "price_b2c", "price_b2g", "stock_count", "is_active", "description",
  ];

  const insert: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body && body[key] !== "" && body[key] != null) {
      insert[key] = body[key];
    }
  }

  // `title` column is the canonical display title — use title_ru if title not provided
  if (!insert.title) insert.title = insert.title_ru ?? insert.title_kz ?? insert.title_en;

  insert.stock_count = Number(insert.stock_count ?? 0);
  insert.price_b2c   = Number(insert.price_b2c);
  if (insert.price_b2g != null) insert.price_b2g = Number(insert.price_b2g);
  if (insert.class_level != null) insert.class_level = Number(insert.class_level);
  if (insert.is_active == null) insert.is_active = true;

  const db = createSupabaseServiceClient();
  const { data, error } = await db.from("books").insert(insert).select("*").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = createSupabaseServiceClient();

  if (body.setting) {
    const { error } = await db.from("admin_settings").upsert({ key: body.setting, value: body.value });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const allowed = [
    "stock_count", "is_active", "is_b2b_active", "description", "cover_image_url",
    "price_b2c", "price_b2g",
    "isbn", "title", "title_ru", "title_kz", "title_en", "author", "subject", "class_level",
    "description_ru", "description_kz", "description_en", "images",
    "class_level_to",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in fields) update[key] = fields[key];
  }

  const { error } = await db.from("books").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

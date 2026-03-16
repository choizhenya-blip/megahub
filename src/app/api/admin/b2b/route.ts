import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/assertAdminServer";

// GET /api/admin/b2b — list all B2B quotes with user info
export async function GET() {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from("b2b_quotes")
    .select(`
      id, items, comment, status, manager_notes, created_at,
      b2b_users (email, contact_name, company_name, phone)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ quotes: data });
}

// PATCH /api/admin/b2b — update quote status or manager notes
export async function PATCH(req: NextRequest) {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, status, manager_notes } = body as { id: string; status?: string; manager_notes?: string };

  if (!id) return NextResponse.json({ error: "ID обязателен" }, { status: 400 });

  const validStatuses = ["new", "in_review", "priced", "completed", "cancelled"];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Неверный статус" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status !== undefined) updates.status = status;
  if (manager_notes !== undefined) updates.manager_notes = manager_notes;

  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from("b2b_quotes")
    .update(updates)
    .eq("id", id)
    .select("id, status, manager_notes")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ quote: data });
}

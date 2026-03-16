import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/assertAdminServer";
import { hashPassword } from "@/lib/adminAuth";

// GET /api/admin/users — list all admin users
export async function GET() {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from("admin_users")
    .select("id, name, email, role, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data });
}

// POST /api/admin/users — create a new admin user
export async function POST(req: NextRequest) {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, email, password, role } = body as {
    name: string; email: string; password: string; role: string;
  };

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Все поля обязательны" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Пароль должен быть не менее 8 символов" }, { status: 400 });
  }
  const validRoles = ["super_admin", "manager", "editor", "viewer"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Неверная роль" }, { status: 400 });
  }

  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from("admin_users")
    .insert({ name, email: email.toLowerCase(), password_hash: hashPassword(password), role })
    .select("id, name, email, role, is_active, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ user: data }, { status: 201 });
}

// PATCH /api/admin/users — update a user (role, active status, or password)
export async function PATCH(req: NextRequest) {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, name, role, is_active, password } = body as {
    id: string; name?: string; role?: string; is_active?: boolean; password?: string;
  };

  if (!id) return NextResponse.json({ error: "ID обязателен" }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name;
  if (role !== undefined) {
    const validRoles = ["super_admin", "manager", "editor", "viewer"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Неверная роль" }, { status: 400 });
    }
    updates.role = role;
  }
  if (is_active !== undefined) updates.is_active = is_active;
  if (password !== undefined) {
    if (password.length < 8) {
      return NextResponse.json({ error: "Пароль должен быть не менее 8 символов" }, { status: 400 });
    }
    updates.password_hash = hashPassword(password);
  }

  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from("admin_users")
    .update(updates)
    .eq("id", id)
    .select("id, name, email, role, is_active, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user: data });
}

// DELETE /api/admin/users — remove a user
export async function DELETE(req: NextRequest) {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID обязателен" }, { status: 400 });

  const db = createSupabaseServiceClient();
  const { error } = await db.from("admin_users").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

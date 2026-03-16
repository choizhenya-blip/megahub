import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { verifyB2bPassword, hashB2bPassword, verifyB2bSessionToken } from "@/lib/b2bAuth";

export async function POST(req: NextRequest) {
  const userId = req.cookies.get("b2b_user_id")?.value;
  const token  = req.cookies.get("b2b_session")?.value;

  if (!userId || !token || !verifyB2bSessionToken(token, userId)) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json() as {
    currentPassword: string;
    newPassword: string;
  };

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Все поля обязательны" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Новый пароль должен быть не менее 8 символов" }, { status: 400 });
  }

  const db = createSupabaseServiceClient();
  const { data: user, error } = await db
    .from("b2b_users")
    .select("password_hash")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  if (!verifyB2bPassword(currentPassword, user.password_hash)) {
    return NextResponse.json({ error: "Неверный текущий пароль" }, { status: 403 });
  }

  const { error: updateError } = await db
    .from("b2b_users")
    .update({ password_hash: hashB2bPassword(newPassword) })
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

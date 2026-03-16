import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { verifyB2bPassword, createB2bSessionToken } from "@/lib/b2bAuth";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body as { email: string; password: string };

  if (!email || !password) {
    return NextResponse.json({ error: "Email и пароль обязательны" }, { status: 400 });
  }

  const db = createSupabaseServiceClient();
  const { data: user, error } = await db
    .from("b2b_users")
    .select("id, email, contact_name, company_name, password_hash, email_verified, is_active")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error || !user) {
    return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
  }
  if (!user.is_active) {
    return NextResponse.json({ error: "Аккаунт отключён. Обратитесь к администратору." }, { status: 403 });
  }
  if (!verifyB2bPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
  }
  if (!user.email_verified) {
    return NextResponse.json({
      error: "Email не подтверждён. Проверьте почту и перейдите по ссылке из письма.",
      code: "EMAIL_NOT_VERIFIED",
    }, { status: 403 });
  }

  const token = createB2bSessionToken(user.id);

  const res = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      contact_name: user.contact_name,
      company_name: user.company_name,
    },
  });

  res.cookies.set("b2b_session", token, { ...COOKIE_OPTS, maxAge: 60 * 60 * 24 * 7 }); // 7 days
  res.cookies.set("b2b_user_id", user.id, { ...COOKIE_OPTS, maxAge: 60 * 60 * 24 * 7 });

  return res;
}

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { hashB2bPassword } from "@/lib/b2bAuth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password, contact_name, company_name, phone, bin, company_type } = body as {
    email: string;
    password: string;
    contact_name: string;
    company_name?: string;
    phone?: string;
    bin?: string;
    company_type?: string;
  };

  if (!email || !password || !contact_name) {
    return NextResponse.json({ error: "Email, пароль и контактное лицо обязательны" }, { status: 400 });
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    return NextResponse.json({ error: "Некорректный формат email" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Пароль должен быть не менее 8 символов" }, { status: 400 });
  }

  const db = createSupabaseServiceClient();
  const { error } = await db
    .from("b2b_users")
    .insert({
      email: email.toLowerCase(),
      password_hash: hashB2bPassword(password),
      contact_name,
      company_name: company_name || null,
      phone: phone || null,
      bin: bin || null,
      company_type: company_type || null,
      email_verified: true,
    });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Пользователь с таким email уже зарегистрирован" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Регистрация прошла успешно. Теперь вы можете войти.",
  }, { status: 201 });
}

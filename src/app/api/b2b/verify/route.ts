import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/b2b/login?error=invalid_token", req.url));
  }

  const db = createSupabaseServiceClient();
  const { data: user, error } = await db
    .from("b2b_users")
    .select("id, email_verified, verify_expires")
    .eq("verify_token", token)
    .maybeSingle();

  if (error || !user) {
    return NextResponse.redirect(new URL("/b2b/login?error=invalid_token", req.url));
  }
  if (user.email_verified) {
    return NextResponse.redirect(new URL("/b2b/login?verified=already", req.url));
  }
  if (user.verify_expires && new Date(user.verify_expires) < new Date()) {
    return NextResponse.redirect(new URL("/b2b/login?error=token_expired", req.url));
  }

  // Mark email as verified
  await db
    .from("b2b_users")
    .update({ email_verified: true, verify_token: null, verify_expires: null })
    .eq("id", user.id);

  return NextResponse.redirect(new URL("/b2b/login?verified=1", req.url));
}

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { verifyB2bSessionToken } from "@/lib/b2bAuth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("b2b_session")?.value;
  const userId = req.cookies.get("b2b_user_id")?.value;

  if (!token || !userId || !verifyB2bSessionToken(token, userId)) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const db = createSupabaseServiceClient();
  const { data: user } = await db
    .from("b2b_users")
    .select("id, email, contact_name, company_name, phone, bin, company_type, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (!user || !user.is_active) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}

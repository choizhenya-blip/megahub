import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("b2b_session");
  res.cookies.delete("b2b_user_id");
  return res;
}

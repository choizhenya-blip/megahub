/**
 * B2B catalog API — returns active books without price info.
 * Requires B2B authentication.
 */
export const dynamic = "force-dynamic"; // never cache — data changes when admin toggles is_b2b_active

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { verifyB2bSessionToken } from "@/lib/b2bAuth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("b2b_session")?.value;
  const userId = req.cookies.get("b2b_user_id")?.value;

  if (!token || !userId || !verifyB2bSessionToken(token, userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from("books")
    .select("id, title_ru, title_kz, title_en, author, subject, class_level, class_level_to, images, cover_image_url")
    .eq("is_b2b_active", true)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ books: data });
}

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const bookId = formData.get("bookId") as string;
  const file = formData.get("file") as File | null;

  if (!bookId || !file) {
    return NextResponse.json({ error: "bookId and file required" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${bookId}.${ext}`;
  const bytes = await file.arrayBuffer();

  const db = createSupabaseServiceClient();

  // Upload to Supabase Storage (bucket: book-images)
  const { error: uploadError } = await db.storage
    .from("book-images")
    .upload(path, bytes, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Get public URL
  const { data: { publicUrl } } = db.storage
    .from("book-images")
    .getPublicUrl(path);

  // Update book record
  await db.from("books").update({ cover_image_url: publicUrl }).eq("id", bookId);

  return NextResponse.json({ url: publicUrl });
}

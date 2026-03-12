import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/assertAdminServer";

function parseImages(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((u): u is string => typeof u === "string");
  return [];
}

/** POST — upload a new image, append it to the book's images array */
export async function POST(req: NextRequest) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const bookId = formData.get("bookId") as string;
  const file = formData.get("file") as File | null;

  if (!bookId || !file) {
    return NextResponse.json({ error: "bookId and file required" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  // Unique path per upload so multiple photos don't collide
  const path = `${bookId}/${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const db = createSupabaseServiceClient();

  const { error: uploadError } = await db.storage
    .from("book-images")
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = db.storage.from("book-images").getPublicUrl(path);

  // Read current images array, append new URL
  const { data: book } = await db
    .from("books")
    .select("images, cover_image_url")
    .eq("id", bookId)
    .single();

  const current = parseImages(book?.images);
  // If the book had only a cover_image_url (old format), seed the array from it
  const seeded =
    current.length === 0 && book?.cover_image_url
      ? [book.cover_image_url]
      : current;
  const newImages = [...seeded, publicUrl];

  await db.from("books").update({
    images: newImages,
    cover_image_url: newImages[0],
  }).eq("id", bookId);

  return NextResponse.json({ url: publicUrl, images: newImages });
}

/** DELETE — remove a specific image URL from the book's images array */
export async function DELETE(req: NextRequest) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId, url } = await req.json();
  if (!bookId || !url) {
    return NextResponse.json({ error: "bookId and url required" }, { status: 400 });
  }

  const db = createSupabaseServiceClient();

  const { data: book } = await db
    .from("books")
    .select("images, cover_image_url")
    .eq("id", bookId)
    .single();

  const current = parseImages(book?.images);
  const newImages = current.filter((u) => u !== url);

  await db.from("books").update({
    images: newImages,
    cover_image_url: newImages[0] ?? null,
  }).eq("id", bookId);

  return NextResponse.json({ ok: true, images: newImages });
}

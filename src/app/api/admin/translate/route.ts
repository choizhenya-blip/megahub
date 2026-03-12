import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/assertAdminServer";

/**
 * GET /api/admin/translate?text=...&from=ru&to=en
 *
 * Thin proxy to the free MyMemory translation API.
 * Language codes: ru, kk (Kazakh), en
 */
export async function GET(req: NextRequest) {
  if (!(await assertAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const text = searchParams.get("text")?.trim() ?? "";
  const from = searchParams.get("from") ?? "ru";
  const to   = searchParams.get("to")   ?? "en";

  if (!text) return NextResponse.json({ translated: "" });

  try {
    const url =
      `https://api.mymemory.translated.net/get` +
      `?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;

    const res  = await fetch(url, { next: { revalidate: 0 } });
    const data = await res.json();

    // MyMemory returns { responseData: { translatedText: "..." }, responseStatus: 200 }
    const translated: string =
      data?.responseData?.translatedText ?? "";

    return NextResponse.json({ translated });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Translation failed" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/assertAdminServer";
import { syncFromGoogleSheets } from "@/lib/syncSheets";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Allow caller to pass a custom URL (or use one stored in admin_settings)
    let customUrl: string | undefined;
    const body = await req.json().catch(() => ({}));
    if (body.url) {
      customUrl = body.url;
    } else {
      // Try admin_settings
      const db = createSupabaseServiceClient();
      const { data } = await db
        .from("admin_settings")
        .select("value")
        .eq("key", "gsheets_url")
        .single();
      if (data?.value) customUrl = data.value;
    }

    const result = await syncFromGoogleSheets(customUrl);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { syncFromGoogleSheets } from "@/lib/syncSheets";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if auto-sync is enabled
  const db = createSupabaseServiceClient();
  const { data } = await db
    .from("admin_settings")
    .select("value")
    .eq("key", "sync_enabled")
    .single();

  if (data?.value !== "true") {
    return NextResponse.json({ ok: true, skipped: "sync disabled" });
  }

  try {
    const result = await syncFromGoogleSheets();
    console.log("[cron/sync-sheets]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("[cron/sync-sheets] error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

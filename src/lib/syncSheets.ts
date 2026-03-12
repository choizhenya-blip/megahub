import { createSupabaseServiceClient } from "@/lib/supabase/server";

export interface SyncResult {
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Fetches the public Google Sheet CSV and syncs stock_count (and optionally
 * is_active) into the books table matched by SKU.
 *
 * Expected CSV columns (first row = headers, case-insensitive):
 *   SKU | Остаток | Активен   (column names can vary — matched by keyword)
 *
 * Falls back to positional columns if no headers recognised:
 *   col 0 = SKU, col 1 = stock_count, col 2 = is_active (optional)
 */
export async function syncFromGoogleSheets(): Promise<SyncResult> {
  const url = process.env.GSHEETS_URL;
  if (!url) throw new Error("GSHEETS_URL not set");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

  const text = await res.text();
  const rows = text
    .split(/\r?\n/)
    .map((r) => r.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));

  if (rows.length < 2) throw new Error("CSV has no data rows");

  // Detect header row
  const header = rows[0].map((h) => h.toLowerCase());
  const skuCol = header.findIndex((h) => h.includes("sku") || h.includes("артикул") || h.includes("код"));
  const stockCol = header.findIndex((h) => h.includes("остат") || h.includes("stock") || h.includes("количе"));
  const activeCol = header.findIndex((h) => h.includes("актив") || h.includes("active") || h.includes("налич"));

  const dataRows = skuCol >= 0 ? rows.slice(1) : rows; // skip header if found
  const iSku = skuCol >= 0 ? skuCol : 0;
  const iStock = stockCol >= 0 ? stockCol : 1;
  const iActive = activeCol >= 0 ? activeCol : -1;

  const db = createSupabaseServiceClient();
  const result: SyncResult = { updated: 0, skipped: 0, errors: [] };

  for (const row of dataRows) {
    const sku = row[iSku];
    const rawStock = row[iStock];
    if (!sku || sku === "") continue;

    const stock = parseInt(rawStock, 10);
    if (isNaN(stock)) {
      result.skipped++;
      continue;
    }

    const update: Record<string, unknown> = { stock_count: stock };

    if (iActive >= 0 && row[iActive] !== undefined) {
      const raw = row[iActive].toLowerCase();
      update.is_active = raw === "1" || raw === "true" || raw === "да" || raw === "yes";
    }

    const { error } = await db.from("books").update(update).eq("sku", sku);
    if (error) {
      result.errors.push(`SKU ${sku}: ${error.message}`);
    } else {
      result.updated++;
    }
  }

  return result;
}

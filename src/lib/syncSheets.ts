import { createSupabaseServiceClient } from "@/lib/supabase/server";

export interface SyncResult {
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Parse a CSV/TSV string into rows of trimmed, unquoted strings.
 */
function parseCSV(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map((line) => {
      // Handle tab-separated and comma-separated
      const sep = line.includes("\t") ? "\t" : ",";
      return line.split(sep).map((c) => c.trim().replace(/^"|"$/g, "").trim());
    });
}

/**
 * Sync stock counts from parsed CSV rows into the `books` table.
 *
 * Supported CSV formats (first row = headers, case-insensitive):
 *   id | stock                  — match by book UUID
 *   title | stock               — match by book title (case-insensitive)
 *   title | stock | is_active   — also updates visibility
 *
 * Positional fallback (no recognisable headers):
 *   col 0 = id or title, col 1 = stock_count, col 2 = is_active (optional)
 *
 * "stock" column recognised by keywords: остат, кол, stock, qty, amount
 * "title" column: название, наим, title, книга, name
 * "id" column: id, uuid, код (≤5 chars after trim)
 * "active" column: актив, active, налич
 */
export async function syncFromCSVText(csvText: string): Promise<SyncResult> {
  const rows = parseCSV(csvText);
  if (rows.length < 2) throw new Error("Файл не содержит данных");

  const header = rows[0].map((h) => h.toLowerCase());

  const idCol = header.findIndex((h) => h === "id" || h === "uuid" || (h.startsWith("код") && h.length <= 6));
  const titleCol = header.findIndex((h) =>
    h.includes("название") || h.includes("наим") || h.includes("title") || h.includes("книга") || h.includes("name")
  );
  const stockCol = header.findIndex((h) =>
    h.includes("остат") || h.includes("кол") || h.includes("stock") || h.includes("qty") || h.includes("amount") || h.includes("количе")
  );
  const activeCol = header.findIndex((h) =>
    h.includes("актив") || h.includes("active") || h.includes("налич")
  );

  const hasHeaders = idCol >= 0 || titleCol >= 0 || stockCol >= 0;
  const dataRows = hasHeaders ? rows.slice(1) : rows;

  // Column indices (positional fallback)
  const iId = idCol >= 0 ? idCol : -1;
  const iTitle = titleCol >= 0 ? titleCol : iId < 0 ? 0 : -1;
  const iStock = stockCol >= 0 ? stockCol : 1;
  const iActive = activeCol >= 0 ? activeCol : -1;

  // Load all books for title-based matching
  const db = createSupabaseServiceClient();
  const { data: allBooks, error: fetchErr } = await db
    .from("books")
    .select("id, title, title_ru");
  if (fetchErr) throw new Error("Ошибка загрузки книг: " + fetchErr.message);

  // Build lookup maps
  const byId = new Map<string, string>(); // id → id
  const byTitle = new Map<string, string>(); // lower(title) → id
  for (const b of allBooks ?? []) {
    byId.set(b.id, b.id);
    if (b.title) byTitle.set(String(b.title).toLowerCase(), b.id);
    if (b.title_ru) byTitle.set(String(b.title_ru).toLowerCase(), b.id);
  }

  const result: SyncResult = { updated: 0, skipped: 0, errors: [] };

  for (const row of dataRows) {
    const rawStock = row[iStock] ?? "";
    const stock = parseInt(rawStock, 10);
    if (isNaN(stock)) { result.skipped++; continue; }

    // Resolve book id
    let bookId: string | undefined;
    if (iId >= 0 && row[iId]) {
      bookId = byId.get(row[iId]);
    }
    if (!bookId && iTitle >= 0 && row[iTitle]) {
      bookId = byTitle.get(row[iTitle].toLowerCase());
    }
    if (!bookId) { result.skipped++; continue; }

    const update: Record<string, unknown> = { stock_count: stock };
    if (iActive >= 0 && row[iActive] !== undefined) {
      const raw = row[iActive].toLowerCase();
      update.is_active = raw === "1" || raw === "true" || raw === "да" || raw === "yes";
    }

    const { error } = await db.from("books").update(update).eq("id", bookId);
    if (error) {
      result.errors.push(`"${row[iTitle >= 0 ? iTitle : iId]}": ${error.message}`);
    } else {
      result.updated++;
    }
  }

  return result;
}

/**
 * Fetch a Google Sheets CSV export URL and sync stock counts.
 * URL can be passed explicitly, otherwise reads GSHEETS_URL env var.
 */
export async function syncFromGoogleSheets(customUrl?: string): Promise<SyncResult> {
  const url = customUrl || process.env.GSHEETS_URL;
  if (!url) throw new Error("URL Google Sheets не задан. Укажите ссылку в настройках синхронизации.");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Ошибка загрузки файла: ${res.status} ${res.statusText}`);

  return syncFromCSVText(await res.text());
}

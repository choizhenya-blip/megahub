import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/assertAdminServer";
import { syncFromCSVText } from "@/lib/syncSheets";

export async function POST(req: NextRequest) {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Файл не передан" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["csv", "tsv", "txt"].includes(ext)) {
    return NextResponse.json(
      { error: "Поддерживаются только CSV/TSV файлы. Из Excel сохраните как CSV." },
      { status: 400 }
    );
  }

  const text = await file.text();
  try {
    const result = await syncFromCSVText(text);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

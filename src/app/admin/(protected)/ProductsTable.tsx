"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  ChevronDown, ChevronRight, RefreshCw, Upload, ImageOff,
  Link2, FileText, CheckCircle2, XCircle, Package, Settings2,
  BookOpen, RotateCcw, PlusCircle, Loader2, Languages,
  Search, X, SlidersHorizontal,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */
interface Book {
  id: string;
  title?: string | null;
  title_ru?: string | null;
  title_kz?: string | null;
  title_en?: string | null;
  author?: string | null;
  subject?: string | null;
  class_level?: number | null;
  price_b2c?: number | null;
  price_b2g?: number | null;
  stock_count: number;
  is_active: boolean;
  cover_image_url?: string | null;
  description?: string | null;
  description_ru?: string | null;
  description_kz?: string | null;
  description_en?: string | null;
  images?: unknown; // JSONB string[] from Supabase
  isbn?: string | null;
  class_level_to?: number | null;
  [key: string]: unknown;
}

/** Format class range: "7 кл." or "7–9 кл." */
function classRange(b: Book): string | null {
  if (b.class_level == null) return null;
  const from = Number(b.class_level);
  const to = b.class_level_to != null ? Number(b.class_level_to) : from;
  return to > from ? `${from}–${to} кл.` : `${from} кл.`;
}

type MainTab = "products" | "sync";
type SortKey = "title_asc" | "price_asc" | "price_desc" | "stock_asc" | "stock_desc";

/* ─── Helpers ───────────────────────────────────────────── */
function bookTitle(b: Book) {
  return b.title_ru || b.title || b.title_kz || b.title_en || "(без названия)";
}
function getImages(b: Book): string[] {
  if (Array.isArray(b.images) && b.images.length > 0)
    return (b.images as unknown[]).filter((u): u is string => typeof u === "string");
  if (b.cover_image_url) return [b.cover_image_url];
  return [];
}
function fmt(n: number | null | undefined) {
  if (n == null) return "";
  return String(n);
}
async function patchBook(id: string, fields: Record<string, unknown>) {
  const res = await fetch("/api/admin/products", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...fields }),
  });
  if (!res.ok) throw new Error(await res.text());
}
async function patchSetting(key: string, value: string) {
  await fetch("/api/admin/products", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ setting: key, value }),
  });
}

/* ─── Primitives ────────────────────────────────────────── */
function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      title={value ? "Активен — скрыть" : "Скрыт — показать"}
      style={{
        position: "relative", width: 44, height: 24, borderRadius: 12,
        border: "none", cursor: "pointer", flexShrink: 0,
        background: value ? "#22C55E" : "#D1D5DB", transition: "background 0.2s",
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: value ? 22 : 2,
        width: 20, height: 20, borderRadius: "50%",
        background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        transition: "left 0.2s", display: "block",
      }} />
    </button>
  );
}

function SmallToggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      title={value ? "Активен — скрыть" : "Скрыт — показать"}
      style={{
        position: "relative", width: 36, height: 20, borderRadius: 10,
        border: "none", cursor: "pointer", flexShrink: 0,
        background: value ? "#22C55E" : "#D1D5DB", transition: "background 0.2s",
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: value ? 18 : 2,
        width: 16, height: 16, borderRadius: "50%",
        background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        transition: "left 0.2s", display: "block",
      }} />
    </button>
  );
}

function NumInput({
  value, onChange, prefix, suffix, wide,
}: {
  value: number | null | undefined;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
  wide?: boolean;
}) {
  const [val, setVal] = useState(fmt(value));
  function commit() {
    const n = parseFloat(val);
    if (!isNaN(n) && n !== value) onChange(n);
    else setVal(fmt(value));
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {prefix && <span style={{ fontSize: 13, color: "#6B7280" }}>{prefix}</span>}
      <input
        type="number" min={0} value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        style={{
          width: wide ? 100 : 76, textAlign: "right",
          border: "1.5px solid #E5E7EB", borderRadius: 8,
          padding: "6px 8px", fontSize: 14, outline: "none",
          fontWeight: 600, color: "#111827", background: "#fff",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; commit(); }}
      />
      {suffix && <span style={{ fontSize: 13, color: "#6B7280" }}>{suffix}</span>}
    </div>
  );
}

function ResultBanner({ r, onClose }: { r: { ok: boolean; msg: string }; onClose: () => void }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "12px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500,
      background: r.ok ? "#F0FDF4" : "#FEF2F2",
      border: `1.5px solid ${r.ok ? "#BBF7D0" : "#FECACA"}`,
      color: r.ok ? "#166534" : "#991B1B", marginBottom: 16,
    }}>
      {r.ok
        ? <CheckCircle2 size={16} style={{ marginTop: 1, flexShrink: 0 }} />
        : <XCircle size={16} style={{ marginTop: 1, flexShrink: 0 }} />}
      <span style={{ flex: 1, lineHeight: 1.5 }}>{r.msg}</span>
      <button onClick={onClose} style={{
        background: "none", border: "none", cursor: "pointer",
        fontSize: 18, lineHeight: 1, color: "inherit", opacity: 0.5, padding: 0,
      }}>×</button>
    </div>
  );
}

/* ─── Tab bar ────────────────────────────────────────────── */
function TabBar({ active, onChange }: { active: MainTab; onChange: (t: MainTab) => void }) {
  const tabs: { id: MainTab; label: string; Icon: React.ElementType }[] = [
    { id: "products", label: "Товары", Icon: BookOpen },
    { id: "sync", label: "Синхронизация", Icon: RotateCcw },
  ];
  return (
    <div style={{
      display: "flex", gap: 0, marginBottom: 24,
      borderBottom: "2px solid #F3F4F6",
    }}>
      {tabs.map(({ id, label, Icon }) => {
        const active_ = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "10px 22px", fontSize: 14, fontWeight: 600,
              border: "none", background: "none", cursor: "pointer",
              color: active_ ? "#F97316" : "#6B7280",
              borderBottom: active_ ? "2px solid #F97316" : "2px solid transparent",
              marginBottom: -2, transition: "all 0.15s",
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Sync Tab ───────────────────────────────────────────── */
function SyncTab({
  initialUrl,
  syncEnabled,
  onSyncEnabled,
  onResult,
  syncResult,
  onBooksRefresh,
}: {
  initialUrl: string;
  syncEnabled: boolean;
  onSyncEnabled: (v: boolean) => void;
  onResult: (r: { ok: boolean; msg: string } | null) => void;
  syncResult: { ok: boolean; msg: string } | null;
  onBooksRefresh: () => void;
}) {
  const [sourceTab, setSourceTab] = useState<"url" | "file">("url");
  const [url, setUrl] = useState(initialUrl);
  const [urlSaved, setUrlSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function saveUrl() {
    await patchSetting("gsheets_url", url);
    setUrlSaved(true);
    setTimeout(() => setUrlSaved(false), 2500);
  }

  async function syncFromUrl() {
    setSyncing(true); onResult(null);
    try {
      const res = await fetch("/api/admin/sync-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        const errs = data.errors?.length ? ` · ${data.errors.length} ошиб.` : "";
        onResult({ ok: true, msg: `Обновлено: ${data.updated} · Пропущено: ${data.skipped}${errs}` });
        onBooksRefresh();
      } else {
        onResult({ ok: false, msg: data.error ?? "Неизвестная ошибка" });
      }
    } catch (e: unknown) {
      onResult({ ok: false, msg: e instanceof Error ? e.message : String(e) });
    }
    setSyncing(false);
  }

  async function syncFromFile() {
    if (!pendingFile) return;
    setSyncing(true); onResult(null);
    const fd = new FormData();
    fd.append("file", pendingFile);
    try {
      const res = await fetch("/api/admin/sync-file", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        const errs = data.errors?.length ? ` · ${data.errors.length} ошиб.` : "";
        onResult({ ok: true, msg: `Обновлено: ${data.updated} · Пропущено: ${data.skipped}${errs}` });
        onBooksRefresh();
        setPendingFile(null); setFileName(null);
      } else {
        onResult({ ok: false, msg: data.error ?? "Неизвестная ошибка" });
      }
    } catch (e: unknown) {
      onResult({ ok: false, msg: e instanceof Error ? e.message : String(e) });
    }
    setSyncing(false);
  }

  const srcTabBtn = (t: "url" | "file", label: string, Icon: React.ElementType) => (
    <button
      key={t}
      onClick={() => setSourceTab(t)}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
        border: "1.5px solid",
        borderColor: sourceTab === t ? "#F97316" : "#E5E7EB",
        background: sourceTab === t ? "#FFF7ED" : "#fff",
        color: sourceTab === t ? "#F97316" : "#6B7280",
        cursor: "pointer", transition: "all 0.15s",
      }}
    >
      <Icon size={14} /> {label}
    </button>
  );

  const syncBtn = (onClick: () => void, disabled: boolean, label: string) => (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        display: "flex", alignItems: "center", gap: 7, padding: "10px 20px",
        borderRadius: 10, border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? "#94A3B8" : "#F97316",
        color: "#fff", fontSize: 14, fontWeight: 700, transition: "background 0.15s",
      }}
    >
      <RefreshCw size={14} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
      {label}
    </button>
  );

  return (
    <div>
      {syncResult && <ResultBanner r={syncResult} onClose={() => onResult(null)} />}

      {/* Auto-sync setting */}
      <div style={{
        background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 14,
        padding: "18px 22px", marginBottom: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#001A33" }}>Автоматическая синхронизация</div>
          <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
            Запускается автоматически по расписанию (через cron-задачу)
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: syncEnabled ? "#16A34A" : "#6B7280", fontWeight: 600 }}>
            {syncEnabled ? "Включена" : "Выключена"}
          </span>
          <Toggle
            value={syncEnabled}
            onChange={() => {
              const next = !syncEnabled;
              onSyncEnabled(next);
              patchSetting("sync_enabled", String(next));
            }}
          />
        </div>
      </div>

      {/* Source select */}
      <div style={{
        background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 14,
        padding: "20px 22px",
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#001A33", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Settings2 size={16} color="#F97316" />
          Источник данных об остатках
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {srcTabBtn("url", "Google Sheets / URL", Link2)}
          {srcTabBtn("file", "Загрузить файл CSV", FileText)}
        </div>

        {sourceTab === "url" && (
          <div>
            <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 10, lineHeight: 1.6 }}>
              Вставьте ссылку на CSV-экспорт Google Sheets:<br />
              В таблице: <strong>Файл → Скачать → CSV</strong> → скопируйте ссылку.<br />
              Поддерживаемые колонки: <strong>Название</strong> + <strong>Остаток</strong>, либо <strong>ID</strong> + <strong>Остаток</strong>.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/…/export?format=csv"
                style={{
                  flex: 1, minWidth: 260, border: "1.5px solid #E5E7EB", borderRadius: 9,
                  padding: "10px 14px", fontSize: 13, outline: "none", color: "#111827",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
              />
              <button
                onClick={saveUrl}
                style={{
                  padding: "10px 18px", borderRadius: 9, border: "1.5px solid #E5E7EB",
                  background: urlSaved ? "#F0FDF4" : "#F9FAFB",
                  color: urlSaved ? "#166534" : "#374151",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {urlSaved ? "✓ Сохранено" : "Сохранить URL"}
              </button>
            </div>
            {syncBtn(syncFromUrl, syncing || !url.trim(), syncing ? "Загрузка…" : "Синхронизировать сейчас")}
          </div>
        )}

        {sourceTab === "file" && (
          <div>
            <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 10, lineHeight: 1.6 }}>
              Загрузите CSV/TSV файл с остатками. Первая строка — заголовки.<br />
              Пример: <code style={{ background: "#F1F5F9", padding: "1px 5px", borderRadius: 4 }}>Название,Остаток</code> или <code style={{ background: "#F1F5F9", padding: "1px 5px", borderRadius: 4 }}>ID,Остаток</code><br />
              Из Excel: <strong>Файл → Сохранить как → CSV (разделители — запятые)</strong>.
            </p>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setDragOver(false);
                const f = e.dataTransfer.files[0];
                if (f) { setPendingFile(f); setFileName(f.name); }
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "#F97316" : fileName ? "#22C55E" : "#D1D5DB"}`,
                borderRadius: 12, padding: "28px 20px", textAlign: "center", cursor: "pointer",
                background: dragOver ? "#FFF7ED" : fileName ? "#F0FDF4" : "#F9FAFB",
                transition: "all 0.2s", marginBottom: 14,
              }}
            >
              <input
                ref={fileInputRef} type="file" accept=".csv,.tsv,.txt" style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setPendingFile(f); setFileName(f.name); }
                }}
              />
              {fileName ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <FileText size={18} color="#22C55E" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#166534" }}>{fileName}</span>
                </div>
              ) : (
                <>
                  <Upload size={22} color="#CBD5E1" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 14, color: "#6B7280" }}>
                    Перетащите файл или{" "}
                    <span style={{ color: "#F97316", fontWeight: 600 }}>нажмите для выбора</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>CSV, TSV, TXT</div>
                </>
              )}
            </div>
            {syncBtn(syncFromFile, !pendingFile || syncing, syncing ? "Обработка…" : "Загрузить и синхронизировать")}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Filter Bar ─────────────────────────────────────────── */
function FilterBar({
  books,
  search, setSearch,
  subject, setSubject,
  classLevel, setClassLevel,
  sortKey, setSortKey,
  count, total,
  pageSize, onPageSizeChange,
}: {
  books: Book[];
  search: string; setSearch: (v: string) => void;
  subject: string; setSubject: (v: string) => void;
  classLevel: number | null; setClassLevel: (v: number | null) => void;
  sortKey: SortKey; setSortKey: (v: SortKey) => void;
  count: number; total: number;
  pageSize: number; onPageSizeChange: (n: number) => void;
}) {
  const subjects = useMemo(
    () => [...new Set(books.map((b) => b.subject).filter(Boolean) as string[])].sort(),
    [books],
  );
  const hasFilter = !!search || !!subject || classLevel !== null;

  const inp: React.CSSProperties = {
    border: "1.5px solid #E5E7EB", borderRadius: 9, padding: "8px 12px",
    fontSize: 13, outline: "none", color: "#111827", background: "#fff",
  };

  return (
    <div style={{ marginBottom: 16, background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <SlidersHorizontal size={14} color="#6B7280" />

        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Название, автор, ISBN…"
            style={{ ...inp, paddingLeft: 32, width: "100%", boxSizing: "border-box" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 0, lineHeight: 0 }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Subject */}
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          style={{ ...inp, cursor: "pointer" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
        >
          <option value="">Все предметы</option>
          {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Class buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>Класс</span>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {[1,2,3,4,5,6,7,8,9,10,11].map((c) => (
            <button
              key={c}
              onClick={() => setClassLevel(classLevel === c ? null : c)}
              style={{
                width: 28, height: 28, borderRadius: 7, border: "1.5px solid",
                borderColor: classLevel === c ? "#F97316" : "#E5E7EB",
                background: classLevel === c ? "#FFF7ED" : "#F9FAFB",
                color: classLevel === c ? "#F97316" : "#6B7280",
                fontSize: 11, fontWeight: 700, cursor: "pointer",
              }}
            >
              {c}
            </button>
          ))}
          </div>
        </div>

        {/* Sort */}
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          style={{ ...inp, cursor: "pointer" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
        >
          <option value="title_asc">По названию А–Я</option>
          <option value="price_asc">Цена ↑</option>
          <option value="price_desc">Цена ↓</option>
          <option value="stock_asc">Остаток ↑</option>
          <option value="stock_desc">Остаток ↓</option>
        </select>

        {/* Clear + per-page + count */}
        {hasFilter && (
          <button
            onClick={() => { setSearch(""); setSubject(""); setClassLevel(null); }}
            style={{ fontSize: 12, color: "#F97316", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: "4px 6px", borderRadius: 6 }}
          >
            Сбросить
          </button>
        )}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{ ...inp, cursor: "pointer", fontSize: 12, padding: "5px 8px" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n} / стр.</option>
            ))}
          </select>
          <span style={{ fontSize: 12, color: "#9CA3AF", whiteSpace: "nowrap" }}>
            {count} из {total}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Photo Gallery (admin) ──────────────────────────────── */
function PhotoGalleryAdmin({
  book,
  onUpdate,
}: {
  book: Book;
  onUpdate: (fields: Partial<Book>) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const images = getImages(book);

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("bookId", book.id);
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const { images: newImages } = await res.json();
      onUpdate({ images: newImages, cover_image_url: newImages[0] ?? null });
    } catch (e: unknown) {
      alert("Ошибка загрузки: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setUploading(false);
    }
  }

  async function deleteImg(url: string) {
    if (!confirm("Удалить фото?")) return;
    try {
      const res = await fetch("/api/admin/upload-image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id, url }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { images: newImages } = await res.json();
      onUpdate({ images: newImages, cover_image_url: newImages[0] ?? null });
    } catch (e: unknown) {
      alert("Ошибка удаления: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
        Галерея фотографий
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        {images.map((url, i) => (
          <div key={url} style={{ position: "relative" }}>
            <img
              src={url} alt=""
              style={{ width: 72, height: 92, objectFit: "cover", borderRadius: 8, border: `2px solid ${i === 0 ? "#F97316" : "#E5E7EB"}`, display: "block" }}
            />
            {i === 0 && (
              <span style={{ position: "absolute", bottom: 4, left: 0, right: 0, textAlign: "center", fontSize: 9, fontWeight: 700, color: "#fff", background: "rgba(249,115,22,0.85)", padding: "1px 0" }}>
                Главная
              </span>
            )}
            <button
              onClick={() => deleteImg(url)}
              title="Удалить"
              style={{
                position: "absolute", top: -6, right: -6, width: 18, height: 18,
                borderRadius: "50%", background: "#EF4444", border: "2px solid #fff",
                color: "#fff", fontSize: 11, fontWeight: 900, lineHeight: "14px",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                padding: 0,
              }}
            >
              <X size={10} />
            </button>
          </div>
        ))}

        {/* Add photo button */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            width: 72, height: 92, borderRadius: 8,
            border: `2px dashed ${uploading ? "#D1D5DB" : "#FDBA74"}`,
            background: uploading ? "#F9FAFB" : "#FFF7ED",
            cursor: uploading ? "not-allowed" : "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
          }}
        >
          {uploading
            ? <Loader2 size={16} color="#9CA3AF" style={{ animation: "spin 1s linear infinite" }} />
            : <Upload size={16} color="#F97316" />}
          <span style={{ fontSize: 10, color: uploading ? "#9CA3AF" : "#F97316", fontWeight: 700 }}>
            {uploading ? "…" : "+ Фото"}
          </span>
        </button>
      </div>

      <input
        ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
      />
      <p style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.5 }}>
        Первое фото — главная обложка · JPG, PNG, WebP · до 5 МБ
      </p>
    </div>
  );
}

/* ─── Description Editor (multi-language) ────────────────── */
function DescriptionEditor({
  book,
  onUpdate,
}: {
  book: Book;
  onUpdate: (fields: Partial<Book>) => void;
}) {
  type DLang = "ru" | "kz" | "en";
  const [tab, setTab] = useState<DLang>("ru");
  const [drafts, setDrafts] = useState<Record<DLang, string>>({
    ru: book.description_ru ?? book.description ?? "",
    kz: book.description_kz ?? "",
    en: book.description_en ?? "",
  });
  const [translating, setTranslating] = useState(false);
  const manualKz = useRef(false);
  const manualEn = useRef(false);
  const manualRu = useRef(false);

  const fieldMap: Record<DLang, keyof Book> = {
    ru: "description_ru",
    kz: "description_kz",
    en: "description_en",
  };

  async function handleBlur(lang: DLang) {
    const val = drafts[lang];
    // Save current lang
    await patchBook(book.id, { [fieldMap[lang]]: val });
    onUpdate({ [fieldMap[lang]]: val });

    // Auto-translate if other langs are empty and not manually set
    const tasks: Promise<void>[] = [];
    if (lang === "ru" && val.trim()) {
      if (!manualKz.current && !drafts.kz.trim())
        tasks.push(translateText(val, "ru", "kk").then((t) => {
          if (!t) return;
          setDrafts((d) => ({ ...d, kz: t }));
          patchBook(book.id, { description_kz: t });
          onUpdate({ description_kz: t });
        }));
      if (!manualEn.current && !drafts.en.trim())
        tasks.push(translateText(val, "ru", "en").then((t) => {
          if (!t) return;
          setDrafts((d) => ({ ...d, en: t }));
          patchBook(book.id, { description_en: t });
          onUpdate({ description_en: t });
        }));
    } else if (lang === "kz" && val.trim()) {
      if (!manualRu.current && !drafts.ru.trim())
        tasks.push(translateText(val, "kk", "ru").then((t) => {
          if (!t) return;
          setDrafts((d) => ({ ...d, ru: t }));
          patchBook(book.id, { description_ru: t });
          onUpdate({ description_ru: t });
        }));
      if (!manualEn.current && !drafts.en.trim())
        tasks.push(translateText(val, "kk", "en").then((t) => {
          if (!t) return;
          setDrafts((d) => ({ ...d, en: t }));
          patchBook(book.id, { description_en: t });
          onUpdate({ description_en: t });
        }));
    }
    if (tasks.length) {
      setTranslating(true);
      await Promise.all(tasks);
      setTranslating(false);
    }
  }

  const tabs: { id: DLang; label: string }[] = [
    { id: "ru", label: "Русский" },
    { id: "kz", label: "Қазақша" },
    { id: "en", label: "English" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 0, marginBottom: 8, borderBottom: "1.5px solid #E5E7EB" }}>
        {tabs.map(({ id, label }) => {
          const active = tab === id;
          const filled = !!drafts[id].trim();
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                padding: "7px 14px", fontSize: 12, fontWeight: 600, border: "none",
                background: "none", cursor: "pointer",
                color: active ? "#F97316" : filled ? "#374151" : "#9CA3AF",
                borderBottom: `2px solid ${active ? "#F97316" : "transparent"}`,
                marginBottom: -2, transition: "all 0.15s",
              }}
            >
              {label}
              {filled && !active && <span style={{ marginLeft: 4, color: "#22C55E", fontSize: 10 }}>●</span>}
            </button>
          );
        })}
        {translating && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto", fontSize: 11, color: "#F97316", paddingBottom: 4 }}>
            <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
            перевод…
          </span>
        )}
      </div>

      <textarea
        key={tab}
        value={drafts[tab]}
        onChange={(e) => {
          const v = e.target.value;
          setDrafts((d) => ({ ...d, [tab]: v }));
          if (tab === "ru") manualRu.current = true;
          if (tab === "kz") manualKz.current = true;
          if (tab === "en") manualEn.current = true;
        }}
        rows={5}
        placeholder={
          tab === "ru" ? "Аннотация на русском…" :
          tab === "kz" ? "Аннотация на казахском…" :
          "Description in English…"
        }
        style={{
          width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 10,
          padding: "10px 12px", fontSize: 14, resize: "vertical", outline: "none",
          lineHeight: 1.55, fontFamily: "inherit", color: "#111827", boxSizing: "border-box",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; handleBlur(tab); }}
      />
      <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
        Сохраняется при потере фокуса · Незаполненные языки переводятся автоматически
      </p>
    </div>
  );
}

/* ─── Add Product Form ───────────────────────────────────── */
const CLASSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

async function translateText(text: string, from: string, to: string): Promise<string> {
  if (!text.trim()) return "";
  try {
    const res = await fetch(
      `/api/admin/translate?text=${encodeURIComponent(text)}&from=${from}&to=${to}`,
    );
    const data = await res.json();
    return data.translated ?? "";
  } catch {
    return "";
  }
}


function AddProductForm({ onAdded }: { onAdded: (book: Book) => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [isbn,          setIsbn]          = useState("");
  const [titleRu,       setTitleRu]       = useState("");
  const [titleKz,       setTitleKz]       = useState("");
  const [titleEn,       setTitleEn]       = useState("");
  const [author,        setAuthor]        = useState("");
  const [subject,       setSubject]       = useState("");
  const [classLevel,    setClassLevel]    = useState("");
  const [classLevelTo,  setClassLevelTo]  = useState("");
  const [priceB2C,      setPriceB2C]      = useState("");
  const [stock,         setStock]         = useState("0");
  const [isActive,      setIsActive]      = useState(true);

  // Track which title fields were manually typed by the user
  const manualKz = useRef(false);
  const manualEn = useRef(false);
  const manualRu = useRef(false);

  async function autoTranslateFromRu() {
    if (!titleRu.trim()) return;
    const tasks: Promise<void>[] = [];

    if (!manualKz.current && !titleKz.trim()) {
      tasks.push(
        translateText(titleRu, "ru", "kk").then((t) => { if (t) setTitleKz(t); }),
      );
    }
    if (!manualEn.current && !titleEn.trim()) {
      tasks.push(
        translateText(titleRu, "ru", "en").then((t) => { if (t) setTitleEn(t); }),
      );
    }
    if (tasks.length) {
      setTranslating("ru");
      await Promise.all(tasks);
      setTranslating(null);
    }
  }

  async function autoTranslateFromKz() {
    if (!titleKz.trim()) return;
    const tasks: Promise<void>[] = [];

    if (!manualRu.current && !titleRu.trim()) {
      tasks.push(
        translateText(titleKz, "kk", "ru").then((t) => { if (t) setTitleRu(t); }),
      );
    }
    if (!manualEn.current && !titleEn.trim()) {
      tasks.push(
        translateText(titleKz, "kk", "en").then((t) => { if (t) setTitleEn(t); }),
      );
    }
    if (tasks.length) {
      setTranslating("kz");
      await Promise.all(tasks);
      setTranslating(null);
    }
  }

  function reset() {
    setIsbn(""); setTitleRu(""); setTitleKz(""); setTitleEn("");
    setAuthor(""); setSubject(""); setClassLevel(""); setClassLevelTo("");
    setPriceB2C(""); setStock("0"); setIsActive(true);
    manualRu.current = false; manualKz.current = false; manualEn.current = false;
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!titleRu.trim() && !titleKz.trim()) {
      setFormError("Заполните наименование на русском или казахском");
      return;
    }
    if (!priceB2C || isNaN(Number(priceB2C))) {
      setFormError("Укажите корректную стоимость B2C");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title_ru:      titleRu.trim()      || undefined,
        title_kz:      titleKz.trim()      || undefined,
        title_en:      titleEn.trim()      || undefined,
        author:        author.trim()       || undefined,
        subject:       subject.trim()      || undefined,
        class_level:   classLevel          ? Number(classLevel) : undefined,
        class_level_to: classLevelTo       ? Number(classLevelTo) : (classLevel ? Number(classLevel) : undefined),
        isbn:          isbn.trim()         || undefined,
        price_b2c:     Number(priceB2C),
        stock_count:   Number(stock) || 0,
        is_active:     isActive,
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Ошибка создания товара");
        return;
      }
      onAdded(data as Book);
      reset();
      setOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 9,
    padding: "9px 12px", fontSize: 14, outline: "none",
    color: "#111827", boxSizing: "border-box" as const, background: "#fff",
  };

  const labelStyle = { display: "block" as const, fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 };

  function field(
    label: string,
    value: string,
    setter: (v: string) => void,
    opts?: {
      required?: boolean;
      placeholder?: string;
      onBlur?: () => void;
      translating?: boolean;
      onManual?: () => void;
      type?: string;
    },
  ) {
    return (
      <div>
        <label style={labelStyle}>
          {label}
          {opts?.required && <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>}
          {opts?.translating && (
            <span style={{ marginLeft: 6, color: "#F97316", fontSize: 11, fontWeight: 500 }}>
              <Loader2 size={11} style={{ display: "inline", animation: "spin 1s linear infinite", marginRight: 3 }} />
              перевод…
            </span>
          )}
        </label>
        <input
          type={opts?.type ?? "text"}
          value={value}
          onChange={(e) => { opts?.onManual?.(); setter(e.target.value); }}
          onBlur={opts?.onBlur}
          placeholder={opts?.placeholder}
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
        />
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Toggle button */}
      <button
        onClick={() => { setOpen((o) => !o); if (!open) reset(); }}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 20px", borderRadius: 10,
          border: `1.5px solid ${open ? "#F97316" : "#FDBA74"}`,
          background: open ? "#F97316" : "#FFF7ED",
          color: open ? "#fff" : "#F97316",
          fontSize: 14, fontWeight: 700, cursor: "pointer",
          transition: "all 0.15s", marginBottom: open ? 16 : 0,
        }}
      >
        <PlusCircle size={16} />
        {open ? "Отмена" : "Добавить товар"}
      </button>

      {/* Form panel */}
      {open && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 14,
            padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, background: "#FFF7ED",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Languages size={16} color="#F97316" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#001A33" }}>Новый товар</div>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>Незаполненные переводы проставляются автоматически при потере фокуса</div>
            </div>
          </div>

          {formError && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              background: "#FEF2F2", border: "1.5px solid #FECACA",
              borderRadius: 9, padding: "10px 12px", fontSize: 13, color: "#991B1B", marginBottom: 16,
            }}>
              <XCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {formError}
            </div>
          )}

          {/* ISBN */}
          <div style={{ marginBottom: 16 }}>
            {field("ISBN", isbn, setIsbn, { placeholder: "978-…" })}
          </div>

          {/* Titles */}
          <div style={{
            background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10,
            padding: "16px", marginBottom: 16,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Наименование товара
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {field("На русском", titleRu, setTitleRu, {
                required: !titleKz.trim(),
                placeholder: "Введите название на русском",
                onManual: () => { manualRu.current = true; },
                onBlur: autoTranslateFromRu,
                translating: translating === "ru",
              })}
              {field("На казахском", titleKz, setTitleKz, {
                required: !titleRu.trim(),
                placeholder: "Атауын қазақша жазыңыз",
                onManual: () => { manualKz.current = true; },
                onBlur: autoTranslateFromKz,
                translating: translating === "kz",
              })}
              {field("На английском", titleEn, setTitleEn, {
                placeholder: "Enter title in English",
                onManual: () => { manualEn.current = true; },
              })}
            </div>
          </div>

          {/* Author + Subject */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            {field("Автор", author, setAuthor, { placeholder: "Фамилия И.О." })}
            {field("Предмет", subject, setSubject, { placeholder: "Математика" })}
          </div>

          {/* Class range */}
          <div style={{ display: "grid", gridTemplateColumns: "100px 100px", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Класс от</label>
              <select
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
              >
                <option value="">—</option>
                {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>до</label>
              <select
                value={classLevelTo || classLevel}
                onChange={(e) => setClassLevelTo(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
              >
                <option value="">—</option>
                {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Prices + Stock */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {field("Цена B2C (розница)", priceB2C, setPriceB2C, {
              required: true, type: "number", placeholder: "0",
            })}
            {field("Остаток (шт.)", stock, setStock, {
              required: true, type: "number", placeholder: "0",
            })}
          </div>

          {/* Active toggle + Submit */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Toggle value={isActive} onChange={() => setIsActive((v) => !v)} />
              <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                {isActive ? "Активен (виден в каталоге)" : "Скрыт из каталога"}
              </span>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => { reset(); setOpen(false); }}
                style={{
                  padding: "10px 20px", borderRadius: 10, border: "1.5px solid #E5E7EB",
                  background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 24px", borderRadius: 10, border: "none",
                  background: saving ? "#94A3B8" : "#F97316",
                  color: "#fff", fontSize: 14, fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer", transition: "background 0.15s",
                }}
              >
                {saving
                  ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />Сохранение…</>
                  : <><PlusCircle size={15} />Создать товар</>}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

/* ─── Products Tab ───────────────────────────────────────── */
function ProductsTab({
  books,
  setBooks,
}: {
  books: Book[];
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  // Filter state
  const [filterSearch, setFilterSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterClass, setFilterClass] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("title_asc");
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // Reset to page 1 whenever filters or page size change
  useEffect(() => { setPage(1); }, [filterSearch, filterSubject, filterClass, sortKey, pageSize]);

  function updateLocal(id: string, fields: Partial<Book>) {
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, ...fields } : b)));
  }

  async function handleToggleActive(book: Book) {
    const next = !book.is_active;
    updateLocal(book.id, { is_active: next });
    try { await patchBook(book.id, { is_active: next }); }
    catch { updateLocal(book.id, { is_active: book.is_active }); alert("Ошибка сохранения"); }
  }

  async function handleNumSave(book: Book, field: keyof Book, n: number) {
    const prev = book[field] as number;
    updateLocal(book.id, { [field]: n });
    try { await patchBook(book.id, { [field]: n }); }
    catch { updateLocal(book.id, { [field]: prev }); alert("Ошибка сохранения"); }
  }

  const stockColor = (n: number) =>
    n === 0 ? "#DC2626" : n < 10 ? "#D97706" : "#16A34A";

  function handleBookAdded(newBook: Book) {
    setBooks((prev) => [newBook, ...prev]);
  }

  // Filtered + sorted books
  const visibleBooks = useMemo(() => {
    let list = [...books];
    if (filterSearch.trim()) {
      const q = filterSearch.trim().toLowerCase();
      list = list.filter((b) =>
        bookTitle(b).toLowerCase().includes(q) ||
        (b.author ?? "").toLowerCase().includes(q) ||
        (b.isbn ?? "").toLowerCase().includes(q)
      );
    }
    if (filterSubject) list = list.filter((b) => b.subject === filterSubject);
    if (filterClass !== null) list = list.filter((b) => {
      if (b.class_level == null) return false;
      const from = Number(b.class_level);
      const to = b.class_level_to != null ? Number(b.class_level_to) : from;
      return filterClass >= from && filterClass <= to;
    });
    switch (sortKey) {
      case "title_asc":  list.sort((a, b) => bookTitle(a).localeCompare(bookTitle(b), "ru")); break;
      case "price_asc":  list.sort((a, b) => (a.price_b2c ?? 0) - (b.price_b2c ?? 0)); break;
      case "price_desc": list.sort((a, b) => (b.price_b2c ?? 0) - (a.price_b2c ?? 0)); break;
      case "stock_asc":  list.sort((a, b) => a.stock_count - b.stock_count); break;
      case "stock_desc": list.sort((a, b) => b.stock_count - a.stock_count); break;
    }
    return list;
  }, [books, filterSearch, filterSubject, filterClass, sortKey]);

  const totalPages = Math.ceil(visibleBooks.length / pageSize);
  const pagedBooks = useMemo(
    () => visibleBooks.slice((page - 1) * pageSize, page * pageSize),
    [visibleBooks, page, pageSize],
  );

  return (
    <div>
      {/* Add product form */}
      <AddProductForm onAdded={handleBookAdded} />

      {books.length === 0 ? (
        <div style={{
          background: "#fff", borderRadius: 16, border: "1.5px solid #E5E7EB",
          textAlign: "center", padding: "64px 24px", color: "#9CA3AF", fontSize: 14,
        }}>
          Товары не найдены. Добавьте товар вручную или синхронизируйте остатки.
        </div>
      ) : (
        <>
          {/* Filter bar */}
          <FilterBar
            books={books}
            search={filterSearch} setSearch={(v) => { setFilterSearch(v); setPage(1); }}
            subject={filterSubject} setSubject={(v) => { setFilterSubject(v); setPage(1); }}
            classLevel={filterClass} setClassLevel={(v) => { setFilterClass(v); setPage(1); }}
            sortKey={sortKey} setSortKey={(v) => { setSortKey(v); setPage(1); }}
            count={visibleBooks.length} total={books.length}
            pageSize={pageSize} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
          />

          {visibleBooks.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #E5E7EB", textAlign: "center", padding: "40px 24px", color: "#9CA3AF", fontSize: 14 }}>
              Ничего не найдено — попробуйте изменить фильтры
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              {/* Table header */}
              <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 96px 88px 76px 52px", background: "#F9FAFB", borderBottom: "1.5px solid #E5E7EB", padding: "0 8px" }}>
                {["", "Книга", "Цена B2C", "Остаток", "Активен", ""].map((h, i) => (
                  <div key={i} style={{ padding: "11px 10px", fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: i >= 2 && i < 5 ? "center" : "left" }}>{h}</div>
                ))}
              </div>

              {/* Rows */}
              {pagedBooks.map((book) => {
                const isOpen = expanded === book.id;
                const title = bookTitle(book);
                const sc = stockColor(book.stock_count);
                const coverUrl = book.cover_image_url;

                return (
                  <div key={book.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                    {/* ── Compact row ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 96px 88px 76px 52px", alignItems: "center", padding: "3px 8px", background: isOpen ? "#FFF7ED" : !book.is_active ? "#FAFAFA" : undefined, transition: "background 0.15s" }}>
                      <button
                        onClick={() => setExpanded(isOpen ? null : book.id)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, border: "none", background: "none", cursor: "pointer", color: isOpen ? "#F97316" : "#CBD5E1", borderRadius: 6 }}
                      >
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>

                      <div style={{ padding: "7px 10px", minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: book.is_active ? "#111827" : "#9CA3AF" }}>
                          {title}
                        </div>
                        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>
                          {[book.author, book.subject, classRange(book)].filter(Boolean).join(" · ")}
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <NumInput value={book.price_b2c} onChange={(n) => handleNumSave(book, "price_b2c", n)} suffix="₸" />
                      </div>

                      <div style={{ display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center", gap: 2 }}>
                        <NumInput value={book.stock_count} onChange={(n) => handleNumSave(book, "stock_count", n)} />
                        <span style={{ fontSize: 10, color: sc, fontWeight: 700 }}>
                          {book.stock_count === 0 ? "Нет" : book.stock_count < 10 ? "Мало" : "OK"}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <SmallToggle value={book.is_active} onChange={() => handleToggleActive(book)} />
                      </div>

                      <div style={{ display: "flex", justifyContent: "center", padding: "4px 6px" }}>
                        {coverUrl ? (
                          <img src={coverUrl} alt="" style={{ width: 28, height: 36, objectFit: "cover", borderRadius: 4, border: "1px solid #E5E7EB" }} />
                        ) : (
                          <div style={{ width: 28, height: 36, background: "#F3F4F6", borderRadius: 4, border: "1.5px dashed #D1D5DB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ImageOff size={11} color="#D1D5DB" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Expanded card ── */}
                    {isOpen && (
                      <div style={{ background: "#FFFBF5", borderTop: "1px dashed #FED7AA", padding: "24px 20px 24px 52px" }}>
                        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>

                          {/* Left: prices + description + meta */}
                          <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 20 }}>

                            {/* Prices */}
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Стоимость</div>
                              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
                                <div>
                                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>Розница (B2C)</div>
                                  <NumInput value={book.price_b2c} onChange={(n) => handleNumSave(book, "price_b2c", n)} suffix="₸" wide />
                                </div>
                                <div>
                                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>Остаток (шт.)</div>
                                  <NumInput value={book.stock_count} onChange={(n) => handleNumSave(book, "stock_count", n)} wide />
                                </div>
                                <div>
                                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>Класс от</div>
                                  <select
                                    value={book.class_level ?? ""}
                                    onChange={(e) => handleNumSave(book, "class_level", e.target.value === "" ? 0 : Number(e.target.value))}
                                    style={{ border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "6px 10px", fontSize: 13, color: "#111827", background: "#fff", cursor: "pointer", minWidth: 70 }}
                                  >
                                    <option value="">—</option>
                                    {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>до</div>
                                  <select
                                    value={book.class_level_to ?? book.class_level ?? ""}
                                    onChange={(e) => handleNumSave(book, "class_level_to", e.target.value === "" ? 0 : Number(e.target.value))}
                                    style={{ border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "6px 10px", fontSize: 13, color: "#111827", background: "#fff", cursor: "pointer", minWidth: 70 }}
                                  >
                                    <option value="">—</option>
                                    {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                                  </select>
                                </div>
                              </div>
                              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>Нажмите Enter или кликните вне поля — сохранится автоматически</p>
                            </div>

                            {/* Multi-language description */}
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Описание для каталога</div>
                              <DescriptionEditor
                                book={book}
                                onUpdate={(fields) => updateLocal(book.id, fields)}
                              />
                            </div>

                            {/* Meta badges */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {([
                                { label: "ID", value: book.id.slice(0, 8) + "…" },
                                book.isbn ? { label: "ISBN", value: String(book.isbn) } : null,
                                book.subject ? { label: "Предмет", value: String(book.subject) } : null,
                                classRange(book) ? { label: "Класс", value: classRange(book)! } : null,
                                book.author ? { label: "Автор", value: String(book.author) } : null,
                              ] as Array<{ label: string; value: string } | null>)
                                .filter((x): x is { label: string; value: string } => x !== null)
                                .map(({ label, value }) => (
                                  <span key={label} style={{ display: "inline-flex", gap: 4, alignItems: "center", background: "#F1F5F9", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#374151" }}>
                                    <span style={{ color: "#9CA3AF", fontWeight: 600 }}>{label}:</span>
                                    <span style={{ fontWeight: 600 }}>{value}</span>
                                  </span>
                                ))}
                            </div>
                          </div>

                          {/* Right: photo gallery */}
                          <div style={{ width: 280, flexShrink: 0 }}>
                            <PhotoGalleryAdmin
                              book={book}
                              onUpdate={(fields) => updateLocal(book.id, fields)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4, padding: "12px 16px", borderTop: "1px solid #F3F4F6" }}>
                  {/* Prev */}
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #E5E7EB", background: page === 1 ? "#F9FAFB" : "#fff", color: page === 1 ? "#CBD5E1" : "#374151", cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >‹</button>

                  {/* Page buttons */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === "…" ? (
                        <span key={`ellipsis-${idx}`} style={{ width: 32, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>…</span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setPage(item as number)}
                          style={{
                            width: 32, height: 32, borderRadius: 8,
                            border: "1.5px solid",
                            borderColor: page === item ? "#F97316" : "#E5E7EB",
                            background: page === item ? "#FFF7ED" : "#fff",
                            color: page === item ? "#F97316" : "#374151",
                            fontSize: 13, fontWeight: page === item ? 700 : 500,
                            cursor: "pointer",
                          }}
                        >{item}</button>
                      )
                    )}

                  {/* Next */}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #E5E7EB", background: page === totalPages ? "#F9FAFB" : "#fff", color: page === totalPages ? "#CBD5E1" : "#374151", cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >›</button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Root ───────────────────────────────────────────────── */
export default function AdminProductsTable({
  initialBooks,
  syncEnabled: initSyncEnabled,
  sheetsUrl,
}: {
  initialBooks: Book[];
  syncEnabled: boolean;
  sheetsUrl: string;
}) {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [mainTab, setMainTab] = useState<MainTab>("products");
  const [syncEnabled, setSyncEnabled] = useState(initSyncEnabled);
  const [syncResult, setSyncResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const refreshBooks = useCallback(async () => {
    const res = await fetch("/api/admin/products");
    if (res.ok) setBooks(await res.json());
  }, []);

  return (
    <div style={{ padding: "24px 0" }}>
      {/* Page title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <Package size={20} color="#F97316" />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#001A33", margin: 0 }}>
          Панель управления
        </h1>
        {mainTab === "products" && (
          <span style={{ fontSize: 13, color: "#9CA3AF" }}>{books.length} позиций</span>
        )}
      </div>

      {/* Main tabs */}
      <TabBar active={mainTab} onChange={setMainTab} />

      {mainTab === "products" && (
        <ProductsTab books={books} setBooks={setBooks} />
      )}

      {mainTab === "sync" && (
        <SyncTab
          initialUrl={sheetsUrl}
          syncEnabled={syncEnabled}
          onSyncEnabled={setSyncEnabled}
          onResult={setSyncResult}
          syncResult={syncResult}
          onBooksRefresh={refreshBooks}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { opacity: 0.35; }
      `}</style>
    </div>
  );
}

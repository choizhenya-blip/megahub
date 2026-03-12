"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useI18n } from "@/i18n/I18nProvider";
import { useCartStore, MAX_QTY } from "@/lib/store";
import { buildSubjects, getSubjectLocalized } from "@/lib/subjectI18n";
import {
  Filter,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ShoppingCart,
  Info,
  Plus,
  Minus,
  ImageOff,
} from "lucide-react";

// ── Multilingual helpers ─────────────────────────────────────
export function getBookTitle(book: any, lang: string): string {
  const l = lang.toLowerCase();
  if (l === "kz" && book.title_kz) return book.title_kz;
  if (l === "en" && book.title_en) return book.title_en;
  return book.title_ru ?? book.title ?? "";
}

function getBookDescription(book: any, lang: string): string {
  const l = lang.toLowerCase();
  if (l === "kz" && book.description_kz) return book.description_kz;
  if (l === "en" && book.description_en) return book.description_en;
  return book.description_ru ?? book.description ?? "";
}

function getBookImages(book: any): string[] {
  if (Array.isArray(book.images) && book.images.length > 0)
    return book.images.filter((u: unknown): u is string => typeof u === "string");
  if (book.cover_image_url) return [book.cover_image_url];
  return [];
}

const MOCK_BOOKS = [
  {
    id: "1", sku: "MH-ALG-10",
    title: "Алгебра и начала анализа",
    title_ru: "Алгебра и начала анализа",
    title_kz: "Алгебра және математикалық анализ бастамалары",
    title_en: "Algebra and Introductory Analysis",
    subject: "Математика",
    class_level: 10, price_b2c: 2850, price_b2g: 2200, stock_count: 48,
    language: "RU", author: "Колмогоров А.Н.", cover_image_url: null, is_active: true,
    description_ru: null, description_kz: null, description_en: null, images: [],
  },
  {
    id: "2", sku: "MH-HIS-09",
    title: "История Казахстана",
    title_ru: "История Казахстана",
    title_kz: "Қазақстан тарихы",
    title_en: "History of Kazakhstan",
    subject: "История",
    class_level: 9, price_b2c: 2400, price_b2g: 1900, stock_count: 120,
    language: "KZ", author: "Кан Г.В.", cover_image_url: null, is_active: true,
    description_ru: null, description_kz: null, description_en: null, images: [],
  },
  {
    id: "3", sku: "MH-CHM-11",
    title: "Химия. Органика",
    title_ru: "Химия. Органика",
    title_kz: "Химия. Органикалық химия",
    title_en: "Chemistry. Organic Chemistry",
    subject: "Химия",
    class_level: 11, price_b2c: 3100, price_b2g: 2500, stock_count: 0,
    language: "RU", author: "Рудзитис Г.Е.", cover_image_url: null, is_active: true,
    description_ru: null, description_kz: null, description_en: null, images: [],
  },
  {
    id: "4", sku: "MH-LIT-08",
    title: "Русский язык и литература",
    title_ru: "Русский язык и литература",
    title_kz: "Орыс тілі және әдебиеті",
    title_en: "Russian Language and Literature",
    subject: "Литература",
    class_level: 8, price_b2c: 2200, price_b2g: 1750, stock_count: 65,
    language: "RU", author: "Сабитова З.К.", cover_image_url: null, is_active: true,
    description_ru: null, description_kz: null, description_en: null, images: [],
  },
];

type SortKey = "cheap" | "expensive" | "new";

function formatPrice(p: number | null | undefined) {
  if (p == null) return "—";
  return `₸ ${Number(p).toLocaleString("ru-KZ")}`;
}

function getStockLabel(stock: number, m: ReturnType<typeof useI18n>["m"]): string {
  if (stock < 10)  return `${m.book.inStockPrefix} ${m.book.stockLessThan10}`;
  if (stock < 30)  return `${m.book.inStockPrefix} ${m.book.stockMoreThan10}`;
  if (stock < 50)  return `${m.book.inStockPrefix} ${m.book.stockMoreThan30}`;
  return `${m.book.inStockPrefix} ${m.book.stockMoreThan50}`;
}

// ── Image Carousel ────────────────────────────────────────────
function BookImageCarousel({ images, title }: { images: string[]; title: string }) {
  const [idx, setIdx] = useState(0);

  if (images.length === 0) {
    return (
      <div style={{
        width: "100%", aspectRatio: "3/4", background: "#F1F5F9", borderRadius: 10,
        display: "flex", alignItems: "center", justifyContent: "center",
        border: "1px solid #E5E7EB", marginBottom: 10,
      }}>
        <ImageOff size={28} color="#CBD5E1" />
      </div>
    );
  }

  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  return (
    <div style={{ position: "relative", marginBottom: 10, userSelect: "none" }}>
      <img
        src={images[idx]}
        alt={title}
        style={{
          width: "100%", aspectRatio: "3/4", objectFit: "cover",
          borderRadius: 10, border: "1px solid #E5E7EB", display: "block",
        }}
      />

      {images.length > 1 && (
        <>
          {/* Arrows */}
          {[
            { dir: "prev", icon: <ChevronLeft size={14} />, action: prev, position: { left: 4 } },
            { dir: "next", icon: <ChevronRightIcon size={14} />, action: next, position: { right: 4 } },
          ].map(({ dir, icon, action, position }) => (
            <button
              key={dir}
              onClick={action}
              style={{
                position: "absolute", top: "50%", transform: "translateY(-50%)",
                ...position,
                width: 24, height: 24, borderRadius: "50%",
                background: "rgba(0,0,0,0.45)", border: "none", cursor: "pointer",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                padding: 0,
              }}
            >
              {icon}
            </button>
          ))}

          {/* Dots */}
          <div style={{
            position: "absolute", bottom: 6, left: 0, right: 0,
            display: "flex", justifyContent: "center", gap: 4,
          }}>
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  width: i === idx ? 14 : 6, height: 6, borderRadius: 3,
                  background: i === idx ? "#F97316" : "rgba(255,255,255,0.7)",
                  border: "none", cursor: "pointer", padding: 0,
                  transition: "all 0.2s",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Description with expand/collapse ─────────────────────────
const DESC_LINES = 3;
const APPROX_CHARS_PER_LINE = 60;
const COLLAPSE_THRESHOLD = DESC_LINES * APPROX_CHARS_PER_LINE;

function DescriptionBlock({ text, expandLabel, collapseLabel }: {
  text: string;
  expandLabel: string;
  collapseLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > COLLAPSE_THRESHOLD;

  return (
    <div style={{ marginTop: 4 }}>
      <p
        style={{
          fontFamily: "system-ui,sans-serif",
          fontSize: "0.78rem",
          color: "#4B5563",
          lineHeight: 1.6,
          margin: 0,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: expanded ? "unset" : DESC_LINES,
          WebkitBoxOrient: "vertical",
        } as React.CSSProperties}
      >
        {text}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            fontFamily: "system-ui,sans-serif",
            fontSize: "0.72rem",
            color: "#F97316",
            fontWeight: 600,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 0",
            marginTop: 2,
          }}
        >
          {expanded ? collapseLabel : expandLabel}
        </button>
      )}
    </div>
  );
}

// ── Quantity Controller ──────────────────────────────────────
function QtyControl({
  qty, bookId, stock, maxQtyNote, stockLimitReached, inStockSuffix,
}: {
  qty: number; bookId: string; stock: number;
  maxQtyNote: string; stockLimitReached: string; inStockSuffix: string;
}) {
  const { setQty } = useCartStore();
  const effectiveMax = Math.min(MAX_QTY, stock);
  const atLimit = qty >= effectiveMax;
  const atStockLimit = atLimit && stock < MAX_QTY;
  return (
    <div className="inline-flex flex-col items-end shrink-0">
      <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
        <button
          onClick={() => setQty(bookId, qty - 1)}
          className="flex items-center justify-center w-8 h-8 shrink-0"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#374151" }}
          aria-label="−"
        >
          <Minus size={12} />
        </button>
        <span
          className="w-8 shrink-0 text-center text-xs font-bold"
          style={{ fontFamily: "system-ui,sans-serif", color: "#111827", borderLeft: "1px solid #E5E7EB", borderRight: "1px solid #E5E7EB", lineHeight: "2rem" }}
        >
          {qty}
        </span>
        <button
          onClick={() => setQty(bookId, qty + 1)}
          disabled={atLimit}
          className="flex items-center justify-center w-8 h-8 shrink-0"
          style={{ background: "none", border: "none", cursor: atLimit ? "not-allowed" : "pointer", color: atLimit ? "#D1D5DB" : "#374151" }}
          aria-label="+"
          title={atLimit ? (atStockLimit ? `${stockLimitReached} ${stock} ${inStockSuffix}` : maxQtyNote) : undefined}
        >
          <Plus size={12} />
        </button>
      </div>
      {atLimit && (
        <p style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.65rem", color: "#F97316", marginTop: 2, textAlign: "right", maxWidth: "7rem", lineHeight: 1.2 }}>
          {atStockLimit ? `${stockLimitReached} ${stock} ${inStockSuffix}` : maxQtyNote}
        </p>
      )}
    </div>
  );
}

// ── Book Card ─────────────────────────────────────────────────
function BookCard({ b, lang, m }: { b: any; lang: string; m: ReturnType<typeof useI18n>["m"] }) {
  const { add, items, setQty } = useCartStore();
  const outOfStock = b.stock_count === 0;
  const localTitle = getBookTitle(b, lang);
  const description = getBookDescription(b, lang);
  const images = getBookImages(b);
  const cartItem = items.find((i) => i.id === b.id);
  const cartQty = cartItem?.qty ?? 0;

  const handleAdd = () => {
    add({
      id: b.id,
      sku: b.sku || b.id,
      titles: { ru: b.title_ru || b.title || "", kz: b.title_kz || b.title || "", en: b.title_en || b.title || "" },
      subjects: buildSubjects(b.subject || ""),
      price: b.price_b2c ?? 0,
      stock: b.stock_count ?? 0,
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white flex flex-col shadow-sm overflow-hidden">
      {/* Image carousel */}
      <div style={{ padding: "12px 12px 0" }}>
        <BookImageCarousel images={images} title={localTitle} />
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <p className="text-xs uppercase tracking-wide font-semibold text-blue-700" style={{ fontFamily: "system-ui,sans-serif" }}>
          {getSubjectLocalized(buildSubjects(b.subject || ""), lang)}
        </p>
        <h3 className="text-sm font-semibold text-slate-900" style={{ fontFamily: "'Georgia',serif" }}>
          {localTitle}
        </h3>
        {b.author && (
          <p className="text-xs text-slate-400" style={{ fontFamily: "system-ui,sans-serif" }}>
            {b.author}
          </p>
        )}
        {b.class_level && (
          <p className="text-xs text-slate-500" style={{ fontFamily: "system-ui,sans-serif" }}>
            {b.class_level} {m.book.classSuffix}
          </p>
        )}

        {/* Description */}
        {description && (
          <DescriptionBlock
            text={description}
            expandLabel="Подробнее ↓"
            collapseLabel="Свернуть ↑"
          />
        )}

        {/* Stock */}
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: outOfStock ? "#EF4444" : "#22C55E" }} />
          <span className="text-xs" style={{ fontFamily: "system-ui,sans-serif", color: outOfStock ? "#DC2626" : "#16A34A" }}>
            {outOfStock ? m.book.outOfStock : getStockLabel(b.stock_count ?? 0, m)}
          </span>
        </div>

        {/* Price + cart */}
        <div className="flex items-center justify-between mt-auto gap-2">
          <div className="text-base font-bold text-slate-900" style={{ fontFamily: "system-ui,sans-serif" }}>
            {formatPrice(b.price_b2c)}
          </div>

          {!outOfStock && cartQty > 0 ? (
            <QtyControl
              qty={cartQty} bookId={b.id} stock={b.stock_count ?? 0}
              maxQtyNote={m.cart.maxQtyNote}
              stockLimitReached={m.cart.stockLimitReached}
              inStockSuffix={m.book.inStockSuffix}
            />
          ) : (
            <button
              type="button"
              disabled={outOfStock}
              onClick={() => !outOfStock && handleAdd()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
              style={{
                fontFamily: "system-ui,sans-serif",
                background: outOfStock ? "#E5E7EB" : "#F97316",
                color: outOfStock ? "#9CA3AF" : "#fff",
                cursor: outOfStock ? "not-allowed" : "pointer",
                border: "none",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => { if (!outOfStock) (e.currentTarget as HTMLButtonElement).style.background = "#EA580C"; }}
              onMouseLeave={(e) => { if (!outOfStock) (e.currentTarget as HTMLButtonElement).style.background = "#F97316"; }}
            >
              {outOfStock ? m.book.outOfStock : <><ShoppingCart size={12} /> {m.book.addToCart}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────
function CatalogInner() {
  const { lang, m } = useI18n();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("cheap");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [classes, setClasses] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const sb = createClient(
          "https://jvhknnxshrweuwwoujud.supabase.co",
          "sb_publishable_aZ0w_8zQpjmssGeMl1KVgg_249itAfq"
        );
        const { data, error } = await sb
          .from("books")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(64);
        if (cancelled) return;
        if (error) throw error;
        setBooks(data?.length ? data : MOCK_BOOKS);
      } catch {
        if (!cancelled) setBooks(MOCK_BOOKS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const toggleSubject = (code: string) =>
    setSubjects((prev) => prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]);

  const toggleClass = (value: number) =>
    setClasses((prev) => prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]);

  const resetFilters = () => { setSubjects([]); setClasses([]); setSearch(""); setSort("cheap"); };

  const visibleBooks = useMemo(() => {
    let list = [...books];

    if (subjects.length) {
      list = list.filter((b) => {
        const subj = String(b.subject ?? "");
        if (subjects.includes("math") && subj.includes("Математика")) return true;
        if (subjects.includes("physics") && subj.includes("Физика")) return true;
        if (subjects.includes("languages") && subj.toLowerCase().includes("язык")) return true;
        return false;
      });
    }
    if (classes.length) {
      list = list.filter((b) => classes.includes(Number(b.class_level ?? 0)));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((b) => getBookTitle(b, lang).toLowerCase().includes(q));
    }
    list = list.sort((a, b) => {
      const pa = Number(a.price_b2c ?? 0);
      const pb = Number(b.price_b2c ?? 0);
      if (sort === "cheap") return pa - pb;
      if (sort === "expensive") return pb - pa;
      return 0;
    });

    return list;
  }, [books, lang, subjects, classes, search, sort]);

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">

        {/* Disclaimer */}
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl mb-6" style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE" }}>
          <Info size={17} style={{ color: "#2563EB", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.8125rem", color: "#1E40AF", lineHeight: 1.55 }}>
            {m.catalog.retailDisclaimer}
          </p>
        </div>

        <button
          className="lg:hidden flex items-center gap-2 mb-4 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg px-3 py-2 bg-white"
          onClick={() => setShowFilters((o) => !o)}
          style={{ fontFamily: "system-ui,sans-serif" }}
        >
          <Filter size={15} /> {m.catalogFilters.sidebarTitle}
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className={`${showFilters ? "block" : "hidden"} lg:block w-full lg:w-64 flex-shrink-0 bg-white border border-slate-200 rounded-2xl p-4 space-y-6`} style={{ alignSelf: "flex-start" }}>
            <div className="flex items-center gap-2 mb-1">
              <Filter size={16} className="text-slate-600" />
              <h2 className="text-sm font-semibold text-slate-800" style={{ fontFamily: "system-ui,sans-serif" }}>
                {m.catalogFilters.sidebarTitle}
              </h2>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ fontFamily: "system-ui,sans-serif" }}>
                {m.catalogFilters.subjectsTitle}
              </p>
              {(["math", "physics", "languages"] as const).map((code) => {
                const label = m.catalogFilters.subjects[code];
                const checked = subjects.includes(code);
                return (
                  <label key={code} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none" style={{ fontFamily: "system-ui,sans-serif" }}>
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600" checked={checked} onChange={() => toggleSubject(code)} />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ fontFamily: "system-ui,sans-serif" }}>
                {m.catalogFilters.classesTitle}
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {Array.from({ length: 11 }).map((_, idx) => {
                  const value = idx + 1;
                  const active = classes.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleClass(value)}
                      className="text-xs rounded-lg py-1"
                      style={{ fontFamily: "system-ui,sans-serif", background: active ? "#F97316" : "#F1F5F9", color: active ? "#fff" : "#1F2933" }}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="w-full mt-2 text-xs font-semibold rounded-md py-2 border border-slate-200 text-slate-600 hover:bg-slate-50"
              style={{ fontFamily: "system-ui,sans-serif" }}
            >
              {m.catalogFilters.reset}
            </button>
          </aside>

          {/* Content */}
          <section className="flex-1 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-1" style={{ fontFamily: "system-ui,sans-serif" }}>
                  {m.catalog.eyebrow}
                </p>
                <h1 className="text-xl md:text-2xl font-semibold text-slate-900" style={{ fontFamily: "'Georgia',serif" }}>
                  {m.catalog.title}
                </h1>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={m.catalogFilters.searchPlaceholder}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    style={{ fontFamily: "system-ui,sans-serif" }}
                  />
                </div>

                {/* Sort */}
                <div className="flex items-center gap-1">
                  <span className="hidden sm:inline text-xs text-slate-500" style={{ fontFamily: "system-ui,sans-serif" }}>
                    {m.catalogFilters.sortLabel}:
                  </span>
                  <div className="relative">
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortKey)}
                      className="appearance-none pl-3 pr-7 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      style={{ fontFamily: "system-ui,sans-serif", color: "#111827" }}
                    >
                      <option value="cheap">{m.catalogFilters.sortCheapFirst}</option>
                      <option value="expensive">{m.catalogFilters.sortExpensiveFirst}</option>
                      <option value="new">{m.catalogFilters.sortNew}</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading
                ? Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 bg-white h-64 animate-pulse" />
                  ))
                : visibleBooks.length === 0
                ? (
                  <div className="col-span-full text-sm text-slate-600 bg-white border border-slate-200 rounded-xl px-4 py-4" style={{ fontFamily: "system-ui,sans-serif" }}>
                    {m.catalog.empty}
                  </div>
                )
                : visibleBooks.map((b) => (
                  <BookCard key={b.id} b={b} lang={lang} m={m} />
                ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function CatalogPage() {
  return <CatalogInner />;
}

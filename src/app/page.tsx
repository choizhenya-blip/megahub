"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useI18n } from "@/i18n/I18nProvider";
import { useCartStore, MAX_QTY } from "@/lib/store";
import { buildSubjects, getSubjectLocalized } from "@/lib/subjectI18n";
import {
  BookOpen,
  ShoppingCart,
  ChevronRight,
  Building2,
  BookMarked,
  Package,
  Award,
  ArrowRight,
  Users,
  CheckCircle,
  AlertCircle,
  Plus,
  Minus,
} from "lucide-react";

// ─── Multilingual title helper ───────────────────────────────
function getBookTitle(book: any, lang: string): string {
  const l = lang.toLowerCase();
  if (l === "kz" && book.title_kz) return book.title_kz;
  if (l === "en" && book.title_en) return book.title_en;
  return book.title_ru ?? book.title ?? "";
}

// ─── Mock fallback data ─────────────────────────────────────
const MOCK_BOOKS = [
  {
    id: "1", sku: "MH-ALG-10",
    title: "Алгебра и начала анализа",
    title_ru: "Алгебра и начала анализа",
    title_kz: "Алгебра және математикалық анализ бастамалары",
    title_en: "Algebra and Introductory Analysis",
    subject: "Математика", class_level: 10, price_b2c: 2850, price_b2g: 2200, stock_count: 48,
    language: "RU", author: "Колмогоров А.Н.", cover_image_url: null, is_active: true,
  },
  {
    id: "2", sku: "MH-HIS-09",
    title: "История Казахстана",
    title_ru: "История Казахстана",
    title_kz: "Қазақстан тарихы",
    title_en: "History of Kazakhstan",
    subject: "История", class_level: 9, price_b2c: 2400, price_b2g: 1900, stock_count: 120,
    language: "KZ", author: "Кан Г.В.", cover_image_url: null, is_active: true,
  },
  {
    id: "3", sku: "MH-CHM-11",
    title: "Химия. Органика",
    title_ru: "Химия. Органика",
    title_kz: "Химия. Органикалық химия",
    title_en: "Chemistry. Organic Chemistry",
    subject: "Химия", class_level: 11, price_b2c: 3100, price_b2g: 2500, stock_count: 0,
    language: "RU", author: "Рудзитис Г.Е.", cover_image_url: null, is_active: true,
  },
  {
    id: "4", sku: "MH-LIT-08",
    title: "Русский язык и литература",
    title_ru: "Русский язык и литература",
    title_kz: "Орыс тілі және әдебиеті",
    title_en: "Russian Language and Literature",
    subject: "Литература", class_level: 8, price_b2c: 2200, price_b2g: 1750, stock_count: 65,
    language: "RU", author: "Сабитова З.К.", cover_image_url: null, is_active: true,
  },
];

const SUBJECT_META = {
  "Математика":  { color: "#DBEAFE", accent: "#1D4ED8" },
  "История":     { color: "#FEF3C7", accent: "#D97706" },
  "Химия":       { color: "#D1FAE5", accent: "#059669" },
  "Литература":  { color: "#EDE9FE", accent: "#7C3AED" },
  "Физика":      { color: "#FFE4E6", accent: "#E11D48" },
  "Биология":    { color: "#DCFCE7", accent: "#16A34A" },
  "География":   { color: "#FEF9C3", accent: "#CA8A04" },
  "Информатика": { color: "#E0F2FE", accent: "#0284C7" },
};
const DEFAULT_META = { color: "#F1F5F9", accent: "#475569" };
const getMeta = (subject: string) =>
  SUBJECT_META[subject as keyof typeof SUBJECT_META] ?? DEFAULT_META;
const formatPrice = (p: number | null | undefined) =>
  p != null ? `₸ ${Number(p).toLocaleString("ru-KZ")}` : "—";

const HOME_STATS_ICONS = [Users, BookMarked, Package, CheckCircle] as const;

// ── Skeleton ────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden flex flex-col"
      style={{ background: "white", border: "1px solid #E5E7EB" }}>
      <div className="relative overflow-hidden" style={{ height: 180, background: "#F1F5F9" }}>
        <div className="absolute inset-0" style={{
          background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,.7) 50%,transparent 100%)",
          animation: "shimmer 1.4s infinite"
        }} />
      </div>
      <div className="p-4 flex flex-col gap-3">
        {[20, "100%", "70%"].map((w, i) => (
          <div key={i} style={{ height: i === 0 ? 12 : 16, width: w, borderRadius: 999, background: i === 2 ? "#F1F5F9" : "#E5E7EB" }} />
        ))}
        <div className="flex justify-between items-center mt-1">
          <div style={{ height: 20, width: 90, borderRadius: 999, background: "#E5E7EB" }} />
          <div style={{ height: 32, width: 110, borderRadius: 8, background: "#E5E7EB" }} />
        </div>
      </div>
    </div>
  );
}

// ── Error Banner ─────────────────────────────────────────────
function ErrorBanner({ onRetry }: { onRetry: () => void }) {
  const { m } = useI18n();
  return (
    <div className="col-span-full mb-2 flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{ background: "#FFF7ED", border: "1.5px solid #FED7AA" }}>
      <AlertCircle size={18} style={{ color: "#F97316", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.8125rem", color: "#92400E", fontWeight: 600 }}>
          {m.errors.supabaseTitle}
        </p>
        <p style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.75rem", color: "#B45309", marginTop: 2 }}>
          {m.errors.supabaseSubtitle}
        </p>
      </div>
      <button onClick={onRetry}
        style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.75rem", color: "#1D4ED8",
          background: "none", border: "none", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
        {m.catalog.retry}
      </button>
    </div>
  );
}

// ── Book Card ────────────────────────────────────────────────
function BookCard({ book, onAdd }: { book: any; onAdd: (id: string) => void }) {
  const { lang, m } = useI18n();
  const { items, setQty } = useCartStore();
  const meta = getMeta(book.subject);
  const outOfStock = book.stock_count === 0;
  const localTitle = getBookTitle(book, lang);
  const cartItem = items.find((i) => i.id === book.id);
  const cartQty = cartItem?.qty ?? 0;

  return (
    <div className="rounded-xl overflow-hidden flex flex-col transition-all duration-200"
      style={{ background: "white", border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,.10)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,.05)"}>

      {/* Cover */}
      <div className="relative flex items-center justify-center"
        style={{ background: meta.color, height: 180 }}>
        {book.class_level && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-semibold"
            style={{ background: meta.accent, color: "white", fontFamily: "system-ui,sans-serif" }}>
            {book.class_level} {m.book.classSuffix}
          </span>
        )}
        {book.cover_image_url
          ? <img src={book.cover_image_url} alt={localTitle} style={{ maxHeight: 140, objectFit: "contain" }} />
          : <>
              <div style={{ width: 56, height: 72, borderRadius: 6, background: meta.accent, opacity: .18 }} />
              <BookOpen size={34} style={{ color: meta.accent, position: "absolute", opacity: .65 }} />
            </>
        }
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        <p className="text-xs uppercase tracking-wide font-semibold mb-1"
          style={{ color: meta.accent, fontFamily: "system-ui,sans-serif" }}>
          {getSubjectLocalized(buildSubjects(book.subject || ""), lang)}
        </p>
        <h3 className="flex-1 mb-1"
          style={{ fontFamily: "'Georgia',serif", fontSize: "0.9375rem", fontWeight: 600, color: "#111827", lineHeight: 1.4 }}>
          {localTitle}
        </h3>
        {book.author && (
          <p className="mb-2" style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.72rem", color: "#9CA3AF" }}>
            {book.author}
          </p>
        )}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="w-1.5 h-1.5 rounded-full"
            style={{ background: outOfStock ? "#EF4444" : "#22C55E" }} />
          <span style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.7rem",
            color: outOfStock ? "#DC2626" : "#16A34A" }}>
            {outOfStock
              ? m.book.outOfStock
              : `${m.book.inStockPrefix} ${book.stock_count} ${m.book.inStockSuffix}`}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-auto">
          <div style={{ fontFamily: "system-ui,sans-serif", fontWeight: 700, fontSize: "1.0625rem", color: "#111827" }}>
            {formatPrice(book.price_b2c)}
          </div>

          {/* Cart control: qty controller if in cart, else add button */}
          {!outOfStock && cartQty > 0 ? (
            (() => {
              const effectiveMax = Math.min(MAX_QTY, book.stock_count ?? 0);
              const atLimit = cartQty >= effectiveMax;
              const atStockLimit = atLimit && (book.stock_count ?? 0) < MAX_QTY;
              const limitNote = atStockLimit
                ? `${m.cart.stockLimitReached} ${book.stock_count} ${m.book.inStockSuffix}`
                : m.cart.maxQtyNote;
              return (
                <div>
                  <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
                    <button onClick={() => setQty(book.id, cartQty - 1)}
                      className="flex items-center justify-center w-8 h-8"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#374151" }}>
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-xs font-bold"
                      style={{ fontFamily: "system-ui,sans-serif", color: "#111827", borderLeft: "1px solid #E5E7EB", borderRight: "1px solid #E5E7EB", lineHeight: "2rem" }}>
                      {cartQty}
                    </span>
                    <button onClick={() => setQty(book.id, cartQty + 1)}
                      disabled={atLimit}
                      className="flex items-center justify-center w-8 h-8"
                      style={{ background: "none", border: "none", cursor: atLimit ? "not-allowed" : "pointer", color: atLimit ? "#D1D5DB" : "#374151" }}
                      title={atLimit ? limitNote : undefined}>
                      <Plus size={12} />
                    </button>
                  </div>
                  {atLimit && (
                    <p style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.65rem", color: "#F97316", marginTop: 2, textAlign: "center" }}>
                      {limitNote}
                    </p>
                  )}
                </div>
              );
            })()
          ) : (
          <button onClick={() => !outOfStock && onAdd(book.id)} disabled={outOfStock}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all duration-200"
            style={{
              background: outOfStock ? "#E5E7EB" : "#1D4ED8",
              color: outOfStock ? "#9CA3AF" : "white",
              fontFamily: "system-ui,sans-serif", fontSize: "0.8125rem",
              border: "none", cursor: outOfStock ? "not-allowed" : "pointer", whiteSpace: "nowrap"
            }}>
            {outOfStock
              ? m.book.no
              : <><ShoppingCart size={14} /> {m.book.addToCart}</>
            }
          </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────
function MegaHubLandingInner() {
  const { lang, m } = useI18n();
  const { add } = useCartStore();

  const [books,   setBooks]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [dbError, setDbError]   = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setDbError(false);

    async function load() {
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
          .limit(4);

        if (cancelled) return;
        if (error) throw error;
        setBooks(data?.length ? data : MOCK_BOOKS);
        if (!data?.length) setDbError(true);
      } catch {
        if (!cancelled) { setBooks(MOCK_BOOKS); setDbError(true); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [fetchKey]);

  const handleAdd = (id: string) => {
    const book = books.find((b) => b.id === id);
    if (book) {
      add({
        id: book.id,
        sku: book.sku || book.id,
        titles: {
          ru: book.title_ru || book.title || "",
          kz: book.title_kz || book.title || "",
          en: book.title_en || book.title || "",
        },
        subjects: buildSubjects(book.subject || ""),
        price: book.price_b2c ?? 0,
        stock: book.stock_count ?? 0,
      });
    }
  };

  // All books are shown — titles rendered in current lang
  const filteredBooks = books;

  return (
    <div style={{ fontFamily: "'Georgia',serif", background: "#F8FAFC", minHeight: "100vh" }}>
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%) }
          100% { transform: translateX(200%)  }
        }
      `}</style>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#1E3A8A 0%,#1D4ED8 55%,#2563EB 100%)" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full opacity-10" style={{ background: "white" }} />
          <div className="absolute right-40 bottom-0 w-56 h-56 rounded-full opacity-5" style={{ background: "white" }} />
          <svg className="absolute inset-0 w-full h-full opacity-5">
            <defs>
              <pattern id="d" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.4" fill="white"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#d)"/>
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-18">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-7"
            style={{ background: "rgba(255,255,255,.14)", color: "rgba(255,255,255,.9)", fontFamily: "system-ui,sans-serif" }}>
            <Award size={12}/> {m.hero.badge}
          </div>

          {/* Title */}
          <h1 style={{ fontFamily: "'Georgia',serif", fontSize: "clamp(1.6rem,3.6vw,2.75rem)",
            fontWeight: 700, color: "white", lineHeight: 1.2, letterSpacing: "-.02em", marginBottom: "0.5rem" }}>
            {m.hero.titleTop}
          </h1>
          <h1 style={{ fontFamily: "'Georgia',serif", fontSize: "clamp(1.6rem,3.6vw,2.75rem)",
            fontWeight: 700, color: "#FCD34D", lineHeight: 1.2, letterSpacing: "-.02em", marginBottom: "1rem" }}>
            {m.hero.titleAccent}
          </h1>
          <p style={{ fontFamily: "system-ui,sans-serif", fontSize: "1.0625rem",
            color: "rgba(255,255,255,.8)", lineHeight: 1.65, marginBottom: "2.5rem", maxWidth: 560 }}>
            {m.hero.subtitle}
          </p>

          {/* ── PATH CARDS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            {/* Card 1: parent / student */}
            <a href="/catalog"
              className="group flex flex-col gap-3 rounded-2xl p-5 transition-all duration-200"
              style={{
                background: "rgba(255,255,255,.12)",
                border: "1.5px solid rgba(255,255,255,.22)",
                textDecoration: "none",
                backdropFilter: "blur(6px)",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,.12)")}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#F97316" }}>
                <BookOpen size={20} color="white" />
              </div>
              <div>
                <div style={{ fontFamily: "system-ui,sans-serif", fontWeight: 700, fontSize: "1rem", color: "white", marginBottom: "0.3rem" }}>
                  {m.home.pathCard1Title}
                </div>
                <div style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.8125rem", color: "rgba(255,255,255,.72)", lineHeight: 1.55 }}>
                  {m.home.pathCard1Sub}
                </div>
              </div>
              <div className="flex items-center gap-1 mt-auto"
                style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.8125rem", fontWeight: 600, color: "#FCD34D" }}>
                {m.home.pathCard1Cta} <ArrowRight size={14} />
              </div>
            </a>

            {/* Card 2: organization */}
            <a href="/organizations"
              className="group flex flex-col gap-3 rounded-2xl p-5 transition-all duration-200"
              style={{
                background: "rgba(255,255,255,.08)",
                border: "1.5px solid rgba(255,255,255,.16)",
                textDecoration: "none",
                backdropFilter: "blur(6px)",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.16)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,.08)")}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,.18)" }}>
                <Building2 size={20} color="white" />
              </div>
              <div>
                <div style={{ fontFamily: "system-ui,sans-serif", fontWeight: 700, fontSize: "1rem", color: "white", marginBottom: "0.3rem" }}>
                  {m.home.pathCard2Title}
                </div>
                <div style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.8125rem", color: "rgba(255,255,255,.72)", lineHeight: 1.55 }}>
                  {m.home.pathCard2Sub}
                </div>
              </div>
              <div className="flex items-center gap-1 mt-auto"
                style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,.8)" }}>
                {m.home.pathCard2Cta} <ArrowRight size={14} />
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ── HOME STATS ── */}
      <section style={{ background: "white", borderBottom: "1px solid #E5E7EB" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <p className="text-sm font-semibold text-center mb-6"
            style={{ fontFamily: "system-ui,sans-serif", color: "#6B7280" }}>
            {m.home.statsTitle}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {m.home.statsItems.map(({ value, label }, idx) => {
              const Icon = HOME_STATS_ICONS[idx] ?? BookMarked;
              return (
                <div key={label} className="flex items-center gap-3 p-4 rounded-xl"
                  style={{ background: "#F8FAFC", border: "1px solid #F3F4F6" }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "#EFF6FF" }}>
                    <Icon size={16} style={{ color: "#1D4ED8" }}/>
                  </div>
                  <div>
                    <div style={{ fontFamily: "system-ui,sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#111827" }}>{value}</div>
                    <div style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.7rem", color: "#6B7280", lineHeight: 1.3 }}>{label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CATALOG ── */}
      <section className="py-16 lg:py-20" style={{ background: "#F8FAFC" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "#F97316", fontFamily: "system-ui,sans-serif" }}>
                {m.catalog.eyebrow}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 style={{ fontFamily: "'Georgia',serif", fontSize: "clamp(1.375rem,3vw,2rem)",
                  fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
                  {m.catalog.title}
                </h2>
                {!loading && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: dbError ? "#FFF7ED" : "#DCFCE7", color: dbError ? "#92400E" : "#15803D",
                      fontFamily: "system-ui,sans-serif" }}>
                    <span className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{ background: dbError ? "#F97316" : "#22C55E" }}/>
                    {dbError ? m.catalog.demo : m.catalog.live}
                  </span>
                )}
              </div>
            </div>
            <a href="/catalog" className="hidden sm:inline-flex items-center gap-1"
              style={{ color: "#1D4ED8", textDecoration: "none", fontFamily: "system-ui,sans-serif", fontSize: "0.875rem", fontWeight: 500 }}>
              {m.catalog.allCatalog} <ChevronRight size={16}/>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {dbError && !loading && <ErrorBanner onRetry={() => setFetchKey(k => k+1)} />}
            {!loading && filteredBooks.length === 0 && (
              <div className="col-span-full rounded-xl px-4 py-4"
                style={{ background: "white", border: "1px solid #E5E7EB",
                  fontFamily: "system-ui,sans-serif", color: "#374151", fontSize: "0.875rem" }}>
                {m.catalog.empty}
              </div>
            )}
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i}/>)
              : filteredBooks.map(b => (
                  <BookCard
                    key={b.id}
                    book={b}
                    onAdd={handleAdd}
                  />
                ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#111827" }} className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#1D4ED8" }}>
                <BookOpen size={16} color="white"/>
              </div>
              <span style={{ fontFamily: "'Georgia',serif", color: "white", fontWeight: 600 }}>
                {m.brand.megaHub} {m.brand.education}
              </span>
            </div>
            <p style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.8125rem", color: "#4B5563" }}>
              {m.footer.copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Page() {
  return <MegaHubLandingInner />;
}

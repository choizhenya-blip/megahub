"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, ShoppingCart, Plus, Minus, Trash2, Send, X,
  CheckCircle2, Loader2, AlertCircle, BookOpen,
  LayoutGrid, List, SlidersHorizontal, ChevronRight,
} from "lucide-react";
import { useB2bCartStore } from "@/lib/b2bStore";

interface Book {
  id: string;
  title_ru: string;
  title_kz?: string;
  title_en?: string;
  author?: string;
  subject?: string;
  class_level?: number;
  class_level_to?: number;
  sku?: string;
  images?: string[];
  cover_image_url?: string;
}

type ViewMode = "grid" | "list";

const PAGE_SIZES = [10, 20, 50, 100];
const LS_VIEW = "b2b_catalog_view";
const LS_PAGE_SIZE = "b2b_catalog_page_size";

const SUBJECTS = [
  { value: "math", label: "Математика" },
  { value: "physics", label: "Физика" },
  { value: "languages", label: "Языки" },
];

/* Тёплые градиенты-заглушки для обложек без картинки */
const COVER_GRADIENTS = [
  "linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)",
  "linear-gradient(135deg, #F0FDF4 0%, #BBF7D0 100%)",
  "linear-gradient(135deg, #FFF7ED 0%, #FED7AA 100%)",
  "linear-gradient(135deg, #F5F3FF 0%, #DDD6FE 100%)",
  "linear-gradient(135deg, #FDF2F8 0%, #FBCFE8 100%)",
];
const coverGradient = (id: string) =>
  COVER_GRADIENTS[id.charCodeAt(0) % COVER_GRADIENTS.length];

/* ─── Skeleton card ─── */
function SkeletonCard() {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #F3F4F6", overflow: "hidden" }}>
      <div style={{ height: 150, background: "linear-gradient(90deg, #F3F4F6 25%, #E9EAEB 50%, #F3F4F6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
      <div style={{ padding: "14px 14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ height: 12, width: "40%", borderRadius: 6, background: "#F3F4F6", animation: "shimmer 1.4s infinite" }} />
        <div style={{ height: 14, width: "85%", borderRadius: 6, background: "#F3F4F6", animation: "shimmer 1.4s infinite" }} />
        <div style={{ height: 12, width: "55%", borderRadius: 6, background: "#F3F4F6", animation: "shimmer 1.4s infinite" }} />
        <div style={{ height: 36, borderRadius: 9, background: "#F3F4F6", marginTop: 4, animation: "shimmer 1.4s infinite" }} />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 16, padding: "12px 16px" }}>
      <div style={{ width: 56, height: 72, borderRadius: 8, background: "#F3F4F6", flexShrink: 0, animation: "shimmer 1.4s infinite" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
        <div style={{ height: 11, width: "30%", borderRadius: 5, background: "#F3F4F6", animation: "shimmer 1.4s infinite" }} />
        <div style={{ height: 14, width: "70%", borderRadius: 5, background: "#F3F4F6", animation: "shimmer 1.4s infinite" }} />
        <div style={{ height: 11, width: "40%", borderRadius: 5, background: "#F3F4F6", animation: "shimmer 1.4s infinite" }} />
      </div>
      <div style={{ width: 90, height: 36, borderRadius: 9, background: "#F3F4F6", flexShrink: 0, animation: "shimmer 1.4s infinite" }} />
    </div>
  );
}

/* ─── Cart controls ─── */
function CartControls({
  id, cartItem, onAdd, onSetQty, onRemove, compact,
}: {
  id: string; cartItem: { qty: number } | undefined;
  onAdd: () => void; onSetQty: (n: number) => void; onRemove: () => void;
  compact?: boolean;
}) {
  if (!cartItem) {
    return (
      <button
        onClick={onAdd}
        className="b2b-add-btn"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: compact ? "8px 14px" : "9px 0",
          width: compact ? "auto" : "100%",
          borderRadius: 9, background: "#001A33", color: "#fff",
          border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
          whiteSpace: "nowrap", transition: "background 0.15s",
        }}
      >
        <Plus size={13} /> В заявку
      </button>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #E5E7EB", borderRadius: 9, overflow: "hidden" }}>
        <button onClick={() => onSetQty(cartItem.qty - 1)} style={{ padding: "7px 9px", background: "#F9FAFB", border: "none", cursor: "pointer", color: "#374151", display: "flex", alignItems: "center" }}>
          <Minus size={13} />
        </button>
        <input
          type="number" value={cartItem.qty} min={1}
          onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v > 0) onSetQty(v); }}
          style={{ width: 40, textAlign: "center", border: "none", fontSize: 14, fontWeight: 700, color: "#111827", outline: "none", padding: "7px 0" }}
        />
        <button onClick={() => onSetQty(cartItem.qty + 1)} style={{ padding: "7px 9px", background: "#F9FAFB", border: "none", cursor: "pointer", color: "#374151", display: "flex", alignItems: "center" }}>
          <Plus size={13} />
        </button>
      </div>
      <button onClick={onRemove} style={{ padding: "7px 9px", borderRadius: 8, background: "#FEF2F2", border: "none", cursor: "pointer", color: "#DC2626", display: "flex", alignItems: "center" }}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export default function B2bCatalogPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const { items, add, setQty, remove, clear } = useB2bCartStore();
  const cartCount = items.reduce((s, i) => s + i.qty, 0);

  /* ─── Restore preferences ─── */
  useEffect(() => {
    const savedView = localStorage.getItem(LS_VIEW) as ViewMode | null;
    if (savedView === "grid" || savedView === "list") setViewMode(savedView);
    const savedSize = Number(localStorage.getItem(LS_PAGE_SIZE));
    if (PAGE_SIZES.includes(savedSize)) setPageSize(savedSize);
  }, []);

  const handleSetView = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(LS_VIEW, mode);
  };
  const handleSetPageSize = (n: number) => {
    setPageSize(n);
    setPage(1);
    localStorage.setItem(LS_PAGE_SIZE, String(n));
  };

  useEffect(() => { setPage(1); }, [search, selectedSubjects, selectedClasses]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/b2b/catalog", { cache: "no-store" });
        if (res.status === 401) { window.location.href = "/b2b/login"; return; }
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setFetchError(json.error ?? `Ошибка ${res.status}`);
        } else {
          const json = await res.json();
          setBooks(json.books ?? []);
        }
      } catch (e) {
        setFetchError(e instanceof Error ? e.message : "Ошибка загрузки");
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = books.filter((b) => {
    if (search && !(b.title_ru ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedSubjects.length > 0 && !selectedSubjects.some((s) => b.subject?.toLowerCase().includes(s))) return false;
    if (selectedClasses.length > 0) {
      const ok = selectedClasses.some((c) =>
        b.class_level !== undefined && c >= b.class_level && c <= (b.class_level_to ?? b.class_level)
      );
      if (!ok) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const getCartItem = useCallback((id: string) => items.find((i) => i.id === id), [items]);
  const coverImg = (b: Book) => (b.images?.length ? b.images[0] : null) ?? b.cover_image_url ?? null;

  function classLabel(b: Book) {
    if (!b.class_level) return null;
    return b.class_level_to && b.class_level_to !== b.class_level
      ? `${b.class_level}–${b.class_level_to} кл.`
      : `${b.class_level} кл.`;
  }

  async function handleSubmitQuote() {
    if (items.length === 0) return;
    setSubmitting(true); setSubmitError(null);
    const res = await fetch("/api/b2b/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ book_id: i.id, sku: i.sku, title_ru: i.title_ru, qty: i.qty })),
        comment: comment.trim() || undefined,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      clear(); setComment(""); setSubmitDone(true);
      setTimeout(() => { setSubmitDone(false); setCartOpen(false); }, 3000);
    } else {
      const json = await res.json();
      setSubmitError(json.error ?? "Ошибка при отправке заявки");
    }
  }

  const activeFiltersCount = selectedSubjects.length + selectedClasses.length + (search ? 1 : 0);

  return (
    <div style={{ paddingTop: 28 }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F5F3FF", border: "1px solid #DDD6FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BookOpen size={18} color="#7C3AED" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#001A33", margin: 0, letterSpacing: "-0.01em" }}>Каталог</h1>
          {!loading && (
            <span style={{ fontSize: 13, color: "#9CA3AF", background: "#F3F4F6", borderRadius: 20, padding: "2px 10px", fontWeight: 500 }}>
              {filtered.length} {filtered.length === 1 ? "книга" : filtered.length < 5 ? "книги" : "книг"}
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, color: "#6B7280", margin: 0, paddingLeft: 46 }}>
          Формируйте заявку — менеджер подберёт индивидуальные условия и цены.
        </p>
      </div>

      {/* ── Filters ── */}
      <div style={{
        background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB",
        padding: "14px 18px", marginBottom: 12,
      }}>
        {/* Search row */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
            <input
              placeholder="Поиск по названию или автору…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                border: "1.5px solid #E5E7EB", borderRadius: 9,
                padding: "9px 12px 9px 33px", fontSize: 13, outline: "none", color: "#111827",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
            />
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={() => { setSearch(""); setSelectedSubjects([]); setSelectedClasses([]); }}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 12px", borderRadius: 8, border: "1px solid #FECACA",
                background: "#FEF2F2", color: "#DC2626",
                fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              <X size={12} /> Сбросить ({activeFiltersCount})
            </button>
          )}
        </div>

        {/* Subject + class row */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>Предмет</span>
            <div style={{ display: "flex", gap: 5 }}>
              {SUBJECTS.map((s) => {
                const active = selectedSubjects.includes(s.value);
                return (
                  <button
                    key={s.value}
                    onClick={() => setSelectedSubjects((prev) =>
                      active ? prev.filter((x) => x !== s.value) : [...prev, s.value]
                    )}
                    style={{
                      padding: "5px 11px", borderRadius: 7, border: "1.5px solid",
                      borderColor: active ? "#F97316" : "#E5E7EB",
                      background: active ? "#FFF7ED" : "#F9FAFB",
                      color: active ? "#C2410C" : "#6B7280",
                      fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>Класс</span>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {Array.from({ length: 11 }, (_, i) => i + 1).map((cls) => {
                const active = selectedClasses.includes(cls);
                return (
                  <button
                    key={cls}
                    onClick={() => setSelectedClasses((prev) =>
                      active ? prev.filter((x) => x !== cls) : [...prev, cls]
                    )}
                    style={{
                      width: 30, height: 30, borderRadius: 7, border: "1.5px solid",
                      borderColor: active ? "#F97316" : "#E5E7EB",
                      background: active ? "#FFF7ED" : "#F9FAFB",
                      color: active ? "#C2410C" : "#6B7280",
                      fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {cls}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar strip ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16, padding: "0 2px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <SlidersHorizontal size={14} color="#9CA3AF" />
          <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>
            {loading ? "Загрузка…" : `${filtered.length} результатов`}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Page size */}
          <select
            value={pageSize}
            onChange={(e) => handleSetPageSize(Number(e.target.value))}
            style={{
              height: 34, padding: "0 26px 0 10px", borderRadius: 8,
              border: "1.5px solid #E5E7EB", fontSize: 12, color: "#374151",
              background: "#fff", cursor: "pointer", outline: "none",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
            }}
          >
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n} / стр.</option>)}
          </select>

          {/* View toggle */}
          <div style={{ display: "flex", gap: 2, background: "#F3F4F6", borderRadius: 9, padding: 3 }}>
            {([["grid", LayoutGrid, "Плитка"], ["list", List, "Список"]] as const).map(([mode, Icon, title]) => (
              <button
                key={mode}
                onClick={() => handleSetView(mode)}
                title={title}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 28, height: 28, borderRadius: 7, border: "none",
                  background: viewMode === mode ? "#fff" : "transparent",
                  color: viewMode === mode ? "#F97316" : "#9CA3AF",
                  cursor: "pointer",
                  boxShadow: viewMode === mode ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                  transition: "all 0.15s",
                }}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Fetch error ── */}
      {fetchError && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "#FEF2F2", border: "1.5px solid #FECACA",
          borderRadius: 12, padding: "14px 18px", marginBottom: 20,
          fontSize: 13, color: "#991B1B",
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>Не удалось загрузить каталог: {fetchError}</span>
          <button
            onClick={() => { setFetchError(null); setLoading(true); window.location.reload(); }}
            style={{ marginLeft: "auto", background: "#DC2626", color: "#fff", border: "none", borderRadius: 7, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >Повторить</button>
        </div>
      )}

      {/* ── Books ── */}
      {loading ? (
        viewMode === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        )
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "56px 0",
          background: "#fff", borderRadius: 16, border: "1.5px dashed #E5E7EB",
        }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <BookOpen size={28} color="#D1D5DB" />
          </div>
          <p style={{ color: "#374151", fontSize: 15, fontWeight: 600, margin: 0 }}>Ничего не найдено</p>
          <p style={{ color: "#9CA3AF", fontSize: 13, marginTop: 6 }}>Попробуйте изменить фильтры или поисковый запрос</p>
          {activeFiltersCount > 0 && (
            <button
              onClick={() => { setSearch(""); setSelectedSubjects([]); setSelectedClasses([]); }}
              style={{ marginTop: 16, padding: "8px 20px", borderRadius: 9, background: "#F97316", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Сбросить фильтры
            </button>
          )}
        </div>

      ) : viewMode === "grid" ? (
        /* ══ GRID ══ */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {paginated.map((b) => {
            const cartItem = getCartItem(b.id);
            const img = coverImg(b);
            const inCart = !!cartItem;
            return (
              <div
                key={b.id}
                className="b2b-card"
                style={{
                  background: "#fff", borderRadius: 14,
                  border: `1.5px solid ${inCart ? "#FED7AA" : "#F0F0F0"}`,
                  overflow: "hidden", display: "flex", flexDirection: "column",
                  transition: "box-shadow 0.18s, transform 0.18s",
                  boxShadow: inCart ? "0 0 0 3px #FFF7ED" : "none",
                }}
              >
                {/* Cover */}
                <div style={{
                  height: 150,
                  background: img ? "#F3F4F6" : coverGradient(b.id),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", position: "relative",
                }}>
                  {img
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={img} alt={b.title_ru} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <BookOpen size={36} color="rgba(0,0,0,0.12)" />
                  }
                  {inCart && (
                    <div style={{
                      position: "absolute", top: 8, right: 8,
                      background: "#F97316", borderRadius: 6,
                      width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <ShoppingCart size={12} color="#fff" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: "12px 13px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  {classLabel(b) && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", background: "#F5F3FF", padding: "2px 6px", borderRadius: 5, alignSelf: "flex-start" }}>
                      {classLabel(b)}
                    </span>
                  )}
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0, lineHeight: 1.45 }}>
                    {b.title_ru}
                  </h3>
                  {b.author && <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>{b.author}</p>}
                </div>

                {/* Cart */}
                <div style={{ padding: "0 13px 13px" }}>
                  <CartControls
                    id={b.id} cartItem={cartItem}
                    onAdd={() => add({ id: b.id, sku: b.sku ?? b.id, title_ru: b.title_ru, title_kz: b.title_kz, title_en: b.title_en, author: b.author })}
                    onSetQty={(n) => setQty(b.id, n)}
                    onRemove={() => remove(b.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>

      ) : (
        /* ══ LIST ══ */
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {paginated.map((b) => {
            const cartItem = getCartItem(b.id);
            const img = coverImg(b);
            const inCart = !!cartItem;
            return (
              <div
                key={b.id}
                className="b2b-row"
                style={{
                  background: "#fff", borderRadius: 12,
                  border: `1.5px solid ${inCart ? "#FED7AA" : "#F0F0F0"}`,
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "10px 14px",
                  boxShadow: inCart ? "0 0 0 3px #FFF7ED" : "none",
                  transition: "box-shadow 0.15s",
                }}
              >
                {/* Thumb */}
                <div style={{
                  width: 52, height: 68, flexShrink: 0,
                  background: img ? "#F3F4F6" : coverGradient(b.id),
                  borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                }}>
                  {img
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={img} alt={b.title_ru} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <BookOpen size={20} color="rgba(0,0,0,0.12)" />
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                    {classLabel(b) && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#7C3AED", background: "#F5F3FF", padding: "1px 6px", borderRadius: 4, whiteSpace: "nowrap" }}>
                        {classLabel(b)}
                      </span>
                    )}
                    {b.subject && (
                      <span style={{ fontSize: 10, color: "#9CA3AF" }}>{b.subject}</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {b.title_ru}
                  </h3>
                  {b.author && <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0" }}>{b.author}</p>}
                </div>

                {/* Cart */}
                <div style={{ flexShrink: 0 }}>
                  <CartControls
                    id={b.id} cartItem={cartItem} compact
                    onAdd={() => add({ id: b.id, sku: b.sku ?? b.id, title_ru: b.title_ru, title_kz: b.title_kz, title_en: b.title_en, author: b.author })}
                    onSetQty={(n) => setQty(b.id, n)}
                    onRemove={() => remove(b.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && filtered.length > 0 && totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 28, flexWrap: "wrap" }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            style={{ padding: "7px 13px", borderRadius: 8, border: "1.5px solid #E5E7EB", background: safePage === 1 ? "#F9FAFB" : "#fff", color: safePage === 1 ? "#D1D5DB" : "#374151", fontSize: 13, fontWeight: 600, cursor: safePage === 1 ? "default" : "pointer" }}
          >←</button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
            .reduce<(number | "…")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
              acc.push(p);
              return acc;
            }, [])
            .map((p, idx) =>
              p === "…"
                ? <span key={`e${idx}`} style={{ color: "#9CA3AF", padding: "0 4px", fontSize: 13 }}>…</span>
                : (
                  <button key={p} onClick={() => setPage(p as number)} style={{
                    width: 34, height: 34, borderRadius: 8, border: "1.5px solid",
                    borderColor: safePage === p ? "#F97316" : "#E5E7EB",
                    background: safePage === p ? "#FFF7ED" : "#fff",
                    color: safePage === p ? "#C2410C" : "#374151",
                    fontSize: 13, fontWeight: safePage === p ? 700 : 500, cursor: "pointer",
                  }}>{p}</button>
                )
            )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            style={{ padding: "7px 13px", borderRadius: 8, border: "1.5px solid #E5E7EB", background: safePage === totalPages ? "#F9FAFB" : "#fff", color: safePage === totalPages ? "#D1D5DB" : "#374151", fontSize: 13, fontWeight: 600, cursor: safePage === totalPages ? "default" : "pointer" }}
          >→</button>

          <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: 6 }}>
            {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} из {filtered.length}
          </span>
        </div>
      )}

      {/* ── Floating cart button ── */}
      {cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="b2b-float-cart"
          style={{
            position: "fixed", bottom: 28, right: 28, zIndex: 90,
            display: "flex", alignItems: "center", gap: 10,
            background: "#F97316", color: "#fff",
            border: "none", borderRadius: 14,
            padding: "13px 22px", fontSize: 14, fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(249,115,22,0.45)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
        >
          <ShoppingCart size={17} />
          Заявка — {cartCount} поз.
          <ChevronRight size={15} />
        </button>
      )}

      {/* ── Cart drawer ── */}
      {cartOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setCartOpen(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,26,51,0.5)", zIndex: 999, display: "flex", justifyContent: "flex-end" }}
        >
          <div style={{ background: "#fff", width: "100%", maxWidth: 480, height: "100%", display: "flex", flexDirection: "column", boxShadow: "-8px 0 32px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0 }}>Заявка на цену</h2>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{cartCount} позиций</p>
              </div>
              <button onClick={() => setCartOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
              {submitDone ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 20, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <CheckCircle2 size={36} color="#22C55E" />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>Заявка отправлена!</h3>
                  <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, marginTop: 8 }}>
                    Менеджер свяжется с вами для уточнения условий и цен.
                  </p>
                </div>
              ) : (
                <>
                  {items.map((item) => (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #F9FAFB" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{item.title_ru}</div>
                        {item.author && <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{item.author}</div>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 1, border: "1.5px solid #E5E7EB", borderRadius: 8, overflow: "hidden" }}>
                        <button onClick={() => setQty(item.id, item.qty - 1)} style={{ padding: "5px 9px", background: "none", border: "none", cursor: "pointer", color: "#374151", display: "flex" }}>
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#111827", minWidth: 26, textAlign: "center" }}>{item.qty}</span>
                        <button onClick={() => setQty(item.id, item.qty + 1)} style={{ padding: "5px 9px", background: "none", border: "none", cursor: "pointer", color: "#374151", display: "flex" }}>
                          <Plus size={12} />
                        </button>
                      </div>
                      <button onClick={() => remove(item.id)} style={{ padding: 5, background: "none", border: "none", cursor: "pointer", color: "#D1D5DB" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  <div style={{ marginTop: 20 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 7 }}>
                      Комментарий к заявке
                    </label>
                    <textarea
                      value={comment} onChange={(e) => setComment(e.target.value)}
                      placeholder="Сроки, регион доставки, особые требования…"
                      rows={3}
                      style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 12px", fontSize: 13, resize: "vertical", outline: "none", fontFamily: "inherit" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
                    />
                  </div>

                  {submitError && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 9, padding: "10px 12px", fontSize: 13, color: "#991B1B", marginTop: 12 }}>
                      <AlertCircle size={14} /> {submitError}
                    </div>
                  )}
                </>
              )}
            </div>

            {!submitDone && (
              <div style={{ padding: "16px 24px", borderTop: "1px solid #F3F4F6" }}>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 12, lineHeight: 1.5 }}>
                  💡 Цены не фиксированы — менеджер рассчитает индивидуальные условия после получения заявки.
                </div>
                <button
                  onClick={handleSubmitQuote}
                  disabled={submitting || items.length === 0}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", padding: "13px", borderRadius: 10, border: "none",
                    background: submitting || items.length === 0 ? "#94A3B8" : "#F97316",
                    color: "#fff", fontSize: 15, fontWeight: 700,
                    cursor: submitting || items.length === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting
                    ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Отправка…</>
                    : <><Send size={16} />Отправить заявку</>
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .b2b-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.09) !important; transform: translateY(-2px); }
        .b2b-row:hover { background: #FAFAFA !important; }
        .b2b-add-btn:hover { background: #F97316 !important; }
        .b2b-float-cart:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(249,115,22,0.55) !important; }
      `}</style>
    </div>
  );
}

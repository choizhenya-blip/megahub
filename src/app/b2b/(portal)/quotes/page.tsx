"use client";

import { useState, useEffect } from "react";
import {
  FileText, Loader2, Package, Clock, CheckCircle,
  XCircle, ChevronDown, ChevronUp, BookOpen,
} from "lucide-react";

interface Quote {
  id: string;
  items: { book_id: string; sku: string; title_ru: string; qty: number }[];
  comment?: string;
  status: "new" | "in_review" | "priced" | "completed" | "cancelled";
  manager_notes?: string;
  created_at: string;
}

const STATUS_CONFIG = {
  new:        { label: "Новая",          color: "#2563EB", bg: "#EFF6FF",  border: "#BFDBFE", dot: "#3B82F6", icon: Clock        },
  in_review:  { label: "На рассмотрении", color: "#D97706", bg: "#FFFBEB",  border: "#FDE68A", dot: "#F59E0B", icon: Clock        },
  priced:     { label: "Цены готовы",    color: "#7C3AED", bg: "#F5F3FF",  border: "#DDD6FE", dot: "#8B5CF6", icon: CheckCircle  },
  completed:  { label: "Выполнена",      color: "#16A34A", bg: "#F0FDF4",  border: "#BBF7D0", dot: "#22C55E", icon: CheckCircle  },
  cancelled:  { label: "Отменена",       color: "#DC2626", bg: "#FEF2F2",  border: "#FECACA", dot: "#EF4444", icon: XCircle      },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    year: "numeric", month: "long", day: "numeric",
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function SkeletonQuote() {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #F0F0F0", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ height: 12, width: 120, borderRadius: 5, background: "#F3F4F6", animation: "shimmer 1.4s infinite" }} />
          <div style={{ height: 10, width: 80, borderRadius: 5, background: "#F3F4F6", animation: "shimmer 1.4s infinite" }} />
        </div>
        <div style={{ height: 28, width: 110, borderRadius: 7, background: "#F3F4F6", animation: "shimmer 1.4s infinite" }} />
      </div>
      <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 9 }}>
        {[80, 65, 70].map((w, i) => (
          <div key={i} style={{ height: 13, width: `${w}%`, borderRadius: 5, background: "#F3F4F6", animation: "shimmer 1.4s infinite" }} />
        ))}
      </div>
    </div>
  );
}

function QuoteCard({ q }: { q: Quote }) {
  const [open, setOpen] = useState(true);
  const cfg = STATUS_CONFIG[q.status] ?? STATUS_CONFIG.new;
  const StatusIcon = cfg.icon;
  const totalItems = q.items.reduce((s, i) => s + i.qty, 0);

  return (
    <div style={{
      background: "#fff", borderRadius: 14, overflow: "hidden",
      border: `1.5px solid ${cfg.border}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      {/* Header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", cursor: "pointer",
          background: cfg.bg,
          borderBottom: open ? `1px solid ${cfg.border}` : "none",
          transition: "background 0.15s",
        }}
      >
        {/* Left: date + ID */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11, background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            border: `1px solid ${cfg.border}`,
            flexShrink: 0,
          }}>
            <StatusIcon size={18} color={cfg.color} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
              {formatDate(q.created_at)}
              <span style={{ fontSize: 11, fontWeight: 400, color: "#9CA3AF", marginLeft: 6 }}>
                {formatTime(q.created_at)}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <span style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "monospace" }}>
                #{q.id.slice(0, 8).toUpperCase()}
              </span>
              <span style={{ fontSize: 11, color: cfg.color, fontWeight: 600 }}>
                {q.items.length} {q.items.length === 1 ? "позиция" : q.items.length < 5 ? "позиции" : "позиций"}, {totalItems} шт.
              </span>
            </div>
          </div>
        </div>

        {/* Right: status + chevron */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "#fff", color: cfg.color,
            padding: "5px 11px", borderRadius: 8,
            fontSize: 12, fontWeight: 700,
            border: `1px solid ${cfg.border}`,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
            {cfg.label}
          </span>
          {open
            ? <ChevronUp size={15} color="#9CA3AF" />
            : <ChevronDown size={15} color="#9CA3AF" />
          }
        </div>
      </div>

      {/* Body */}
      {open && (
        <div style={{ padding: "14px 18px 16px" }}>
          {/* Items */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {q.items.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "#F9FAFB", borderRadius: 9,
                  padding: "9px 12px",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" }}>
                  <Package size={13} color="#C4B5FD" style={{ flexShrink: 0 }} />
                  {item.title_ru}
                </span>
                <span style={{
                  flexShrink: 0, marginLeft: 16,
                  background: "#EDE9FE", color: "#6D28D9",
                  padding: "2px 9px", borderRadius: 6,
                  fontSize: 12, fontWeight: 700,
                }}>
                  {item.qty} шт.
                </span>
              </div>
            ))}
          </div>

          {/* Comment */}
          {q.comment && (
            <div style={{
              marginTop: 12, padding: "10px 13px",
              background: "#F8FAFC", borderRadius: 9, borderLeft: "3px solid #CBD5E1",
              fontSize: 13, color: "#374151", lineHeight: 1.5,
            }}>
              <span style={{ fontWeight: 600, color: "#64748B" }}>Комментарий: </span>
              {q.comment}
            </div>
          )}

          {/* Manager notes */}
          {q.manager_notes && (
            <div style={{
              marginTop: 10, padding: "10px 13px",
              background: "#F0FDF4", borderRadius: 9, borderLeft: "3px solid #86EFAC",
              fontSize: 13, color: "#166534", lineHeight: 1.5,
            }}>
              <div style={{ fontWeight: 700, marginBottom: 3, display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle size={13} color="#22C55E" /> Ответ менеджера
              </div>
              {q.manager_notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function B2bQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/b2b/quotes");
      if (res.ok) {
        const json = await res.json();
        setQuotes(json.quotes ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div style={{ paddingTop: 28 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EFF6FF", border: "1px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={18} color="#2563EB" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#001A33", margin: 0, letterSpacing: "-0.01em" }}>Мои заявки</h1>
          {!loading && quotes.length > 0 && (
            <span style={{ fontSize: 13, color: "#9CA3AF", background: "#F3F4F6", borderRadius: 20, padding: "2px 10px", fontWeight: 500 }}>
              {quotes.length} {quotes.length === 1 ? "заявка" : quotes.length < 5 ? "заявки" : "заявок"}
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, color: "#6B7280", margin: 0, paddingLeft: 46 }}>
          История ваших запросов на ценообразование
        </p>
      </div>

      {/* ── Status legend ── */}
      {!loading && quotes.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {(Object.entries(STATUS_CONFIG) as [keyof typeof STATUS_CONFIG, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, cfg]) => {
            const count = quotes.filter(q => q.status === key).length;
            if (!count) return null;
            return (
              <span key={key} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 7,
                background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                fontSize: 11, fontWeight: 700,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot }} />
                {cfg.label}: {count}
              </span>
            );
          })}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => <SkeletonQuote key={i} />)}
        </div>
      ) : quotes.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 24px",
          background: "#fff", borderRadius: 16, border: "1.5px dashed #E5E7EB",
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: "0 auto 16px",
            background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FileText size={32} color="#8B5CF6" />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: 0 }}>Заявок пока нет</h3>
          <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 8, lineHeight: 1.6, maxWidth: 320, margin: "8px auto 0" }}>
            Перейдите в каталог, добавьте нужные книги и отправьте заявку на расчёт цен.
          </p>
          <a
            href="/b2b/catalog"
            style={{
              display: "inline-flex", alignItems: "center", gap: 7, marginTop: 20,
              padding: "11px 24px", borderRadius: 10,
              background: "#F97316", color: "#fff",
              fontSize: 14, fontWeight: 700, textDecoration: "none",
            }}
          >
            <BookOpen size={15} /> Открыть каталог
          </a>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {quotes.map((q) => <QuoteCard key={q.id} q={q} />)}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2, Package, Clock, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Save, AlertCircle, Phone, Mail,
  User, MessageSquare,
} from "lucide-react";

interface Quote {
  id: string;
  items: { book_id: string; sku: string; title_ru: string; qty: number }[];
  comment?: string;
  status: string;
  manager_notes?: string;
  created_at: string;
  b2b_users?: {
    email: string;
    contact_name: string;
    company_name?: string;
    phone?: string;
  };
}

const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string; dot: string;
  icon: React.ElementType;
}> = {
  new:       { label: "Новая",          color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", dot: "#3B82F6", icon: Clock       },
  in_review: { label: "На рассмотрении", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", dot: "#F59E0B", icon: Clock       },
  priced:    { label: "Цены готовы",    color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", dot: "#8B5CF6", icon: CheckCircle },
  completed: { label: "Выполнена",      color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", dot: "#22C55E", icon: CheckCircle },
  cancelled: { label: "Отменена",       color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", dot: "#EF4444", icon: XCircle    },
};

const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }));

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

/* ── Skeleton ── */
function SkeletonQuote() {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #F0F0F0", overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F8FAFC", borderBottom: "1px solid #F0F0F0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: "#F3F4F6", animation: "shimmer 1.4s infinite" }} />
          <div>
            <div style={{ height: 13, width: 160, borderRadius: 5, background: "#F3F4F6", marginBottom: 6, animation: "shimmer 1.4s infinite" }} />
            <div style={{ height: 11, width: 220, borderRadius: 5, background: "#F3F4F6", animation: "shimmer 1.4s infinite" }} />
          </div>
        </div>
        <div style={{ height: 28, width: 120, borderRadius: 8, background: "#F3F4F6", animation: "shimmer 1.4s infinite" }} />
      </div>
      <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
        {[80, 65, 72].map((w, i) => (
          <div key={i} style={{ height: 36, borderRadius: 8, background: "#F3F4F6", width: `${w}%`, animation: "shimmer 1.4s infinite" }} />
        ))}
      </div>
    </div>
  );
}

/* ── Quote card ── */
function QuoteRow({ quote, onUpdated }: { quote: Quote; onUpdated: () => void }) {
  const [expanded, setExpanded] = useState(quote.status === "new");
  const [status, setStatus] = useState(quote.status);
  const [notes, setNotes] = useState(quote.manager_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = quote.b2b_users;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.new;
  const StatusIcon = cfg.icon;
  const totalQty = quote.items.reduce((s, i) => s + i.qty, 0);

  async function handleSave() {
    setSaving(true); setError(null);
    const res = await fetch("/api/admin/b2b", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: quote.id, status, manager_notes: notes }),
    });
    setSaving(false);
    if (!res.ok) { const j = await res.json(); setError(j.error ?? "Ошибка"); }
    else onUpdated();
  }

  return (
    <div style={{
      background: "#fff", borderRadius: 14, overflow: "hidden",
      border: `1.5px solid ${cfg.border}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      {/* ── Header ── */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "13px 18px", cursor: "pointer",
          background: cfg.bg,
          borderBottom: expanded ? `1px solid ${cfg.border}` : "none",
          transition: "background 0.15s",
        }}
      >
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11, background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${cfg.border}`,
            flexShrink: 0,
          }}>
            <StatusIcon size={18} color={cfg.color} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
              {user?.company_name ?? user?.contact_name ?? "—"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "monospace" }}>
                #{quote.id.slice(0, 8).toUpperCase()}
              </span>
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>·</span>
              <span style={{ fontSize: 11, color: cfg.color, fontWeight: 600 }}>
                {quote.items.length} поз., {totalQty} шт.
              </span>
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>·</span>
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                {formatDate(quote.created_at)}, {formatTime(quote.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "#fff", color: cfg.color,
            padding: "5px 11px", borderRadius: 8,
            fontSize: 12, fontWeight: 700, border: `1px solid ${cfg.border}`,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot }} />
            {cfg.label}
          </span>
          {expanded ? <ChevronUp size={15} color="#9CA3AF" /> : <ChevronDown size={15} color="#9CA3AF" />}
        </div>
      </div>

      {/* ── Expanded body ── */}
      {expanded && (
        <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Client info pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {user?.contact_name && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F8FAFC", borderRadius: 8, padding: "7px 12px" }}>
                <User size={13} color="#94A3B8" />
                <span style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>{user.contact_name}</span>
              </div>
            )}
            {user?.company_name && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F8FAFC", borderRadius: 8, padding: "7px 12px" }}>
                <Building2 size={13} color="#94A3B8" />
                <span style={{ fontSize: 12, color: "#374151" }}>{user.company_name}</span>
              </div>
            )}
            {user?.email && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F8FAFC", borderRadius: 8, padding: "7px 12px" }}>
                <Mail size={13} color="#94A3B8" />
                <a href={`mailto:${user.email}`} style={{ fontSize: 12, color: "#2563EB", textDecoration: "none" }}>{user.email}</a>
              </div>
            )}
            {user?.phone && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F8FAFC", borderRadius: 8, padding: "7px 12px" }}>
                <Phone size={13} color="#94A3B8" />
                <span style={{ fontSize: 12, color: "#374151" }}>{user.phone}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Состав заявки</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {quote.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "#F9FAFB", borderRadius: 9, padding: "9px 12px",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" }}>
                    <Package size={13} color="#C4B5FD" style={{ flexShrink: 0 }} />
                    {item.title_ru}
                    {item.sku && <span style={{ fontSize: 11, color: "#9CA3AF" }}>({item.sku})</span>}
                  </span>
                  <span style={{
                    flexShrink: 0, marginLeft: 16,
                    background: "#EDE9FE", color: "#6D28D9",
                    padding: "2px 9px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                  }}>
                    {item.qty} шт.
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Client comment */}
          {quote.comment && (
            <div style={{
              padding: "10px 13px", background: "#FFFBEB",
              borderRadius: 9, borderLeft: "3px solid #FDE68A",
              fontSize: 13, color: "#92400E", lineHeight: 1.5,
              display: "flex", gap: 8, alignItems: "flex-start",
            }}>
              <MessageSquare size={14} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <span><strong>Комментарий клиента:</strong> {quote.comment}</span>
            </div>
          )}

          {/* Manager controls */}
          <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>Управление заявкой</div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: "0 0 auto" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  Статус
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{
                    border: "1.5px solid #E5E7EB", borderRadius: 9,
                    padding: "8px 12px", fontSize: 13, outline: "none",
                    background: "#fff", color: "#111827", cursor: "pointer",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1, minWidth: 240 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  Ответ менеджера <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(виден клиенту)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Условия, цены, сроки…"
                  rows={2}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    border: "1.5px solid #E5E7EB", borderRadius: 9,
                    padding: "8px 12px", fontSize: 13, resize: "vertical",
                    outline: "none", fontFamily: "inherit", background: "#fff",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
                />
              </div>
            </div>

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#991B1B", background: "#FEF2F2", padding: "8px 12px", borderRadius: 8 }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "9px 20px", borderRadius: 9, border: "none",
                background: saving ? "#94A3B8" : "#F97316",
                color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                alignSelf: "flex-start", transition: "background 0.15s",
              }}
            >
              {saving
                ? <><span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />Сохранение…</>
                : <><Save size={13} />Сохранить</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main page ── */
export default function B2bAdminPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchQuotes = useCallback(async () => {
    const res = await fetch("/api/admin/b2b");
    if (res.ok) {
      const json = await res.json();
      setQuotes(json.quotes ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const filtered = filter === "all" ? quotes : quotes.filter((q) => q.status === filter);
  const statusCounts = Object.fromEntries(
    STATUS_OPTIONS.map(({ value }) => [value, quotes.filter(q => q.status === value).length])
  );

  return (
    <div style={{ padding: "28px 0" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F0FDF4", border: "1px solid #BBF7D0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={18} color="#16A34A" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#001A33", margin: 0, letterSpacing: "-0.01em" }}>B2B-заявки</h2>
          {!loading && (
            <span style={{ fontSize: 13, color: "#9CA3AF", background: "#F3F4F6", borderRadius: 20, padding: "2px 10px", fontWeight: 500 }}>
              {quotes.length} {quotes.length === 1 ? "заявка" : quotes.length < 5 ? "заявки" : "заявок"}
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, color: "#6B7280", margin: 0, paddingLeft: 46 }}>
          Запросы на оптовые цены от зарегистрированных организаций
        </p>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: 5, marginBottom: 20, flexWrap: "wrap" }}>
        {[{ value: "all", label: "Все", dot: "#94A3B8", border: "#E5E7EB", color: "#6B7280", bg: "#F9FAFB" },
          ...STATUS_OPTIONS.map(({ value, label }) => ({
            value, label,
            dot: STATUS_CONFIG[value]?.dot ?? "#94A3B8",
            border: STATUS_CONFIG[value]?.border ?? "#E5E7EB",
            color: STATUS_CONFIG[value]?.color ?? "#6B7280",
            bg: STATUS_CONFIG[value]?.bg ?? "#F9FAFB",
          }))
        ].map(({ value, label, dot, border, color, bg }) => {
          const active = filter === value;
          const count = value === "all" ? quotes.length : statusCounts[value] ?? 0;
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 13px", borderRadius: 9,
                border: `1.5px solid ${active ? border : "#E5E7EB"}`,
                background: active ? bg : "#fff",
                color: active ? color : "#6B7280",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: active ? dot : "#D1D5DB", flexShrink: 0 }} />
              {label}
              <span style={{
                background: active ? "#fff" : "#F3F4F6",
                color: active ? color : "#9CA3AF",
                fontSize: 10, fontWeight: 800,
                padding: "1px 6px", borderRadius: 5,
                border: active ? `1px solid ${border}` : "none",
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Array.from({ length: 3 }).map((_, i) => <SkeletonQuote key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 24px",
          background: "#fff", borderRadius: 16, border: "1.5px dashed #E5E7EB",
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: "0 auto 16px",
            background: "linear-gradient(135deg, #EFF6FF, #BFDBFE)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Building2 size={32} color="#3B82F6" />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: 0 }}>
            {filter === "all" ? "Заявок пока нет" : `Нет заявок со статусом «${STATUS_CONFIG[filter]?.label ?? filter}»`}
          </h3>
          <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 8 }}>
            {filter === "all" ? "Заявки от B2B-клиентов появятся здесь" : "Попробуйте выбрать другой статус"}
          </p>
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              style={{ marginTop: 14, padding: "8px 20px", borderRadius: 9, background: "#F97316", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Показать все
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((q) => (
            <QuoteRow key={q.id} quote={q} onUpdated={fetchQuotes} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      `}</style>
    </div>
  );
}

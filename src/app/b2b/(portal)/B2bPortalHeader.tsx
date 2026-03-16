"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ShoppingCart, LogOut, User, FileText, BookOpen, Menu, X,
  KeyRound, ChevronDown, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";
import { useB2bCartStore } from "@/lib/b2bStore";

const IDLE_MS = 15 * 60 * 1000; // 15 минут неактивности → выход

interface B2bUser {
  id: string;
  email: string;
  contact_name: string;
  company_name?: string;
}

const NAV = [
  { href: "/b2b/catalog", label: "Каталог", icon: BookOpen },
  { href: "/b2b/quotes", label: "Мои заявки", icon: FileText },
];

/* ─── Password change modal ─── */
function PasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPwd.length < 8) { setError("Новый пароль должен быть не менее 8 символов"); return; }
    if (newPwd !== confirmPwd) { setError("Пароли не совпадают"); return; }
    setSaving(true);
    const res = await fetch("/api/b2b/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
    });
    setSaving(false);
    if (res.ok) {
      setSuccess(true);
      setTimeout(onClose, 1800);
    } else {
      const json = await res.json();
      setError(json.error ?? "Ошибка");
    }
  }

  const field = (label: string, value: string, setter: (v: string) => void, show: boolean, toggle: () => void) => (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => setter(e.target.value)}
          required
          style={{
            width: "100%", boxSizing: "border-box",
            border: "1.5px solid #E5E7EB", borderRadius: 9,
            padding: "9px 38px 9px 12px", fontSize: 14, outline: "none", color: "#111827",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
        />
        <button type="button" onClick={toggle} tabIndex={-1} style={{
          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer", color: "#9CA3AF",
          display: "flex", alignItems: "center",
        }}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,26,51,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 999, backdropFilter: "blur(2px)",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 18, padding: "28px 28px 24px",
        width: "100%", maxWidth: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        position: "relative",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 14, right: 14, background: "none", border: "none",
          cursor: "pointer", color: "#9CA3AF", display: "flex", alignItems: "center",
        }}>
          <X size={18} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <KeyRound size={18} color="#F97316" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#001A33" }}>Смена пароля</div>
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>B2B / B2G кабинет</div>
          </div>
        </div>
        {success ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "24px 0" }}>
            <CheckCircle2 size={44} color="#22C55E" />
            <p style={{ fontSize: 15, fontWeight: 600, color: "#166534" }}>Пароль успешно изменён</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {error && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                background: "#FEF2F2", border: "1.5px solid #FECACA",
                borderRadius: 9, padding: "10px 12px", fontSize: 13, color: "#991B1B",
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
              </div>
            )}
            {field("Текущий пароль", currentPwd, setCurrentPwd, showCurrent, () => setShowCurrent(v => !v))}
            {field("Новый пароль (мин. 8 символов)", newPwd, setNewPwd, showNew, () => setShowNew(v => !v))}
            {field("Подтвердите новый пароль", confirmPwd, setConfirmPwd, showNew, () => setShowNew(v => !v))}
            <button type="submit" disabled={saving} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", padding: "10px", borderRadius: 10, border: "none",
              background: saving ? "#94A3B8" : "#F97316",
              color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer", marginTop: 4,
            }}>
              {saving ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />Сохранение…</> : "Сменить пароль"}
            </button>
          </form>
        )}
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

/* ─── Idle warning banner ─── */
function IdleWarning({ secondsLeft, onExtend }: { secondsLeft: number; onExtend: () => void }) {
  return (
    <div style={{
      position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)",
      background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 12,
      padding: "12px 20px", zIndex: 500, boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
      display: "flex", alignItems: "center", gap: 12,
      fontSize: 13, color: "#991B1B", fontWeight: 600, whiteSpace: "nowrap",
    }}>
      <AlertCircle size={16} style={{ flexShrink: 0 }} />
      Сессия истекает через {secondsLeft} сек.
      <button
        onClick={onExtend}
        style={{
          background: "#F97316", color: "#fff", border: "none", borderRadius: 7,
          padding: "4px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}
      >
        Продолжить
      </button>
    </div>
  );
}

export function B2bPortalHeader({ user }: { user: B2bUser | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const { items } = useB2bCartStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [idleWarning, setIdleWarning] = useState(false);
  const [idleSecondsLeft, setIdleSecondsLeft] = useState(60);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const cartCount = items.reduce((s, i) => s + i.qty, 0);

  // ── Idle detection ─────────────────────────────────────────
  useEffect(() => {
    const WARNING_BEFORE_MS = 60_000; // предупреждение за 60 с до выхода

    function resetIdle() {
      setIdleWarning(false);
      if (warningTimer.current) clearInterval(warningTimer.current);
      if (idleTimer.current) clearTimeout(idleTimer.current);

      idleTimer.current = setTimeout(() => {
        setIdleWarning(true);
        let left = Math.ceil(WARNING_BEFORE_MS / 1000);
        setIdleSecondsLeft(left);
        warningTimer.current = setInterval(() => {
          left -= 1;
          setIdleSecondsLeft(left);
          if (left <= 0) {
            clearInterval(warningTimer.current!);
            window.location.href =
              "/b2b/login?error=" +
              encodeURIComponent("Сессия истекла — 15 минут неактивности");
          }
        }, 1000);
      }, IDLE_MS - WARNING_BEFORE_MS);
    }

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
    resetIdle();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (warningTimer.current) clearInterval(warningTimer.current);
    };
  }, []);

  // ── Close dropdown on outside click ───────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  function extendSession() {
    setIdleWarning(false);
    if (warningTimer.current) clearInterval(warningTimer.current);
    // Любое движение мыши/клавиши снова запустит resetIdle через listeners
  }

  async function handleLogout() {
    await fetch("/api/b2b/logout", { method: "POST" });
    router.push("/b2b/login");
  }

  return (
    <>
      <header style={{
        background: "#001A33", color: "#fff",
        position: "sticky", top: 0, zIndex: 50,
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
      }}>
        <div style={{
          maxWidth: 1240, margin: "0 auto", padding: "0 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 60,
        }}>
          {/* Logo + nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, height: "100%" }}>
            <a href="/b2b/catalog" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginRight: 24 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, background: "#F97316",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(249,115,22,0.4)",
              }}>
                <svg viewBox="0 0 20 20" fill="none" width={18} height={18}>
                  <rect x="3" y="4" width="6" height="12" rx="1" fill="white" opacity="0.9" />
                  <rect x="11" y="4" width="6" height="12" rx="1" fill="white" opacity="0.7" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.1em", lineHeight: 1 }}>Личный кабинет</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", lineHeight: 1.4 }}>B2B / B2G</div>
              </div>
            </a>

            {/* Separator */}
            <div style={{ width: 1, height: 28, background: "#1E3A5F", marginRight: 20 }} />

            <nav className="hidden md:flex" style={{ display: "flex", gap: 0, height: "100%", alignItems: "stretch" }}>
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                  <a key={href} href={href} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "0 14px",
                    borderBottom: active ? "2px solid #F97316" : "2px solid transparent",
                    color: active ? "#F97316" : "#94A3B8",
                    textDecoration: "none", fontSize: 13, fontWeight: active ? 700 : 500,
                    transition: "color 0.15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#E2E8F0"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = active ? "#F97316" : "#94A3B8"; }}
                  >
                    <Icon size={14} /> {label}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Cart */}
            <a href="/b2b/catalog" style={{ position: "relative", display: "flex", alignItems: "center", padding: 8, color: "#94A3B8", textDecoration: "none" }}>
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span style={{
                  position: "absolute", top: 2, right: 2,
                  background: "#F97316", color: "#fff",
                  fontSize: 10, fontWeight: 800, lineHeight: 1,
                  minWidth: 16, height: 16, borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
                }}>
                  {cartCount}
                </span>
              )}
            </a>

            {/* User dropdown */}
            {user && (
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: dropdownOpen ? "#0F2A47" : "none",
                    border: "1px solid", borderColor: dropdownOpen ? "#334155" : "transparent",
                    borderRadius: 10, padding: "6px 12px 6px 8px", cursor: "pointer",
                    color: "#fff",
                  }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F97316", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <User size={14} color="#fff" />
                  </div>
                  <div style={{ textAlign: "left", lineHeight: 1.25 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{user.contact_name}</div>
                    {user.company_name && (
                      <div style={{ fontSize: 10, color: "#64748B" }}>{user.company_name}</div>
                    )}
                  </div>
                  <ChevronDown size={14} color="#94A3B8" style={{ transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>

                {dropdownOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", right: 0,
                    background: "#fff", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                    border: "1px solid #E5E7EB", minWidth: 200, overflow: "hidden", zIndex: 200,
                  }}>
                    <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid #F3F4F6" }}>
                      <div style={{ fontSize: 12, color: "#9CA3AF" }}>Вошли как</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{user.contact_name}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{user.email}</div>
                    </div>
                    <button
                      onClick={() => { setDropdownOpen(false); setModalOpen(true); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        width: "100%", padding: "11px 14px", border: "none", background: "none",
                        cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#374151", textAlign: "left",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      <KeyRound size={15} color="#F97316" /> Сменить пароль
                    </button>
                    <div style={{ borderTop: "1px solid #F3F4F6" }} />
                    <button
                      onClick={handleLogout}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        width: "100%", padding: "11px 14px", border: "none", background: "none",
                        cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#DC2626", textAlign: "left",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF2F2")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      <LogOut size={15} /> Выйти
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile burger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              style={{ alignItems: "center", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 6 }}
              className="md:hidden flex"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div style={{ background: "#0F2A47", padding: "12px 24px 16px", borderTop: "1px solid #1E3A5F" }}>
            {NAV.map(({ href, label, icon: Icon }) => (
              <a key={href} href={href} onClick={() => setMobileOpen(false)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
                color: pathname.startsWith(href) ? "#F97316" : "#94A3B8",
                textDecoration: "none", fontSize: 14, fontWeight: 600,
                borderBottom: "1px solid #1E3A5F",
              }}>
                <Icon size={15} /> {label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* ── Idle warning ─────────────────────────────────── */}
      {idleWarning && (
        <IdleWarning secondsLeft={idleSecondsLeft} onExtend={extendSession} />
      )}

      {modalOpen && <PasswordModal onClose={() => setModalOpen(false)} />}
    </>
  );
}

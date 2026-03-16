"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Eye, EyeOff, LogOut, KeyRound, ChevronDown, X, UserCircle2, CheckCircle2, AlertCircle, Loader2, Package, Users, Languages, Building2 } from "lucide-react";
import { signOut, changePassword } from "../login/actions";

const IDLE_MS = 15 * 60 * 1000; // 15 minutes — must match middleware

const NAV_ITEMS = [
  { href: "/admin", label: "Каталог", icon: Package, exact: true, superOnly: false },
  { href: "/admin/users", label: "Пользователи", icon: Users, superOnly: true },
  { href: "/admin/translations", label: "Переводы", icon: Languages, superOnly: false },
  { href: "/admin/b2b", label: "B2B-заявки", icon: Building2, superOnly: false },
];

/* ─── Password change modal ─────────────────────────────── */
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

    if (newPwd.length < 8) {
      setError("Новый пароль должен быть не менее 8 символов");
      return;
    }
    if (newPwd !== confirmPwd) {
      setError("Новый пароль и подтверждение не совпадают");
      return;
    }

    setSaving(true);
    const fd = new FormData();
    fd.append("currentPassword", currentPwd);
    fd.append("newPassword", newPwd);
    fd.append("confirmPassword", confirmPwd);

    const result = await changePassword(fd);
    setSaving(false);

    if (result.ok) {
      setSuccess(true);
      setTimeout(onClose, 1800);
    } else {
      setError(result.error ?? "Неизвестная ошибка");
    }
  }

  const pwdField = (
    id: string,
    label: string,
    value: string,
    setter: (v: string) => void,
    show: boolean,
    toggleShow: () => void,
  ) => (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => setter(e.target.value)}
          required
          autoComplete={id === "currentPassword" ? "current-password" : "new-password"}
          style={{
            width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 9,
            padding: "9px 38px 9px 12px", fontSize: 14, outline: "none",
            color: "#111827", boxSizing: "border-box",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
        />
        <button
          type="button"
          onClick={toggleShow}
          tabIndex={-1}
          style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: "#9CA3AF",
            display: "flex", alignItems: "center",
          }}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,26,51,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 999, backdropFilter: "blur(2px)",
      }}
    >
      {/* Modal card */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 18, padding: "28px 28px 24px",
          width: "100%", maxWidth: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          position: "relative",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 14, right: 14, background: "none", border: "none",
            cursor: "pointer", color: "#9CA3AF", display: "flex", alignItems: "center",
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: "#FFF7ED",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <KeyRound size={18} color="#F97316" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#001A33" }}>Смена пароля</div>
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>Администратор</div>
          </div>
        </div>

        {success ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 10, padding: "24px 0",
          }}>
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
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </div>
            )}

            {pwdField("currentPassword", "Текущий пароль", currentPwd, setCurrentPwd, showCurrent, () => setShowCurrent((v) => !v))}
            {pwdField("newPassword", "Новый пароль (мин. 8 символов)", newPwd, setNewPwd, showNew, () => setShowNew((v) => !v))}
            {pwdField("confirmPassword", "Подтвердите новый пароль", confirmPwd, setConfirmPwd, showNew, () => setShowNew((v) => !v))}

            <button
              type="submit"
              disabled={saving}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", padding: "10px", borderRadius: 10, border: "none",
                background: saving ? "#94A3B8" : "#F97316",
                color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                transition: "background 0.15s", marginTop: 4,
              }}
            >
              {saving ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />Сохранение…</> : "Сменить пароль"}
            </button>
          </form>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Idle warning banner ────────────────────────────────── */
function IdleWarning({ secondsLeft, onExtend }: { secondsLeft: number; onExtend: () => void }) {
  return (
    <div style={{
      position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)",
      background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 12,
      padding: "12px 20px", zIndex: 500, boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
      display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "#991B1B", fontWeight: 600,
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

/* ─── Main header ────────────────────────────────────────── */
export function AdminHeader({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [idleWarning, setIdleWarning] = useState(false);
  const [idleSecondsLeft, setIdleSecondsLeft] = useState(60);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Idle detection ─────────────────────────────────────────
  useEffect(() => {
    const WARNING_BEFORE_MS = 60_000; // show warning 60 s before expiry
    let lastActivity = Date.now();

    function resetIdle() {
      lastActivity = Date.now();
      setIdleWarning(false);
      if (warningTimer.current) clearInterval(warningTimer.current);
      if (idleTimer.current) clearTimeout(idleTimer.current);

      // Schedule warning
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
              "/admin/login?error=" +
              encodeURIComponent("Сессия истекла — 15 минут неактивности");
          }
        }, 1000);
      }, IDLE_MS - WARNING_BEFORE_MS);
    }

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
    resetIdle(); // start

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
    // Touching the page triggers activity listeners which will reset the idle timer
  }

  const pathname = usePathname();

  const visibleNav = NAV_ITEMS.filter((item) => !item.superOnly || isSuperAdmin);

  return (
    <>
      {/* ── Header bar ─────────────────────────────────────── */}
      <header style={{
        background: "#001A33", color: "#fff",
        flexShrink: 0, position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
      }}>
        <div style={{
          maxWidth: 1240, margin: "0 auto", padding: "0 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 60,
        }}>
          {/* Brand + Nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, height: "100%" }}>
            <a href="/admin" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginRight: 24 }}>
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
                <div style={{ fontSize: 9, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.1em", lineHeight: 1 }}>Панель управления</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#F1F5F9", lineHeight: 1.4 }}>Администратор</div>
              </div>
            </a>

            {/* Separator */}
            <div style={{ width: 1, height: 28, background: "#1E3A5F", marginRight: 20 }} />

            <nav style={{ display: "flex", gap: 0, height: "100%", alignItems: "stretch" }}>
              {visibleNav.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <a key={href} href={href} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "0 14px",
                    position: "relative",
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

          {/* User menu */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: dropdownOpen ? "#0F2A47" : "none",
              border: "1px solid",
              borderColor: dropdownOpen ? "#334155" : "transparent",
              borderRadius: 10, padding: "6px 12px 6px 8px", cursor: "pointer",
              color: "#fff", transition: "all 0.15s",
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: "#F97316",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <UserCircle2 size={16} color="#fff" />
            </div>
            <div style={{ textAlign: "left", lineHeight: 1.25 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Администратор</div>
            </div>
            <ChevronDown
              size={14}
              color="#94A3B8"
              style={{ transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
            />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", right: 0,
              background: "#fff", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
              border: "1px solid #E5E7EB", minWidth: 200, overflow: "hidden", zIndex: 200,
            }}>
              <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid #F3F4F6" }}>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>Вошли как</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Администратор</div>
              </div>

              <button
                onClick={() => { setDropdownOpen(false); setModalOpen(true); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "11px 14px", border: "none", background: "none",
                  cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#374151",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <KeyRound size={15} color="#F97316" />
                Сменить пароль
              </button>

              <div style={{ borderTop: "1px solid #F3F4F6" }} />

              <form action={signOut}>
                <button
                  type="submit"
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "11px 14px", border: "none", background: "none",
                    cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#DC2626",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF2F2")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <LogOut size={15} />
                  Выйти
                </button>
              </form>
            </div>
          )}
          </div>
        </div>
      </header>

      {/* ── Idle warning ───────────────────────────────────── */}
      {idleWarning && (
        <IdleWarning secondsLeft={idleSecondsLeft} onExtend={extendSession} />
      )}

      {/* ── Password modal ─────────────────────────────────── */}
      {modalOpen && <PasswordModal onClose={() => setModalOpen(false)} />}
    </>
  );
}

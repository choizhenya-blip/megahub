"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const verified = params.get("verified");
  const errorCode = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!errorCode) return;
    if (errorCode === "invalid_token") setError("Ссылка недействительна или устарела.");
    else if (errorCode === "token_expired") setError("Срок ссылки истёк. Запросите новое письмо.");
    else setError(decodeURIComponent(errorCode));
  }, [errorCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/b2b/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    setLoading(false);

    if (res.ok) {
      router.push("/b2b/catalog");
    } else {
      setError(json.error ?? "Неизвестная ошибка");
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#001A33 0%,#002D55 60%,#001A33 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "36px 36px 32px",
        width: "100%", maxWidth: 420,
        boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, background: "#F97316",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg viewBox="0 0 20 20" fill="none" width={24} height={24}>
              <rect x="3" y="4" width="6" height="12" rx="1" fill="white" opacity="0.9" />
              <rect x="11" y="4" width="6" height="12" rx="1" fill="white" opacity="0.7" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Личный кабинет
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#001A33" }}>B2B / B2G Оптовик</div>
          </div>
        </div>

        {/* Verified banner */}
        {(verified === "1" || verified === "already") && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#F0FDF4", border: "1.5px solid #86EFAC",
            borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#166534",
            marginBottom: 20,
          }}>
            <CheckCircle2 size={16} />
            {verified === "1" ? "Email подтверждён! Теперь вы можете войти." : "Email уже подтверждён. Войдите в кабинет."}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 8,
            background: "#FEF2F2", border: "1.5px solid #FECACA",
            borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#991B1B",
            marginBottom: 20,
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
              style={{
                width: "100%", boxSizing: "border-box",
                border: "1.5px solid #E5E7EB", borderRadius: 10,
                padding: "11px 14px", fontSize: 14, outline: "none", color: "#111827",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Пароль
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%", boxSizing: "border-box",
                  border: "1.5px solid #E5E7EB", borderRadius: 10,
                  padding: "11px 40px 11px 14px", fontSize: 14, outline: "none", color: "#111827",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                tabIndex={-1}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "#9CA3AF",
                }}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", padding: "13px", borderRadius: 10, border: "none",
              background: loading ? "#94A3B8" : "#F97316",
              color: "#fff", fontSize: 15, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", marginTop: 4,
            }}
          >
            {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Вход…</> : "Войти"}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <a href="/b2b/register" style={{ fontSize: 13, color: "#F97316", textDecoration: "none", fontWeight: 600 }}>
            Нет аккаунта? Зарегистрироваться
          </a>
        </div>

        <div style={{ marginTop: 12, textAlign: "center" }}>
          <a href="/" style={{ fontSize: 12, color: "#9CA3AF", textDecoration: "none" }}>
            ← Вернуться на сайт
          </a>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function B2bLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const COMPANY_TYPES = [
  { value: "school", label: "Школа / Гимназия" },
  { value: "akimat", label: "Акимат / Госучреждение" },
  { value: "college", label: "Колледж / ВУЗ" },
  { value: "shop", label: "Книжный магазин / Реселлер" },
  { value: "other", label: "Другое" },
];

export default function B2bRegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [contactName, setContactName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [bin, setBin] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/b2b/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        contact_name: contactName,
        company_name: companyName || undefined,
        phone: phone || undefined,
        bin: bin || undefined,
        company_type: companyType || undefined,
      }),
    });
    const json = await res.json();
    setLoading(false);

    if (res.ok) {
      setSuccess(true);
    } else {
      setError(json.error ?? "Не удалось зарегистрироваться");
    }
  }

  const inputStyle = {
    width: "100%", boxSizing: "border-box" as const,
    border: "1.5px solid #E5E7EB", borderRadius: 10,
    padding: "11px 14px", fontSize: 14, outline: "none", color: "#111827",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#001A33 0%,#002D55 60%,#001A33 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "32px 24px",
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "36px 36px 32px",
        width: "100%", maxWidth: 500,
        boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
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
              Регистрация
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#001A33" }}>B2B / B2G Личный кабинет</div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 24, lineHeight: 1.5 }}>
          Зарегистрируйтесь чтобы формировать заявки на оптовые поставки и получать индивидуальные условия.
        </p>

        {success ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 12, padding: "32px 0", textAlign: "center",
          }}>
            <CheckCircle2 size={52} color="#22C55E" />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0 }}>
              Регистрация завершена!
            </h3>
            <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
              Аккаунт создан. Теперь вы можете войти в личный кабинет.
            </p>
            <a
              href="/b2b/login"
              style={{
                display: "inline-block", marginTop: 8,
                padding: "11px 24px", borderRadius: 10,
                background: "#F97316", color: "#fff",
                fontSize: 14, fontWeight: 700, textDecoration: "none",
              }}
            >
              Перейти ко входу
            </a>
          </div>
        ) : (
          <>
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

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Section: Аккаунт */}
              <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", margin: "4px 0 0" }}>
                Данные для входа
              </p>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Email <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required placeholder="you@company.com" style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Пароль <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPwd ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required placeholder="Мин. 8 символов"
                    style={{ ...inputStyle, padding: "11px 40px 11px 14px" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
                  />
                  <button type="button" onClick={() => setShowPwd((v) => !v)} tabIndex={-1}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Повторите пароль <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  required placeholder="Повторите пароль" style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
                />
              </div>

              {/* Section: Организация */}
              <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", margin: "8px 0 0" }}>
                Данные организации
              </p>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Контактное лицо <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text" value={contactName} onChange={(e) => setContactName(e.target.value)}
                  required placeholder="ФИО" style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Название организации
                </label>
                <input
                  type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Школа №1 / ТОО Книги и т.д." style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                    БИН
                  </label>
                  <input
                    type="text" value={bin} onChange={(e) => setBin(e.target.value)}
                    placeholder="123456789012" style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                    Телефон
                  </label>
                  <input
                    type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (777) 123-45-67" style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Тип организации
                </label>
                <select
                  value={companyType} onChange={(e) => setCompanyType(e.target.value)}
                  style={{ ...inputStyle, background: "#fff" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
                >
                  <option value="">— Выберите тип —</option>
                  {COMPANY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
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
                {loading
                  ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Регистрация…</>
                  : "Зарегистрироваться"
                }
              </button>
            </form>

            <div style={{ marginTop: 20, textAlign: "center" }}>
              <a href="/b2b/login" style={{ fontSize: 13, color: "#F97316", textDecoration: "none", fontWeight: 600 }}>
                Уже есть аккаунт? Войти
              </a>
            </div>

            <div style={{ marginTop: 12, textAlign: "center" }}>
              <a href="/" style={{ fontSize: 12, color: "#9CA3AF", textDecoration: "none" }}>
                ← Вернуться на сайт
              </a>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

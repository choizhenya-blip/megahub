"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Languages, AlertCircle } from "lucide-react";

type Lang = "kz" | "en";

const LANG_LABELS: Record<Lang, string> = {
  kz: "Қазақша (KZ)",
  en: "English (EN)",
};

export default function TranslationsPanel({
  defaultMessages,
}: {
  defaultMessages: Record<"ru" | "kz" | "en", Record<string, string>>;
}) {
  const [filling, setFilling] = useState<Lang | null>(null);
  const [filled, setFilled] = useState<Record<Lang, number | null>>({ kz: null, en: null });
  const [error, setError] = useState<string | null>(null);

  async function fillLanguage(lang: Lang) {
    setFilling(lang);
    setError(null);

    const ruStaticDefaults = defaultMessages["ru"];
    const langDefaults = defaultMessages[lang];

    // Fetch current DB overrides for target language and for RU (as authoritative source)
    const [langRes, ruRes] = await Promise.all([
      fetch(`/api/admin/translations?lang=${lang}`),
      fetch("/api/admin/translations?lang=ru"),
    ]);

    if (!langRes.ok) {
      setError("Ошибка получения текущих переводов");
      setFilling(null);
      return;
    }

    const currentOverrides: Record<string, string> = (await langRes.json()).overrides ?? {};
    const ruOverrides: Record<string, string> = ruRes.ok ? ((await ruRes.json()).overrides ?? {}) : {};

    // For every key in RU — fill it into the DB if no DB override exists yet:
    //   • If KZ/EN static file has a proper translation (≠ RU static) → use that
    //   • Otherwise use RU DB override → RU static (fallback chain)
    // This populates the DB with both properly translated interface strings AND
    // RU text for anything not yet translated.
    const next = { ...currentOverrides };
    let count = 0;

    Object.keys(ruStaticDefaults).forEach((key) => {
      if (next[key] !== undefined) return; // already overridden — skip

      const langStatic = langDefaults[key];
      const ruStatic = ruStaticDefaults[key];
      const ruSource = ruOverrides[key] ?? ruStatic;

      // Prefer proper lang translation, fall back to RU
      const value = (langStatic && langStatic !== ruStatic) ? langStatic : ruSource;
      if (value) {
        next[key] = value;
        count++;
      }
    });

    if (count > 0) {
      const saveRes = await fetch("/api/admin/translations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, overrides: next }),
      });
      if (!saveRes.ok) {
        const errJson = await saveRes.json().catch(() => ({}));
        setError(errJson.error ?? "Ошибка сохранения");
        setFilling(null);
        return;
      }
    }

    setFilled((prev) => ({ ...prev, [lang]: count }));
    setFilling(null);
  }

  return (
    <div style={{ padding: "32px 0" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#001A33", margin: 0 }}>
          Переводы контента
        </h2>
        <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
          Заполняет все строки интерфейса и контента: сначала берутся готовые переводы из файлов,
          затем — русский текст для незаполненных ключей. Уже сохранённые в БД строки не меняются.
        </p>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {(["kz", "en"] as Lang[]).map((lang) => (
          <div
            key={lang}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "24px",
              border: "1px solid #E5E7EB",
              flex: 1,
              minWidth: 240,
              maxWidth: 480,
            }}
          >
            {/* Icon + title */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "#FFF7ED",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Languages size={22} color="#F97316" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#001A33" }}>
                  {LANG_LABELS[lang]}
                </div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                  Интерфейс + контент из RU
                </div>
              </div>
            </div>

            {/* Result message */}
            {filled[lang] !== null && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "#F0FDF4", border: "1.5px solid #86EFAC",
                borderRadius: 9, padding: "10px 12px", marginBottom: 14,
                fontSize: 13, color: "#166534",
              }}>
                <CheckCircle2 size={15} />
                {filled[lang] === 0
                  ? "Все строки уже в БД — ничего не изменено"
                  : `Добавлено ${filled[lang]} строк. Перезагрузите сайт для применения.`}
              </div>
            )}

            {/* Button */}
            <button
              onClick={() => fillLanguage(lang)}
              disabled={filling === lang}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", padding: "12px 20px", borderRadius: 10, border: "none",
                background: filling === lang ? "#94A3B8" : "#F97316",
                color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: filling === lang ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
            >
              {filling === lang ? (
                <>
                  <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                  Заполнение…
                </>
              ) : (
                `🔄 Заполнить ${lang.toUpperCase()} из RU`
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#FEF2F2", border: "1.5px solid #FECACA",
          borderRadius: 9, padding: "10px 14px",
          fontSize: 13, color: "#991B1B", marginTop: 16,
        }}>
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

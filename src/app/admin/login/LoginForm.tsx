"use client";

import { useState } from "react";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { signIn } from "./actions";

export function LoginForm({ error }: { error?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (formData: FormData) => {
        setPending(true);
        await signIn(formData);
        setPending(false);
      }}
      className="flex flex-col gap-4"
    >
      {/* Error banner */}
      {error && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-xl"
          style={{ background: "#FEF2F2", border: "1.5px solid #FECACA" }}
        >
          <AlertCircle size={18} style={{ color: "#DC2626", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.8125rem", fontWeight: 700, color: "#991B1B", marginBottom: 2 }}>
              Ошибка авторизации
            </p>
            <p style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.75rem", color: "#B91C1C" }}>
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Email */}
      <div>
        <label
          className="block text-sm font-medium mb-1"
          style={{ fontFamily: "system-ui,sans-serif", color: "#374151" }}
        >
          Email
        </label>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          defaultValue="choi.zhenya@gmail.com"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2"
          style={{ fontFamily: "system-ui,sans-serif", focusRingColor: "#F97316" } as React.CSSProperties}
        />
      </div>

      {/* Password + show/hide */}
      <div>
        <label
          className="block text-sm font-medium mb-1"
          style={{ fontFamily: "system-ui,sans-serif", color: "#374151" }}
        >
          Пароль
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            required
            autoComplete="current-password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-2"
            style={{ fontFamily: "system-ui,sans-serif" }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9CA3AF",
              padding: 2,
              display: "flex",
              alignItems: "center",
            }}
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white mt-1 transition-colors"
        style={{
          background: pending ? "#94A3B8" : "#F97316",
          fontFamily: "system-ui,sans-serif",
          border: "none",
          cursor: pending ? "not-allowed" : "pointer",
        }}
      >
        <LogIn size={15} />
        {pending ? "Входим…" : "Войти"}
      </button>
    </form>
  );
}

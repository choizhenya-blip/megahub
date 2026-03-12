"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { MapPin, Mail, Phone, CheckCircle, AlertCircle, Send } from "lucide-react";

function ContactsInner() {
  const { m } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const canSubmit = name.trim().length >= 2 && email.includes("@") && message.trim().length >= 5;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setToast(null);
    await new Promise((r) => setTimeout(r, 800));
    setToast({ kind: "success", text: m.contacts.form.success });
    setName(""); setEmail(""); setMessage("");
    setSubmitting(false);
    setTimeout(() => setToast(null), 6000);
  }

  const contactRows = [
    {
      icon: MapPin,
      label: m.contacts.labelAddress,
      value: m.contacts.address,
      href: undefined as string | undefined,
      accent: "#F97316",
      bg: "#FFF7ED",
    },
    {
      icon: Mail,
      label: m.contacts.labelEmail,
      value: m.contacts.email,
      href: `mailto:${m.contacts.email}`,
      accent: "#059669",
      bg: "#ECFDF5",
    },
    {
      icon: Phone,
      label: m.contacts.labelPhone,
      value: m.contacts.phone,
      href: `tel:${m.contacts.phone.replace(/\s/g, "")}`,
      accent: "#D97706",
      bg: "#FFFBEB",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#001A33 0%,#002D55 55%,#001A33 100%)", paddingTop: "4rem", paddingBottom: "4rem" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full opacity-10" style={{ background: "white" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1
            style={{
              fontFamily: "'Georgia',serif",
              fontSize: "clamp(1.75rem,4vw,2.75rem)",
              fontWeight: 700,
              color: "white",
              marginBottom: "0.5rem",
            }}
          >
            {m.contacts.title}
          </h1>
          <p style={{ fontFamily: "system-ui,sans-serif", color: "rgba(255,255,255,.78)", fontSize: "1rem" }}>
            {m.brand.megaHub} {m.brand.education} — {m.contacts.address}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Contact Info */}
          <div>
            <h2
              className="text-xl font-semibold text-slate-900 mb-6"
              style={{ fontFamily: "'Georgia',serif" }}
            >
              {m.contacts.title}
            </h2>

            <div className="space-y-5">
              {contactRows.map(({ icon: Icon, label, value, href, accent, bg }) => (
                <div key={label} className="flex items-start gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: bg }}
                  >
                    <Icon size={20} style={{ color: accent }} />
                  </div>
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-wide mb-0.5"
                      style={{ fontFamily: "system-ui,sans-serif", color: "#9CA3AF" }}
                    >
                      {label}
                    </p>
                    {href ? (
                      <a
                        href={href}
                        style={{
                          fontFamily: "system-ui,sans-serif",
                          fontSize: "0.9375rem",
                          color: accent,
                          textDecoration: "none",
                          fontWeight: 500,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                      >
                        {value}
                      </a>
                    ) : (
                      <p
                        style={{
                          fontFamily: "system-ui,sans-serif",
                          fontSize: "0.9375rem",
                          color: "#111827",
                          fontWeight: 500,
                        }}
                      >
                        {value}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Working hours */}
            <div
              className="mt-8 rounded-xl p-5"
              style={{ background: "white", border: "1px solid #E5E7EB" }}
            >
              <p
                className="text-sm font-semibold text-slate-700 mb-3"
                style={{ fontFamily: "system-ui,sans-serif" }}
              >
                {m.contacts.workingHoursTitle}
              </p>
              {m.contacts.schedule.map(({ day, hours }) => (
                <div key={day} className="flex justify-between py-1.5" style={{ borderBottom: "1px solid #F9FAFB" }}>
                  <span style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.875rem", color: "#374151" }}>
                    {day}
                  </span>
                  <span
                    style={{
                      fontFamily: "system-ui,sans-serif",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: day === m.contacts.schedule[2].day ? "#9CA3AF" : "#111827",
                    }}
                  >
                    {hours}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2
              className="text-xl font-semibold text-slate-900 mb-6"
              style={{ fontFamily: "'Georgia',serif" }}
            >
              {m.contacts.formTitle}
            </h2>

            {toast && (
              <div
                className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5"
                style={{
                  background: toast.kind === "success" ? "#ECFDF5" : "#FEF2F2",
                  border: `1.5px solid ${toast.kind === "success" ? "#A7F3D0" : "#FECACA"}`,
                }}
              >
                {toast.kind === "success"
                  ? <CheckCircle size={18} style={{ color: "#059669", flexShrink: 0, marginTop: 1 }} />
                  : <AlertCircle size={18} style={{ color: "#DC2626", flexShrink: 0, marginTop: 1 }} />}
                <p style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.875rem", fontWeight: 600, color: toast.kind === "success" ? "#065F46" : "#991B1B" }}>
                  {toast.text}
                </p>
              </div>
            )}

            <form
              onSubmit={onSubmit}
              className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4"
            >
              <div>
                <label
                  className="block text-xs font-semibold text-slate-600 mb-1"
                  style={{ fontFamily: "system-ui,sans-serif" }}
                >
                  {m.contacts.form.name}
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  style={{ fontFamily: "system-ui,sans-serif", color: "#111827" }}
                  autoComplete="name"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold text-slate-600 mb-1"
                  style={{ fontFamily: "system-ui,sans-serif" }}
                >
                  {m.contacts.form.email}
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  style={{ fontFamily: "system-ui,sans-serif", color: "#111827" }}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold text-slate-600 mb-1"
                  style={{ fontFamily: "system-ui,sans-serif" }}
                >
                  {m.contacts.form.message}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
                  style={{ fontFamily: "system-ui,sans-serif", color: "#111827" }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-white"
                style={{
                  background: !canSubmit || submitting ? "#94A3B8" : "#F97316",
                  fontFamily: "system-ui,sans-serif",
                  fontSize: "0.9375rem",
                  border: "none",
                  cursor: !canSubmit || submitting ? "not-allowed" : "pointer",
                }}
              >
                <Send size={15} />
                {submitting ? m.contacts.form.submitting : m.contacts.form.submit}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ContactsPage() {
  return <ContactsInner />;
}

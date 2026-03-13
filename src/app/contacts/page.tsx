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

  const inputStyle: React.CSSProperties = {
    fontFamily: "system-ui,sans-serif",
    color: "#111827",
    width: "100%",
    padding: "10px 14px",
    fontSize: "0.9rem",
    borderRadius: 10,
    border: "1.5px solid #E5E7EB",
    outline: "none",
    background: "#FAFAFA",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#001220 0%,#002244 60%,#001A33 100%)", paddingTop: "4.5rem", paddingBottom: "4.5rem" }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full opacity-[0.06]" style={{ background: "white" }} />
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(249,115,22,.5),transparent)" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{ background: "rgba(249,115,22,.18)", color: "#FCA668", border: "1px solid rgba(249,115,22,.3)", fontFamily: "system-ui,sans-serif" }}>
            <MapPin size={12} /> {m.brand.megaHub} {m.brand.education}
          </div>
          <h1
            style={{
              fontFamily: "'Georgia',serif",
              fontSize: "clamp(1.75rem,4vw,2.75rem)",
              fontWeight: 700,
              color: "white",
              marginBottom: "0.6rem",
              lineHeight: 1.2,
            }}
          >
            {m.contacts.title}
          </h1>
          <p style={{ fontFamily: "system-ui,sans-serif", color: "rgba(255,255,255,.65)", fontSize: "1rem", maxWidth: 500 }}>
            {m.contacts.address}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">

          {/* Contact Info */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-5"
              style={{ fontFamily: "system-ui,sans-serif", color: "#F97316", letterSpacing: "0.12em" }}>
              {m.contacts.title}
            </p>

            <div className="space-y-4">
              {contactRows.map(({ icon: Icon, label, value, href, accent, bg }) => (
                <div key={label} className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{ background: "white", border: "1px solid #F0F2F5", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
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
                          color: "#111827",
                          textDecoration: "none",
                          fontWeight: 600,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = accent)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#111827")}
                      >
                        {value}
                      </a>
                    ) : (
                      <p style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.9375rem", color: "#111827", fontWeight: 600 }}>
                        {value}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Working hours */}
            <div className="mt-6 rounded-2xl overflow-hidden"
              style={{ background: "white", border: "1px solid #F0F2F5", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
              <div className="px-5 py-3" style={{ background: "#F8FAFC", borderBottom: "1px solid #F0F2F5" }}>
                <p className="text-xs font-bold uppercase tracking-widest"
                  style={{ fontFamily: "system-ui,sans-serif", color: "#6B7280", letterSpacing: "0.1em" }}>
                  {m.contacts.workingHoursTitle}
                </p>
              </div>
              <div className="px-5 py-2">
                {m.contacts.schedule.map(({ day, hours }, i) => (
                  <div key={day} className="flex justify-between py-2.5"
                    style={{ borderBottom: i < m.contacts.schedule.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                    <span style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.875rem", color: "#374151" }}>
                      {day}
                    </span>
                    <span style={{
                      fontFamily: "system-ui,sans-serif",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: day === m.contacts.schedule[2].day ? "#9CA3AF" : "#111827",
                    }}>
                      {hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-5"
              style={{ fontFamily: "system-ui,sans-serif", color: "#F97316", letterSpacing: "0.12em" }}>
              {m.contacts.formTitle}
            </p>

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
              className="rounded-2xl p-6 md:p-8 space-y-4"
              style={{ background: "white", border: "1px solid #F0F2F5", boxShadow: "0 2px 12px rgba(0,0,0,.05)" }}
            >
              <div>
                <label className="block text-xs font-semibold mb-1.5"
                  style={{ fontFamily: "system-ui,sans-serif", color: "#374151" }}>
                  {m.contacts.form.name}
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = "#F97316"; e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,.12)"; e.target.style.background = "white"; }}
                  onBlur={e => { e.target.style.borderColor = "#E5E7EB"; e.target.style.boxShadow = "none"; }}
                  autoComplete="name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5"
                  style={{ fontFamily: "system-ui,sans-serif", color: "#374151" }}>
                  {m.contacts.form.email}
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = "#F97316"; e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,.12)"; e.target.style.background = "white"; }}
                  onBlur={e => { e.target.style.borderColor = "#E5E7EB"; e.target.style.boxShadow = "none"; }}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5"
                  style={{ fontFamily: "system-ui,sans-serif", color: "#374151" }}>
                  {m.contacts.form.message}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  style={{ ...inputStyle, resize: "none" }}
                  onFocus={e => { e.target.style.borderColor = "#F97316"; e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,.12)"; e.target.style.background = "white"; }}
                  onBlur={e => { e.target.style.borderColor = "#E5E7EB"; e.target.style.boxShadow = "none"; }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white"
                style={{
                  background: !canSubmit || submitting ? "#CBD5E1" : "linear-gradient(135deg,#F97316,#EA580C)",
                  fontFamily: "system-ui,sans-serif",
                  fontSize: "0.9375rem",
                  border: "none",
                  cursor: !canSubmit || submitting ? "not-allowed" : "pointer",
                  boxShadow: !canSubmit || submitting ? "none" : "0 4px 14px rgba(249,115,22,.35)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { if (canSubmit && !submitting) e.currentTarget.style.boxShadow = "0 6px 20px rgba(249,115,22,.5)"; }}
                onMouseLeave={e => { if (canSubmit && !submitting) e.currentTarget.style.boxShadow = "0 4px 14px rgba(249,115,22,.35)"; }}
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

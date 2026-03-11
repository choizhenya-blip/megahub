"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Building2, Store, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";

function Toast({ kind, title }: { kind: "success" | "error"; title: string }) {
  const Icon = kind === "success" ? CheckCircle : AlertCircle;
  const bg = kind === "success" ? "#ECFDF5" : "#FEF2F2";
  const border = kind === "success" ? "#A7F3D0" : "#FECACA";
  const color = kind === "success" ? "#065F46" : "#991B1B";
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl"
      style={{ background: bg, border: `1.5px solid ${border}` }}
      role="status"
      aria-live="polite"
    >
      <Icon size={18} style={{ color, flexShrink: 0, marginTop: 1 }} />
      <div style={{ fontFamily: "system-ui,sans-serif", color, fontSize: "0.875rem", fontWeight: 700 }}>
        {title}
      </div>
    </div>
  );
}

function OrganizationsInner() {
  const { m } = useI18n();

  const [bin, setBin] = useState("");
  const [orgName, setOrgName] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ kind: "success" | "error"; title: string } | null>(null);

  const canSubmit = useMemo(() => {
    return (
      bin.trim().length >= 8 &&
      orgName.trim().length >= 3 &&
      institutionName.trim().length >= 3 &&
      contactName.trim().length >= 3 &&
      email.trim().length >= 5 &&
      phone.trim().length >= 6
    );
  }, [bin, orgName, institutionName, contactName, email, phone]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending || !canSubmit) return;
    setSending(true);
    setToast(null);
    try {
      const payload = {
        bin: bin.trim(),
        orgName: orgName.trim(),
        institutionName: institutionName.trim(),
        contactName: contactName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      };
      window.localStorage.setItem("megahub-b2g-client", JSON.stringify(payload));
      setToast({ kind: "success", title: m.organizations.formSuccess });
    } catch {
      setToast({ kind: "error", title: m.organizations.formError });
    } finally {
      setSending(false);
      window.setTimeout(() => setToast(null), 5000);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#1E3A8A 0%,#1D4ED8 55%,#2563EB 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full opacity-10" style={{ background: "white" }} />
          <div className="absolute right-40 bottom-0 w-56 h-56 rounded-full opacity-5" style={{ background: "white" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="max-w-2xl">
            <h1
              style={{
                fontFamily: "'Georgia',serif",
                fontSize: "clamp(1.6rem,3.6vw,2.6rem)",
                fontWeight: 700,
                color: "white",
                lineHeight: 1.15,
                letterSpacing: "-.02em",
                marginBottom: "0.9rem",
              }}
            >
              {m.organizations.heroTitle}
            </h1>
            <p
              style={{
                fontFamily: "system-ui,sans-serif",
                fontSize: "1.02rem",
                color: "rgba(255,255,255,.82)",
                lineHeight: 1.65,
                marginBottom: "1.6rem",
                maxWidth: 640,
              }}
            >
              {m.organizations.heroSubtitle}
            </p>
            <a
              href="#org-form"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white"
              style={{
                background: "#F97316",
                fontFamily: "system-ui,sans-serif",
                fontSize: "0.9375rem",
                boxShadow: "0 4px 20px rgba(249,115,22,.4)",
                textDecoration: "none",
                width: "fit-content",
              }}
            >
              {m.organizations.formCta} <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ── SPLIT COLUMNS ── */}
      <section className="py-12 lg:py-14 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left: Government */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#EFF6FF" }}>
                  <Building2 size={22} style={{ color: "#1D4ED8" }} />
                </div>
                <div>
                  <div className="text-base font-semibold text-slate-900" style={{ fontFamily: "system-ui,sans-serif" }}>
                    {m.organizations.govTitle}
                  </div>
                  <div className="text-sm text-slate-500" style={{ fontFamily: "system-ui,sans-serif" }}>
                    {m.organizations.govDesc}
                  </div>
                </div>
              </div>
              <ul className="space-y-2.5">
                {m.organizations.govPoints.map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <CheckCircle size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#1D4ED8" }} />
                    <span style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.875rem", color: "#374151", lineHeight: 1.55 }}>
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Shops */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#FFF7ED" }}>
                  <Store size={22} style={{ color: "#F97316" }} />
                </div>
                <div>
                  <div className="text-base font-semibold text-slate-900" style={{ fontFamily: "system-ui,sans-serif" }}>
                    {m.organizations.shopTitle}
                  </div>
                  <div className="text-sm text-slate-500" style={{ fontFamily: "system-ui,sans-serif" }}>
                    {m.organizations.shopDesc}
                  </div>
                </div>
              </div>
              <ul className="space-y-2.5">
                {m.organizations.shopPoints.map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <CheckCircle size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#F97316" }} />
                    <span style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.875rem", color: "#374151", lineHeight: 1.55 }}>
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FORM ── */}
      <section className="py-12 lg:py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
            <h2
              id="org-form"
              className="text-xl md:text-2xl font-semibold text-slate-900"
              style={{ fontFamily: "'Georgia',serif" }}
            >
              {m.organizations.formTitle}
            </h2>

            {toast && (
              <div className="mt-4">
                <Toast kind={toast.kind} title={toast.title} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1" style={{ fontFamily: "system-ui,sans-serif" }}>
                  {m.b2gLanding.form.bin}
                </label>
                <input
                  value={bin}
                  onChange={(e) => setBin(e.target.value)}
                  name="bin"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  style={{ fontFamily: "system-ui,sans-serif" }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1" style={{ fontFamily: "system-ui,sans-serif" }}>
                  {m.b2gLanding.form.institutionType}
                </label>
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  name="orgName"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  style={{ fontFamily: "system-ui,sans-serif" }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1" style={{ fontFamily: "system-ui,sans-serif" }}>
                  {m.b2gLanding.form.institutionName}
                </label>
                <input
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  name="institutionName"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  style={{ fontFamily: "system-ui,sans-serif" }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1" style={{ fontFamily: "system-ui,sans-serif" }}>
                  {m.b2gLanding.form.contactName}
                </label>
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  name="contactName"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  style={{ fontFamily: "system-ui,sans-serif" }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1" style={{ fontFamily: "system-ui,sans-serif" }}>
                  {m.b2gLanding.form.email}
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  name="email"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  style={{ fontFamily: "system-ui,sans-serif" }}
                  type="email"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1" style={{ fontFamily: "system-ui,sans-serif" }}>
                  {m.b2gLanding.form.phone}
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  name="phone"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  style={{ fontFamily: "system-ui,sans-serif" }}
                  type="tel"
                  required
                />
              </div>

              <div className="md:col-span-2 mt-2">
                <button
                  type="submit"
                  disabled={!canSubmit || sending}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-white"
                  style={{
                    background: !canSubmit || sending ? "#94A3B8" : "#1D4ED8",
                    fontFamily: "system-ui,sans-serif",
                    fontSize: "0.9375rem",
                    border: "none",
                    cursor: !canSubmit || sending ? "not-allowed" : "pointer",
                  }}
                >
                  {sending ? m.organizations.formCtaSending : m.organizations.formCta}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function OrganizationsPage() {
  return <OrganizationsInner />;
}

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
  const [consentChecked, setConsentChecked] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      bin.trim().length >= 8 &&
      orgName.trim().length >= 3 &&
      institutionName.trim().length >= 3 &&
      contactName.trim().length >= 3 &&
      email.trim().length >= 5 &&
      phone.trim().length >= 6 &&
      consentChecked
    );
  }, [bin, orgName, institutionName, contactName, email, phone, consentChecked]);

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

  const inputStyle: React.CSSProperties = {
    fontFamily: "system-ui,sans-serif", color: "#111827", width: "100%",
    padding: "10px 14px", fontSize: "0.9rem", borderRadius: 10,
    border: "1.5px solid #E5E7EB", outline: "none", background: "#FAFAFA",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#F97316";
    e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,.12)";
    e.target.style.background = "white";
  };
  const onBlurInput = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#E5E7EB";
    e.target.style.boxShadow = "none";
  };

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#001220 0%,#002244 60%,#001A33 100%)" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full opacity-[0.06]" style={{ background: "white" }} />
          <div className="absolute right-40 bottom-0 w-56 h-56 rounded-full opacity-[0.03]" style={{ background: "white" }} />
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(249,115,22,.5),transparent)" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ background: "rgba(249,115,22,.18)", color: "#FCA668", border: "1px solid rgba(249,115,22,.3)", fontFamily: "system-ui,sans-serif" }}>
              <Building2 size={12} /> B2G / B2B
            </div>
            <h1 style={{
              fontFamily: "'Georgia',serif", fontSize: "clamp(1.6rem,3.6vw,2.6rem)",
              fontWeight: 700, color: "white", lineHeight: 1.18, letterSpacing: "-.02em", marginBottom: "0.9rem",
            }}>
              {m.organizations.heroTitle}
            </h1>
            <p style={{
              fontFamily: "system-ui,sans-serif", fontSize: "1.02rem",
              color: "rgba(255,255,255,.75)", lineHeight: 1.65, marginBottom: "1.75rem", maxWidth: 580,
            }}>
              {m.organizations.heroSubtitle}
            </p>
            <a href="#org-form"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
              style={{
                background: "linear-gradient(135deg,#F97316,#EA580C)",
                fontFamily: "system-ui,sans-serif", fontSize: "0.9375rem",
                boxShadow: "0 4px 20px rgba(249,115,22,.45)", textDecoration: "none",
              }}>
              {m.organizations.formCta} <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ── SPLIT COLUMNS ── */}
      <section className="py-12 lg:py-14" style={{ background: "white", borderBottom: "1px solid #F0F2F5" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-8"
            style={{ fontFamily: "system-ui,sans-serif", color: "#F97316", letterSpacing: "0.12em" }}>
            {m.organizations.govTitle} & {m.organizations.shopTitle}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              { icon: Building2, title: m.organizations.govTitle, desc: m.organizations.govDesc, points: m.organizations.govPoints },
              { icon: Store, title: m.organizations.shopTitle, desc: m.organizations.shopDesc, points: m.organizations.shopPoints },
            ].map(({ icon: Icon, title, desc, points }) => (
              <div key={title} className="rounded-2xl p-6"
                style={{ background: "#F8FAFC", border: "1px solid #F0F2F5" }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#FFF7ED,#FFEDD5)" }}>
                    <Icon size={22} style={{ color: "#F97316" }} />
                  </div>
                  <div>
                    <div className="font-semibold" style={{ fontFamily: "system-ui,sans-serif", fontSize: "1rem", color: "#111827" }}>
                      {title}
                    </div>
                    <div style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.8125rem", color: "#9CA3AF" }}>
                      {desc}
                    </div>
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <CheckCircle size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#F97316" }} />
                      <span style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.875rem", color: "#374151", lineHeight: 1.55 }}>
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORM ── */}
      <section className="py-12 lg:py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ fontFamily: "system-ui,sans-serif", color: "#F97316", letterSpacing: "0.12em" }}>
            {m.organizations.formTitle}
          </p>
          <h2 id="org-form" className="mb-8"
            style={{ fontFamily: "'Georgia',serif", fontSize: "clamp(1.3rem,2.5vw,1.75rem)", fontWeight: 700, color: "#111827" }}>
            {m.organizations.formTitle}
          </h2>

          {toast && <div className="mb-6"><Toast kind={toast.kind} title={toast.title} /></div>}

          <div className="rounded-2xl p-6 md:p-8"
            style={{ background: "white", border: "1px solid #F0F2F5", boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1.5" style={{ fontFamily: "system-ui,sans-serif", color: "#374151" }}>
                  {m.b2gLanding.form.bin}
                </label>
                <input value={bin} onChange={(e) => setBin(e.target.value)} name="bin"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlurInput} required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ fontFamily: "system-ui,sans-serif", color: "#374151" }}>
                  {m.b2gLanding.form.institutionType}
                </label>
                <input value={orgName} onChange={(e) => setOrgName(e.target.value)} name="orgName"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlurInput} required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ fontFamily: "system-ui,sans-serif", color: "#374151" }}>
                  {m.b2gLanding.form.institutionName}
                </label>
                <input value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} name="institutionName"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlurInput} required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ fontFamily: "system-ui,sans-serif", color: "#374151" }}>
                  {m.b2gLanding.form.contactName}
                </label>
                <input value={contactName} onChange={(e) => setContactName(e.target.value)} name="contactName"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlurInput} required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ fontFamily: "system-ui,sans-serif", color: "#374151" }}>
                  {m.b2gLanding.form.email}
                </label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} name="email"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlurInput} type="email" required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ fontFamily: "system-ui,sans-serif", color: "#374151" }}>
                  {m.b2gLanding.form.phone}
                </label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} name="phone"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlurInput} type="tel" required />
              </div>
              <div className="md:col-span-2">
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={consentChecked} onChange={(e) => setConsentChecked(e.target.checked)}
                    style={{ marginTop: 3, width: 16, height: 16, accentColor: "#F97316", flexShrink: 0, cursor: "pointer" }} />
                  <span style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.8125rem", color: "#6B7280", lineHeight: 1.55 }}>
                    Я согласен(-на) на сбор и обработку персональных данных.{" "}
                    <a href="/docs/consent-b2b.html" target="_blank" rel="noopener noreferrer"
                      style={{ color: "#F97316", textDecoration: "underline" }}>
                      Прочитать документ
                    </a>
                  </span>
                </label>
              </div>
              <div className="md:col-span-2 mt-2">
                <button type="submit" disabled={!canSubmit || sending}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white"
                  style={{
                    background: !canSubmit || sending ? "#CBD5E1" : "linear-gradient(135deg,#F97316,#EA580C)",
                    fontFamily: "system-ui,sans-serif", fontSize: "0.9375rem", border: "none",
                    cursor: !canSubmit || sending ? "not-allowed" : "pointer",
                    boxShadow: !canSubmit || sending ? "none" : "0 4px 14px rgba(249,115,22,.35)",
                  }}>
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

"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { supabase } from "@/lib/supabaseClient";
import {
  ArrowRight,
  Users,
  ShieldCheck,
  BadgeDollarSign,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

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

function ForAuthorsInner() {
  const { m } = useI18n();
  const [fullName, setFullName] = useState("");
  const [subject, setSubject] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ kind: "success" | "error"; title: string } | null>(null);

  const canSubmit = useMemo(() => {
    return (
      fullName.trim().length >= 3 &&
      subject.trim().length >= 2 &&
      portfolioUrl.trim().length >= 6 &&
      email.trim().length >= 5 &&
      phone.trim().length >= 6
    );
  }, [fullName, subject, portfolioUrl, email, phone]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setToast(null);
    setSubmitting(true);
    try {
      const { error } = await supabase.from("author_applications").insert([{
        full_name: fullName.trim(),
        specialization: subject.trim(),
        portfolio_url: portfolioUrl.trim(),
        email: email.trim(),
        phone: phone.trim(),
      }]);
      if (error) throw error;
      setFullName(""); setSubject(""); setPortfolioUrl(""); setEmail(""); setPhone("");
      setToast({ kind: "success", title: m.forAuthors.form.success });
    } catch {
      setToast({ kind: "error", title: m.forAuthors.form.error });
    } finally {
      setSubmitting(false);
      window.setTimeout(() => setToast(null), 5000);
    }
  }

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
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "#F97316";
    e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,.12)";
    e.target.style.background = "white";
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "#E5E7EB";
    e.target.style.boxShadow = "none";
  };

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
      {/* HERO */}
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
              <Users size={12} /> {m.forAuthors.heroTitle.split(" ").slice(0, 2).join(" ")}
            </div>
            <h1 style={{
              fontFamily: "'Georgia',serif",
              fontSize: "clamp(1.6rem,3.6vw,2.6rem)",
              fontWeight: 700, color: "white",
              lineHeight: 1.18, letterSpacing: "-.02em", marginBottom: "0.9rem",
            }}>
              {m.forAuthors.heroTitle}
            </h1>
            <p style={{
              fontFamily: "system-ui,sans-serif", fontSize: "1.02rem",
              color: "rgba(255,255,255,.75)", lineHeight: 1.65, marginBottom: "1.75rem", maxWidth: 560,
            }}>
              {m.forAuthors.heroSubtitle}
            </p>
            <a href="#lead-form"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
              style={{
                background: "linear-gradient(135deg,#F97316,#EA580C)",
                fontFamily: "system-ui,sans-serif", fontSize: "0.9375rem",
                boxShadow: "0 4px 20px rgba(249,115,22,.45)", textDecoration: "none",
              }}>
              {m.forAuthors.heroCta} <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* PERKS */}
      <section className="py-12 lg:py-14" style={{ background: "white", borderBottom: "1px solid #F0F2F5" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ fontFamily: "system-ui,sans-serif", color: "#F97316", letterSpacing: "0.12em" }}>
            {m.forAuthors.perksTitle}
          </p>
          <h2 className="mb-8" style={{ fontFamily: "'Georgia',serif", fontSize: "clamp(1.3rem,2.5vw,1.75rem)", fontWeight: 700, color: "#111827" }}>
            {m.forAuthors.perksTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: Users, title: m.forAuthors.perks.reachTitle, text: m.forAuthors.perks.reachText },
              { icon: BadgeDollarSign, title: m.forAuthors.perks.moneyTitle, text: m.forAuthors.perks.moneyText },
              { icon: ShieldCheck, title: m.forAuthors.perks.rightsTitle, text: m.forAuthors.perks.rightsText },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl p-6"
                style={{ background: "#F8FAFC", border: "1px solid #F0F2F5" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "linear-gradient(135deg,#FFF7ED,#FFEDD5)" }}>
                  <Icon size={22} style={{ color: "#F97316" }} />
                </div>
                <div className="font-semibold mb-2" style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.9375rem", color: "#111827" }}>
                  {title}
                </div>
                <div style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.875rem", color: "#6B7280", lineHeight: 1.65 }}>
                  {text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-12 lg:py-14" style={{ background: "#F8FAFC" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ fontFamily: "system-ui,sans-serif", color: "#F97316", letterSpacing: "0.12em" }}>
            {m.forAuthors.whyTitle}
          </p>
          <h2 className="mb-8" style={{ fontFamily: "'Georgia',serif", fontSize: "clamp(1.3rem,2.5vw,1.75rem)", fontWeight: 700, color: "#111827" }}>
            {m.forAuthors.whyTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {m.forAuthors.whyPoints.map((point, idx) => (
              <div key={idx} className="rounded-2xl p-5 flex gap-4"
                style={{ background: "white", border: "1px solid #F0F2F5", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ background: "linear-gradient(135deg,#FFF7ED,#FFEDD5)", color: "#F97316", fontFamily: "system-ui,sans-serif" }}>
                  {idx + 1}
                </div>
                <div>
                  <div className="font-semibold mb-1" style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.9rem", color: "#111827" }}>
                    {point.title}
                  </div>
                  <div style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.85rem", color: "#6B7280", lineHeight: 1.6 }}>
                    {point.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="py-12 lg:py-14" style={{ background: "white", borderTop: "1px solid #F0F2F5" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ fontFamily: "system-ui,sans-serif", color: "#F97316", letterSpacing: "0.12em" }}>
            {m.forAuthors.formTitle}
          </p>
          <h2 id="lead-form" className="mb-8" style={{ fontFamily: "'Georgia',serif", fontSize: "clamp(1.3rem,2.5vw,1.75rem)", fontWeight: 700, color: "#111827" }}>
            {m.forAuthors.formTitle}
          </h2>

          {toast && <div className="mb-6"><Toast kind={toast.kind} title={toast.title} /></div>}

          <div className="rounded-2xl p-6 md:p-8"
            style={{ background: "#F8FAFC", border: "1px solid #F0F2F5", boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
            <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1.5" style={{ fontFamily: "system-ui,sans-serif", color: "#374151" }}>
                  {m.forAuthors.form.fullName}
                </label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} autoComplete="name" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1.5" style={{ fontFamily: "system-ui,sans-serif", color: "#374151" }}>
                  {m.forAuthors.form.subject}
                </label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)}
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1.5" style={{ fontFamily: "system-ui,sans-serif", color: "#374151" }}>
                  {m.forAuthors.form.portfolio}
                </label>
                <input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)}
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} placeholder="https://" required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ fontFamily: "system-ui,sans-serif", color: "#374151" }}>
                  {m.forAuthors.form.email}
                </label>
                <input value={email} onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} type="email" autoComplete="email" required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ fontFamily: "system-ui,sans-serif", color: "#374151" }}>
                  {m.forAuthors.form.phone}
                </label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)}
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} type="tel" autoComplete="tel" required />
              </div>
              <div className="md:col-span-2 mt-2">
                <button type="submit" disabled={!canSubmit || submitting}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white"
                  style={{
                    background: !canSubmit || submitting ? "#CBD5E1" : "linear-gradient(135deg,#F97316,#EA580C)",
                    fontFamily: "system-ui,sans-serif", fontSize: "0.9375rem", border: "none",
                    cursor: !canSubmit || submitting ? "not-allowed" : "pointer",
                    boxShadow: !canSubmit || submitting ? "none" : "0 4px 14px rgba(249,115,22,.35)",
                  }}>
                  {submitting ? m.forAuthors.form.submitting : m.forAuthors.form.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ForAuthorsPage() {
  return <ForAuthorsInner />;
}

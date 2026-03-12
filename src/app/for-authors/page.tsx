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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#001A33 0%,#002D55 55%,#001A33 100%)" }}
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
              {m.forAuthors.heroTitle}
            </h1>
            <p
              style={{
                fontFamily: "system-ui,sans-serif",
                fontSize: "1.02rem",
                color: "rgba(255,255,255,.82)",
                lineHeight: 1.65,
                marginBottom: "1.5rem",
                maxWidth: 620,
              }}
            >
              {m.forAuthors.heroSubtitle}
            </p>
            <a
              href="#lead-form"
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
              {m.forAuthors.heroCta} <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* PERKS */}
      <section className="py-12 lg:py-14 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-6" style={{ fontFamily: "'Georgia',serif" }}>
            {m.forAuthors.perksTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Users, title: m.forAuthors.perks.reachTitle, text: m.forAuthors.perks.reachText },
              { icon: BadgeDollarSign, title: m.forAuthors.perks.moneyTitle, text: m.forAuthors.perks.moneyText },
              { icon: ShieldCheck, title: m.forAuthors.perks.rightsTitle, text: m.forAuthors.perks.rightsText },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: "#FFF7ED" }}>
                  <Icon size={22} style={{ color: "#F97316" }} />
                </div>
                <div className="text-base font-semibold text-slate-900 mb-1" style={{ fontFamily: "system-ui,sans-serif" }}>
                  {title}
                </div>
                <div className="text-sm text-slate-600" style={{ fontFamily: "system-ui,sans-serif", lineHeight: 1.6 }}>
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
          <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-6" style={{ fontFamily: "'Georgia',serif" }}>
            {m.forAuthors.whyTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {m.forAuthors.whyPoints.map((point, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white p-5 flex gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ background: "#FFF7ED", color: "#F97316", fontFamily: "system-ui,sans-serif" }}>
                  {idx + 1}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 mb-1" style={{ fontFamily: "system-ui,sans-serif" }}>
                    {point.title}
                  </div>
                  <div className="text-sm text-slate-600" style={{ fontFamily: "system-ui,sans-serif", lineHeight: 1.6 }}>
                    {point.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="py-12 lg:py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
            <h2 id="lead-form" className="text-xl md:text-2xl font-semibold text-slate-900" style={{ fontFamily: "'Georgia',serif" }}>
              {m.forAuthors.formTitle}
            </h2>

            {toast && <div className="mt-4"><Toast kind={toast.kind} title={toast.title} /></div>}

            <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1" style={{ fontFamily: "system-ui,sans-serif" }}>
                  {m.forAuthors.form.fullName}
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  style={{ fontFamily: "system-ui,sans-serif" }}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1" style={{ fontFamily: "system-ui,sans-serif" }}>
                  {m.forAuthors.form.subject}
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  style={{ fontFamily: "system-ui,sans-serif" }}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1" style={{ fontFamily: "system-ui,sans-serif" }}>
                  {m.forAuthors.form.portfolio}
                </label>
                <input
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  style={{ fontFamily: "system-ui,sans-serif" }}
                  placeholder="https://"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1" style={{ fontFamily: "system-ui,sans-serif" }}>
                  {m.forAuthors.form.email}
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  style={{ fontFamily: "system-ui,sans-serif" }}
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1" style={{ fontFamily: "system-ui,sans-serif" }}>
                  {m.forAuthors.form.phone}
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  style={{ fontFamily: "system-ui,sans-serif" }}
                  type="tel"
                  autoComplete="tel"
                  required
                />
              </div>

              <div className="md:col-span-2 mt-2">
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

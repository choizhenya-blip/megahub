"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { Mail, Phone, MapPin, BookOpen } from "lucide-react";

export function Footer() {
  const { m } = useI18n();

  const navLinks = [
    { href: "/catalog", label: m.nav.catalog },
    { href: "/organizations", label: m.nav.organizations },
    { href: "/for-authors", label: m.nav.authors },
    { href: "/contacts", label: m.nav.contacts },
  ];

  return (
    <footer style={{ background: "#0D1117", color: "white" }}>
      {/* Top stripe */}
      <div style={{ height: 3, background: "linear-gradient(90deg,#F97316 0%,#FB923C 50%,#FCD34D 100%)" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">

          {/* Brand */}
          <div>
            <a href="/" style={{ textDecoration: "none", display: "inline-block", marginBottom: "1rem" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                alt="MegaHub Education"
                style={{ height: 40, width: "auto", filter: "brightness(0) invert(1)" }}
              />
            </a>
            <p style={{
              fontFamily: "system-ui,sans-serif",
              fontSize: "0.875rem",
              color: "rgba(255,255,255,.55)",
              lineHeight: 1.7,
              marginBottom: "1.25rem",
            }}>
              Официальный дистрибьютор учебной литературы МОН РК. Прямые поставки для школ, акиматов и родителей.
            </p>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{
              background: "rgba(249,115,22,.12)",
              border: "1px solid rgba(249,115,22,.25)",
              display: "inline-flex",
            }}>
              <BookOpen size={14} style={{ color: "#F97316", flexShrink: 0 }} />
              <span style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.75rem", color: "#FB923C", fontWeight: 600 }}>
                Официальный поставщик МОН РК
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p style={{
              fontFamily: "system-ui,sans-serif",
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: "rgba(255,255,255,.35)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "1rem",
            }}>
              Навигация
            </p>
            <nav className="flex flex-col gap-2.5">
              {navLinks.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  style={{
                    fontFamily: "system-ui,sans-serif",
                    fontSize: "0.9rem",
                    color: "rgba(255,255,255,.65)",
                    textDecoration: "none",
                    transition: "color 0.15s",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#F97316")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.65)")}
                >
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor", flexShrink: 0, opacity: 0.5 }} />
                  {label}
                </a>
              ))}
            </nav>
          </div>

          {/* Contacts */}
          <div>
            <p style={{
              fontFamily: "system-ui,sans-serif",
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: "rgba(255,255,255,.35)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "1rem",
            }}>
              Контакты
            </p>
            <div className="flex flex-col gap-3.5">
              {[
                { icon: MapPin, text: m.contacts.address },
                { icon: Mail, text: m.contacts.email, href: `mailto:${m.contacts.email}` },
                { icon: Phone, text: m.contacts.phone, href: `tel:${m.contacts.phone.replace(/\s/g, "")}` },
              ].map(({ icon: Icon, text, href }, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: "rgba(249,115,22,.12)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Icon size={14} style={{ color: "#F97316" }} />
                  </div>
                  {href ? (
                    <a href={href} style={{
                      fontFamily: "system-ui,sans-serif",
                      fontSize: "0.875rem",
                      color: "rgba(255,255,255,.65)",
                      textDecoration: "none",
                      lineHeight: 1.5,
                      alignSelf: "center",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#F97316")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.65)")}
                    >
                      {text}
                    </a>
                  ) : (
                    <span style={{
                      fontFamily: "system-ui,sans-serif",
                      fontSize: "0.875rem",
                      color: "rgba(255,255,255,.65)",
                      lineHeight: 1.5,
                      alignSelf: "center",
                    }}>
                      {text}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", marginTop: "3rem", paddingTop: "1.5rem" }}
          className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,.3)" }}>
            {m.footer.copyright}
          </p>
          <div className="flex items-center gap-4">
            <a href="/docs/consent-b2c.html" target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,.3)", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,.6)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.3)")}
            >
              Политика конфиденциальности
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

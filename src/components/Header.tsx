"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Menu,
  X,
  Truck,
  Download,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import type { Language } from "@/i18n";
import { useCartStore, MAX_QTY } from "@/lib/store";
import { getSubjectLocalized } from "@/lib/subjectI18n";

export function Header() {
  const { lang, setLang, m } = useI18n();
  const pathname = usePathname();
  const { items, remove, setQty, clear } = useCartStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isB2G, setIsB2G] = useState(false);
  const [orderSent, setOrderSent] = useState(false);

  // Hide public header on admin and B2B portal pages (they have their own headers)
  const isHidden =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/b2b/catalog") ||
    pathname.startsWith("/b2b/quotes");

  // Checkout form step
  const [checkoutStep, setCheckoutStep] = useState(false);
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutAddress, setCheckoutAddress] = useState("");
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  // Per-item "need more" comments (shown when stock limit is reached)
  const [moreComments, setMoreComments] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      setIsB2G(!!window.localStorage.getItem("megahub-b2g-client"));
    } catch {
      /* ignore */
    }
  }, []);

  const cartCount = items.reduce((s, i) => s + i.qty, 0);
  const cartTotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  // Resolve title / subject for current locale
  const localeLower = lang.toLowerCase() as "ru" | "kz" | "en";
  const getTitle   = (item: (typeof items)[0]) => item.titles[localeLower] || item.titles.ru;
  const getSubject = (item: (typeof items)[0]) =>
    getSubjectLocalized(item.subjects, lang);

  const navLinks = [
    { href: "/", label: m.nav.home },
    { href: "/catalog", label: m.nav.catalog },
    { href: "/organizations", label: m.nav.organizations },
    { href: "/for-authors", label: m.nav.authors },
    { href: "/contacts", label: m.nav.contacts },
  ];

  // ── Close cart / reset checkout step ───────────────────────
  const handleCloseCart = () => {
    setCartOpen(false);
    setCheckoutStep(false);
    setCheckoutName("");
    setCheckoutPhone("");
    setCheckoutAddress("");
    setConsentChecked(false);
    setMoreComments({});
  };

  // ── Submit order to /api/submit-order ──────────────────────
  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkoutSubmitting) return;
    setCheckoutSubmitting(true);

    const orderData = {
      name: checkoutName,
      phone: checkoutPhone,
      address: checkoutAddress,
      category: isB2G ? "B2B/B2G" : "B2C",
      items: items.map((i) => ({
        id: i.id,
        sku: i.sku,
        titleRu: i.titles.ru,
        price: i.price,
        qty: i.qty,
      })),
      totalPrice: cartTotal,
      // Per-item "need more" comments (keyed by item SKU)
      moreComments: Object.keys(moreComments).reduce<Record<string, string>>((acc, id) => {
        const item = items.find((i) => i.id === id);
        if (item && moreComments[id]?.trim()) acc[item.sku] = moreComments[id];
        return acc;
      }, {}),
    };

    try {
      // TODO: connect real BITRIX_WEBHOOK_URL in .env.local for production
      await fetch("/api/submit-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
    } catch (err) {
      console.error("[Order] submit error:", err);
    }

    console.log("[Order] 📦 submitted:", orderData);

    clear();
    setMoreComments({});
    setCheckoutStep(false);
    setCheckoutName("");
    setCheckoutPhone("");
    setCheckoutAddress("");
    setCheckoutSubmitting(false);
    setConsentChecked(false);
    setOrderSent(true);
    setTimeout(() => setOrderSent(false), 4000);
  };

  const downloadKP = () => {
    if (!items.length) return;
    const lines = [
      "Коммерческое предложение",
      "",
      ...items.map(
        (i) =>
          `${i.titles.ru} × ${i.qty} — ₸ ${(i.price * i.qty).toLocaleString("ru-KZ")}`
      ),
      "",
      `Итого: ₸ ${cartTotal.toLocaleString("ru-KZ")}`,
      `Дата: ${new Date().toLocaleString("ru-KZ")}`,
      "",
      "Доставка рассчитывается менеджером после подтверждения заказа.",
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kp.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const canSubmitCheckout =
    checkoutName.trim().length >= 2 && checkoutPhone.trim().length >= 6 && consentChecked;

  if (isHidden) return null;

  return (
    <>
      <header
        className="sticky top-0 z-50 bg-white"
        style={{
          borderBottom: "1px solid #E5E7EB",
          boxShadow: "0 1px 12px rgba(0,0,0,.07)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* ─── Logo ─── */}
            <a
              href="/"
              className="flex items-center select-none flex-shrink-0"
              style={{ textDecoration: "none" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                alt="Логотип"
                style={{ height: 44, width: "auto" }}
              />
            </a>

            {/* ─── Desktop Nav ─── */}
            <nav className="hidden md:flex items-center gap-5 lg:gap-7">
              {navLinks.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <a
                    key={href}
                    href={href}
                    style={{
                      color: active ? "#F97316" : "#4B5563",
                      textDecoration: "none",
                      fontFamily: "system-ui,sans-serif",
                      fontSize: "0.875rem",
                      fontWeight: active ? 600 : 500,
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#F97316")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = active
                        ? "#F97316"
                        : "#4B5563")
                    }
                  >
                    {label}
                  </a>
                );
              })}
            </nav>

            {/* ─── Right Controls ─── */}
            <div className="flex items-center gap-2">
              {/* Language switcher */}
              <div
                className="hidden sm:flex items-center gap-1 rounded-lg p-1"
                style={{ background: "#F1F5F9" }}
              >
                {(["RU", "KZ", "EN"] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={{
                      fontFamily: "system-ui,sans-serif",
                      background: l === lang ? "white" : "transparent",
                      color: l === lang ? "#111827" : "#475569",
                      border:
                        l === lang
                          ? "1px solid #E5E7EB"
                          : "1px solid transparent",
                      cursor: "pointer",
                    }}
                    aria-label={`${m.language.label}: ${l}`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {/* Cart button */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 rounded-lg"
                style={{ background: "#F1F5F9" }}
                aria-label={m.cart.title}
              >
                <ShoppingCart size={20} style={{ color: "#374151" }} />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white"
                    style={{
                      background: "#F97316",
                      fontFamily: "system-ui,sans-serif",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Burger (mobile) */}
              <button
                className="md:hidden p-2 rounded-lg"
                style={{ background: "#F1F5F9" }}
                onClick={() => setMobileOpen((o) => !o)}
                aria-label="Меню"
              >
                {mobileOpen ? <X size={20} style={{ color: "#374151" }} /> : <Menu size={20} style={{ color: "#374151" }} />}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Mobile Drawer ─── */}
        {mobileOpen && (
          <div
            className="md:hidden border-t bg-white px-4 pb-4 pt-2"
            style={{ borderColor: "#F3F4F6" }}
          >
            {navLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="block py-3 text-sm"
                style={{
                  color: pathname === href ? "#F97316" : "#374151",
                  textDecoration: "none",
                  fontFamily: "system-ui,sans-serif",
                  fontWeight: pathname === href ? 600 : 400,
                  borderBottom: "1px solid #F9FAFB",
                }}
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </a>
            ))}
            <div className="flex items-center gap-1.5 pt-3">
              {(["RU", "KZ", "EN"] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold"
                  style={{
                    fontFamily: "system-ui,sans-serif",
                    background: l === lang ? "white" : "transparent",
                    color: l === lang ? "#111827" : "#475569",
                    border:
                      l === lang
                        ? "1px solid #E5E7EB"
                        : "1px solid transparent",
                    cursor: "pointer",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ─── Cart Drawer ─── */}
      {cartOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={handleCloseCart}
          />
          {/* Panel */}
          <div
            className="fixed right-0 top-0 h-full z-50 bg-white shadow-2xl flex flex-col"
            style={{ width: "min(24rem, 100vw)" }}
          >
            {/* Cart header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "#E5E7EB" }}
            >
              <h2
                style={{
                  fontFamily: "'Georgia',serif",
                  fontWeight: 700,
                  fontSize: "1.125rem",
                  color: "#111827",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {checkoutStep ? (
                  <>
                    <button
                      onClick={() => setCheckoutStep(false)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        color: "#374151",
                      }}
                      aria-label={m.cart.backToCart}
                    >
                      <ArrowLeft size={18} />
                    </button>
                    {m.cart.checkoutTitle}
                  </>
                ) : (
                  <>
                    {m.cart.title}{" "}
                    {cartCount > 0 && (
                      <span style={{ color: "#6B7280", fontSize: "0.875rem" }}>
                        ({cartCount})
                      </span>
                    )}
                  </>
                )}
              </h2>
              <button
                onClick={handleCloseCart}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} style={{ color: "#374151" }} />
              </button>
            </div>

            {/* ── Order sent banner ── */}
            {orderSent && (
              <div
                className="flex items-center gap-2 px-5 py-2.5"
                style={{ background: "#ECFDF5", borderBottom: "1px solid #A7F3D0" }}
              >
                <CheckCircle size={16} style={{ color: "#059669", flexShrink: 0 }} />
                <p
                  style={{
                    fontFamily: "system-ui,sans-serif",
                    fontSize: "0.8125rem",
                    color: "#065F46",
                    fontWeight: 600,
                  }}
                >
                  {m.cart.orderSuccess}
                </p>
              </div>
            )}

            {/* ─── CHECKOUT STEP ─── */}
            {checkoutStep ? (
              <form
                onSubmit={handleConfirmOrder}
                className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4"
              >
                {/* Order summary — total */}
                <div
                  className="flex items-center justify-between rounded-xl px-3 py-2.5"
                  style={{ background: "#FFF7ED", border: "1.5px solid #FED7AA" }}
                >
                  <div>
                    <p
                      style={{
                        fontFamily: "system-ui,sans-serif",
                        fontSize: "0.7rem",
                        color: "#9A3412",
                        fontWeight: 500,
                        marginBottom: 1,
                      }}
                    >
                      {cartCount} {cartCount === 1 ? "позиция" : cartCount < 5 ? "позиции" : "позиций"}
                    </p>
                    <span
                      style={{
                        fontFamily: "system-ui,sans-serif",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      {m.cart.total}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "system-ui,sans-serif",
                      fontWeight: 800,
                      fontSize: "1.25rem",
                      color: "#F97316",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    ₸&nbsp;{cartTotal.toLocaleString("ru-KZ")}
                  </span>
                </div>

                {/* Order summary — delivery note */}
                <div
                  className="flex items-start gap-2 rounded-lg px-3 py-2.5 -mt-1"
                  style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
                >
                  <Truck size={14} style={{ color: "#16A34A", flexShrink: 0, marginTop: 2 }} />
                  <p
                    style={{
                      fontFamily: "system-ui,sans-serif",
                      fontSize: "0.75rem",
                      color: "#15803D",
                      lineHeight: 1.5,
                      fontWeight: 500,
                    }}
                  >
                    {m.cart.deliveryNote}
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label
                    className="block text-xs font-semibold text-slate-600 mb-1"
                    style={{ fontFamily: "system-ui,sans-serif" }}
                  >
                    {m.cart.checkoutName} *
                  </label>
                  <input
                    value={checkoutName}
                    onChange={(e) => setCheckoutName(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    style={{ fontFamily: "system-ui,sans-serif", color: "#111827" }}
                    autoComplete="name"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    className="block text-xs font-semibold text-slate-600 mb-1"
                    style={{ fontFamily: "system-ui,sans-serif" }}
                  >
                    {m.cart.checkoutPhone} *
                  </label>
                  <input
                    value={checkoutPhone}
                    onChange={(e) => setCheckoutPhone(e.target.value)}
                    required
                    type="tel"
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    style={{ fontFamily: "system-ui,sans-serif", color: "#111827" }}
                    autoComplete="tel"
                    placeholder="+7 700 000 00 00"
                  />
                </div>

                {/* Address (optional) */}
                <div>
                  <label
                    className="block text-xs font-semibold text-slate-600 mb-1"
                    style={{ fontFamily: "system-ui,sans-serif" }}
                  >
                    {m.cart.checkoutAddress}
                  </label>
                  <input
                    value={checkoutAddress}
                    onChange={(e) => setCheckoutAddress(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    style={{ fontFamily: "system-ui,sans-serif", color: "#111827" }}
                    autoComplete="street-address"
                  />
                </div>

                {/* Consent checkbox */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    cursor: "pointer",
                    marginTop: "4px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    style={{
                      marginTop: "2px",
                      width: 16,
                      height: 16,
                      accentColor: "#F97316",
                      flexShrink: 0,
                      cursor: "pointer",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "system-ui,sans-serif",
                      fontSize: "0.75rem",
                      color: "#6B7280",
                      lineHeight: 1.5,
                    }}
                  >
                    Я согласен(-на) на сбор и обработку моих персональных данных.{" "}
                    <a
                      href="/docs/consent-b2c.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#F97316", textDecoration: "underline" }}
                    >
                      Прочитать документ
                    </a>
                  </span>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!canSubmitCheckout || checkoutSubmitting}
                  className="w-full py-3 rounded-lg font-semibold text-white mt-2"
                  style={{
                    background: !canSubmitCheckout || checkoutSubmitting ? "#94A3B8" : "#F97316",
                    fontFamily: "system-ui,sans-serif",
                    fontSize: "0.9375rem",
                    border: "none",
                    cursor: !canSubmitCheckout || checkoutSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {checkoutSubmitting ? m.cart.checkoutSubmitting : m.cart.checkoutSubmit}
                </button>

                <button
                  type="button"
                  onClick={() => setCheckoutStep(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "system-ui,sans-serif",
                    fontSize: "0.8125rem",
                    color: "#6B7280",
                    textAlign: "center",
                    padding: "0.25rem 0",
                  }}
                >
                  {m.cart.backToCart}
                </button>
              </form>
            ) : (
              <>
                {/* ─── CART ITEMS LIST ─── */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {items.length === 0 ? (
                    <p
                      style={{
                        fontFamily: "system-ui,sans-serif",
                        color: "#9CA3AF",
                        fontSize: "0.875rem",
                        textAlign: "center",
                        paddingTop: "2rem",
                      }}
                    >
                      {m.cart.empty}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="pb-3"
                          style={{ borderBottom: "1px solid #F3F4F6" }}
                        >
                          {/* Title + trash */}
                          <div className="flex items-start gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <p
                                style={{
                                  fontFamily: "'Georgia',serif",
                                  fontSize: "0.875rem",
                                  fontWeight: 600,
                                  color: "#111827",
                                  lineHeight: 1.35,
                                }}
                              >
                                {getTitle(item)}
                              </p>
                              <p
                                style={{
                                  fontFamily: "system-ui,sans-serif",
                                  fontSize: "0.72rem",
                                  color: "#9CA3AF",
                                  marginTop: 2,
                                }}
                              >
                                {getSubject(item)}
                              </p>
                            </div>
                            <button
                              onClick={() => remove(item.id)}
                              title={m.cart.remove}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "#D1D5DB",
                                padding: 4,
                                flexShrink: 0,
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.color = "#EF4444")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.color = "#D1D5DB")
                              }
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Qty controller + line price */}
                          {(() => {
                            const effectiveMax = Math.min(MAX_QTY, item.stock);
                            const atLimit = item.qty >= effectiveMax;
                            const atStockLimit = atLimit && item.stock < MAX_QTY;
                            const limitNote = atStockLimit
                              ? `${m.cart.stockLimitReached} ${item.stock} ${m.book.inStockSuffix}`
                              : m.cart.maxQtyNote;
                            return (
                              <>
                                <div className="flex items-center justify-between gap-2">
                                  {/* − qty + */}
                                  <div
                                    className="flex items-center rounded-lg overflow-hidden"
                                    style={{ border: "1px solid #E5E7EB" }}
                                  >
                                    <button
                                      onClick={() => setQty(item.id, item.qty - 1)}
                                      className="flex items-center justify-center w-7 h-7"
                                      style={{ background: "none", border: "none", cursor: "pointer", color: "#374151" }}
                                      aria-label="−"
                                    >
                                      <Minus size={12} />
                                    </button>
                                    <span
                                      className="w-8 text-center text-xs font-semibold"
                                      style={{
                                        fontFamily: "system-ui,sans-serif",
                                        color: "#111827",
                                        borderLeft: "1px solid #E5E7EB",
                                        borderRight: "1px solid #E5E7EB",
                                        lineHeight: "1.75rem",
                                      }}
                                    >
                                      {item.qty}
                                    </span>
                                    <button
                                      onClick={() => setQty(item.id, item.qty + 1)}
                                      disabled={atLimit}
                                      className="flex items-center justify-center w-7 h-7"
                                      style={{
                                        background: "none",
                                        border: "none",
                                        cursor: atLimit ? "not-allowed" : "pointer",
                                        color: atLimit ? "#D1D5DB" : "#374151",
                                      }}
                                      aria-label="+"
                                      title={atLimit ? limitNote : undefined}
                                    >
                                      <Plus size={12} />
                                    </button>
                                  </div>

                                  <p
                                    style={{
                                      fontFamily: "system-ui,sans-serif",
                                      fontSize: "0.8125rem",
                                      fontWeight: 700,
                                      color: "#111827",
                                    }}
                                  >
                                    ₸ {(item.price * item.qty).toLocaleString("ru-KZ")}
                                  </p>
                                </div>

                                {/* Limit note */}
                                {atLimit && (
                                  <p style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.68rem", color: "#F97316", marginTop: 4 }}>
                                    {limitNote}
                                  </p>
                                )}

                                {/* "Need more?" textarea — shown when stock is the limit */}
                                {atStockLimit && (
                                  <div style={{ marginTop: 6 }}>
                                    <p style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.7rem", color: "#6B7280", marginBottom: 3 }}>
                                      {m.cart.needMore}
                                    </p>
                                    <textarea
                                      rows={2}
                                      value={moreComments[item.id] ?? ""}
                                      onChange={(e) =>
                                        setMoreComments((prev) => ({
                                          ...prev,
                                          [item.id]: e.target.value,
                                        }))
                                      }
                                      placeholder={m.cart.needMorePlaceholder}
                                      style={{
                                        width: "100%",
                                        fontSize: "0.72rem",
                                        fontFamily: "system-ui,sans-serif",
                                        color: "#111827",
                                        background: "#F9FAFB",
                                        border: "1px solid #E5E7EB",
                                        borderRadius: 6,
                                        padding: "4px 8px",
                                        resize: "none",
                                        outline: "none",
                                        boxSizing: "border-box",
                                      }}
                                    />
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ─── CART FOOTER ─── */}
                {items.length > 0 && (
                  <div
                    className="px-5 py-4 border-t"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    {/* Total */}
                    <div
                      className="flex items-center justify-between mb-3 px-3 py-2.5 rounded-xl"
                      style={{ background: "#FFF7ED", border: "1.5px solid #FED7AA" }}
                    >
                      <div>
                        <p
                          style={{
                            fontFamily: "system-ui,sans-serif",
                            fontSize: "0.7rem",
                            color: "#9A3412",
                            fontWeight: 500,
                            marginBottom: 1,
                          }}
                        >
                          {cartCount} {cartCount === 1 ? "позиция" : cartCount < 5 ? "позиции" : "позиций"}
                        </p>
                        <span
                          style={{
                            fontFamily: "system-ui,sans-serif",
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            color: "#111827",
                          }}
                        >
                          {m.cart.total}
                        </span>
                      </div>
                      <span
                        style={{
                          fontFamily: "system-ui,sans-serif",
                          fontWeight: 800,
                          fontSize: "1.375rem",
                          color: "#F97316",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        ₸&nbsp;{cartTotal.toLocaleString("ru-KZ")}
                      </span>
                    </div>

                    {/* Delivery note */}
                    <div
                      className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-lg"
                      style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
                    >
                      <Truck
                        size={15}
                        style={{ color: "#16A34A", flexShrink: 0, marginTop: 1 }}
                      />
                      <p
                        style={{
                          fontFamily: "system-ui,sans-serif",
                          fontSize: "0.775rem",
                          color: "#15803D",
                          lineHeight: 1.5,
                          fontWeight: 500,
                        }}
                      >
                        {m.cart.deliveryNote}
                      </p>
                    </div>

                    {/* Proceed to checkout */}
                    <button
                      onClick={() => setCheckoutStep(true)}
                      className="w-full py-3 rounded-lg font-semibold text-white mb-2"
                      style={{
                        background: "#F97316",
                        fontFamily: "system-ui,sans-serif",
                        fontSize: "0.9375rem",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {m.cart.checkout}
                    </button>

                    {/* Download KP (B2G only) */}
                    {isB2G && (
                      <button
                        onClick={downloadKP}
                        className="w-full py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2"
                        style={{
                          background: "#111827",
                          color: "#F9FAFB",
                          fontFamily: "system-ui,sans-serif",
                          fontSize: "0.875rem",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <Download size={14} /> {m.cart.downloadCp}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}

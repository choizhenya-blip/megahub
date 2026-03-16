"use client";

import { usePathname } from "next/navigation";
import { Package, Users, Languages, Building2 } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Каталог", icon: Package, exact: true },
  { href: "/admin/users", label: "Пользователи", icon: Users },
  { href: "/admin/translations", label: "Переводы", icon: Languages },
  { href: "/admin/b2b", label: "B2B-заявки", icon: Building2 },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav style={{
      background: "#fff",
      borderBottom: "1px solid #E5E7EB",
      padding: "0 24px",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        display: "flex", gap: 0,
      }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <a
              key={href}
              href={href}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "12px 16px",
                fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? "#F97316" : "#6B7280",
                textDecoration: "none",
                borderBottom: active ? "2px solid #F97316" : "2px solid transparent",
                transition: "color 0.15s, border-color 0.15s, background 0.15s",
                whiteSpace: "nowrap",
                borderRadius: "6px 6px 0 0",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#374151"; e.currentTarget.style.background = "#F9FAFB"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = active ? "#F97316" : "#6B7280"; e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={15} />
              {label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

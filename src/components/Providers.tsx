"use client";

import { I18nProvider } from "@/i18n/I18nProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <I18nProvider defaultLang="RU">{children}</I18nProvider>;
}

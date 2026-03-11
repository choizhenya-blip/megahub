"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Language, Messages } from "./index";
import { getMessages } from "./index";

type I18nContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  m: Messages;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "megahub.lang";

export function I18nProvider({
  children,
  defaultLang = "RU",
}: {
  children: React.ReactNode;
  defaultLang?: Language;
}) {
  const [lang, setLangState] = useState<Language>(defaultLang);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved === "RU" || saved === "KZ" || saved === "EN") setLangState(saved);
    } catch {
      // ignore
    }
  }, []);

  const setLang = (next: Language) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  const value = useMemo<I18nContextValue>(() => {
    return { lang, setLang, m: getMessages(lang) };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}


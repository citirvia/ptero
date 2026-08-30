"use client";

import { createContext, useContext } from "react";
import { dictionaries, type Locale } from "./dictionary";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale: Locale = "en";
  const setLocale = () => {};
  const t = (key: string) => dictionaries.en[key] ?? key;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback so components work outside the provider (e.g. tests).
    return {
      locale: "en" as Locale,
      setLocale: () => {},
      t: (key: string) => dictionaries.en[key] ?? key,
    };
  }
  return ctx;
}

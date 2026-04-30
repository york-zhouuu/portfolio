"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_LOCALE, type Locale, LOCALES } from "./types";

const STORAGE_KEY = "portfolio-locale";

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
}>({ locale: DEFAULT_LOCALE, setLocale: () => {} });

/**
 * LocaleProvider — wraps the app, keeps locale in client state, persists to
 * localStorage, and reflects the choice on `<html data-locale>` so future
 * CSS / no-flash tricks can hook in.
 *
 * Iteration seam: this is the single swap point for locale storage. If
 * later we want cookie-based locale (for SSR-aware initial render) or
 * URL-segment-based locale (for shareable language links), only this file
 * + a small bit of layout.tsx changes.
 */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && (LOCALES as readonly string[]).includes(stored)) {
      setLocaleState(stored as Locale);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // localStorage may be unavailable (private mode etc.); ignore
    }
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * Locale toggle. Two states only — 中 / EN. Mono caps to match the chrome
 * register; sits in SiteNav.
 */
export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  const next = locale === "zh" ? "en" : "zh";
  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      aria-label={`Switch language to ${next === "zh" ? "中文" : "English"}`}
      className="font-mono text-caption uppercase tracking-[0.24em] text-muted transition-colors hover:text-fg"
    >
      <span aria-hidden className={locale === "zh" ? "text-fg" : ""}>
        中
      </span>
      <span aria-hidden className="mx-1 text-muted/60">
        /
      </span>
      <span aria-hidden className={locale === "en" ? "text-fg" : ""}>
        EN
      </span>
    </button>
  );
}

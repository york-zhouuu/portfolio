"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { pickLang, type I18nString } from "@/lib/i18n/types";

/**
 * <T value={…} /> — the universal "render this localized string" component.
 *
 * Pass either an I18nString ({zh, en}) or a plain string (treated as
 * locale-agnostic). Server components can pass either through; the client
 * picks the right language at render time via the LocaleProvider context.
 *
 * Brief flash on first paint is possible if user has stored locale=en
 * (server pre-renders zh by default). Acceptable for v1; we can add a
 * pre-hydration script later if needed.
 */
export function T({ value }: { value: I18nString | string }) {
  const { locale } = useLocale();
  return <>{pickLang(value, locale)}</>;
}

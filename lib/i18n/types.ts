/**
 * i18n primitive types — shared by the schema, provider, and components.
 * Keep this module tiny; both server and client code import it.
 */

export type Locale = "zh" | "en";

export const LOCALES: readonly Locale[] = ["zh", "en"] as const;
export const DEFAULT_LOCALE: Locale = "zh";

export type I18nString = { zh: string; en: string };

export const isI18nString = (value: unknown): value is I18nString =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as I18nString).zh === "string" &&
  typeof (value as I18nString).en === "string";

/** Pick the right language out of an i18n string (or pass through plain strings). */
export function pickLang(value: I18nString | string, locale: Locale): string {
  if (typeof value === "string") return value;
  return value[locale] ?? value.zh ?? value.en ?? "";
}

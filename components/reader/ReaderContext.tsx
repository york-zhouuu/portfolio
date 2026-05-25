"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/types";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export type ResidentStoryEntry = {
  slug: string;
  displayName: { zh: string; en: string };
  role: { zh: string; en: string };
  languages: Locale[];
  agentId?: string;
  studySlug: string;
};

type ReaderContextValue = {
  stories: ResidentStoryEntry[];
  currentStory: ResidentStoryEntry | null;
  currentLang: Locale;
  openReader: (slug: string, lang?: Locale) => void;
  closeReader: () => void;
  setCurrentLang: (lang: Locale) => void;
};

const ReaderContext = createContext<ReaderContextValue | null>(null);

export function useReaderContext(): ReaderContextValue | null {
  return useContext(ReaderContext);
}

export function ReaderProvider({
  stories,
  children,
}: {
  stories: ResidentStoryEntry[];
  children: React.ReactNode;
}) {
  const { locale } = useLocale();
  const router = useRouter();
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState<Locale>(locale);
  const triggerRef = useRef<HTMLElement | null>(null);

  const currentStory = useMemo(
    () => (currentSlug ? stories.find((s) => s.slug === currentSlug) ?? null : null),
    [currentSlug, stories],
  );

  const pickLang = useCallback(
    (entry: ResidentStoryEntry, requested?: Locale): Locale => {
      const tryOrder: Locale[] = requested
        ? [requested, locale, "zh", "en"]
        : [locale, "zh", "en"];
      for (const l of tryOrder) {
        if (entry.languages.includes(l)) return l;
      }
      return entry.languages[0] ?? "zh";
    },
    [locale],
  );

  const openReader = useCallback(
    (slug: string, lang?: Locale) => {
      const entry = stories.find((s) => s.slug === slug);
      if (!entry) return;
      triggerRef.current = (typeof document !== "undefined"
        ? (document.activeElement as HTMLElement | null)
        : null);
      setCurrentLang(pickLang(entry, lang));
      setCurrentSlug(slug);
    },
    [stories, pickLang],
  );

  const closeReader = useCallback(() => {
    setCurrentSlug(null);
    // restore focus on next tick so the sheet has time to unmount
    const trigger = triggerRef.current;
    triggerRef.current = null;
    if (trigger && typeof trigger.focus === "function") {
      window.setTimeout(() => trigger.focus(), 0);
    }
  }, []);

  // Honor ?open=<slug> on mount — open the reader, then strip the param.
  // Uses window.location instead of useSearchParams to avoid forcing
  // every nested page into dynamic rendering / requiring a Suspense boundary.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("open");
    if (!slug) return;
    const entry = stories.find((s) => s.slug === slug);
    if (entry) openReader(slug);
    params.delete("open");
    const qs = params.toString();
    router.replace(qs ? `${window.location.pathname}?${qs}` : window.location.pathname, {
      scroll: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the page locale changes while reader is closed, sync the reader's
  // initial-open language to follow. Don't interrupt an open session.
  useEffect(() => {
    if (currentSlug === null) setCurrentLang(locale);
  }, [locale, currentSlug]);

  // Listen for global "open-resident-story" event — used by R3F overlays
  // (StoriesPointersOverlay) and other components that can't easily reach
  // the React context tree directly. Detail must include { slug: string }.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ slug?: string }>).detail;
      const slug = detail?.slug;
      if (slug) openReader(slug);
    };
    window.addEventListener("open-resident-story", onOpen as EventListener);
    return () =>
      window.removeEventListener("open-resident-story", onOpen as EventListener);
  }, [openReader]);

  const value = useMemo<ReaderContextValue>(
    () => ({
      stories,
      currentStory,
      currentLang,
      openReader,
      closeReader,
      setCurrentLang,
    }),
    [stories, currentStory, currentLang, openReader, closeReader],
  );

  return <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>;
}

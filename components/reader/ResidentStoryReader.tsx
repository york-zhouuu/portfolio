"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import type { Locale } from "@/lib/i18n/types";
import { useReaderContext, type ResidentStoryEntry } from "./ReaderContext";

function resolveSrc(entry: ResidentStoryEntry, lang: Locale): string {
  const base = `/case-studies/${entry.studySlug}/people/${entry.slug}`;
  // Convention: <slug>.html is the zh canonical; <slug>_en.html is the en variant.
  return lang === "zh" ? `${base}.html` : `${base}_${lang}.html`;
}

export function ResidentStoryReader() {
  const ctx = useReaderContext();
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  // Reset load state whenever target src changes.
  useEffect(() => {
    setLoaded(false);
    setErrored(false);
  }, [ctx?.currentStory?.slug, ctx?.currentLang]);

  // ESC to close + focus to ✕ on open
  useEffect(() => {
    if (!ctx?.currentStory) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        ctx.closeReader();
      }
    };
    document.addEventListener("keydown", onKey);
    // Defer focus to allow animation to start
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 50);
    // Lock body scroll while reader is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
    };
  }, [ctx?.currentStory, ctx]);

  if (!mounted || !ctx) return null;
  const story = ctx.currentStory;
  const open = story !== null;

  // Always render the portal so animations on close run; visibility is
  // controlled by `open` class. But skip when no story has been opened yet.
  if (!open && !sheetRef.current) {
    // Nothing has ever been opened — skip to keep DOM clean.
    // Once we render once, keep the wrapper for exit animations.
    return null;
  }

  const src = story ? resolveSrc(story, ctx.currentLang) : "";
  const displayName = story
    ? story.displayName[ctx.currentLang] ?? story.displayName.zh
    : "";
  const role = story ? story.role[ctx.currentLang] ?? story.role.zh : "";

  return createPortal(
    <div
      aria-hidden={!open}
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 45 }}
    >
      {/* Dim backdrop — also catches clicks to close. */}
      <button
        type="button"
        aria-label="Close reader"
        tabIndex={-1}
        onClick={() => ctx.closeReader()}
        className={clsx(
          "absolute inset-0 transition-opacity duration-200 ease-out",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        style={{
          background: "oklch(var(--bg) / 0.6)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={displayName || "Resident story"}
        className={clsx(
          "absolute inset-x-0 bottom-0 flex flex-col bg-bg shadow-[0_-12px_48px_oklch(0_0_0/0.4)]",
          "transition-transform duration-[320ms] ease-chamber",
          open ? "pointer-events-auto translate-y-0" : "translate-y-full",
        )}
        style={{
          zIndex: 50,
          height: "min(92vh, 1100px)",
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
        }}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-line/40 px-5 py-3 md:px-8">
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-caption uppercase tracking-[0.18em] text-muted">
              Resident story
            </p>
            {story && (
              <p className="truncate text-subhead text-fg">
                {displayName}
                <span className="ml-2 text-muted">· {role}</span>
              </p>
            )}
          </div>

          {story && (
            <LanguageToggle
              available={story.languages}
              current={ctx.currentLang}
              onChange={ctx.setCurrentLang}
            />
          )}

          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => ctx.closeReader()}
            aria-label="Close reader"
            className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-line/40 text-fg/80 transition-colors hover:bg-fg/10 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path
                d="M1 1 L13 13 M13 1 L1 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-hidden bg-[#FBF6EE]">
          {!loaded && !errored && <ReaderSkeleton />}
          {errored && (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-fg/80">
              <p className="font-mono text-caption uppercase tracking-[0.18em] text-muted">
                Could not load story
              </p>
              <p className="max-w-[44ch] text-body">
                The resident story file at <code>{src}</code> failed to load.
                You can close this and try another.
              </p>
            </div>
          )}
          {story && (
            <iframe
              key={src}
              src={src}
              title={displayName}
              sandbox="allow-same-origin allow-scripts"
              onLoad={() => setLoaded(true)}
              onError={() => setErrored(true)}
              className={clsx(
                "h-full w-full border-0 transition-opacity duration-200",
                loaded ? "opacity-100" : "opacity-0",
              )}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function LanguageToggle({
  available,
  current,
  onChange,
}: {
  available: Locale[];
  current: Locale;
  onChange: (l: Locale) => void;
}) {
  const zhEnabled = available.includes("zh");
  const enEnabled = available.includes("en");
  return (
    <div className="flex items-center font-mono text-caption uppercase tracking-[0.24em]">
      <LangButton
        active={current === "zh"}
        disabled={!zhEnabled}
        onClick={() => zhEnabled && onChange("zh")}
        title={zhEnabled ? "中文" : "Chinese version coming soon"}
      >
        中
      </LangButton>
      <span className="mx-1 text-muted/60">/</span>
      <LangButton
        active={current === "en"}
        disabled={!enEnabled}
        onClick={() => enEnabled && onChange("en")}
        title={enEnabled ? "English" : "English version coming soon"}
      >
        EN
      </LangButton>
    </div>
  );
}

function LangButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-disabled={disabled}
      title={title}
      className={clsx(
        "transition-colors",
        active ? "text-fg" : "text-muted",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "hover:text-fg focus:outline-none focus-visible:text-fg",
      )}
    >
      {children}
    </button>
  );
}

function ReaderSkeleton() {
  return (
    <div className="absolute inset-0 flex flex-col gap-3 p-8 md:p-12" aria-hidden>
      {[0.92, 0.84, 0.62, 0.78, 0.5, 0.7].map((w, i) => (
        <div
          key={i}
          className="h-3 animate-pulse rounded"
          style={{ width: `${w * 100}%`, background: "rgba(42,31,24,0.08)" }}
        />
      ))}
    </div>
  );
}

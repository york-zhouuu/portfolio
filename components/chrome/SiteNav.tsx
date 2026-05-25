"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { pickLang, type Locale } from "@/lib/i18n/types";
import { useReaderContext } from "@/components/reader/ReaderContext";
import type { ProjectActSummary } from "@/lib/content/load-project-structure";

type ActPosition = {
  id: string;
  title: string;
  /** Section DOM id to scroll to. */
  sectionId: string;
  /** 0..1 — fraction along the document scroll budget. */
  pct: number;
};

/**
 * SiteNav — single-project chapter index. One continuous chrome row:
 *
 *   ◆━━━━━━━━◇━━━━━━━◇   │   ◇   ◇   ◇
 *   01 Act 1  02 Act 2  03 Act 3       Hannah  Mary  A0290
 *
 * Three-act markers + resident-story markers share the same diamond
 * register and permanent labels. Acts are positioned by scroll fraction
 * along the rail; clicking jumps via smooth-scroll (camera flies as a
 * pure function of scroll). Stories sit after a thin separator and
 * trigger the reader sheet on click — same shape, different target.
 */
export function SiteNav({ acts }: { acts: ProjectActSummary[] }) {
  const reader = useReaderContext();
  const { locale } = useLocale();

  const [scrollPct, setScrollPct] = useState(0);
  const [actPositions, setActPositions] = useState<ActPosition[]>([]);

  // Compute act positions whenever DOM layout might have changed.
  useEffect(() => {
    const compute = () => {
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        setActPositions([]);
        return;
      }
      const positions: ActPosition[] = acts
        .map((act) => {
          const el = document.getElementById(act.firstSectionId);
          if (!el) return null;
          const top = el.getBoundingClientRect().top + window.scrollY;
          return {
            id: act.id,
            title: pickLang(act.title, locale),
            sectionId: act.firstSectionId,
            pct: Math.min(1, Math.max(0, top / docHeight)),
          };
        })
        .filter((x): x is ActPosition => x !== null);
      setActPositions(positions);
    };
    compute();
    const t1 = window.setTimeout(compute, 200);
    const t2 = window.setTimeout(compute, 800);
    window.addEventListener("resize", compute);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("resize", compute);
    };
  }, [acts, locale]);

  // Live scroll progress.
  useEffect(() => {
    const onScroll = () => {
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? window.scrollY / docHeight : 0;
      setScrollPct(Math.min(1, Math.max(0, pct)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const currentActId = useMemo(() => {
    let active: string | null = null;
    for (const a of actPositions) {
      if (scrollPct >= a.pct - 0.001) active = a.id;
    }
    return active;
  }, [actPositions, scrollPct]);

  const stories = reader?.stories ?? [];

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const jumpToAct = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-bg/60 via-bg/20 to-transparent" />

      <div className="pointer-events-auto relative mx-auto flex max-w-[1280px] items-start gap-6 px-6 py-4 md:gap-8 md:px-12">
        <a
          href="#top"
          onClick={scrollToTop}
          className="mt-1 shrink-0 font-mono text-caption uppercase tracking-[0.22em] text-fg/85 transition-colors hover:text-fg"
        >
          York Zhou
        </a>

        <ActProgressRail
          scrollPct={scrollPct}
          actPositions={actPositions}
          currentActId={currentActId}
          onJump={jumpToAct}
        />

        {/* Report — sits right after Act 3 (the findings) since it IS the
            long-form findings. Click scroll-jumps to the inline CTA and
            dispatches `open-full-report` so the iframe expands. */}
        <ReportDiamond locale={locale} />

        {stories.length > 0 && (
          <>
            <span
              className="mt-2 h-4 w-px shrink-0 bg-line/45"
              aria-hidden
            />
            <StoriesDiamond locale={locale} count={stories.length} />
          </>
        )}

        <div className="mt-1 shrink-0">
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}

function ActProgressRail({
  scrollPct,
  actPositions,
  currentActId,
  onJump,
}: {
  scrollPct: number;
  actPositions: ActPosition[];
  currentActId: string | null;
  onJump: (sectionId: string) => void;
}) {
  if (actPositions.length === 0) {
    return <div className="relative h-px flex-1 bg-line/30" aria-hidden />;
  }

  return (
    <div className="relative h-10 flex-1">
      {/* Rail — 1px line at marker center height. */}
      <div className="absolute inset-x-0 h-px bg-line/30" style={{ top: 12 }} />
      <div
        className="absolute left-0 h-px bg-glow"
        style={{
          top: 12,
          width: `${Math.min(100, scrollPct * 100)}%`,
        }}
      />

      {actPositions.map((act, idx) => {
        const isCurrent = act.id === currentActId;
        const left = `${act.pct * 100}%`;
        const labelAlign =
          act.pct < 0.05
            ? "left-0 translate-x-0"
            : act.pct > 0.95
              ? "right-0 left-auto translate-x-0"
              : "left-1/2 -translate-x-1/2";

        return (
          <div
            key={act.id}
            className="absolute top-0 -translate-x-1/2"
            style={{ left }}
          >
            <button
              type="button"
              onClick={() => onJump(act.sectionId)}
              aria-label={`Jump to ${act.title}`}
              className="group relative flex h-6 w-6 items-center justify-center focus:outline-none"
            >
              <span
                className={clsx(
                  "block h-2 w-2 rotate-45 transition-all duration-200 group-focus-visible:ring-2 group-focus-visible:ring-accent/60",
                  isCurrent
                    ? "bg-glow shadow-[0_0_8px_oklch(var(--glow)/0.6)]"
                    : "border border-fg/70 bg-bg group-hover:bg-fg/30",
                )}
              />
            </button>
            <div
              className={clsx(
                "pointer-events-none absolute top-7 whitespace-nowrap text-[11px] transition-colors",
                labelAlign,
              )}
            >
              <span
                className={clsx(
                  "font-mono uppercase tracking-[0.16em]",
                  isCurrent ? "text-fg" : "text-muted/85",
                )}
              >
                <span className="text-muted/55">
                  {String(idx + 1).padStart(2, "0")}
                </span>{" "}
                {act.title}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Report diamond — same visual register as act markers, sits right after
 * Act 3 since it IS the long-form findings. Click dispatches the global
 * `open-full-report` event (ReportCTA listens) which expands the inline
 * iframe + smooth-scrolls to it. Locale-aware label.
 */
function ReportDiamond({ locale }: { locale: Locale }) {
  const zh = locale === "zh";
  const label = zh ? "完整报告" : "Full report";
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // First fire the open event so ReportCTA renders the iframe.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-full-report"));
    }
    // Then scroll to the CTA section (ReportCTA does an additional scroll
    // to the iframe block once it mounts).
    const el = document.getElementById("full-experimental-report");
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };
  return (
    <div className="relative flex h-10 shrink-0 items-start">
      <div className="relative flex flex-col items-center">
        <a
          href="#full-experimental-report"
          onClick={handleClick}
          aria-label={zh ? "展开完整实验报告" : "Open the full experimental report"}
          className="group flex h-6 w-6 items-center justify-center focus:outline-none"
        >
          <span className="block h-2 w-2 rotate-45 border border-fg/65 bg-bg transition-all duration-200 group-hover:border-fg group-hover:bg-fg/30 group-focus-visible:ring-2 group-focus-visible:ring-accent/60" />
        </a>
        <div className="pointer-events-none mt-1 whitespace-nowrap text-[11px]">
          <span className="font-mono uppercase tracking-[0.16em] text-muted/85">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Stories diamond — single consolidated entry point for the 3 resident
 * longform stories (Hannah / Mary / a0290). Click dispatches a global
 * `open-stories-sheet` event; StoriesSheet listens and shows an intro
 * card + 3 story tiles. Previously rendered 3 separate diamonds, but
 * UX feedback: 3 names = noise without context, consolidate + provide
 * an intro that explains *why* the stories exist.
 */
function StoriesDiamond({ locale, count }: { locale: Locale; count: number }) {
  const zh = locale === "zh";
  const label = zh ? "三个居民" : "Three residents";
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-stories-sheet"));
    }
  };
  return (
    <div className="relative flex h-10 shrink-0 items-start">
      <div className="relative flex flex-col items-center">
        <a
          href="#stories"
          onClick={handleClick}
          aria-label={zh ? "打开三个居民的故事" : "Open the resident stories"}
          className="group flex h-6 w-6 items-center justify-center focus:outline-none"
        >
          <span className="block h-2 w-2 rotate-45 border border-fg/65 bg-bg transition-all duration-200 group-hover:border-fg group-hover:bg-fg/30 group-focus-visible:ring-2 group-focus-visible:ring-accent/60" />
        </a>
        <div className="pointer-events-none mt-1 whitespace-nowrap text-[11px]">
          <span className="font-mono uppercase tracking-[0.16em] text-muted/85">
            {label}
            <span className="ml-1 text-muted/55">· {count}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { CaseStudyFrontmatter } from "@/lib/content/case-study-schema";
import { pickLang } from "@/lib/i18n/types";

/**
 * TitleCard — opening section, ~50svh tall, sits BEFORE the cinema. Gives
 * cold readers a 2-second "what / who / when / scale" before the camera
 * push-in cold-open starts. Uses MDX frontmatter directly: title,
 * subtitle, role, year, atAGlance.
 *
 * Rendered as a non-sticky section in normal document flow, ABOVE all
 * cinema sections. Doesn't conflict with cinema scroll behavior — it's
 * just the very first thing the user sees on load.
 */
export function TitleCard({ frontmatter }: { frontmatter: CaseStudyFrontmatter }) {
  const { locale } = useLocale();
  const zh = locale === "zh";

  const title = pickLang(frontmatter.title, locale);
  const subtitle = pickLang(frontmatter.subtitle, locale);
  const role = pickLang(frontmatter.role, locale);
  const year = frontmatter.year;
  const gl = frontmatter.atAGlance;

  return (
    <section
      data-section="title-card"
      aria-label={title}
      // 56svh — slightly taller than half so it commits as an opening
      // "page". Skip first 14svh to clear the top nav.
      className="relative z-10 flex h-[56svh] items-center justify-center px-6 pt-[14svh] md:px-12"
    >
      <div className="mx-auto flex w-full max-w-[920px] flex-col items-center text-center">
        {/* Tiny year + role mono caption — register-shifts upward */}
        <div className="flex items-center gap-3">
          <span className="h-px w-7 bg-fg/30" aria-hidden />
          <p className="font-mono text-[10.5px] uppercase tracking-[0.34em] text-fg/55">
            {year} · {role}
          </p>
          <span className="h-px w-7 bg-fg/30" aria-hidden />
        </div>

        {/* Title — large but not screaming; supports both EN and ZH */}
        <h1 className="mt-5 font-sans font-medium text-fg leading-[1.08] tracking-[-0.028em] [font-size:clamp(38px,5.4vw,68px)] [text-wrap:balance] [text-shadow:0_1px_22px_oklch(var(--bg)/0.65)]">
          {title}
        </h1>

        {/* Subtitle — one line elevator pitch */}
        <p className="mt-5 max-w-[640px] font-sans text-fg/78 leading-[1.5] tracking-[-0.005em] [font-size:clamp(15px,1.5vw,18.5px)] [text-wrap:pretty]">
          {subtitle}
        </p>

        {/* At-a-glance strip — 5 small stats */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
          <Stat label={zh ? "居民" : "residents"} value={gl.agents} />
          <Stat label={zh ? "协议" : "protocol"} value={gl.protocol} />
          <Stat label={zh ? "种子" : "seeds"} value={gl.seeds} />
          <Stat label={zh ? "成本" : "budget"} value={gl.budget} />
          <Stat label={zh ? "地点" : "site"} value={gl.site} />
        </div>

        {/* Scroll cue — tiny chevron + label */}
        <div className="mt-12 flex flex-col items-center gap-2 text-fg/45">
          <span className="font-mono text-[10px] uppercase tracking-[0.32em]">
            {zh ? "向下滚动开始" : "scroll to begin"}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-4 w-4 animate-[titleScrollHint_1.8s_ease-in-out_infinite]"
            aria-hidden
          >
            <path
              d="M12 5v14M5 13l7 7 7-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <style jsx>{`
        @keyframes titleScrollHint {
          0%, 100% { transform: translateY(0); opacity: 0.55; }
          50% { transform: translateY(4px); opacity: 1; }
        }
      `}</style>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-sans text-[16px] font-medium leading-[1.1] tracking-[-0.012em] text-fg">
        {value}
      </span>
      <span className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-fg/45">
        {label}
      </span>
    </div>
  );
}

"use client";

import { T } from "@/components/i18n/T";
import { transitionStyle } from "./transitions";
import type { CaseStudyScene } from "@/lib/content/case-study-schema";
import { useReaderContext } from "@/components/reader/ReaderContext";
import { StoriesCallouts } from "./StoriesCallouts";

type CtaItem = NonNullable<
  Extract<CaseStudyScene, { kind: "lead" }>["cta"]
>[number];

export function SceneLead({
  scene,
  enterProgress,
  exitProgress,
}: {
  scene: Extract<CaseStudyScene, { kind: "lead" }>;
  enterProgress: number;
  exitProgress: number;
}) {
  const style = transitionStyle(scene.enter, scene.exit, enterProgress, exitProgress);
  const reader = useReaderContext();

  const triggerCta = (cta: CtaItem) => {
    switch (cta.action) {
      case "open-full-report":
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("open-full-report"));
        }
        return;
      case "open-stories":
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("open-stories-sheet"));
        }
        return;
      case "open-story":
        if (reader && cta.storySlug) {
          reader.openReader(cta.storySlug);
        }
        return;
    }
  };

  return (
    <div
      className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center px-6"
      style={style}
    >
      <p
        className="max-w-[42ch] text-center leading-[1.62] tracking-[-0.012em] text-fg/93 [font-size:clamp(14px,min(2.6vw,4vh),29px)] [text-shadow:_0_1px_2px_rgba(0,0,0,0.30),_0_0_22px_rgba(0,0,0,0.16)]"
        style={{ whiteSpace: "pre-line" }}
      >
        <T value={scene.text} />
      </p>

      {scene.id === "scene-3-5-stories" ? <StoriesCallouts /> : null}

      {scene.cta && scene.cta.length > 0 ? (
        <ul className="mt-9 flex flex-col items-center gap-3.5">
          {scene.cta.map((item, idx) => (
            <li key={idx}>
              <button
                type="button"
                onClick={() => triggerCta(item)}
                className="group inline-flex items-center gap-2 font-sans text-fg/82 underline decoration-fg/35 decoration-1 underline-offset-[6px] [font-size:clamp(13px,1.05vw,15px)] transition-all duration-200 hover:text-fg hover:decoration-fg hover:decoration-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
              >
                <span>
                  <T value={item.text} />
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                >
                  <path
                    d="M5 12h14M13 5l7 7-7 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

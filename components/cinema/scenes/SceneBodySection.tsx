"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { pickLang, type I18nString } from "@/lib/i18n/types";
import { transitionStyle } from "./transitions";
import type { CaseStudyScene, CaseStudyKvItem } from "@/lib/content/case-study-schema";

/**
 * SceneBodySection — block reveal: all paragraphs render together.
 *
 * Per author iteration 2026-04-27: progressive (one-by-one) reveal felt
 * "torturing" — too slow for readers who want the whole argument visible.
 * Now scene-level enter/exit fades the whole block; user reads at their
 * own pace within the hold band.
 *
 * sceneLocalT is unused now but kept in the signature for back-compat.
 */
export function SceneBodySection({
  scene,
  enterProgress,
  exitProgress,
}: {
  scene: Extract<CaseStudyScene, { kind: "body-section" }>;
  sceneLocalT: number;
  enterProgress: number;
  exitProgress: number;
}) {
  const style = transitionStyle(scene.enter, scene.exit, enterProgress, exitProgress);
  const paragraphs = scene.paragraphs ?? [];

  if (scene.layout === "twin-column") {
    return (
      <div
        className="pointer-events-auto absolute inset-0 flex items-center justify-center px-6 md:px-12"
        style={style}
      >
        <div className="mx-auto w-full max-w-[1100px] rounded-2xl border border-line/12 bg-bg/32 p-7 shadow-[0_2px_30px_-12px_rgba(0,0,0,0.18)] backdrop-blur-2xl md:p-10">
          <SectionHeader sectionNumber={scene.sectionNumber} heading={scene.heading} />
          {paragraphs.map((p, i) => (
            <p key={i} className="mt-4 text-body leading-[1.65] text-fg/88">
              <RenderInline value={p} />
            </p>
          ))}
          {scene.twinColumns ? (
            <div className="mt-7 grid gap-6 md:grid-cols-2 md:gap-10">
              {([scene.twinColumns.left, scene.twinColumns.right] as const).map((col, i) => {
                const hasParagraphs = col.paragraphs && col.paragraphs.length > 0;
                const hasItems = col.items && col.items.length > 0;
                const hasCitations = col.citations && col.citations.length > 0;
                return (
                  <div key={i}>
                    {col.heading ? (
                      <p className="font-mono text-caption uppercase tracking-[0.22em] text-muted">
                        <RenderInline value={col.heading} />
                      </p>
                    ) : null}
                    {hasParagraphs ? (
                      <div className="mt-3 space-y-3">
                        {col.paragraphs!.map((p, j) => (
                          <p key={j} className="text-body leading-[1.65] text-fg/88">
                            <RenderInline value={p} />
                          </p>
                        ))}
                      </div>
                    ) : null}
                    {hasItems ? (
                      <ul className={`${hasParagraphs ? "mt-5" : "mt-3"} space-y-3`}>
                        {col.items!.map((item, j) => (
                          <KvRow key={j} item={item} stagger={j} enterProgress={enterProgress} />
                        ))}
                      </ul>
                    ) : null}
                    {hasCitations ? (
                      <ul className={`${hasParagraphs || hasItems ? "mt-5" : "mt-3"} space-y-4 border-l border-line/40 pl-5`}>
                        {col.citations!.map((c, j) => (
                          <li key={j}>
                            <p className="italic leading-[1.55] text-fg/88 [text-wrap:pretty]">
                              “<RenderInline value={c.text} />”
                            </p>
                            {c.attribution ? (
                              <p className="mt-1.5 font-mono text-caption uppercase tracking-[0.18em] text-muted/85">
                                — <RenderInline value={c.attribution} />
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // right-column layout
  return (
    <div
      className="pointer-events-auto absolute inset-0 flex items-center justify-end px-6 md:px-12"
      style={style}
    >
      <div className="ml-auto max-w-[44ch] rounded-2xl border border-line/12 bg-bg/32 p-7 shadow-[0_2px_30px_-12px_rgba(0,0,0,0.18)] backdrop-blur-2xl md:p-8">
        <SectionHeader sectionNumber={scene.sectionNumber} heading={scene.heading} />
        {paragraphs.map((p, i) => (
          <p key={i} className="mt-4 text-body leading-[1.65] text-fg/88">
            <RenderInline value={p} />
          </p>
        ))}
        {scene.kvList && scene.kvList.length > 0 ? (
          <ul className="mt-5 space-y-3 border-l border-line/40 pl-5">
            {scene.kvList.map((item, j) => (
              <KvRow key={j} item={item} stagger={j} enterProgress={enterProgress} />
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function SectionHeader({
  sectionNumber,
  heading,
}: {
  sectionNumber?: string;
  heading: I18nString;
}) {
  return (
    <div>
      {sectionNumber ? (
        <p className="font-mono text-caption uppercase tracking-[0.28em] text-muted/90 tabular-nums">
          {sectionNumber}
        </p>
      ) : null}
      <h2 className="mt-2 text-headline font-medium leading-[1.2] tracking-[-0.02em] text-fg/95 [font-size:clamp(20px,2vw,24px)]">
        <RenderInline value={heading} />
      </h2>
    </div>
  );
}

function KvRow({
  item,
  stagger,
  enterProgress,
}: {
  item: CaseStudyKvItem;
  stagger: number;
  enterProgress: number;
}) {
  // Stagger fade-in: each KV item has its own enter window offset by 0.1
  // of enterProgress per index. Scales with scene's overall enter rate.
  const stride = 0.18; // window per item
  const start = stagger * 0.12;
  const localT = Math.max(0, Math.min(1, (enterProgress - start) / stride));
  const opacity = localT;
  const ty = (1 - localT) * 8;
  return (
    <li style={{ opacity, transform: `translateY(${ty}px)` }} className="grid gap-1 md:grid-cols-[max-content_1fr] md:gap-x-5">
      <span className="font-mono text-caption uppercase tracking-[0.18em] text-muted">
        <RenderInline value={item.key} />
      </span>
      <span className="text-body leading-[1.55] text-fg/88">
        <RenderInline value={item.value} />
      </span>
    </li>
  );
}

function RenderInline({ value }: { value: I18nString }) {
  const { locale } = useLocale();
  const text = pickLang(value, locale);
  // Inline **bold** markdown-lite
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-medium text-fg [font-size:1.06em]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

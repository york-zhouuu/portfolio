"use client";

import { T } from "@/components/i18n/T";
import { transitionStyle } from "./transitions";
import type { CaseStudyScene } from "@/lib/content/case-study-schema";

/**
 * SceneDataHit — oversized number with a one-line caption, optional
 * supporting paragraphs.
 *
 * Block reveal (2026-04-27 iteration): all paragraphs render together;
 * scene-level enter/exit fade governs the whole block. Author preferred
 * over per-paragraph stagger.
 *
 * sceneLocalT kept in signature for back-compat (now unused).
 */
export function SceneDataHit({
  scene,
  enterProgress,
  exitProgress,
}: {
  scene: Extract<CaseStudyScene, { kind: "data-hit" }>;
  sceneLocalT: number;
  enterProgress: number;
  exitProgress: number;
}) {
  const wrapStyle = transitionStyle(scene.enter, scene.exit, enterProgress, exitProgress);
  const paragraphs = scene.paragraphs ?? [];

  return (
    <div
      className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
      style={wrapStyle}
    >
      <div className="font-medium tracking-[-0.05em] text-fg/95 [font-size:clamp(60px,min(16vw,24vh),180px)] leading-none [text-shadow:_0_1px_4px_rgba(0,0,0,0.3),_0_0_30px_rgba(0,0,0,0.16)]">
        {scene.number}
      </div>
      <p className="mt-3 font-mono text-caption uppercase tracking-[0.28em] text-muted/95 [text-shadow:_0_1px_2px_rgba(0,0,0,0.25)]">
        <T value={scene.caption} />
      </p>
      {paragraphs.length > 0 ? (
        <div className="mt-6 flex max-w-prose flex-col gap-2 text-body text-fg/88 [text-shadow:_0_1px_2px_rgba(0,0,0,0.25)]">
          {paragraphs.map((p, i) => (
            <p key={i}>
              <T value={p} />
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

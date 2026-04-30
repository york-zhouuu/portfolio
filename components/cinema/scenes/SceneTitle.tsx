"use client";

import { T } from "@/components/i18n/T";
import { transitionStyle } from "./transitions";
import type { CaseStudyScene } from "@/lib/content/case-study-schema";

export function SceneTitle({
  scene,
  enterProgress,
  exitProgress,
}: {
  scene: Extract<CaseStudyScene, { kind: "title" }>;
  enterProgress: number;
  exitProgress: number;
}) {
  const style = transitionStyle(scene.enter, scene.exit, enterProgress, exitProgress);
  return (
    <div
      className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
      style={style}
    >
      <h1 className="font-medium leading-[1.05] tracking-[-0.04em] text-fg/95 [font-size:clamp(48px,8vw,72px)] [text-shadow:_0_1px_2px_rgba(0,0,0,0.28),_0_0_20px_rgba(0,0,0,0.14)]">
        <T value={scene.text} />
      </h1>
      {scene.subtitle ? (
        <p className="mt-4 font-mono text-caption uppercase tracking-[0.28em] text-muted/95 [text-shadow:_0_1px_2px_rgba(0,0,0,0.25)]">
          <T value={scene.subtitle} />
        </p>
      ) : null}
    </div>
  );
}

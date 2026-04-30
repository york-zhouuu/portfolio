"use client";

import { T } from "@/components/i18n/T";
import { transitionStyle } from "./transitions";
import type { CaseStudyScene } from "@/lib/content/case-study-schema";

export function ScenePullQuote({
  scene,
  enterProgress,
  exitProgress,
}: {
  scene: Extract<CaseStudyScene, { kind: "pull-quote" }>;
  enterProgress: number;
  exitProgress: number;
}) {
  const style = transitionStyle(scene.enter, scene.exit, enterProgress, exitProgress);
  return (
    <div
      className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
      style={style}
    >
      <blockquote className="max-w-[64ch]">
        <p className="font-medium italic leading-[1.25] tracking-[-0.005em] text-fg/95 [font-size:clamp(36px,5.5vw,56px)] [text-shadow:_0_1px_3px_rgba(0,0,0,0.3),_0_0_24px_rgba(0,0,0,0.16)]">
          <T value={scene.text} />
        </p>
        {scene.subtitle ? (
          <p className="mt-6 font-medium italic leading-[1.35] text-fg/75 [font-size:clamp(20px,2.4vw,28px)] [text-shadow:_0_1px_2px_rgba(0,0,0,0.25)]">
            <T value={scene.subtitle} />
          </p>
        ) : null}
      </blockquote>
    </div>
  );
}

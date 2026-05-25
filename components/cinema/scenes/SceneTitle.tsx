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
      <h1 className="font-sans font-medium leading-[1.05] tracking-[-0.035em] text-fg/95 [font-size:clamp(28px,min(7vw,11vh),68px)] [text-shadow:_0_1px_2px_rgba(0,0,0,0.28),_0_0_20px_rgba(0,0,0,0.14)] [text-wrap:balance]">
        <T value={scene.text} />
      </h1>
      {scene.subtitle ? (
        <p className="mt-5 max-w-[44ch] font-sans leading-[1.5] text-fg/70 [font-size:clamp(11px,min(1.3vw,2.2vh),19px)] [text-shadow:_0_1px_2px_rgba(0,0,0,0.25)] [text-wrap:pretty]">
          <T value={scene.subtitle} />
        </p>
      ) : null}
    </div>
  );
}

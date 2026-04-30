"use client";

import { T } from "@/components/i18n/T";
import { transitionStyle } from "./transitions";
import type { CaseStudyScene } from "@/lib/content/case-study-schema";

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
  return (
    <div
      className="pointer-events-auto absolute inset-0 flex items-center justify-center px-6"
      style={style}
    >
      <p className="max-w-[60ch] text-center leading-[1.4] tracking-[-0.015em] text-fg/92 [font-size:clamp(22px,2.6vw,28px)] [text-shadow:_0_1px_2px_rgba(0,0,0,0.28),_0_0_18px_rgba(0,0,0,0.14)]">
        <T value={scene.text} />
      </p>
    </div>
  );
}

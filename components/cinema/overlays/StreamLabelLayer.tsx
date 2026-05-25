"use client";

import { useEffect, useRef } from "react";

/**
 * StreamLabelLayer — small label callout naming which of the 4 streams
 * of evidence is currently visualized on the sandbox. Without this the
 * tie lines / push waves / agent widgets are pretty animations; with
 * it, the observer reads "ah, this is the diffusion graph stream".
 *
 * Active overlay name is published by MapOverlay each frame:
 *   window.__sswtActiveOverlay = { name, progress }
 *
 * Label visibility tracks the overlay's progress (the overlay's own
 * fade-in / fade-out).
 */

declare global {
  interface Window {
    __sswtActiveOverlay?: { name: string; progress: number } | null;
  }
}

type StreamMeta = {
  index: number;
  label: string;
  zh: string;
};

// Map registered overlay names → 4-stream-of-evidence narrative.
// agents_trajectories isn't one of the streams (it's background fill);
// digital_silos_heatmap belongs to Act 1.
const STREAM_BY_OVERLAY: Record<string, StreamMeta> = {
  tie_timelapse: {
    index: 2,
    label: "Encounter log",
    zh: "偶遇日志",
  },
  push_moment: {
    index: 3,
    label: "Diffusion graph",
    zh: "信息扩散图谱",
  },
  // movement_heatmap (stream 1) and "agent diaries" (stream 4) come in
  // follow-up iterations. When registered, add entries here.
};

export function StreamLabelLayer() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLSpanElement>(null);
  const enRef = useRef<HTMLParagraphElement>(null);
  const zhRef = useRef<HTMLParagraphElement>(null);
  const lastName = useRef<string>("");

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const w = wrapRef.current;
      if (w) {
        const state =
          typeof window !== "undefined" ? window.__sswtActiveOverlay : null;
        const meta = state ? STREAM_BY_OVERLAY[state.name] : undefined;
        const op = meta ? Math.min(1, (state?.progress ?? 0) * 1.1) : 0;
        if (w.style.opacity !== String(op)) {
          w.style.opacity = String(op);
        }
        if (meta && state && state.name !== lastName.current) {
          if (indexRef.current) {
            indexRef.current.textContent = `${meta.index} ／ 4`;
          }
          if (enRef.current) enRef.current.textContent = meta.label;
          if (zhRef.current) zhRef.current.textContent = meta.zh;
          lastName.current = state.name;
        }
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none fixed right-6 top-[14%] z-30 transition-opacity duration-200 md:right-12"
      style={{ opacity: 0 }}
      aria-hidden
    >
      <div className="w-[220px] rounded-2xl border border-line/30 bg-bg/85 px-4 py-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-glow">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-glow" />
          <span>stream of evidence</span>
          <span ref={indexRef} className="ml-auto text-fg/55" />
        </div>
        <p ref={enRef} className="mt-2 font-sans text-[14px] font-medium leading-[1.2] text-fg/95">
          {/* injected */}
        </p>
        <p ref={zhRef} className="mt-1 font-sans text-[12px] leading-[1.35] text-fg/60">
          {/* injected */}
        </p>
      </div>
    </div>
  );
}

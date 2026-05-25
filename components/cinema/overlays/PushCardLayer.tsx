"use client";

import { useEffect, useRef } from "react";

/**
 * PushCardLayer — DOM render for the stacked push notification cards
 * published by PushMomentOverlay.
 *
 * Renders N fixed card slots (one per wave). Each slot's opacity + content
 * is pushed each frame via window.__sswtPushCards. By scene end, all 5
 * cards are visible at low opacity累积 — visually "the day's push barrage".
 *
 * Positions are spread across the viewport so multiple cards don't
 * overlap; readers see info pile up as they scroll.
 */

const CARD_COUNT = 5;

const CARD_POSITIONS: Array<{
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  transform?: string;
}> = [
  { top: "10%", left: "50%", transform: "translateX(-50%)" },
  { top: "26%", right: "6%" },
  { top: "44%", left: "5%" },
  { bottom: "30%", right: "8%" },
  { bottom: "12%", left: "6%" },
];

export function PushCardLayer() {
  const wrapRefs = useRef<Array<HTMLDivElement | null>>(Array(CARD_COUNT).fill(null));
  const contentRefs = useRef<Array<HTMLParagraphElement | null>>(
    Array(CARD_COUNT).fill(null),
  );
  const dayRefs = useRef<Array<HTMLSpanElement | null>>(Array(CARD_COUNT).fill(null));
  const lastContent = useRef<string[]>(Array(CARD_COUNT).fill(""));
  const lastDay = useRef<number>(-1);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const s = typeof window !== "undefined" ? window.__sswtPushCards : null;
      for (let i = 0; i < CARD_COUNT; i++) {
        const wrap = wrapRefs.current[i];
        if (!wrap) continue;
        const slot = s?.cards?.[i];
        const opacity = slot?.opacity ?? 0;
        if (wrap.style.opacity !== String(opacity)) {
          wrap.style.opacity = String(opacity);
          wrap.style.pointerEvents = opacity > 0.02 ? "auto" : "none";
        }
        if (slot && slot.content !== lastContent.current[i]) {
          const p = contentRefs.current[i];
          if (p) p.textContent = slot.content;
          lastContent.current[i] = slot.content;
        }
        if (s && s.dayIndex !== lastDay.current) {
          const d = dayRefs.current[i];
          if (d) d.textContent = `push ${i + 1}／${s.totalWaves} · day ${s.dayIndex}`;
        }
      }
      if (s && s.dayIndex !== lastDay.current) lastDay.current = s.dayIndex;
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      {CARD_POSITIONS.map((pos, i) => (
        <div
          key={i}
          ref={(el) => {
            wrapRefs.current[i] = el;
          }}
          className="pointer-events-none fixed z-30 transition-opacity duration-150"
          style={{ ...pos, opacity: 0 }}
          aria-live="polite"
        >
          <div className="max-w-[340px] rounded-2xl border border-line/30 bg-bg/85 px-4 py-3 shadow-[0_12px_36px_rgba(0,0,0,0.55)] backdrop-blur-md md:max-w-[380px]">
            <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.22em]">
              <div className="flex items-center gap-2 text-glow">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-glow" />
                <span>hyperlocal push</span>
              </div>
              <span
                ref={(el) => {
                  dayRefs.current[i] = el;
                }}
                className="text-fg/50"
              />
            </div>
            <p
              ref={(el) => {
                contentRefs.current[i] = el;
              }}
              className="mt-2 font-sans text-[14px] leading-[1.5] text-fg/95"
            />
          </div>
        </div>
      ))}
    </>
  );
}

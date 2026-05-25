"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * AgentInternalsLegend — explains the 3 widgets above spotlight agents in
 * Act 2 (event-class flame / decision-step dots / attention bar).
 *
 * Cold-reader rule (per CLAUDE.md): no technical jargon in the visible
 * label. Plain language headline + engineering name as small subtext.
 *
 * Visibility: AgentBeacon publishes a "last seen at" timestamp on
 * window.__sswtInternalsActiveUntil whenever it's drawing internals.
 * This legend reads the timestamp via RAF + mutates DOM directly (no
 * setState 60fps). When timestamp passes, the panel fades out.
 *
 * Mount in HudLayer.
 */

declare global {
  interface Window {
    __sswtInternalsActiveUntil?: number;
  }
}

export function AgentInternalsLegend() {
  const ref = useRef<HTMLDivElement>(null);
  const { locale } = useLocale();
  const zh = locale === "zh";

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const w = ref.current;
      if (w) {
        const activeUntil =
          typeof window !== "undefined" ? window.__sswtInternalsActiveUntil ?? 0 : 0;
        const isActive = performance.now() < activeUntil;
        const op = isActive ? "1" : "0";
        if (w.style.opacity !== op) {
          w.style.opacity = op;
        }
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed left-6 top-1/2 z-30 -translate-y-1/2 transition-opacity duration-200 md:left-12"
      style={{ opacity: 0 }}
      aria-hidden
    >
      <div className="w-[288px] rounded-2xl border border-line/35 bg-bg/85 px-5 py-4 shadow-[0_10px_32px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <p className="font-sans text-[12.5px] font-medium leading-[1.4] text-fg/92">
          {zh
            ? "这位被高亮的居民, 此刻在做什么"
            : "what this highlighted resident is doing right now"}
        </p>
        <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-fg/40">
          three live readouts above their head
        </p>

        {/* 1. Event-class bars — what just happened */}
        <div className="mt-4">
          <div className="flex items-end gap-[5px]">
            <span className="inline-block h-3.5 w-1.5 rounded-[1px] bg-[#6ee7b7]" />
            <span className="inline-block h-3.5 w-1.5 rounded-[1px] bg-[#93c5fd]" />
            <span className="inline-block h-3.5 w-1.5 rounded-[1px] bg-[#c4b5fd]" />
            <span className="ml-2 font-sans text-[11px] leading-[1.4] text-fg/80">
              {zh ? "刚发生了什么" : "what just happened"}
            </span>
          </div>
          <p className="mt-1.5 font-sans text-[11px] leading-[1.5] text-fg/68">
            {zh ? (
              <>
                <span className="text-[#6ee7b7]">看见路人</span> ·{" "}
                <span className="text-[#93c5fd]">收到推送</span> ·{" "}
                <span className="text-[#c4b5fd]">心里在想事</span>
              </>
            ) : (
              <>
                <span className="text-[#6ee7b7]">saw someone</span> ·{" "}
                <span className="text-[#93c5fd]">got a notification</span> ·{" "}
                <span className="text-[#c4b5fd]">reflecting</span>
              </>
            )}
          </p>
          <p className="mt-1 font-mono text-[9px] leading-[1.4] text-fg/35">
            encounter · notification · reflection
          </p>
        </div>

        {/* 2. Decision-stack dots — where in the loop */}
        <div className="mt-4 border-t border-line/22 pt-3">
          <div className="flex items-center gap-[5px]">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  i === 2 ? "bg-[#fde6a8]" : "bg-fg/35"
                }`}
              />
            ))}
            <span className="ml-2 font-sans text-[11px] leading-[1.4] text-fg/80">
              {zh ? "脑子里走到哪一步" : "where in the decision loop"}
            </span>
          </div>
          <p className="mt-1.5 font-sans text-[11px] leading-[1.55] text-fg/68">
            {zh
              ? "感知 · 排队 · 回忆 · 对话 · 行动 · 计划"
              : "perceive · queue · recall · talk · act · plan"}
          </p>
          <p className="mt-1 font-mono text-[9px] leading-[1.4] text-fg/35">
            drain · pending · remember · dialogue · exec · schedule
          </p>
        </div>

        {/* 3. Attention segments — where attention sits */}
        <div className="mt-4 border-t border-line/22 pt-3">
          <div className="flex items-center gap-[3px]">
            <span className="inline-block h-2.5 w-2.5 bg-[#a8e6a3]" />
            <span className="inline-block h-2.5 w-2.5 bg-[#ff7b6b]" />
            <span className="inline-block h-2.5 w-2.5 bg-[#a8c8ff]" />
            <span className="inline-block h-2.5 w-2.5 bg-[#d0b0ff]" />
            <span className="ml-2 font-sans text-[11px] leading-[1.4] text-fg/80">
              {zh ? "注意力此刻在哪" : "where attention sits right now"}
            </span>
          </div>
          <p className="mt-1.5 font-sans text-[11px] leading-[1.5] text-fg/68">
            {zh ? (
              <>
                <span className="text-[#a8e6a3]">身边</span> ·{" "}
                <span className="text-[#ff7b6b]">手机</span> ·{" "}
                <span className="text-[#a8c8ff]">手头任务</span> ·{" "}
                <span className="text-[#d0b0ff]">对话</span>
              </>
            ) : (
              <>
                <span className="text-[#a8e6a3]">surroundings</span> ·{" "}
                <span className="text-[#ff7b6b]">phone</span> ·{" "}
                <span className="text-[#a8c8ff]">a task</span> ·{" "}
                <span className="text-[#d0b0ff]">a conversation</span>
              </>
            )}
          </p>
          <p className="mt-1 font-mono text-[9px] leading-[1.4] text-fg/35">
            physical · phone · task · conversation
          </p>
        </div>
      </div>
    </div>
  );
}

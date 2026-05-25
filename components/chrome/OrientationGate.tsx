"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * OrientationGate — full-screen blocking overlay shown when a small,
 * touch-class device is held in portrait orientation. The site's
 * scroll cinema is designed for landscape (16:9-ish) framing; on a
 * phone in portrait the sandbox + intro text are unreadable.
 *
 * Triggers when ALL three are true:
 *   1. touch-capable pointer (rules out narrow desktop browser windows)
 *   2. innerWidth < MOBILE_BREAKPOINT_PX (phone-class viewport)
 *   3. orientation: portrait
 *
 * No dismiss button — the user MUST rotate the device. Re-evaluates on
 * resize / orientationchange / matchMedia change.
 */

const MOBILE_BREAKPOINT_PX = 900;

export function OrientationGate() {
  const { locale } = useLocale();
  const [needsRotate, setNeedsRotate] = useState(false);

  // Detection — re-evaluates on every viewport / orientation change.
  useEffect(() => {
    const check = () => {
      if (typeof window === "undefined") return;
      const isTouch = window.matchMedia("(any-pointer: coarse)").matches;
      const isSmall = window.innerWidth < MOBILE_BREAKPOINT_PX;
      const isPortrait = window.matchMedia("(orientation: portrait)").matches;
      setNeedsRotate(isTouch && isSmall && isPortrait);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    const orientMql = window.matchMedia("(orientation: portrait)");
    orientMql.addEventListener?.("change", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
      orientMql.removeEventListener?.("change", check);
    };
  }, []);

  // Lock body scroll while the gate is visible — also blocks scroll
  // events from reaching the cinema below.
  useEffect(() => {
    if (!needsRotate) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [needsRotate]);

  if (!needsRotate) return null;

  const zh = locale === "zh";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center gap-10 bg-bg px-8 text-center"
    >
      <PhoneRotateIcon />
      <div className="space-y-3 max-w-[26ch]">
        <h1 className="font-serif text-[22px] leading-[1.35] tracking-[-0.01em] text-fg/95">
          {zh
            ? "这是一座需要横着看的城市"
            : "This city was built for landscape"}
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-fg/55">
          {zh ? "请将设备横向旋转" : "Rotate your device to enter"}
        </p>
      </div>
    </div>
  );
}

/** Pure-CSS rotating phone icon — no SVG library dep. */
function PhoneRotateIcon() {
  return (
    <div className="orientation-gate-icon" aria-hidden>
      <div className="phone">
        <div className="screen" />
        <div className="speaker" />
        <div className="home-indicator" />
      </div>
      <style jsx>{`
        .orientation-gate-icon {
          width: 56px;
          height: 96px;
          opacity: 0.85;
          animation: orientation-gate-rotate 2.6s ease-in-out infinite;
          transform-origin: center center;
        }
        .phone {
          position: relative;
          width: 100%;
          height: 100%;
          border: 1.5px solid currentColor;
          border-radius: 11px;
          padding: 10px 5px;
          color: rgb(var(--fg-rgb, 240 232 216));
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: stretch;
        }
        .speaker {
          width: 18px;
          height: 2px;
          background: currentColor;
          opacity: 0.55;
          border-radius: 1px;
          margin: 0 auto 6px;
        }
        .screen {
          flex: 1;
          border: 1px solid currentColor;
          opacity: 0.35;
          border-radius: 3px;
        }
        .home-indicator {
          width: 22px;
          height: 2px;
          background: currentColor;
          opacity: 0.55;
          border-radius: 1px;
          margin: 6px auto 0;
        }
        @keyframes orientation-gate-rotate {
          0%, 25% {
            transform: rotate(0deg);
          }
          50%, 75% {
            transform: rotate(-90deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
}

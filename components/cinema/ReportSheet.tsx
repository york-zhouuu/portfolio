"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * ReportSheet — fullscreen modal overlay carrying the v7 long-form
 * experimental report. Mounts at <body> level via portal so it sits on
 * top of the cinema scroll without consuming page scroll length.
 *
 * Opens via the global `open-full-report` window event (dispatched by the
 * SiteNav "完整报告" diamond). Closes via:
 *   - the close button in the top-right of the sheet
 *   - clicking the backdrop
 *   - pressing ESC
 *
 * No inline section anywhere on the page. The cinema scroll experience
 * stays uninterrupted; the report is a discrete reading mode the user
 * opts into and exits from.
 *
 * Locale-aware: picks zh.html or en.html.
 */
export function ReportSheet() {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const reportUrl = zh
    ? "/case-studies/sswt/report/zh.html"
    : "/case-studies/sswt/report/en.html";

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portal target only exists after hydration.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen for the global open event.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("open-full-report", onOpen);
    return () => window.removeEventListener("open-full-report", onOpen);
  }, []);

  // ESC closes the sheet.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock body scroll when open so the iframe takes over.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={zh ? "完整实验报告" : "Full experimental report"}
      className="fixed inset-0 z-[100] flex items-stretch justify-center animate-[reportSheetFadeIn_280ms_ease-out]"
    >
      {/* Backdrop — click to close */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Sheet container — leaves a small margin so the cinema can be
          glimpsed at the edges, signaling "you're still on the page". */}
      <div className="relative z-[101] mx-auto my-[3svh] flex h-[94svh] w-[min(96vw,1440px)] flex-col overflow-hidden rounded-xl bg-white shadow-[0_24px_72px_-12px_rgba(0,0,0,0.55)] animate-[reportSheetSlideUp_360ms_cubic-bezier(0.16,1,0.3,1)]">
        {/* Header bar with title + close button */}
        <div className="flex items-center justify-between border-b border-black/8 bg-white px-5 py-3 md:px-7">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.30em] text-black/55">
              {zh ? "完整实验报告 · v7" : "Full experimental report · v7"}
            </span>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.20em] text-black/35">
              {zh ? "ESC 关闭" : "ESC to close"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={zh ? "关闭完整报告" : "Close report"}
            className="group inline-flex items-center gap-1.5 rounded-full border border-black/15 bg-white px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-black/75 transition-all duration-150 hover:border-black/40 hover:bg-black/5 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
          >
            <span>{zh ? "关闭" : "Close"}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-3 w-3"
              aria-hidden
            >
              <path
                d="M6 6l12 12M6 18L18 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* The report iframe takes the rest of the sheet. Internal scroll
            handles the long-form; outer page scroll is locked. */}
        <iframe
          key={reportUrl}
          src={reportUrl}
          title={zh ? "实验报告 (中文)" : "Experimental Report"}
          className="block h-full w-full flex-1 border-0 bg-white"
        />
      </div>

      <style jsx>{`
        @keyframes reportSheetFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes reportSheetSlideUp {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>,
    document.body,
  );
}

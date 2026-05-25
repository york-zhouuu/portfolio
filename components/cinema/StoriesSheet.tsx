"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useReaderContext } from "@/components/reader/ReaderContext";

/**
 * StoriesSheet — modal overlay that introduces the three resident
 * longform stories. Why this exists: 3 separate nav diamonds said
 * nothing about WHY these stories matter or HOW they were made; cold
 * readers saw three names and skipped. This sheet provides one entry
 * point: intro paragraph + 3 cards. Click a card → opens that story
 * in the existing ResidentStoryReader sheet.
 *
 * Opens via the global `open-stories-sheet` window event (dispatched
 * by the SiteNav "三个居民" diamond and by the outro CTA action
 * "open-stories"). Closes via ESC, close button, or backdrop click.
 *
 * Three stories (slug, name, role) come from ReaderContext.stories,
 * sourced from the MDX frontmatter `residentStories` field.
 */
export function StoriesSheet() {
  const { locale } = useLocale();
  const reader = useReaderContext();
  const zh = locale === "zh";

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("open-stories-sheet", onOpen);
    return () => window.removeEventListener("open-stories-sheet", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open) return null;

  const stories = reader?.stories ?? [];

  const handleOpenStory = (slug: string) => {
    setOpen(false);
    // Defer slightly so the sheet's close animation can begin before the
    // resident-story reader takes over the body.style.overflow lock.
    window.setTimeout(() => {
      reader?.openReader(slug);
    }, 50);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={zh ? "三个居民" : "Three residents"}
      className="fixed inset-0 z-[100] flex items-center justify-center animate-[storiesSheetFadeIn_260ms_ease-out]"
    >
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden
      />

      <div className="relative z-[101] mx-auto my-[4svh] flex max-h-[92svh] w-[min(96vw,920px)] flex-col overflow-hidden rounded-2xl bg-bg shadow-[0_24px_72px_-12px_rgba(0,0,0,0.55)] animate-[storiesSheetSlideUp_320ms_cubic-bezier(0.16,1,0.3,1)]">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-line/20 px-6 py-3.5 md:px-8">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.30em] text-fg/55">
              {zh ? "三个居民" : "Three residents"}
            </span>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.20em] text-fg/35">
              ESC
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={zh ? "关闭" : "Close"}
            className="group inline-flex items-center gap-1.5 rounded-full border border-fg/25 bg-bg px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-fg/75 transition-all duration-150 hover:border-fg/55 hover:bg-fg/5 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40"
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

        {/* Body — intro + 3 cards. Internal scroll if content overflows. */}
        <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-10">
          {/* Intro: WHY + HOW + WHAT FOR */}
          <div className="max-w-[640px]">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.30em] text-fg/55">
              {zh ? "为什么有这些故事" : "Why these stories exist"}
            </p>
            <h3 className="mt-3 font-sans font-medium text-fg leading-[1.22] tracking-[-0.018em] [font-size:clamp(20px,2.2vw,26px)]">
              {zh
                ? "1,000 个居民, 每个都是一个完整的人。 我们挑了三个, 把他们的 14 天写下来。"
                : "1,000 residents, each a complete person. We picked three and wrote down their 14 days."}
            </h3>
            <p className="mt-4 font-sans text-[14px] leading-[1.72] tracking-[0.005em] text-fg/78 [text-wrap:pretty]">
              {zh ? (
                <>
                  上面的 cinema 给出的是群体层面的形状 —— 5 个 anchor、
                  3.1× cliff、 31% movable。 但每个数字下面都是一个人:
                  一份性格、 一周的安排、 14 天里 4,032 次决策、 推开门
                  那一下犹豫。 这三篇 longform 把仿真里的 raw data
                  (位置 · 决策 · 对话 · 心理活动) 还原成可读的纪实写作 ——
                  跟 The New Yorker 的肖像稿同形态, 但底层不是采访,
                  是直接从 simulation events.jsonl 重建的。
                </>
              ) : (
                <>
                  The cinema above shows the population-level shape — 5
                  anchors, the 3.1× cliff, 31% movable. Underneath every
                  number is a person: a personality, a weekly routine,
                  4,032 decisions across 14 days, the hesitation before
                  pushing a door open. These three longform pieces rebuild
                  the simulation’s raw data (positions · decisions ·
                  dialogues · interior monologue) into readable narrative
                  reportage — same shape as a New Yorker profile, but the
                  source isn’t an interview; it’s `events.jsonl`.
                </>
              )}
            </p>
            <p className="mt-3 font-sans text-[13.5px] leading-[1.7] text-fg/62">
              {zh ? (
                <>
                  方法: 抽 agent 的全部 events / locations / plans /
                  dialogues / reflections, 串成时序, 抚平 LLM 的明显痕迹
                  (重复 / 机械语气), 但保留情感细节。 数字虚荣化时刻在
                  appendix 里。
                </>
              ) : (
                <>
                  Method: pull every event / location / plan / dialogue /
                  reflection for the agent, sequence chronologically,
                  smooth out the LLM’s tells (repetition, mechanical
                  voice) without scrubbing emotional detail. The “data
                  vanity” stat block is in each story’s appendix.
                </>
              )}
            </p>
          </div>

          {/* Three story cards */}
          <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {stories.map((s) => {
              const name = s.displayName[locale] ?? s.displayName.zh;
              const role = s.role[locale] ?? s.role.zh;
              return (
                <li key={s.slug}>
                  <button
                    type="button"
                    onClick={() => handleOpenStory(s.slug)}
                    className="group flex h-full w-full flex-col items-start gap-2 rounded-xl border border-line/30 bg-bg px-5 py-5 text-left transition-all duration-200 hover:border-fg/60 hover:bg-fg/3 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg/45">
                      {zh ? `走进 · agent #${s.agentId ?? ""}` : `Enter · agent #${s.agentId ?? ""}`}
                    </span>
                    <span className="font-sans text-[19px] font-medium leading-[1.2] tracking-[-0.012em] text-fg">
                      {name}
                    </span>
                    <span className="font-sans text-[12.5px] leading-[1.5] text-fg/65">
                      {role}
                    </span>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-3 font-mono text-[10.5px] uppercase tracking-[0.22em] text-fg/55 transition-colors group-hover:text-fg">
                      <span>{zh ? "读 14 天" : "Read 14 days"}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5"
                        aria-hidden
                      >
                        <path
                          d="M5 12h14M13 5l7 7-7 7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <style jsx>{`
        @keyframes storiesSheetFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes storiesSheetSlideUp {
          from {
            opacity: 0;
            transform: translateY(28px) scale(0.985);
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

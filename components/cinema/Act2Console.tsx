"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { CaseStudyAct } from "@/lib/content/case-study-schema";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { pickLang, type Locale } from "@/lib/i18n/types";

/**
 * Act2Console — paradigm break.
 *
 * Replaces the 9 cinema-scene Act 2 with an interactive apparatus
 * console: 4 variant buttons + live narrative panel + main cinema
 * sandbox underneath. Click a variant → overlay on the main canvas
 * switches to that variant's real demo + this panel updates.
 *
 * Outer <section> still preserves the nav-jump anchor ID so the top
 * nav "Act 2" marker still scrolls here. The section has a tall scroll
 * budget so the console stays sticky-pinned while user is in the zone.
 *
 * Publishes selected variant to window.__sswtSelectedVariant so the
 * R3F overlays (PushMomentOverlay / future BaselineOverlay etc.) can
 * subscribe.
 */

type VariantMeta = {
  id: string;
  label: { zh: string; en: string };
  short: { zh: string; en: string };
  hypothesis: string;
  hypothesisCaption: { zh: string; en: string };
  description: { zh: string; en: string };
  stat: { zh: string; en: string };
  /** Hexadecimal colour for the variant accent on tab + panel border. */
  accent: string;
};

// Voice rewrite per CLAUDE.md "9 原则" + 附近 thesis:
// * 凉读者必须读得懂 — variant 名称用日常中文, 技术名退到底下小字
// * 描述聚焦 "在做什么 + 想验证什么", 不剧透结果数据 (留给 Act 3)
// * 全部围绕 "附近 / 视野 / 目光 / 注意力" 这条 thesis 主轴, 不用"搭话/社交"
// * variant 顺序 = BL → HP → GD → PF, 跟 v7 report / poster 完全对齐
const VARIANTS: VariantMeta[] = [
  {
    id: "baseline",
    label: { zh: "什么都不推", en: "Push nothing" },
    short: { zh: "对照组", en: "control" },
    hypothesis: "对照",
    hypothesisCaption: {
      zh: "基线 · 不干预",
      en: "Baseline · no intervention",
    },
    description: {
      zh: "1,000 个居民按自己的节奏跑 14 天。 没有任何推送、 没有任何参数调整。 这是其他 3 个方案的对照零点 —— 默认的城市, 默认的注意力分布。",
      en: "1,000 residents live their own rhythm for 14 days. No pushes, no parameter changes. This is the zero-point the other three conditions get measured against — a default city with a default distribution of attention.",
    },
    stat: {
      zh: "默认城市 · 默认注意力",
      en: "default city · default attention",
    },
    accent: "#9aa3ad",
  },
  {
    id: "hyperlocal_push",
    label: { zh: "推附近的事", en: "Push the nearby" },
    short: { zh: "核心实验", en: "the core test" },
    hypothesis: "核心实验",
    hypothesisCaption: {
      zh: "把目光往附近拉, 附近会回到视野里吗?",
      en: "Pull the gaze toward the nearby — does the nearby come back?",
    },
    description: {
      zh: "每天 5 条推送, 内容都指向住所 1,000 米内的小事 —— 街角咖啡馆的新品、 邻居走丢的橘猫、 教堂前的市集。 想验证的问题: 当 '附近' 这件事重新进入手机屏幕, 居民的目光、 脚步、 一天的轨迹, 会不会也跟着回到附近?",
      en: "Five daily push notifications, all pointing to small things within 1,000 m of home — a new pastry at the corner café, a missing ginger cat, a market in front of the church. The test: when the nearby reappears on the screen, does the gaze, the walk, the day-shape follow it back into the nearby?",
    },
    stat: {
      zh: "推送半径 1,000 米 · 都是附近",
      en: "push radius 1,000 m · all nearby",
    },
    accent: "#f4c674",
  },
  {
    id: "global_distraction",
    label: { zh: "推远方的事", en: "Push the far-away" },
    short: { zh: "镜像对照", en: "mirror control" },
    hypothesis: "镜像对照",
    hypothesisCaption: {
      zh: "同样的频率, 反方向的内容 · 测的是「方向」不是「数量」",
      en: "Same frequency, opposite direction — testing direction, not volume",
    },
    description: {
      zh: "同样 5 条推送、 同样的频率, 但内容换成远方的事 —— 国际新闻、 别处的灾难、 名人动态。 镜像对照: 如果上一个方案有效果, 这一个就应该没效果。 这样我们能判断推送的效果到底是来自 '推送本身', 还是来自 '推送指向了附近'。",
      en: "Same five-a-day cadence, but the content points far away — world news, distant disasters, celebrity feeds. The mirror: if the previous condition works, this one shouldn't. That lets us tell whether the effect comes from pushing at all, or specifically from pushing toward the nearby.",
    },
    stat: {
      zh: "推送频率相同 · 方向相反",
      en: "same cadence · opposite direction",
    },
    accent: "#93c5fd",
  },
  {
    id: "phone_friction",
    label: { zh: "削弱手机的吸引力", en: "Dim the phone" },
    short: { zh: "反向尝试", en: "the inverse" },
    hypothesis: "反向尝试",
    hypothesisCaption: {
      zh: "不往附近「拉」 · 而是把远方的拉力削掉",
      en: "Don't pull toward the nearby — cut the far-away's pull instead",
    },
    description: {
      zh: "不推任何东西。 反过来, 把所有居民对手机的吸引力调低一半 —— 屏幕的拉力变小, 抬头看周围的成本就变小。 想验证的问题: 让附近回到视野, 是要 '多推一点附近', 还是 '少拉一点别处'? 这两个看似对称的方向, 哪个其实更有用?",
      en: "Push nothing. Instead, halve every resident's pull toward the screen — when the phone tugs less hard, looking up costs less. The test: does the nearby come back by adding more local signal, or by subtracting far-away pull? Two symmetric-looking directions — which one actually works?",
    },
    stat: {
      zh: "推送 0 条 · 手机吸引力 × 0.5",
      en: "0 pushes · phone pull × 0.5",
    },
    accent: "#d0b0ff",
  },
];

declare global {
  interface Window {
    __sswtSelectedVariant?: string;
  }
}

export function Act2Console({ act }: { act: CaseStudyAct }) {
  const { locale } = useLocale();
  const [selected, setSelected] = useState<string>("hyperlocal_push");

  // Publish selection to a window slot so R3F overlays can subscribe.
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__sswtSelectedVariant = selected;
    }
  }, [selected]);

  const variant = VARIANTS.find((v) => v.id === selected) ?? VARIANTS[1];
  const firstScene = act.beats[0]?.scenes?.[0];
  // Preserve the nav-jump anchor — global nav's Act 2 marker uses this id.
  const anchorId = firstScene ? `${act.beats[0].id}--${firstScene.id}` : act.beats[0].id;

  return (
    <section
      id={anchorId}
      data-act={act.id}
      style={{ height: "260svh" }}
      className="relative z-10"
    >
      <h2 className="sr-only">{pickLang(act.title, locale)} · console</h2>

      {/* Sticky-pinned console occupying the viewport while user is in the
          Act 2 scroll zone. */}
      <div className="pointer-events-none sticky top-0 flex h-screen w-full flex-col justify-between px-4 py-5 md:px-12 md:py-8">
        {/* TOP: brand + variant tabs */}
        <div className="pointer-events-auto mx-auto w-full max-w-[1280px]">
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-caption uppercase tracking-[0.30em] text-glow [text-shadow:0_1px_8px_oklch(var(--bg)/0.6)]">
              {locale === "zh" ? "02 · 四种方案, 同一座城市" : "02 · Four conditions, one city"}
            </p>
            <p className="hidden font-mono text-caption uppercase tracking-[0.22em] text-fg/55 md:block">
              {locale === "zh"
                ? "点开任一方案 ↓  看沙盘的反应"
                : "click a condition ↓  the sandbox responds"}
            </p>
          </div>

          <VariantTabs
            variants={VARIANTS}
            selectedId={selected}
            onSelect={setSelected}
            locale={locale}
          />
        </div>

        {/* SPACER — let the sandbox breathe through. */}
        <div className="flex-1" />

        {/* BOTTOM: narrative panel for current variant */}
        <div className="pointer-events-auto mx-auto w-full max-w-[1280px]">
          <NarrativePanel variant={variant} locale={locale} />
        </div>
      </div>
    </section>
  );
}

function VariantTabs({
  variants,
  selectedId,
  onSelect,
  locale,
}: {
  variants: VariantMeta[];
  selectedId: string;
  onSelect: (id: string) => void;
  locale: Locale;
}) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-2 md:mt-6 md:grid-cols-4 md:gap-3">
      {variants.map((v) => {
        const active = v.id === selectedId;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.id)}
            className={clsx(
              "group rounded-xl border px-4 py-3.5 text-left transition-all duration-200",
              active
                ? "bg-bg/80 shadow-[0_8px_28px_rgba(0,0,0,0.5)] backdrop-blur-md"
                : "border-line/30 bg-bg/55 backdrop-blur-md hover:border-line/60 hover:bg-bg/72",
            )}
            style={{
              borderColor: active ? v.accent : undefined,
              boxShadow: active ? `0 0 0 1px ${v.accent}88, 0 12px 32px rgba(0,0,0,0.5)` : undefined,
            }}
          >
            <div
              className="font-mono text-[10px] uppercase tracking-[0.24em]"
              style={{ color: active ? v.accent : "rgba(220, 210, 190, 0.5)" }}
            >
              {v.hypothesis}
            </div>
            <div
              className={clsx(
                "mt-1 font-sans text-[15px] font-medium leading-[1.15] tracking-tight transition-colors md:text-[17px]",
                active ? "text-fg" : "text-fg/75",
              )}
            >
              {pickLang(v.label, locale)}
            </div>
            <div className="mt-0.5 font-mono text-[11px] leading-[1.35] text-fg/55">
              {pickLang(v.short, locale)}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function NarrativePanel({
  variant,
  locale,
}: {
  variant: VariantMeta;
  locale: Locale;
}) {
  // Re-key the panel by variant.id so the fade-in re-plays on switch.
  return (
    <div
      key={variant.id}
      className="rounded-2xl border border-line/30 bg-bg/85 px-6 py-5 shadow-[0_18px_44px_rgba(0,0,0,0.55)] backdrop-blur-md md:px-8 md:py-6"
      style={{
        borderTopColor: variant.accent,
        borderTopWidth: "2px",
        animation: "act2ConsoleFadeIn 280ms ease-out",
      }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-fg/55">
            {locale === "zh" ? "当前方案" : "current condition"}
          </p>
          <h3
            className="mt-1 font-sans text-[26px] font-medium leading-[1.1] tracking-tight md:text-[32px]"
            style={{ color: variant.accent }}
          >
            {pickLang(variant.label, locale)}
          </h3>
          <p className="mt-1 font-sans text-[12.5px] leading-[1.4] text-fg/68">
            {pickLang(variant.hypothesisCaption, locale)}
          </p>
        </div>
        <div className="font-mono text-[12px] leading-[1.4] text-fg/72 md:max-w-[360px] md:text-right">
          {pickLang(variant.stat, locale)}
        </div>
      </div>
      <p className="mt-4 max-w-[820px] font-sans text-[14.5px] leading-[1.65] text-fg/88 [text-wrap:pretty] md:text-[15.5px]">
        {pickLang(variant.description, locale)}
      </p>

      <style jsx>{`
        @keyframes act2ConsoleFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

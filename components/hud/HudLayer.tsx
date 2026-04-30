"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { pickLang } from "@/lib/i18n/types";
import type { CameraScore } from "@/lib/cinema/types";
import type { CaseStudyAct, CaseStudyHud } from "@/lib/content/case-study-schema";
import {
  beatAt,
  buildBeatLayout,
  hudStableOpacity,
  mapScrollToScoreT,
  scrollToT,
} from "@/lib/cinema/scrollCinema";
import { T } from "@/components/i18n/T";

/**
 * HUD layer — reads localized content from the case study frontmatter
 * (passed in as `acts`) but timing/range from the camera score.
 *
 * Stable anchoring: each HUD is fully opaque only in the middle ~64% of
 * its beat and fades at the edges so transitions feel filmic.
 *
 * Iteration seam: HUD kinds live in `lib/cinema/types.ts` (timing) and
 * `lib/content/case-study-schema.ts` (display content). Add a new kind
 * by extending both unions, the Zod schema, and the switch below.
 */
export function HudLayer({
  score,
  acts,
}: {
  score: CameraScore;
  acts: CaseStudyAct[];
}) {
  const [t, setT] = useState(0);
  const beatLayout = useMemo(() => buildBeatLayout(score, acts), [score, acts]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const raw = docHeight > 0 ? window.scrollY / docHeight : 0;
      const piecewise = mapScrollToScoreT(raw, beatLayout);
      setT(scrollToT(piecewise));
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [beatLayout]);

  const current = beatAt(score, t);
  if (!current) return null;
  const opacity = hudStableOpacity(current.localT);

  // Cross-reference frontmatter for the active beat. Fallback to score
  // titles only if frontmatter is missing the act/beat (shouldn't happen
  // when content-lint has passed).
  const fmAct = acts.find((a) => a.id === current.act.id);
  const fmBeat = fmAct?.beats.find((b) => b.id === current.beat.id);

  return (
    <div className="hud-layer" style={{ opacity, transition: "opacity 90ms linear" }}>
      <ActMarker actTitle={fmAct?.title ?? null} fallbackActTitle={current.act.title} beatId={current.beat.id} />
      {fmBeat?.hud ? <HudRender hud={fmBeat.hud} /> : null}
    </div>
  );
}

function ActMarker({
  actTitle,
  fallbackActTitle,
  beatId,
}: {
  actTitle: { zh: string; en: string } | null;
  fallbackActTitle: string;
  beatId: string;
}) {
  return (
    <div className="absolute left-6 top-[10svh] flex flex-col gap-1 font-mono text-caption text-muted/80 md:left-12">
      <span className="uppercase tracking-[0.24em]">
        {actTitle ? <T value={actTitle} /> : fallbackActTitle}
      </span>
      <span className="tracking-[0.18em] text-muted/60">· {beatId}</span>
    </div>
  );
}

function HudRender({ hud }: { hud: CaseStudyHud }) {
  // Cue-card and hud-panel content has moved to the scrolling ContentPanel
  // alongside the cinema canvas — rendering them again as floating HUD
  // would duplicate the same body across two surfaces. We keep
  // letterbox (dramatic moment subtitle) and in-world-label (anchored
  // to a 3D position).
  switch (hud.kind) {
    case "letterbox":
      return (
        <>
          <div className="letterbox-bar absolute inset-x-0 top-0 h-[8svh]" />
          <div className="letterbox-bar absolute inset-x-0 bottom-0 h-[10svh]">
            <p className="mx-auto mt-7 max-w-[64ch] px-6 text-center font-mono text-small uppercase tracking-[0.16em] text-fg/88">
              <T value={hud.subtitle} />
            </p>
          </div>
        </>
      );

    case "in-world-label":
      return (
        <p className="absolute bottom-[14svh] left-1/2 -translate-x-1/2 font-mono text-caption uppercase tracking-[0.28em] text-fg/72">
          <T value={hud.text} />
        </p>
      );

    case "cue-card":
    case "hud-panel":
      // Content lives in the scrolling content panel now.
      return null;

    default:
      return null;
  }
}

function CueLabel() {
  const { locale } = useLocale();
  return <>{locale === "zh" ? "提示" : "cue"}</>;
}

function HudPanel({ slot }: { slot: "stats" | "feed-item" | "beta-rigor" | "mirror-toggle" }) {
  const { locale } = useLocale();
  const content = panelContent(slot, locale);
  return (
    <aside
      className="absolute right-6 top-1/2 max-w-[34ch] -translate-y-1/2 rounded-sm border border-line/40 bg-bg/78 p-5 backdrop-blur-md md:right-12"
      aria-label={`Panel · ${slot}`}
    >
      <p className="font-mono text-caption uppercase tracking-[0.22em] text-muted">
        {content.title}
      </p>
      <div className="mt-4 space-y-2 text-small leading-[1.55] text-fg/88">
        {content.body.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </aside>
  );
}

function panelContent(
  slot: "stats" | "feed-item" | "beta-rigor" | "mirror-toggle",
  locale: "zh" | "en",
): { title: string; body: string[] } {
  const data: Record<typeof slot, { title: { zh: string; en: string }; body: { zh: string; en: string }[] }> = {
    stats: {
      title: { zh: "agent 画像", en: "agent profile" },
      body: [
        {
          zh: "personality 八维 · 一日 plan · 三层模型预算。",
          en: "Personality 8d · daily plan · three-tier model.",
        },
        {
          zh: "Sonnet 10 · mid 200 · Haiku 790。每个 agent 每天一次 LLM 调用。",
          en: "Sonnet 10 · mid 200 · Haiku 790. One LLM call per agent per day.",
        },
        {
          zh: "同一座地图，每个 agent 看到不同的城市。",
          en: "Same map, a different perceived city per agent.",
        },
      ],
    },
    "feed-item": {
      title: {
        zh: "hyperlocal push · variant a",
        en: "hyperlocal push · variant a",
      },
      body: [
        {
          zh: '"300m 外的 Park St 走丢了一只猫。"',
          en: '"Lost cat at Park St — 300m away."',
        },
        {
          zh: "feed item → 500m 地理过滤 → agent 注意力。",
          en: "Feed item → 500m geo filter → agent attention.",
        },
        {
          zh: "Smoke demo：路径偏转中位数 +302m，治理效应 86 pp。",
          en: "Smoke demo: +302m median trajectory delta. 86 pp treatment effect.",
        },
      ],
    },
    "beta-rigor": {
      title: { zh: "比赛进行中", en: "contest in progress" },
      body: [
        {
          zh: "30 seed × 5 variant。Median + IQR（非高斯分布）。",
          en: "30 seeds × 5 variants. Median + IQR (non-Gaussian).",
        },
        {
          zh: "14 天协议：baseline · intervention · post。",
          en: "14-day protocol: baseline · intervention · post.",
        },
        {
          zh: "Smoke 证据：target 100% / control 14%。",
          en: "Smoke evidence: 100% target / 14% control.",
        },
        {
          zh: "其他 variant 与镜像在路上。",
          en: "Other variants + mirror in queue.",
        },
      ],
    },
    "mirror-toggle": {
      title: { zh: "A vs A' · 镜像", en: "a vs a' · mirror" },
      body: [
        {
          zh: "同样的基础设施，反向使用。",
          en: "Same infrastructure, reversed direction.",
        },
        {
          zh: "A：hyperlocal push 把人拉回附近。",
          en: "A: hyperlocal push pulls bodies back to the nearby.",
        },
        {
          zh: "A'：global distraction 把人推得更远。",
          en: "A': global distraction pushes them further away.",
        },
        {
          zh: "杠杆是对称的。",
          en: "The lever is symmetric.",
        },
      ],
    },
  };
  const entry = data[slot];
  return {
    title: pickLang(entry.title, locale),
    body: entry.body.map((b) => pickLang(b, locale)),
  };
}

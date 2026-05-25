"use client";

import { useState } from "react";
import clsx from "clsx";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { pickLang, type I18nString } from "@/lib/i18n/types";
import { transitionStyle } from "./transitions";
import type { CaseStudyScene, CaseStudyKvItem } from "@/lib/content/case-study-schema";

/**
 * SceneBodySection — block reveal: all paragraphs render together.
 *
 * Per author iteration 2026-04-27: progressive (one-by-one) reveal felt
 * "torturing" — too slow for readers who want the whole argument visible.
 * Now scene-level enter/exit fades the whole block; user reads at their
 * own pace within the hold band.
 *
 * sceneLocalT is unused now but kept in the signature for back-compat.
 */
export function SceneBodySection({
  scene,
  enterProgress,
  exitProgress,
}: {
  scene: Extract<CaseStudyScene, { kind: "body-section" }>;
  sceneLocalT: number;
  enterProgress: number;
  exitProgress: number;
}) {
  const style = transitionStyle(scene.enter, scene.exit, enterProgress, exitProgress);
  const { locale } = useLocale();
  const paragraphs = scene.paragraphs ?? [];

  if (scene.layout === "twin-column") {
    return (
      <div
        className="pointer-events-auto absolute inset-0 flex items-center justify-center px-6 md:px-12"
        style={style}
      >
        <div className="mx-auto w-full max-w-[1100px] rounded-2xl border border-line/12 bg-bg/32 p-7 shadow-[0_2px_30px_-12px_rgba(0,0,0,0.18)] backdrop-blur-2xl md:p-10">
          <SectionHeader sectionNumber={scene.sectionNumber} heading={scene.heading} />
          {paragraphs.map((p, i) => (
            <p key={i} className="mt-4 text-body leading-[1.65] text-fg/88">
              <RenderInline value={p} />
            </p>
          ))}
          {scene.twinColumns ? (
            <div className="mt-7 grid gap-6 md:grid-cols-2 md:gap-10">
              {([scene.twinColumns.left, scene.twinColumns.right] as const).map((col, i) => {
                const hasParagraphs = col.paragraphs && col.paragraphs.length > 0;
                const hasItems = col.items && col.items.length > 0;
                const hasCitations = col.citations && col.citations.length > 0;
                return (
                  <div key={i}>
                    {col.heading ? (
                      <p className="font-mono text-caption uppercase tracking-[0.22em] text-muted">
                        <RenderInline value={col.heading} />
                      </p>
                    ) : null}
                    {hasParagraphs ? (
                      <div className="mt-3 space-y-3">
                        {col.paragraphs!.map((p, j) => (
                          <p key={j} className="text-body leading-[1.65] text-fg/88">
                            <RenderInline value={p} />
                          </p>
                        ))}
                      </div>
                    ) : null}
                    {hasItems ? (
                      <ul className={`${hasParagraphs ? "mt-5" : "mt-3"} space-y-3`}>
                        {col.items!.map((item, j) => (
                          <KvRow key={j} item={item} stagger={j} enterProgress={enterProgress} />
                        ))}
                      </ul>
                    ) : null}
                    {hasCitations ? (
                      <ul className={`${hasParagraphs || hasItems ? "mt-5" : "mt-3"} space-y-4 border-l border-line/40 pl-5`}>
                        {col.citations!.map((c, j) => (
                          <li key={j}>
                            <p className="italic leading-[1.55] text-fg/88 [text-wrap:pretty]">
                              “<RenderInline value={c.text} />”
                            </p>
                            {c.attribution ? (
                              <p className="mt-1.5 font-mono text-caption uppercase tracking-[0.18em] text-muted/85">
                                — <RenderInline value={c.attribution} />
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (scene.layout === "attention-mechanism") {
    return (
      <div
        className="pointer-events-auto absolute inset-0 flex items-center justify-center px-6 md:px-12"
        style={style}
      >
        <div className="mx-auto w-full max-w-[1100px]">
          {scene.sectionNumber ? (
            <p className="text-center font-mono text-caption uppercase tracking-[0.32em] text-fg/55 [text-shadow:0_1px_8px_oklch(var(--bg)/0.55)]">
              {scene.sectionNumber}
            </p>
          ) : null}
          <h2 className="mt-4 text-center font-sans font-medium leading-[1.1] tracking-[-0.025em] text-fg/95 [font-size:clamp(28px,3.6vw,42px)] [text-shadow:0_1px_14px_oklch(var(--bg)/0.6)] [text-wrap:balance]">
            <RenderInline value={scene.heading} />
          </h2>
          {paragraphs.length > 0 ? (
            <div className="mx-auto mt-5 max-w-[680px] space-y-3 text-center">
              {paragraphs.map((p, i) => (
                <p
                  key={i}
                  className="font-sans leading-[1.55] text-fg/78 [font-size:clamp(14px,1.15vw,16px)] [text-shadow:0_1px_8px_oklch(var(--bg)/0.5)] [text-wrap:pretty]"
                >
                  <RenderInline value={p} />
                </p>
              ))}
            </div>
          ) : null}
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            <AttentionScenePanel
              label="Scene A"
              result="both on phones"
              dotColor="#ff7b6b"
              dotIcon="phone"
              outcomePrimary="P(see) ≈ 0"
              outcomeSecondary="no weak tie"
              outcomeMood="cold"
              stagger={0}
              enterProgress={enterProgress}
            />
            <AttentionScenePanel
              label="Scene B"
              result="both look up"
              dotColor="#a8e6a3"
              dotIcon="eye"
              outcomePrimary="P(see) ↑"
              outcomeSecondary="weak tie possible"
              outcomeMood="warm"
              stagger={1}
              enterProgress={enterProgress}
            />
          </div>
          <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-[0.28em] text-fg/55 [text-shadow:0_1px_8px_oklch(var(--bg)/0.5)]">
            encounter = proximity (within 5 m) × mutual attention
          </p>
        </div>
      </div>
    );
  }

  if (scene.layout === "process-flow") {
    const steps = scene.kvList ?? [];
    return (
      <div
        className="pointer-events-auto absolute inset-0 flex items-center justify-center px-6 md:px-12"
        style={style}
      >
        <div className="mx-auto w-full max-w-[1100px]">
          {scene.sectionNumber ? (
            <p className="text-center font-mono text-caption uppercase tracking-[0.32em] text-fg/55 [text-shadow:0_1px_8px_oklch(var(--bg)/0.55)]">
              {scene.sectionNumber}
            </p>
          ) : null}
          <h2 className="mt-4 text-center font-sans font-medium leading-[1.1] tracking-[-0.025em] text-fg/95 [font-size:clamp(28px,3.6vw,42px)] [text-shadow:0_1px_14px_oklch(var(--bg)/0.6)] [text-wrap:balance]">
            <RenderInline value={scene.heading} />
          </h2>
          {paragraphs.length > 0 ? (
            <div className="mx-auto mt-6 max-w-[640px] space-y-3 text-center">
              {paragraphs.map((p, i) => (
                <p
                  key={i}
                  className="font-sans leading-[1.6] text-fg/78 [font-size:clamp(15px,1.2vw,17px)] [text-shadow:0_1px_8px_oklch(var(--bg)/0.5)] [text-wrap:pretty]"
                >
                  <RenderInline value={p} />
                </p>
              ))}
            </div>
          ) : null}
          {steps.length > 0 ? (
            <div className="mt-12 flex flex-col items-stretch gap-6 md:flex-row md:items-stretch md:gap-2">
              {steps.map((item, i) => (
                <ProcessStepFragment
                  key={i}
                  item={item}
                  index={i + 1}
                  isLast={i === steps.length - 1}
                  stagger={i}
                  enterProgress={enterProgress}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (scene.layout === "cinema-subtitle") {
    const items = scene.kvList ?? [];
    return (
      <div
        className="pointer-events-auto absolute inset-x-0 bottom-0"
        style={style}
      >
        <div className="relative mx-auto max-w-[1280px] px-6 pb-8 md:px-12 md:pb-10">
          {/* Thin separator marking the sandbox-vs-subtitle boundary. */}
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-fg/22 to-transparent md:inset-x-12" />
          <div className="pt-5 md:pt-6">
            {scene.sectionNumber ? (
              <p className="font-mono text-caption uppercase tracking-[0.28em] text-fg/55 [text-shadow:0_1px_8px_oklch(var(--bg)/0.55)]">
                {scene.sectionNumber}
              </p>
            ) : null}
            <h2 className="mt-2 font-sans font-medium leading-[1.15] tracking-[-0.02em] text-fg/95 [font-size:clamp(22px,2.4vw,32px)] [text-shadow:0_1px_12px_oklch(var(--bg)/0.55)] [text-wrap:balance]">
              <RenderInline value={scene.heading} />
            </h2>
            {paragraphs.length > 0 ? (
              <div className="mt-3 max-w-[680px] space-y-2">
                {paragraphs.map((p, i) => (
                  <p
                    key={i}
                    className="font-sans text-fg/78 leading-[1.5] [font-size:clamp(13px,1.05vw,15px)] [text-shadow:0_1px_8px_oklch(var(--bg)/0.5)] [text-wrap:pretty]"
                  >
                    <RenderInline value={p} />
                  </p>
                ))}
              </div>
            ) : null}
            {items.length > 0 ? (
              <div className="mt-4 flex flex-wrap items-start gap-x-7 gap-y-3 md:gap-x-9">
                {items.map((item, j) => (
                  <SubtitleStat
                    key={j}
                    item={item}
                    stagger={j}
                    enterProgress={enterProgress}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (scene.layout === "figure-hero") {
    // Figure-hero (sandbox-native): the sand-table itself carries the
    // visualisation via a finding-specific R3F overlay (e.g.
    // finding_1_siphon, finding_2_friction). Left ~60% of the viewport is
    // intentionally empty DOM so the sandbox + overlay rings are fully
    // visible through; the right column holds the small annotation panel.
    // Earlier iteration embedded a 2D PNG poster which clashed with the
    // 3D aesthetic — that was replaced by sandbox-native rendering.
    const items = scene.kvList ?? [];
    return (
      <div
        className="pointer-events-auto absolute inset-0 flex items-center justify-end px-6 md:px-12"
        style={style}
      >
        {/* Right-side annotation card, ~36% width, leaves the left ~60% of
            the viewport clear so the sandbox + anchor overlay show through. */}
        <aside className="ml-auto w-full max-w-[420px] rounded-2xl border border-line/14 bg-bg/55 px-7 py-7 shadow-[0_18px_44px_-14px_rgba(0,0,0,0.55)] backdrop-blur-xl md:px-8 md:py-8">
          {scene.sectionNumber ? (
            <div className="flex items-center gap-3">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.30em] text-fg/55 [text-shadow:0_1px_8px_oklch(var(--bg)/0.55)]">
                {scene.sectionNumber}
              </p>
              <span className="h-px flex-1 bg-fg/15" aria-hidden />
            </div>
          ) : null}
          <h2 className="mt-3 font-sans font-medium text-fg leading-[1.2] tracking-[-0.018em] [font-size:clamp(22px,2.2vw,28px)] [text-shadow:0_1px_18px_oklch(var(--bg)/0.65)] [text-wrap:balance]">
            <RenderInline value={scene.heading} />
          </h2>
          {paragraphs.length > 0 ? (
            <div className="mt-5 space-y-4">
              {paragraphs.map((p, i) => (
                <p
                  key={i}
                  className="font-sans text-fg/85 leading-[1.7] tracking-[0.005em] [font-size:clamp(13.5px,1.05vw,15.5px)] [text-wrap:pretty]"
                >
                  <RenderInline value={p} />
                </p>
              ))}
            </div>
          ) : null}
          {items.length > 0 ? (
            <div className="mt-6 flex flex-col gap-4 border-t border-line/18 pt-5">
              {items.map((item, j) => (
                <HeroSideStat
                  key={j}
                  item={item}
                  stagger={j}
                  enterProgress={enterProgress}
                />
              ))}
            </div>
          ) : null}
        </aside>
      </div>
    );
  }

  if (scene.layout === "hero") {
    const items = scene.kvList ?? [];
    const hasStats = items.length > 0;
    return (
      <div
        // items-center + NO overflow — content must fit viewport. Layout
        // changes shape based on whether stats exist:
        //   hasStats → heading + 2-col body (paras left, stats right)
        //   no stats → heading + centered paras (legacy)
        // The 2-col body cuts vertical content height in half, eliminating
        // the "heading pushed into nav" problem without scrolling or scene
        // splitting (per user request "不要滚动 · 用多个文本框").
        className="pointer-events-auto absolute inset-0 flex items-center justify-center px-6 md:px-16"
        style={style}
      >
        <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center">
          {scene.sectionNumber ? (
            <div className="flex flex-col items-center gap-3">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.34em] text-fg/52 [text-shadow:0_1px_8px_oklch(var(--bg)/0.55)]">
                {scene.sectionNumber}
              </p>
              <span className="h-px w-7 bg-fg/22" aria-hidden />
            </div>
          ) : null}
          <h2
            className="mt-5 max-w-[760px] text-center font-sans font-medium text-fg leading-[1.14] tracking-[-0.022em] [font-size:clamp(26px,3.0vw,38px)] [text-shadow:0_1px_18px_oklch(var(--bg)/0.65)] [text-wrap:balance]"
          >
            <RenderInline value={scene.heading} />
          </h2>

          {hasStats ? (
            // 2-column body: paragraphs left, stats sidebar right.
            <div className="mt-10 grid w-full grid-cols-1 gap-y-10 md:grid-cols-[minmax(0,1fr)_290px] md:gap-x-14 md:items-start">
              {paragraphs.length > 0 ? (
                <div className="max-w-[640px] space-y-5 text-left md:justify-self-end">
                  {paragraphs.map((p, i) => (
                    <p
                      key={i}
                      className="font-sans text-fg/85 leading-[1.72] tracking-[0.005em] [font-size:clamp(15.5px,1.2vw,18px)] [text-shadow:0_1px_10px_oklch(var(--bg)/0.55)] [text-wrap:pretty]"
                    >
                      <RenderInline value={p} />
                    </p>
                  ))}
                </div>
              ) : <div />}
              <div className="flex flex-col gap-7 text-left md:items-start">
                {items.map((item, j) => (
                  <HeroSideStat
                    key={j}
                    item={item}
                    stagger={j}
                    enterProgress={enterProgress}
                  />
                ))}
              </div>
            </div>
          ) : (
            // No stats: original centered single-column.
            paragraphs.length > 0 ? (
              <div className="mt-10 max-w-[580px] space-y-6 text-center">
                {paragraphs.map((p, i) => (
                  <p
                    key={i}
                    className="font-sans text-fg/85 leading-[1.72] tracking-[0.005em] [font-size:clamp(16.5px,1.32vw,19.5px)] [text-shadow:0_1px_10px_oklch(var(--bg)/0.55)] [text-wrap:pretty]"
                  >
                    <RenderInline value={p} />
                  </p>
                ))}
              </div>
            ) : null
          )}
        </div>
      </div>
    );
  }

  if (scene.layout === "params-grid") {
    const items = scene.kvList ?? [];
    return (
      <div
        className="pointer-events-none absolute inset-0"
        style={style}
      >
        {/* Scattered HUD chips — each kvList item floats over the cinema canvas. */}
        {items.map((item, j) => {
          const pos = PARAM_GRID_POSITIONS[j % PARAM_GRID_POSITIONS.length];
          return (
            <ParamChip
              key={j}
              item={item}
              stagger={j}
              enterProgress={enterProgress}
              position={pos}
            />
          );
        })}
        {/* Heading + paragraphs as bare text at the bottom — no card frame. */}
        <div className="pointer-events-auto absolute inset-x-0 bottom-[7%] mx-auto max-w-[640px] px-6 md:px-12">
          <SectionHeader sectionNumber={scene.sectionNumber} heading={scene.heading} />
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className="mt-3 text-body leading-[1.55] text-fg/82 [text-shadow:0_1px_10px_oklch(var(--bg)/0.45)] [text-wrap:pretty]"
            >
              <RenderInline value={p} />
            </p>
          ))}
        </div>
      </div>
    );
  }

  // right-column layout
  return (
    <div
      className="pointer-events-auto absolute inset-0 flex items-center justify-end px-6 md:px-12"
      style={style}
    >
      <div className="ml-auto max-w-[40ch] rounded-2xl border border-line/14 bg-bg/38 px-8 py-9 shadow-[0_2px_36px_-14px_rgba(0,0,0,0.22)] backdrop-blur-2xl md:px-10 md:py-10">
        <SectionHeader sectionNumber={scene.sectionNumber} heading={scene.heading} />
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className="mt-5 text-body leading-[1.78] tracking-[0.005em] text-fg/90 [text-wrap:pretty]"
          >
            <RenderInline value={p} />
          </p>
        ))}
        {scene.kvList && scene.kvList.length > 0 ? (
          <ul className="mt-5 space-y-3 border-l border-line/40 pl-5">
            {scene.kvList.map((item, j) => (
              <KvRow key={j} item={item} stagger={j} enterProgress={enterProgress} />
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Scatter positions for params-grid chips. Diagonal spread across the
 * viewport edges — no chip sits over the central focal area, and the
 * vertical distribution avoids the "all-clustered-up-top" feel. 4 chips
 * thread a diagonal from upper-left → lower-right. Up to 6 slots; chip
 * i uses slot (i % 6).
 */
const PARAM_GRID_POSITIONS: Array<{
  top: string;
  left?: string;
  right?: string;
}> = [
  { top: "11%", left: "5%" },
  { top: "30%", right: "6%" },
  { top: "52%", left: "8%" },
  { top: "69%", right: "8%" },
  { top: "20%", left: "44%" },
  { top: "64%", left: "44%" },
];

/**
 * AttentionScenePanel — one half of the attention-mechanism diagram.
 * Two agent dots 5m apart, each carrying either a phone or eye glyph,
 * with the outcome (P(see), tie formation) labeled. Warm vs cold
 * outcome tints communicate "yes / no" without text-loading.
 */
function AttentionScenePanel({
  label,
  result,
  dotColor,
  dotIcon,
  outcomePrimary,
  outcomeSecondary,
  outcomeMood,
  stagger,
  enterProgress,
}: {
  label: string;
  result: string;
  dotColor: string;
  dotIcon: "phone" | "eye";
  outcomePrimary: string;
  outcomeSecondary: string;
  outcomeMood: "warm" | "cold";
  stagger: number;
  enterProgress: number;
}) {
  const stride = 0.25;
  const start = stagger * 0.18;
  const localT = Math.max(0, Math.min(1, (enterProgress - start) / stride));
  const opacity = localT;
  const ty = (1 - localT) * 16;
  const tieOpacity = outcomeMood === "warm" ? localT * 0.85 : 0;
  return (
    <div
      className="rounded-2xl border border-line/30 bg-bg/55 px-6 py-7 shadow-[0_4px_22px_rgba(0,0,0,0.32)] backdrop-blur-sm"
      style={{ opacity, transform: `translateY(${ty}px)` }}
    >
      <div className="flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.22em]">
        <span className="text-fg/85">{label}</span>
        <span className="text-fg/45">{result}</span>
      </div>

      {/* Scene SVG — two dots 5m apart, optional tie line for warm Scene B. */}
      <div className="mt-5 flex justify-center">
        <svg width="320" height="120" viewBox="0 0 320 120" aria-hidden>
          {/* Distance ruler */}
          <line
            x1="48"
            y1="92"
            x2="272"
            y2="92"
            stroke="rgba(200,180,150,0.35)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
          <text
            x="160"
            y="108"
            textAnchor="middle"
            fontFamily="ui-monospace, monospace"
            fontSize="10"
            letterSpacing="2"
            fill="rgba(200,180,150,0.6)"
          >
            5 m
          </text>
          {/* Tie line — only Scene B (warm). */}
          <line
            x1="48"
            y1="50"
            x2="272"
            y2="50"
            stroke="#f4c674"
            strokeWidth="1.5"
            opacity={tieOpacity}
          />
          {/* Agent left */}
          <AgentGlyph cx={48} cy={50} color={dotColor} icon={dotIcon} />
          {/* Agent right */}
          <AgentGlyph cx={272} cy={50} color={dotColor} icon={dotIcon} />
        </svg>
      </div>

      <div className="mt-4 space-y-1 text-center">
        <p
          className={`font-sans font-medium text-[18px] leading-[1.15] tracking-tight ${
            outcomeMood === "warm" ? "text-[#fde6a8]" : "text-fg/70"
          }`}
        >
          {outcomePrimary}
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg/55">
          {outcomeSecondary}
        </p>
      </div>
    </div>
  );
}

function AgentGlyph({
  cx,
  cy,
  color,
  icon,
}: {
  cx: number;
  cy: number;
  color: string;
  icon: "phone" | "eye";
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="9" fill={color} opacity="0.9" />
      {/* Glyph above the dot */}
      {icon === "phone" ? (
        <g transform={`translate(${cx - 5} ${cy - 28})`}>
          <rect
            x="0"
            y="0"
            width="10"
            height="16"
            rx="2"
            stroke={color}
            strokeWidth="1.4"
            fill="none"
            opacity="0.85"
          />
          <line
            x1="3"
            y1="13"
            x2="7"
            y2="13"
            stroke={color}
            strokeWidth="1.4"
            opacity="0.85"
          />
        </g>
      ) : (
        <g transform={`translate(${cx - 8} ${cy - 28})`}>
          {/* eye */}
          <path
            d="M0 8 Q8 0 16 8 Q8 16 0 8 Z"
            stroke={color}
            strokeWidth="1.4"
            fill="none"
            opacity="0.85"
          />
          <circle cx="8" cy="8" r="2.4" fill={color} opacity="0.85" />
        </g>
      )}
    </g>
  );
}

/**
 * ProcessStepFragment — one step in process-flow layout.
 * Renders index + step name (value) + label (key) + supporting note,
 * then a horizontal arrow connecting to the next step.
 */
function ProcessStepFragment({
  item,
  index,
  isLast,
  stagger,
  enterProgress,
}: {
  item: CaseStudyKvItem;
  index: number;
  isLast: boolean;
  stagger: number;
  enterProgress: number;
}) {
  const stride = 0.24;
  const start = stagger * 0.12;
  const localT = Math.max(0, Math.min(1, (enterProgress - start) / stride));
  const opacity = localT;
  const tx = (1 - localT) * 16;
  return (
    <>
      <div
        className="flex-1"
        style={{ opacity, transform: `translateX(${-tx}px)` }}
      >
        <div className="rounded-2xl border border-line/30 bg-bg/55 px-5 py-5 shadow-[0_4px_22px_rgba(0,0,0,0.32)] backdrop-blur-sm md:px-6 md:py-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-fg/45 tabular-nums">
            {String(index).padStart(2, "0")}
          </p>
          <h3 className="mt-2 font-sans font-medium leading-[1.1] tracking-[-0.015em] text-fg [font-size:clamp(22px,2vw,28px)]">
            <RenderInline value={item.key} />
          </h3>
          <p className="mt-1 font-sans text-[15px] leading-[1.4] text-fg/85">
            <RenderInline value={item.value} />
          </p>
          {item.note ? (
            <p className="mt-3 font-sans text-[12.5px] leading-[1.5] text-fg/60">
              <RenderInline value={item.note} />
            </p>
          ) : null}
        </div>
      </div>
      {!isLast ? (
        <div
          className="hidden shrink-0 items-center md:flex"
          style={{ opacity }}
        >
          <ProcessArrow />
        </div>
      ) : null}
    </>
  );
}

function ProcessArrow() {
  return (
    <svg
      width="40"
      height="12"
      viewBox="0 0 40 12"
      fill="none"
      aria-hidden
      className="text-fg/45"
    >
      <path
        d="M0 6 L34 6 M28 1 L34 6 L28 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * SubtitleStat — compact lower-third stat for cinema-subtitle layout.
 * Smaller than HeroStat so it fits in the narrative band without
 * stealing visual weight from the sandbox.
 */
function SubtitleStat({
  item,
  stagger,
  enterProgress,
}: {
  item: CaseStudyKvItem;
  stagger: number;
  enterProgress: number;
}) {
  const [hover, setHover] = useState(false);
  const stride = 0.22;
  const start = stagger * 0.08;
  const localT = Math.max(0, Math.min(1, (enterProgress - start) / stride));
  const opacity = localT;
  const ty = (1 - localT) * 10;
  const hasNote = Boolean(item.note);
  return (
    <div
      className="group relative flex cursor-default flex-col"
      style={{ opacity, transform: `translateY(${ty}px)` }}
      onMouseEnter={() => hasNote && setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className={clsx(
          "font-sans font-medium leading-[1.1] tracking-[-0.015em] transition-colors duration-200 [font-size:clamp(17px,1.5vw,21px)] [text-shadow:0_1px_8px_oklch(var(--bg)/0.55)]",
          hover ? "text-fg" : "text-fg/92",
        )}
      >
        <RenderInline value={item.value} />
      </div>
      <div
        className={clsx(
          "mt-0.5 font-sans leading-[1.35] transition-colors duration-200 [font-size:11.5px] [text-shadow:0_1px_6px_oklch(var(--bg)/0.45)]",
          hover ? "text-fg/72" : "text-fg/45",
        )}
      >
        <RenderInline value={item.key} />
      </div>
      {hasNote ? (
        <div
          className={clsx(
            "absolute left-0 top-full z-10 mt-2 max-w-[200px] rounded-md border border-line/22 bg-bg/85 px-3 py-2 font-sans leading-[1.4] text-fg/82 shadow-[0_4px_18px_oklch(var(--bg)/0.55)] backdrop-blur-sm transition-all duration-150 [font-size:11.5px]",
            hover
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-[-4px] opacity-0",
          )}
          aria-hidden={!hover}
        >
          <RenderInline value={item.note!} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * HeroSideStat — left-aligned variant of HeroStat for the hero layout's
 * 2-column body. Sits in the right sidebar; renders as: hairline rule on
 * top + big number + small caption. Note appears below permanently (not
 * hover-revealed) since side panel has more vertical room.
 */
function HeroSideStat({
  item,
  stagger,
  enterProgress,
}: {
  item: CaseStudyKvItem;
  stagger: number;
  enterProgress: number;
}) {
  const stride = 0.20;
  const start = stagger * 0.08;
  const localT = Math.max(0, Math.min(1, (enterProgress - start) / stride));
  const opacity = localT;
  const ty = (1 - localT) * 10;
  return (
    <div
      className="group flex w-full flex-col items-start gap-1.5"
      style={{ opacity, transform: `translateY(${ty}px)` }}
    >
      <span className="h-px w-6 bg-fg/30" aria-hidden />
      <div className="mt-1 font-sans font-semibold leading-[1.0] tracking-[-0.035em] text-fg [font-size:clamp(30px,3.0vw,42px)] [text-shadow:0_1px_18px_oklch(var(--bg)/0.65)] [text-wrap:balance]">
        <RenderInline value={item.value} />
      </div>
      <div className="mt-1 font-sans text-[12px] leading-[1.4] tracking-[0.005em] text-fg/65 [text-shadow:0_1px_8px_oklch(var(--bg)/0.55)] [text-wrap:pretty]">
        <RenderInline value={item.key} />
      </div>
      {item.note ? (
        <div className="mt-1 max-w-[260px] font-sans text-[11.5px] leading-[1.5] text-fg/52 [text-shadow:0_1px_8px_oklch(var(--bg)/0.55)] [text-wrap:pretty]">
          <RenderInline value={item.note} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * HeroStat — Apple-style stat block: a large sans-serif number above a
 * compact caption, with an optional hover-revealed supporting note. Used
 * by the hero layout to render kvList items as a centred row of stats.
 */
function HeroStat({
  item,
  stagger,
  enterProgress,
}: {
  item: CaseStudyKvItem;
  stagger: number;
  enterProgress: number;
}) {
  const [hover, setHover] = useState(false);
  const stride = 0.22;
  const start = stagger * 0.10;
  const localT = Math.max(0, Math.min(1, (enterProgress - start) / stride));
  const opacity = localT;
  const ty = (1 - localT) * 14;
  const hasNote = Boolean(item.note);
  return (
    <div
      className="group flex flex-col items-center gap-2.5 cursor-default"
      style={{ opacity, transform: `translateY(${ty}px)` }}
      onMouseEnter={() => hasNote && setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Hairline accent rule above the number — gives the stat its own
          register, separates from the key. Like NYT data display. */}
      <span className="h-px w-6 bg-fg/35" aria-hidden />
      <div
        className={clsx(
          "font-sans font-semibold leading-[1.0] tracking-[-0.035em] transition-colors duration-200 [font-size:clamp(34px,4.2vw,52px)] [text-shadow:0_1px_18px_oklch(var(--bg)/0.65),_0_0_28px_oklch(var(--bg)/0.4)] [text-wrap:balance]",
          hover ? "text-fg" : "text-fg",
        )}
      >
        <RenderInline value={item.value} />
      </div>
      <div
        className={clsx(
          "mt-1 font-sans text-[12.5px] leading-[1.4] tracking-[0.005em] transition-colors duration-200 [text-shadow:0_1px_8px_oklch(var(--bg)/0.55)] [text-wrap:pretty]",
          hover ? "text-fg/90" : "text-fg/62",
        )}
      >
        <RenderInline value={item.key} />
      </div>
      {hasNote ? (
        <div
          className={clsx(
            "max-w-[180px] font-sans text-[12px] leading-[1.45] text-fg/65 [text-shadow:0_1px_8px_oklch(var(--bg)/0.55)] [text-wrap:pretty] transition-all duration-200",
            hover ? "translate-y-0 opacity-100" : "translate-y-[-4px] opacity-0",
          )}
          aria-hidden={!hover}
        >
          <RenderInline value={item.note!} />
        </div>
      ) : null}
    </div>
  );
}

function ParamChip({
  item,
  stagger,
  enterProgress,
  position,
}: {
  item: CaseStudyKvItem;
  stagger: number;
  enterProgress: number;
  position: { top: string; left?: string; right?: string };
}) {
  const [hover, setHover] = useState(false);
  // Slightly slower stagger than KvRow — chips are bigger so they breathe in
  // more deliberately.
  const stride = 0.20;
  const start = stagger * 0.10;
  const localT = Math.max(0, Math.min(1, (enterProgress - start) / stride));
  const opacity = localT;
  const ty = (1 - localT) * 14;
  const hasNote = Boolean(item.note);
  return (
    <div
      className="group pointer-events-auto absolute max-w-[240px] cursor-default"
      style={{
        top: position.top,
        left: position.left,
        right: position.right,
        opacity,
        transform: `translateY(${ty}px)`,
      }}
      onMouseEnter={() => hasNote && setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Subtle hover affordance — a small dot in front of the value
          when hoverable; brightens & expands on hover. */}
      {hasNote ? (
        <span
          aria-hidden
          className={clsx(
            "absolute -left-2.5 top-3 h-1 w-1 rounded-full transition-all duration-200",
            hover ? "scale-[2] bg-glow" : "scale-100 bg-fg/35",
          )}
        />
      ) : null}
      <div
        className={clsx(
          "whitespace-nowrap font-mono leading-[1.05] tracking-tight transition-colors duration-200 [font-size:clamp(20px,2.2vw,30px)] [text-shadow:0_1px_12px_oklch(var(--bg)/0.6)]",
          hover ? "text-fg" : "text-fg/95",
        )}
      >
        <RenderInline value={item.value} />
      </div>
      <div
        className={clsx(
          "mt-1.5 font-mono text-caption uppercase tracking-[0.22em] transition-colors duration-200 [text-shadow:0_1px_8px_oklch(var(--bg)/0.55)]",
          hover ? "text-fg/85" : "text-fg/60",
        )}
      >
        <RenderInline value={item.key} />
      </div>
      {hasNote ? (
        <div
          className={clsx(
            "mt-2 max-w-[220px] font-mono text-[11px] leading-[1.45] text-fg/72 [text-shadow:0_1px_8px_oklch(var(--bg)/0.55)] transition-all duration-200",
            hover
              ? "translate-y-0 opacity-100"
              : "translate-y-[-4px] opacity-0",
          )}
          aria-hidden={!hover}
        >
          <RenderInline value={item.note!} />
        </div>
      ) : null}
    </div>
  );
}

function SectionHeader({
  sectionNumber,
  heading,
}: {
  sectionNumber?: string;
  heading: I18nString;
}) {
  return (
    <div>
      {sectionNumber ? (
        <div className="flex items-center gap-3">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.30em] text-muted/85 tabular-nums">
            {sectionNumber}
          </p>
          <span className="h-px flex-1 bg-fg/15" aria-hidden />
        </div>
      ) : null}
      <h2 className="mt-3 font-sans font-medium leading-[1.22] tracking-[-0.018em] text-fg/96 [font-size:clamp(21px,2.1vw,26px)] [text-wrap:balance]">
        <RenderInline value={heading} />
      </h2>
    </div>
  );
}

function KvRow({
  item,
  stagger,
  enterProgress,
}: {
  item: CaseStudyKvItem;
  stagger: number;
  enterProgress: number;
}) {
  // Stagger fade-in: each KV item has its own enter window offset by 0.1
  // of enterProgress per index. Scales with scene's overall enter rate.
  const stride = 0.18; // window per item
  const start = stagger * 0.12;
  const localT = Math.max(0, Math.min(1, (enterProgress - start) / stride));
  const opacity = localT;
  const ty = (1 - localT) * 8;
  return (
    <li style={{ opacity, transform: `translateY(${ty}px)` }} className="grid gap-1 md:grid-cols-[max-content_1fr] md:gap-x-5">
      <span className="font-mono text-caption uppercase tracking-[0.18em] text-fg/72">
        <RenderInline value={item.key} />
      </span>
      <span className="text-body leading-[1.55] text-fg/92">
        <RenderInline value={item.value} />
      </span>
    </li>
  );
}

function RenderInline({ value }: { value: I18nString }) {
  const { locale } = useLocale();
  const text = pickLang(value, locale);
  // Inline **bold** markdown-lite
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-medium text-fg [font-size:1.06em]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

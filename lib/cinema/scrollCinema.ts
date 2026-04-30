/**
 * scrollCinema — single global timeline that turns scroll progress into the
 * camera score's t. This is the **one and only** place where DOM scroll
 * becomes cinema time. No per-section progress hooks.
 *
 * Skeleton — full spring + stable-anchor logic comes later.
 */

import type { Act, Beat, CameraScore, Shot } from "./types";
import type { CaseStudyAct, CaseStudyBeat, CaseStudyScene } from "@/lib/content/case-study-schema";
import { clamp, smoothstep } from "./easing";
import { computeSvh, sceneAtBeatLocalT } from "./scene-types";

/** Current beat + act at t, plus normalized 0..1 progress within that beat. */
export function beatAt(
  score: CameraScore,
  t: number,
): { act: Act; beat: Beat; localT: number } | null {
  const x = clamp(t);
  for (const act of score.acts) {
    for (const beat of act.beats) {
      const [start, end] = beat.range;
      if (x >= start && x <= end) {
        const span = Math.max(0.0001, end - start);
        return { act, beat, localT: (x - start) / span };
      }
    }
  }
  return null;
}

/** Resolve the Shot referenced by a beat. Returns null if score is malformed. */
export function shotForBeat(score: CameraScore, beat: Beat): Shot | null {
  return score.shots[beat.shotRef] ?? null;
}

/**
 * Convert raw scroll progress into score t.
 *
 * For now this is identity-mapped 1:1, but the contract is that callers go
 * through this function rather than reading scroll progress directly — so we
 * can later insert non-linear ease + spring buffering + stable-anchor snap
 * without rewriting consumers.
 *
 * Spring smoothing happens **outside** this function (in CameraRig), because
 * the spring needs a per-frame state machine; this function stays pure.
 */
export function scrollToT(scrollProgress: number): number {
  return clamp(scrollProgress);
}

/**
 * Smoothstep within the current beat's range — useful for HUD fade-in/out so
 * cards land on stable anchors rather than mid-beat positions.
 */
export function easedBeatProgress(localT: number): number {
  return smoothstep(localT);
}

/**
 * Stable-anchor opacity: HUD elements should be fully opaque only in the
 * middle of a beat, fading in/out at the edges so transitions read as
 * cinematic instead of "the panel snapped on/off".
 */
export function hudStableOpacity(localT: number): number {
  if (localT < 0.18) return smoothstep(localT / 0.18);
  if (localT > 0.82) return smoothstep((1 - localT) / 0.18);
  return 1;
}

// ---- Scene-aware lookup -----------------------------------------------

/**
 * Find the active scene at global progress t. Walks frontmatter beats in
 * order; for each beat, if it has `scenes`, sub-divides its scroll range
 * proportionally by scene duration. Falls back to legacy beat-level
 * lookup for beats that haven't migrated to scenes yet.
 */
export function sceneAt(
  score: CameraScore,
  acts: CaseStudyAct[],
  t: number,
): {
  act: Act;
  beat: Beat;
  fmBeat: CaseStudyBeat | null;
  scene: CaseStudyScene | null;
  /** 0..1 progress within the active scene (or beat if no scenes). */
  sceneLocalT: number;
  /** 0..1 progress within the active beat. */
  beatLocalT: number;
  /** Index within fmBeat.scenes (or -1). */
  sceneIndex: number;
} | null {
  const current = beatAt(score, t);
  if (!current) return null;

  // Find frontmatter beat by id
  let fmBeat: CaseStudyBeat | null = null;
  for (const a of acts) {
    const b = a.beats.find((x) => x.id === current.beat.id);
    if (b) { fmBeat = b; break; }
  }

  const beatLocalT = current.localT;
  const scenes = fmBeat?.scenes;
  if (!fmBeat || !scenes || scenes.length === 0) {
    return {
      ...current,
      fmBeat,
      scene: null,
      sceneLocalT: beatLocalT,
      sceneIndex: -1,
      beatLocalT,
    };
  }

  const found = sceneAtBeatLocalT(scenes, beatLocalT);
  if (!found) {
    return { ...current, fmBeat, scene: null, sceneLocalT: 0, sceneIndex: -1, beatLocalT };
  }
  return {
    ...current,
    fmBeat,
    scene: found.scene,
    sceneLocalT: found.sceneLocalT,
    sceneIndex: found.sceneIndex,
    beatLocalT,
  };
}

/**
 * Total document scroll budget (svh) — sum of every scene's duration svh
 * across every beat that has scenes; for beats without scenes, default to
 * 100svh per beat (legacy compat).
 */
export function totalScrollSvh(acts: CaseStudyAct[]): number {
  let sum = 0;
  for (const a of acts) {
    for (const b of a.beats) {
      if (b.scenes && b.scenes.length > 0) {
        for (const s of b.scenes) sum += computeSvh(s);
      } else {
        sum += 100;
      }
    }
  }
  return sum;
}

// ---- Piecewise scroll → score-t mapping (cinema-scroll-pacing fix) -------

export type BeatBoundary = {
  beatId: string;
  /** Fraction of total page height [0..1] where this beat starts. */
  domStart: number;
  domEnd: number;
  /** Fraction of cinema-score t [0..1] this beat owns. */
  scoreStart: number;
  scoreEnd: number;
};

/**
 * Build a per-beat boundary table that the scroll listener uses to map
 * raw scrollY/docHeight to score-t.
 *
 * **Why this exists**: page height is content-driven (sum of CPS-derived
 * scene svh), but cinema score's beat ranges are *narrative-driven* (Beat
 * 1.1 owns 10% of camera time, even if its text section happens to occupy
 * 80% of vertical scroll). Without piecewise mapping, scrolling through
 * Beat 1.1's tall text would push camera into Act 2 territory long before
 * the user is "narratively" past Beat 1.1.
 *
 * The mapping below preserves: each beat's DOM scroll range maps 1:1 to
 * its score range, so camera stays within the right shot regardless of
 * how much vertical real estate the beat's text consumes.
 */
export function buildBeatLayout(
  score: CameraScore,
  acts: CaseStudyAct[],
): BeatBoundary[] {
  const total = totalScrollSvh(acts);
  if (total <= 0) return [];

  const out: BeatBoundary[] = [];
  let cumSvh = 0;

  for (const sa of score.acts) {
    const fma = acts.find((a) => a.id === sa.id);
    for (const sb of sa.beats) {
      const fmb = fma?.beats.find((b) => b.id === sb.id) ?? null;
      const beatSvh =
        fmb?.scenes && fmb.scenes.length > 0
          ? fmb.scenes.reduce((s, sc) => s + computeSvh(sc), 0)
          : 100;
      out.push({
        beatId: sb.id,
        domStart: cumSvh / total,
        domEnd: (cumSvh + beatSvh) / total,
        scoreStart: sb.range[0],
        scoreEnd: sb.range[1],
      });
      cumSvh += beatSvh;
    }
  }
  return out;
}

/**
 * Map raw scroll fraction [0..1] of the document to score-t [0..1] using
 * the beat layout. Within each beat, mapping is linear from the beat's
 * DOM range to its score range.
 */
export function mapScrollToScoreT(
  scrollFrac: number,
  layout: BeatBoundary[],
): number {
  if (layout.length === 0) return clamp(scrollFrac);
  const x = clamp(scrollFrac);
  for (const b of layout) {
    if (x >= b.domStart && x <= b.domEnd) {
      const span = Math.max(1e-6, b.domEnd - b.domStart);
      const local = (x - b.domStart) / span;
      return b.scoreStart + local * (b.scoreEnd - b.scoreStart);
    }
  }
  // Past the last beat — return final scoreEnd
  return layout[layout.length - 1].scoreEnd;
}

/**
 * Compute enter/exit progress within a scene given its sceneLocalT.
 *
 * Per cinema-scroll-pacing D7 + cinema-content-language-foundations D5:
 *   still / tracking — 10% / 80% / 10% (enter / hold / exit). Reading-first;
 *                      hold段 opacity 严格 = 1. tracking 同样 reading-first
 *                      只是 camera 在动，所以 fade band 与 still 共用。
 *   motion / bridge  — 30% / 40% / 30%. Camera节奏吻合的更激进 fade.
 */
export function sceneTransitionProgress(
  sceneLocalT: number,
  rhythm: "motion" | "still" | "tracking" | "bridge" = "still",
): { enterProgress: number; exitProgress: number } {
  const t = clamp(sceneLocalT);
  const readingFirst = rhythm === "still" || rhythm === "tracking";
  const enterFrac = readingFirst ? 0.10 : 0.30;
  const exitStart = readingFirst ? 0.90 : 0.70;
  const exitFrac = 1 - exitStart;
  return {
    enterProgress: t < enterFrac ? smoothstep(t / enterFrac) : 1,
    exitProgress: t > exitStart ? smoothstep((1 - t) / exitFrac) : 1,
  };
}

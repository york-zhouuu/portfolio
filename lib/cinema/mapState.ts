/**
 * Map state resolver — turns scene-level `mapState` declarations into a
 * per-frame resolved snapshot for the renderer.
 *
 * Per cinema-content-language-foundations D2:
 *   - `dim` lerps continuously across scene boundaries
 *   - `mode` cross-fades over a 200ms window when adjacent scenes differ
 *   - `overlay` fades in/out per scene's enter/exit windows (10/80/10)
 *
 * The resolver is engine-agnostic: it reads scroll-mapped t and the layout
 * built by `buildBeatLayout`, and emits a plain `ResolvedMapState`.
 */

import type { CaseStudyAct, CaseStudyScene } from "@/lib/content/case-study-schema";
import type { CameraScore } from "./types";
import {
  MAP_STATE_DEFAULT,
  type MapMode,
  type MapOverlayName,
  type MapStatePickup,
  type MapStateSpotlight,
} from "./scene-types";
import {
  buildBeatLayout,
  mapScrollToScoreT,
  sceneAt,
  type BeatBoundary,
} from "./scrollCinema";
import { clamp, lerp, smoothstep } from "./easing";

/**
 * Resolved spotlight payload — narrative-only highlight on a specific
 * sampled agent. Same smoothed intensity treatment as pickups.
 */
export type ResolvedSpotlight = MapStateSpotlight & {
  intensity: number;
};

/**
 * Resolved pickup payload — visual highlight + click hitbox bound to a
 * resident story slug. Smoothed intensity 0..1 from the scene fade band.
 */
export type ResolvedPickup = MapStatePickup & {
  intensity: number;
};

export type ResolvedMapState = {
  mode: MapMode;
  /** Previous scene's mode if mid cross-fade; null otherwise. */
  modePrev: MapMode | null;
  /** 0..1 — fade progress from modePrev → mode (1 = fully arrived). */
  modeFade: number;
  dim: number;
  overlay: MapOverlayName;
  /** 0..1 — overlay opacity (1 = fully on). Falls back when overlay is "none". */
  overlayProgress: number;
  /** 0..1 — scene-local scroll position (clamped). Unlike overlayProgress
   *  this isn't shaped by a fade band; overlays can use it as a clean
   *  scroll timeline to drive scripted events (e.g. push waves). */
  sceneLocalT: number;
  highlight: string[];
  /** Active spotlight target(s) — narrative highlight, no click. */
  spotlights: ResolvedSpotlight[];
  /** Active pickup target(s) — highlight + click → reader. */
  pickups: ResolvedPickup[];
};

/** Window inside which adjacent-scene `mode` switches do their cross-fade.
 *  Widened from 5% → 12% (2026-04-27) so material swap feels gradual rather
 *  than abrupt; combined with precomputed edge geometries, the transition
 *  is now smooth instead of hitching. */
const MODE_CROSSFADE_WINDOW = 0.12;

type EffectiveMapState = {
  mode: MapMode;
  dim: number;
  overlay: MapOverlayName;
  highlight: string[];
  spotlights: MapStateSpotlight[];
  pickup: MapStatePickup | null;
};

function effective(scene: CaseStudyScene | null): EffectiveMapState {
  if (!scene || !scene.mapState) {
    return { ...MAP_STATE_DEFAULT, spotlights: [], pickup: null };
  }
  return {
    mode: scene.mapState.mode ?? MAP_STATE_DEFAULT.mode,
    dim: scene.mapState.dim ?? MAP_STATE_DEFAULT.dim,
    overlay: scene.mapState.overlay ?? MAP_STATE_DEFAULT.overlay,
    highlight: scene.mapState.highlight ?? MAP_STATE_DEFAULT.highlight,
    spotlights: scene.mapState.spotlights ?? [],
    pickup: scene.mapState.pickup ?? null,
  };
}

/**
 * Compute the pickup intensity at the current scene's localT using the same
 * 10/80/10 fade band as overlay opacity. localT in [0..1].
 */
function pickupIntensityAt(localT: number): number {
  if (localT < 0.1) return smoothstep(localT / 0.1);
  if (localT > 0.9) return smoothstep((1 - localT) / 0.1);
  return 1;
}

function neighborSceneInBeat(
  fmBeat: { scenes?: CaseStudyScene[] } | null,
  sceneIndex: number,
  delta: -1 | 1,
): CaseStudyScene | null {
  const scenes = fmBeat?.scenes;
  if (!scenes || sceneIndex < 0) return null;
  const next = sceneIndex + delta;
  if (next < 0 || next >= scenes.length) return null;
  return scenes[next];
}

/**
 * Compute the resolved mapState at a given score-t.
 *
 * Inputs:
 *   - score / acts: same shape used by sceneAt
 *   - t: score-time fraction (already piecewise-mapped from raw scrollY)
 *
 * Returns a snapshot suitable for direct rendering.
 */
export function resolveMapStateAt(
  score: CameraScore,
  acts: CaseStudyAct[],
  t: number,
): ResolvedMapState {
  const current = sceneAt(score, acts, t);
  if (!current || !current.scene) {
    return {
      ...MAP_STATE_DEFAULT,
      modePrev: null,
      modeFade: 1,
      overlayProgress: 0,
      sceneLocalT: 0,
      spotlights: [],
      pickups: [],
    };
  }

  const localT = clamp(current.sceneLocalT, 0, 1);
  const cur = effective(current.scene);
  const prevScene = neighborSceneInBeat(current.fmBeat, current.sceneIndex, -1);
  const nextScene = neighborSceneInBeat(current.fmBeat, current.sceneIndex, 1);
  const prev = effective(prevScene);
  const next = effective(nextScene);

  // dim — continuous lerp using scene boundaries as anchors:
  //   localT 0     → midpoint between prev.dim and cur.dim (i.e., prev's exit)
  //   localT 0.5   → cur.dim (full)
  //   localT 1     → midpoint between cur.dim and next.dim (i.e., next's enter)
  let dim: number;
  if (localT < 0.5) {
    const u = localT * 2; // 0..1 across first half
    dim = lerp((prev.dim + cur.dim) / 2, cur.dim, smoothstep(u));
  } else {
    const u = (localT - 0.5) * 2;
    dim = lerp(cur.dim, (cur.dim + next.dim) / 2, smoothstep(u));
  }

  // mode — cross-fade only inside the window around scene boundaries.
  let mode: MapMode = cur.mode;
  let modePrev: MapMode | null = null;
  let modeFade = 1;
  if (localT < MODE_CROSSFADE_WINDOW && prev.mode !== cur.mode) {
    // Enter window — fading FROM prev mode TO cur mode
    mode = cur.mode;
    modePrev = prev.mode;
    modeFade = smoothstep(localT / MODE_CROSSFADE_WINDOW);
  } else if (localT > 1 - MODE_CROSSFADE_WINDOW && next.mode !== cur.mode) {
    // Exit window — fading FROM cur mode TO next mode
    mode = next.mode;
    modePrev = cur.mode;
    modeFade = smoothstep((localT - (1 - MODE_CROSSFADE_WINDOW)) / MODE_CROSSFADE_WINDOW);
  }

  // overlay — only one overlay rendered at a time. Crossing a boundary where
  // overlay differs uses 10/80/10 (still-style) fade as the progress curve.
  const overlay: MapOverlayName = cur.overlay;
  let overlayProgress = 1;
  if (cur.overlay === MAP_STATE_DEFAULT.overlay) {
    overlayProgress = 0;
  } else if (localT < 0.10) {
    overlayProgress = smoothstep(localT / 0.10);
  } else if (localT > 0.90) {
    overlayProgress = smoothstep((1 - localT) / 0.10);
  }

  // Spotlight + Pickup — current + neighbor scenes can both contribute
  // during the fade band (cross-fade between two different highlighted
  // agents at scene boundaries).
  const curIntensity = pickupIntensityAt(localT);

  const spotlights: ResolvedSpotlight[] = [];
  if (curIntensity > 0) {
    for (const sp of cur.spotlights) {
      spotlights.push({ ...sp, intensity: curIntensity });
    }
  }
  if (localT < 0.1) {
    const intensity = 1 - smoothstep(localT / 0.1);
    if (intensity > 0) {
      for (const sp of prev.spotlights) spotlights.push({ ...sp, intensity });
    }
  } else if (localT > 0.9) {
    const intensity = 1 - smoothstep((1 - localT) / 0.1);
    if (intensity > 0) {
      for (const sp of next.spotlights) spotlights.push({ ...sp, intensity });
    }
  }

  const pickups: ResolvedPickup[] = [];
  if (cur.pickup && curIntensity > 0) {
    pickups.push({ ...cur.pickup, intensity: curIntensity });
  }
  if (localT < 0.1 && prev.pickup) {
    const intensity = 1 - smoothstep(localT / 0.1);
    if (intensity > 0) pickups.push({ ...prev.pickup, intensity });
  } else if (localT > 0.9 && next.pickup) {
    const intensity = 1 - smoothstep((1 - localT) / 0.1);
    if (intensity > 0) pickups.push({ ...next.pickup, intensity });
  }

  return {
    mode,
    modePrev,
    modeFade,
    dim,
    overlay,
    overlayProgress,
    sceneLocalT: localT,
    highlight: cur.highlight,
    spotlights,
    pickups,
  };
}

/**
 * Lazily-computed-and-cached beat layout, suitable as a memo key for
 * useResolvedMapState. The hook itself lives in `useResolvedMapState.ts`
 * (client component) — this module is engine-agnostic.
 */
export function getBeatLayout(
  score: CameraScore,
  acts: CaseStudyAct[],
): BeatBoundary[] {
  return buildBeatLayout(score, acts);
}

/** Map raw scrollY/docHeight to mapState at that scroll position (for tests). */
export function resolveMapStateForScroll(
  score: CameraScore,
  acts: CaseStudyAct[],
  rawScrollFrac: number,
  layout?: BeatBoundary[],
): ResolvedMapState {
  const lay = layout ?? buildBeatLayout(score, acts);
  const t = mapScrollToScoreT(rawScrollFrac, lay);
  return resolveMapStateAt(score, acts, t);
}

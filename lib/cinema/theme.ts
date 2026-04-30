/**
 * Cinema theme — design language v1: "Studio Lamp / 研究室灯下".
 *
 * A single warm tungsten key rakes across a matte-foam architectural model
 * in a near-black field with slight warm tint. Sand table is bone/cream,
 * shadow side cooler clay-grey. Field is deep blue-black; fog dilutes
 * everything beyond ~22 world units. Cyan signal layer (Act 2.4) sings
 * against the warm field. Mirror beat (Act 3.2) replaces it with magenta.
 *
 * Per-act mood deltas:
 *   - Act 1 (注意力边界): key dim, key cool, fog deep blue-black — "before
 *     the apparatus". Sand table has barely emerged from the dark.
 *   - Act 2 (产品本体):  key hot, key warm, fog warm umber — "the lamp is
 *     close". Model dominates frame.
 *   - Act 3 (探索的结论): key cool again, fog cool blue-grey — "stepping
 *     back". Mirror beat (Act 3.2) injects magenta cast.
 *
 * Iteration seam: this file is the single swap point for all visual decisions
 * in the cinema. Components are forbidden from baking in colors / sizes /
 * fog / lights outside these tokens.
 */

import type { ActId } from "./types";
import { lerp } from "./easing";

export type ActMood = {
  background: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  keyIntensity: number;
  keyColor: string;
  ambientIntensity: number;
};

export type CinemaTheme = {
  // ---- World materials (static — sand table doesn't change material per act) ----
  /** Sand-table cream / bone — what the warm key catches. */
  sandTableBase: string;
  buildingTop: string;
  /** Cooler shadow side. */
  buildingSide: string;
  /** Table surface (the "ground plane"). */
  ground: string;
  /** Road ribbons — slightly darker than ground, reads as inset street. */
  road: string;
  /** Park / playground / garden — sage on the cream ground. */
  park: string;
  /** Water (rivers / harbour / bays). Muted teal that fits the warm-clay register. */
  water: string;
  /** Outline / line work tint. */
  line: string;

  // ---- Default atmosphere (used as Act 1 baseline; per-act mood overrides override) ----
  background: string;
  fogNear: number;
  fogFar: number;
  fogColor: string;

  // ---- Default light (used by Act 1) ----
  ambientIntensity: number;
  keyIntensity: number;
  keyAzimuth: number; // degrees
  keyElevation: number; // degrees
  keyColor: string;

  // ---- Per-act mood deltas — interpolated by actMoodAtT ----
  actMoods: Record<ActId, ActMood>;

  // ---- Post-processing intent (slots; shaders not yet implemented) ----
  postFx: {
    tiltShiftStrength: number;
    tiltShiftBand: number;
    grainIntensity: number;
    vignetteStrength: number;
  };

  // ---- Accent / signal layer ----
  /** Hyperlocal pulse (Act 2.4). */
  accentSignal: string;
  /** Mirror reversal (Act 3.2). */
  accentMirror: string;

  // ---- Scene framing ----
  worldExtent: number;
  defaultBuildingHeight: number;
  /**
   * Vertical exaggeration MULTIPLIER on the world's horizontal scale.
   * Sand-table convention is 2–3×: tall enough to read silhouettes,
   * not so tall that 1-story houses look like pillars. 1× is physically
   * accurate but renders Lane Cove (mostly 1-2 floors) as nearly flat.
   */
  buildingHeightExaggeration: number;
  /**
   * Walkway ribbon width — used as a meter override when OSM/atlas don't
   * encode it per segment. Atlas roads are filled polygons (no width
   * needed); waterways carry their own width-in-meters per segment.
   */
  walkwayWidthMeters: number;
};

export const sswtCinemaTheme: CinemaTheme = {
  // Sand table — cream/bone in light, cooler clay in shadow
  sandTableBase: "#e8ddc4",
  buildingTop: "#ece1c8",
  buildingSide: "#bcb09a",
  ground: "#d5c8b1",
  // Road tone slightly darker / cooler than ground — reads as inset
  // pavement on the matte clay table without becoming a foreground line.
  road: "#b8a98e",
  // Sage green that reads as a park on the cream ground without
  // breaking the matte-clay register. Slightly desaturated so it
  // doesn't compete with the warm key light.
  park: "#a8b89a",
  // Muted teal — cool enough to read as water against the warm clay
  // register, dark enough to look like real water (Lane Cove wraps
  // around two rivers and Sydney Harbour estuary).
  water: "#5e7a86",
  line: "#8a7d68",

  // Default atmosphere — Act 1 baseline
  background: "#0c0d12",
  fogNear: 6,
  fogFar: 24,
  fogColor: "#0c0d12",

  ambientIntensity: 0.28,
  keyIntensity: 0.85,
  keyAzimuth: 38,
  keyElevation: 48,
  keyColor: "#fff0d6",

  // Per-act atmospheric mood
  actMoods: {
    "attention-boundary": {
      background: "#0a0b10",
      fogColor: "#0a0b10",
      fogNear: 5,
      fogFar: 22,
      keyIntensity: 0.85,
      keyColor: "#fff0d6", // tungsten cool-warm
      ambientIntensity: 0.26,
    },
    instrument: {
      background: "#13110d",
      fogColor: "#1a1612",
      fogNear: 7,
      fogFar: 28,
      keyIntensity: 1.2,
      keyColor: "#ffd9a6", // hotter, warmer — "the lamp is close"
      ambientIntensity: 0.36,
    },
    findings: {
      background: "#0d0e14",
      fogColor: "#0e1018",
      fogNear: 6,
      fogFar: 30,
      keyIntensity: 0.95,
      keyColor: "#f4eadb", // neutral, slight cool — stepping back
      ambientIntensity: 0.3,
    },
  },

  postFx: {
    tiltShiftStrength: 0.0, // off until shader pass lands
    tiltShiftBand: 0.45,
    grainIntensity: 0.06,
    vignetteStrength: 0.18,
  },

  accentSignal: "#7ed4e8", // cyan
  accentMirror: "#d27aa6", // magenta-rose

  worldExtent: 8,
  defaultBuildingHeight: 6,
  // 3× exaggeration of the horizontal scale. Lane Cove is 82% one-floor
  // residential, so at 1× they would be near-flat (3m × 0.0057 ≈ 0.017),
  // hard to see against the table. 3× lifts a 1-floor to 0.05 world
  // units (cube-ish vs the ~0.07 footprint width), and a 14-floor block
  // up to 0.72 — visible mid-rise variation without skyscraper-pillar
  // distortion.
  buildingHeightExaggeration: 3,
  // Pedestrian path width fallback (footways, cycleways) — 3m typical.
  walkwayWidthMeters: 3,
};

/**
 * Resolve theme with optional overrides — keeps the iteration seam clean
 * even if a future caller wants per-page or per-beat theme mutation.
 */
export function resolveTheme(overrides?: Partial<CinemaTheme>): CinemaTheme {
  if (!overrides) return sswtCinemaTheme;
  return {
    ...sswtCinemaTheme,
    ...overrides,
    actMoods: { ...sswtCinemaTheme.actMoods, ...overrides.actMoods },
    postFx: { ...sswtCinemaTheme.postFx, ...overrides.postFx },
  };
}

/**
 * Compute interpolated atmospheric mood for a given (actId, localT) pair.
 * Smoothly crossfades between adjacent acts at their boundaries so the
 * camera doesn't feel like it crosses a hard color line.
 *
 * `actId` is the act t lands in; `localT` is 0..1 within that act.
 */
export function actMoodAtT(
  theme: CinemaTheme,
  actId: ActId,
  localT: number,
): ActMood {
  const order: ActId[] = ["attention-boundary", "instrument", "findings"];
  const idx = order.indexOf(actId);
  const current = theme.actMoods[actId];

  // Crossfade with neighbor at edges of the act.
  const FADE = 0.18; // local-T window for blending into adjacent act
  if (localT < FADE && idx > 0) {
    const prev = theme.actMoods[order[idx - 1]];
    const w = localT / FADE; // 0..1
    return blendMood(prev, current, w);
  }
  if (localT > 1 - FADE && idx < order.length - 1) {
    const next = theme.actMoods[order[idx + 1]];
    const w = (localT - (1 - FADE)) / FADE;
    return blendMood(current, next, w);
  }
  return current;
}

function blendMood(a: ActMood, b: ActMood, t: number): ActMood {
  return {
    background: blendHex(a.background, b.background, t),
    fogColor: blendHex(a.fogColor, b.fogColor, t),
    fogNear: lerp(a.fogNear, b.fogNear, t),
    fogFar: lerp(a.fogFar, b.fogFar, t),
    keyIntensity: lerp(a.keyIntensity, b.keyIntensity, t),
    keyColor: blendHex(a.keyColor, b.keyColor, t),
    ambientIntensity: lerp(a.ambientIntensity, b.ambientIntensity, t),
  };
}

function blendHex(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(lerp(ar, br, t));
  const g = Math.round(lerp(ag, bg, t));
  const c = Math.round(lerp(ab, bb, t));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${c.toString(16).padStart(2, "0")}`;
}

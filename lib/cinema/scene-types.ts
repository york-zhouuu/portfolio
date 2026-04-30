/**
 * Scene-system types — the atomic unit of cinema × content design.
 *
 * Per `cinema-content-integration` propose: a beat is composed of scenes,
 * each scene is the unit answered by 6 design questions
 * (camera / text-form / transition / interaction / duration / junction).
 *
 * Engine-agnostic types — no React, no three.js — so Zod / renderer /
 * camera math all consume the same shapes.
 */

import type { I18nString } from "@/lib/i18n/types";

export type Vec3 = [number, number, number];

export type SceneCamera = {
  /** World position at scene start. */
  from: Vec3;
  /** World position at scene end. `from === to` means camera holds. */
  to: Vec3;
  lookAt: Vec3;
};

export type TransitionKind =
  | "fade"
  | "slide-up"
  | "slide-side"
  | "scale-in"
  | "none";

/** Scroll budget hint. Renderer turns this into svh. */
export type DurationKind = "short" | "mid" | "long";

/**
 * Rhythm kind — the 7th scene-design dimension, introduced by
 * `cinema-scroll-pacing` and extended by `cinema-content-language-foundations`.
 *
 *   motion   — camera travels (from → to). Text minimal or none.
 *   still    — camera locked (from === to) + 3% push-in drift. Reading-first.
 *   tracking — camera moves linearly + text held + reading + scenery scroll.
 *              Cinematic "tracking shot with voiceover" — required for
 *              "moving camera while user reads" semantics.
 *   bridge   — small camera move with brief text; rhythm transition.
 */
export type RhythmKind = "motion" | "still" | "tracking" | "bridge";

/**
 * Emphasis kind — controls dwell time. The ONLY dwell knob exposed to the
 * author (no raw svh / seconds). Maps to CPS (Characters Per Second) tiers
 * from subtitle industry research, biased toward the conservative end
 * because our 3D sand-table + technical content is cognitively dense.
 */
export type EmphasisKind = "brief" | "standard" | "dwell" | "linger";

// ---- CPS-based dwell calculation (cinema-scroll-pacing D6) -------------

/** Characters per second by emphasis tier. Chinese chars; English ≈ × 1.5. */
export const CPS_ZH: Record<EmphasisKind, number> = {
  brief: 12,
  standard: 9,
  dwell: 7,
  linger: 5,
};

/**
 * Body chars contribute 1/20 of their length to dwell budget — readers scan
 * body paragraphs ~20× faster than they pause on a heading/quote/title.
 * Per cinema-cps-body-discount: lets authors write 600-1500 char body content
 * without forcing the camera to crawl proportionally.
 */
export const BODY_DISCOUNT_FACTOR = 0.05;

/** Multiplier applied to motion / bridge geometric base svh. */
export const EMPHASIS_FACTOR: Record<EmphasisKind, number> = {
  brief: 0.5,
  standard: 1.0,
  dwell: 1.6,
  linger: 2.4,
};

export const REACTION_S = 0.5;
export const SCROLL_PX_PER_S_BASELINE = 1000;
export const VIEWPORT_PX_BASELINE = 1000;
export const MIN_DWELL_S = 1.5;
export const MAX_DWELL_S = 6.5;

// ---- Map state (cinema-content-language-foundations D1) -----------------

/** Material mode for the sand table. `string` to keep the registry open. */
export type MapMode = string;

/** Overlay name registered via OVERLAY_REGISTRY; unknown names = no-op. */
export type MapOverlayName = string;

/**
 * Scene-level map state. All fields optional — unset = legacy default
 * (matte material, full brightness, no overlay).
 *
 *   mode      — material registry key
 *   dim       — 0..1 brightness multiplier (1 = full)
 *   overlay   — overlay registry key
 *   highlight — building / road ids (future use)
 */
export interface MapState {
  mode?: MapMode;
  dim?: number;
  overlay?: MapOverlayName;
  highlight?: string[];
}

/** Default mapState applied when scene doesn't set one. */
export const MAP_STATE_DEFAULT: Required<MapState> = {
  mode: "matte",
  dim: 1,
  overlay: "none",
  highlight: [],
};

export type KvItem = {
  key: I18nString;
  value: I18nString;
};

/**
 * Verbatim citation — a quote with optional attribution. Per
 * act-1-v4-rewrite (Deakin Photovoice extension): renders as italic
 * blockquote with attribution caption.
 */
export type Citation = {
  text: I18nString;
  attribution?: I18nString;
};

/**
 * One side of a twin-column block. Per act-1-v4-rewrite, paragraph[] +
 * citations[] are supported alongside items[] for narrative split-column
 * comparison (e.g. "物理属性 ABS data" vs "社会属性 academic quotes").
 * At least one of items / paragraphs / citations must be non-empty (zod refine).
 */
export type TwinColumnSide = {
  heading?: I18nString;
  items?: KvItem[];
  paragraphs?: I18nString[];
  citations?: Citation[];
};

export type TwinColumns = {
  left: TwinColumnSide;
  right: TwinColumnSide;
};

// ---- Scene discriminated union --------------------------------------------

interface SceneBase {
  id: string;
  camera: SceneCamera;
  enter: TransitionKind;
  exit: TransitionKind;
  /**
   * Rhythm kind — controls camera HOLD discipline + sticky pinning.
   * still requires `camera.from === camera.to` (CameraRig enforces).
   * tracking requires `camera.from !== camera.to` (visible motion).
   */
  rhythm: RhythmKind;
  /**
   * Emphasis tier — controls dwell time via CPS-derived svh budget.
   * Default `"standard"` (9 CPS_zh, 1.0× multiplier).
   */
  emphasis: EmphasisKind;
  /**
   * Map (sand table) state for this scene. Optional — unset = full default.
   * Per-scene values are interpolated across boundaries by useResolvedMapState.
   */
  mapState?: MapState;
}

export type SceneTitle = SceneBase & {
  kind: "title";
  text: I18nString;
  subtitle?: I18nString;
};

export type SceneLead = SceneBase & {
  kind: "lead";
  text: I18nString;
};

export type SceneBodySection = SceneBase & {
  kind: "body-section";
  layout: "right-column" | "twin-column";
  /** Eyebrow number (e.g. "01"). Optional. */
  sectionNumber?: string;
  heading: I18nString;
  /** Optional intro paragraphs above the kvList / twinColumns. */
  paragraphs?: I18nString[];
  /** Right-column layout uses kvList. */
  kvList?: KvItem[];
  /** Twin-column layout uses twinColumns instead of kvList. */
  twinColumns?: TwinColumns;
};

export type ScenePullQuote = SceneBase & {
  kind: "pull-quote";
  text: I18nString;
  subtitle?: I18nString;
};

/**
 * Breath scene — pure camera dwell, no DOM text. Use between text-heavy
 * scenes for breathing room, or at beat-edge transitions (e.g. Beat 1.2's
 * lift can begin as a breath scene before the title arrives).
 */
export type SceneBreath = SceneBase & {
  kind: "breath";
};

/**
 * Data-hit scene — single oversized number with a one-line caption,
 * optionally followed by supporting paragraphs (progressive reveal).
 * Used for "1,000 residents" / "14 days" / "$4 per run" beats.
 */
export type SceneDataHit = SceneBase & {
  kind: "data-hit";
  /** Primary number / short label (e.g. "1,000"). Not part of CPS char count. */
  number: string;
  /** One-line caption beneath the number. Counts toward char-cap as 1 paragraph. */
  caption: I18nString;
  /** Optional supporting paragraphs, progressive-revealed beneath caption. */
  paragraphs?: I18nString[];
};

export type Scene =
  | SceneTitle
  | SceneLead
  | SceneBodySection
  | ScenePullQuote
  | SceneBreath
  | SceneDataHit;

export type SceneKind = Scene["kind"];

// ---- CPS-based svh computation (cinema-scroll-pacing D6 + cinema-cps-body-discount) ----

type LayerCounts = {
  primaryZh: number;
  primaryEn: number;
  bodyZh: number;
  bodyEn: number;
};

/**
 * Split scene text into "primary" (heading / title / quote — full weight)
 * and "body" (paragraphs / kvList / twinColumns subtree — 1/20 weight).
 *
 * Per cinema-cps-body-discount:
 *   - body-section: primary = heading; body = paragraphs / kvList / twinColumns
 *   - data-hit: primary = caption; body = paragraphs (number is visual, not text)
 *   - title / lead / pull-quote: all text is primary (no body discount)
 *   - breath: empty
 */
function countCharsByLayer(scene: Scene): LayerCounts {
  let primaryZh = 0, primaryEn = 0, bodyZh = 0, bodyEn = 0;
  const addPrimary = (s: I18nString | undefined) => {
    if (s) { primaryZh += s.zh.length; primaryEn += s.en.length; }
  };
  const addBody = (s: I18nString | undefined) => {
    if (s) { bodyZh += s.zh.length; bodyEn += s.en.length; }
  };

  if (scene.kind === "title") {
    addPrimary(scene.text);
    addPrimary(scene.subtitle);
  } else if (scene.kind === "lead") {
    addPrimary(scene.text);
  } else if (scene.kind === "pull-quote") {
    addPrimary(scene.text);
    addPrimary(scene.subtitle);
  } else if (scene.kind === "body-section") {
    addPrimary(scene.heading);
    scene.paragraphs?.forEach(addBody);
    scene.kvList?.forEach((kv) => { addBody(kv.key); addBody(kv.value); });
    if (scene.twinColumns) {
      // Sub-headings inside twinColumns are body weight (small labels, not
      // primary attention anchors like the scene-level heading).
      const sides = [scene.twinColumns.left, scene.twinColumns.right];
      for (const side of sides) {
        addBody(side.heading);
        side.items?.forEach((kv) => { addBody(kv.key); addBody(kv.value); });
        side.paragraphs?.forEach(addBody);
        side.citations?.forEach((c) => {
          addBody(c.text);
          addBody(c.attribution);
        });
      }
    }
  } else if (scene.kind === "data-hit") {
    // `number` is a visual element, not narrative text — excluded from both layers.
    addPrimary(scene.caption);
    scene.paragraphs?.forEach(addBody);
  }
  // breath: zeros
  return { primaryZh, primaryEn, bodyZh, bodyEn };
}

/** Translate seconds → svh under the assumed baseline scroll velocity. */
function secondsToSvh(s: number): number {
  return (s * SCROLL_PX_PER_S_BASELINE / VIEWPORT_PX_BASELINE) * 100;
}

/**
 * Compute still / tracking scene's svh budget using the body-discount
 * weighted formula:
 *
 *   weighted_chars = primary × 1.0 + body × BODY_DISCOUNT_FACTOR
 *   dwell_seconds = weighted_chars / CPS_emphasis + REACTION_S
 *   svh = secondsToSvh(clamp(dwell_seconds, MIN_DWELL_S, MAX_DWELL_S))
 *
 * Char count uses max(zh, en × 1/1.5). Page is SSG, locale unknown at
 * build, so we take the conservative upper bound.
 */
export function computeStillSvh(scene: Scene): number {
  const { primaryZh, primaryEn, bodyZh, bodyEn } = countCharsByLayer(scene);
  const cpsZh = CPS_ZH[scene.emphasis];
  const cpsEn = cpsZh * 1.5;

  const weightedZh = primaryZh + bodyZh * BODY_DISCOUNT_FACTOR;
  const weightedEn = primaryEn + bodyEn * BODY_DISCOUNT_FACTOR;

  const dwellZh = weightedZh / cpsZh;
  const dwellEn = weightedEn / cpsEn;
  const rawSeconds = Math.max(dwellZh, dwellEn) + REACTION_S;
  const clamped = Math.max(MIN_DWELL_S, Math.min(MAX_DWELL_S, rawSeconds));
  return secondsToSvh(clamped);
}

/** Geometric base for motion / bridge: euclidean dist + lookAt delta. */
export function motionGeometryToSvh(camera: SceneCamera): number {
  const dx = camera.to[0] - camera.from[0];
  const dy = camera.to[1] - camera.from[1];
  const dz = camera.to[2] - camera.from[2];
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  // lookAt delta is currently a single point; if future schema has from/to lookAt
  // we'd take that delta. For now lookAtDelta = 0.
  const lookAtDelta = 0;
  return dist * 8 + lookAtDelta * 4;
}

export function computeMotionSvh(scene: Scene): number {
  const factor = EMPHASIS_FACTOR[scene.emphasis];
  return Math.max(100, motionGeometryToSvh(scene.camera) * factor);
}

export function computeBridgeSvh(scene: Scene): number {
  const factor = EMPHASIS_FACTOR[scene.emphasis];
  return 120 * factor;
}

/**
 * Top-level dispatcher — replaces `DURATION_SVH[scene.duration]` everywhere.
 * Routes by `scene.rhythm`. tracking uses still's CPS formula (reading-first
 * even though camera moves); Phase 6 of cinema-content-language-foundations
 * will introduce per-paragraph progressive-reveal svh accumulation.
 */
export function computeSvh(scene: Scene): number {
  switch (scene.rhythm) {
    case "still":
      return computeStillSvh(scene);
    case "tracking":
      return computeStillSvh(scene);
    case "motion":
      return computeMotionSvh(scene);
    case "bridge":
      return computeBridgeSvh(scene);
  }
}

// ---- Resolution helpers ----------------------------------------------------

/**
 * Total scroll budget (svh) of a beat = sum of its scenes' computed svh.
 * Caller computes per-scene scroll fraction within beat from this.
 */
export function beatScrollSvh(scenes: Scene[]): number {
  return scenes.reduce((sum, s) => sum + computeSvh(s), 0);
}

/**
 * Dwell easing — "升格" curve. Maps scene-local T to a non-linear camera
 * progress so the camera moves QUICKLY at scene boundaries (where text
 * is fading in/out) and SLOWLY in the middle (where the user is reading).
 *
 *   t ∈ [0,    0.18]  →  cam progress 0    → 0.35   (fast in)
 *   t ∈ [0.18, 0.82]  →  cam progress 0.35 → 0.65   (slow dwell — read here)
 *   t ∈ [0.82, 1.0 ]  →  cam progress 0.65 → 1      (fast out)
 *
 * Within the 64% dwell band the camera covers only 30% of from→to motion,
 * so even fast scrolls give the reader time on each scene's text.
 */
export function dwellEase(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  if (x < 0.18) return (x / 0.18) * 0.35;
  if (x < 0.82) return 0.35 + ((x - 0.18) / 0.64) * 0.30;
  return 0.65 + ((x - 0.82) / 0.18) * 0.35;
}

/**
 * Given an array of scenes and a beat-local progress (0..1), returns the
 * active scene + scene-local progress.
 */
export function sceneAtBeatLocalT(
  scenes: Scene[],
  beatLocalT: number,
): { scene: Scene; sceneLocalT: number; sceneIndex: number } | null {
  if (scenes.length === 0) return null;
  const total = beatScrollSvh(scenes);
  if (total <= 0) return null;

  const t = Math.max(0, Math.min(1, beatLocalT));
  let cumulative = 0;
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const span = computeSvh(scene) / total;
    const start = cumulative;
    const end = cumulative + span;
    if (t >= start && t <= end) {
      const localT = span > 0 ? (t - start) / span : 0;
      return { scene, sceneLocalT: localT, sceneIndex: i };
    }
    cumulative = end;
  }

  // Numerical fallthrough at t=1
  return {
    scene: scenes[scenes.length - 1],
    sceneLocalT: 1,
    sceneIndex: scenes.length - 1,
  };
}

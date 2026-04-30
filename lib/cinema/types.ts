/**
 * Cinema types — single source of truth for the camera score, HUD layer, and
 * frontmatter authoring. Everything that drives a frame at scroll-progress t
 * is described here.
 *
 * See openspec/changes/sswt-cinematic-case-study/design.md (D4, D5) for the
 * design rationale.
 */

export type Vec3 = readonly [number, number, number];

export type Easing = "linear" | "ease-in" | "ease-out" | "smoothstep" | "spring";

export type ActId = "attention-boundary" | "instrument" | "findings";

export type ShotKind =
  | "establishing"
  | "push-in"
  | "pull-back"
  | "dolly-arc"
  | "match-dissolve"
  | "focus-rack";

export type Shot =
  | {
      id: string;
      kind: "establishing";
      orbit: { center: Vec3; radius: number; degrees: [number, number] };
      ease?: Easing;
    }
  | {
      id: string;
      kind: "push-in";
      from: Vec3;
      to: Vec3;
      lookAt: Vec3;
      ease?: Easing;
    }
  | {
      id: string;
      kind: "pull-back";
      from: Vec3;
      to: Vec3;
      lookAt: Vec3;
      ease?: Easing;
    }
  | {
      id: string;
      kind: "dolly-arc";
      path: Vec3[];
      lookAt: Vec3;
      ease?: Easing;
    }
  | {
      id: string;
      kind: "match-dissolve";
      from: Vec3;
      to: Vec3;
      lookAt: Vec3;
      crossfade: number;
    }
  | {
      id: string;
      kind: "focus-rack";
      /** Camera position — held while the focus pulls. */
      anchor: Vec3;
      /** What the camera is *aimed at* — must NOT equal anchor (degenerate). */
      lookAt: Vec3;
      focusFrom: number;
      focusTo: number;
      ease?: Easing;
    };

export type HudPanelSlot = "stats" | "feed-item" | "beta-rigor" | "mirror-toggle";

export type Hud =
  | { kind: "cue-card"; text: string; position: "top" | "bottom" | "left" | "right" }
  | { kind: "letterbox"; subtitle: string }
  | { kind: "in-world-label"; anchor: Vec3; text: string }
  | { kind: "hud-panel"; slot: HudPanelSlot };

/** A single beat: 5-tuple of content / shot / hud / fallback / sources. */
export type Beat = {
  id: string;
  range: [number, number];
  shotRef: string;
  hud: Hud;
  fallbackFigure: string;
};

export type Act = {
  id: ActId;
  title: string;
  range: [number, number];
  beats: Beat[];
};

/** The page-level camera score. Total range MUST cover [0, 1] continuously. */
export type CameraScore = {
  version: string;
  acts: Act[];
  shots: Record<string, Shot>;
};

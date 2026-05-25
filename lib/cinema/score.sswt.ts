import type { CameraScore, Vec3 } from "./types";

/**
 * SSWT 三幕 camera score (v0.1).
 *
 * Coordinates assume the world is normalized to ±worldExtent (default 8) on
 * the X-Z plane, with Y up. Buildings extrude up to ~0.5 units. So:
 *   - Y < 0.5  ≈ street-level (pedestrian POV)
 *   - Y ~ 4    ≈ low oblique (sand-table observer leaning in)
 *   - Y ~ 8    ≈ standard table view
 *   - Y > 12   ≈ god view, table feels like a small object
 *
 * Shot-to-shot continuity is hand-tuned: each shot's exit position closely
 * matches the next shot's entry, so the spring smoother in CameraRig has a
 * minimal jump to absorb. 构图回环: Act 3.3 outro ends near the same vantage
 * Act 1.3 establishing started from, closing the loop.
 *
 * NOTE: bump `version` whenever shots are renamed/removed; content-lint
 * verifies frontmatter shotRef ↔ score consistency by version.
 */

const ORIGIN: Vec3 = [0, 0, 0];

// Anchor positions used by multiple shots — naming them keeps continuity intentional.
//
// Cold open (Beat 1.1) — ABSOLUTELY horizontal, Y===lookAt.Y===0, pure -Z
// push-in across the ground plane. Per directive: the *starting* state is
// what the camera previously hit at t≈0.092 (close to the city edge, fog
// just resolving). The early "drift in from the fog wall" is trimmed;
// Beat 1.1 begins already framed and pushes a short distance further into
// the city. Beat 1.2 still does the lift to oblique vantage.
const PRE_INTRO_FAR: Vec3 = [0, 0, 9.5]; // Act 1.1 first frame — at the city edge, dead level
const PRE_INTRO_NEAR: Vec3 = [0, 0, 5]; // Act 1.1 end — pushed forward into the cluster, still dead level
const ENTRY_HOLD: Vec3 = [-6, 5, 11]; // Act 1.2 end — oblique vantage; seeds Act 1.3 orbit
const ORBIT_END: Vec3 = [4.65, 4.4, 9.97]; // Act 1.3 end (orbit r=11 deg=25°) → seeds Act 2.1
const ARC_FAR_SIDE: Vec3 = [0, 5.2, -8.8]; // Act 2.1 dolly arc far side
const STREET_DIVE: Vec3 = [1.2, 0.7, 1.4]; // Act 2.2 push-in destination — agent POV
const NETWORK_VIEW: Vec3 = [3.8, 3.2, 3.8]; // Act 2.3 mid-overview where ties are visible
// FULL_OVERVIEW removed — Act 3 now uses scene-specific vantages per finding.
// Outro loop closure: descend back to the opening-state level POV, then
// recede along Z into fog — the camera ends on the same plane it began on,
// 构图回环 in the most literal sense.
const OUTRO_LOOP: Vec3 = [0, 0, 9.5]; // matches PRE_INTRO_FAR — opening state revisited
const OUTRO_FADE: Vec3 = [0, 0, 28]; // beyond fog wall, dead level — table dissolves

export const sswtCinemaScore: CameraScore = {
  version: "0.2.0",
  acts: [
    {
      id: "attention-boundary",
      title: "注意力边界",
      range: [0.0, 0.35],
      beats: [
        // Per act-1-v4-rewrite: Act I 由 v3 三 beat 收为 v4 单 beat 4 scene。
        // Beat ID 与 mdx frontmatter 必须匹配 (`disappearance-of-nearby`)，
        // 否则 buildBeatLayout / sceneAt 找不到 fmBeat → 走 legacy shot fallback
        // → 用 act1.b1 push-in 而不是新 scene-level camera。
        // shotRef act1.b1 保留作 fallback（mdx scenes 优先）。
        {
          id: "disappearance-of-nearby",
          range: [0.0, 0.35],
          shotRef: "act1.b1",
          hud: { kind: "letterbox", subtitle: "附近的消失" },
          fallbackFigure: "/figures/act1-disappearance.svg",
        },
      ],
    },
    {
      id: "instrument",
      title: "产品本体",
      range: [0.35, 0.78],
      beats: [
        {
          id: "map",
          range: [0.35, 0.45],
          shotRef: "act2.b1",
          hud: { kind: "in-world-label", anchor: ORIGIN, text: "Lane Cove" },
          fallbackFigure: "/figures/act2-map.svg",
        },
        {
          id: "agent",
          range: [0.45, 0.58],
          shotRef: "act2.b2",
          hud: { kind: "hud-panel", slot: "stats" },
          fallbackFigure: "/figures/act2-agent.svg",
        },
        {
          id: "network",
          range: [0.58, 0.68],
          shotRef: "act2.b3",
          hud: { kind: "letterbox", subtitle: "1000 agents · 14 days · 288 ticks/day" },
          fallbackFigure: "/figures/act2-network.svg",
        },
        {
          id: "intervention",
          range: [0.68, 0.78],
          shotRef: "act2.b4",
          hud: { kind: "hud-panel", slot: "feed-item" },
          fallbackFigure: "/figures/act2-intervention.svg",
        },
      ],
    },
    {
      id: "findings",
      title: "探索的结论",
      range: [0.78, 1.0],
      beats: [
        // Three findings + outro, ~5.5% scroll budget each.
        // MDX scene-level cameras override shotRef (which is fallback only).
        {
          id: "siphon-paradox",
          range: [0.78, 0.835],
          shotRef: "act3.b1",
          fallbackFigure: "/figures/finding-1-siphon.png",
        },
        {
          id: "friction-wins",
          range: [0.835, 0.89],
          shotRef: "act3.b2",
          fallbackFigure: "/figures/finding-2-friction.png",
        },
        {
          id: "routine-cliff",
          range: [0.89, 0.945],
          shotRef: "act3.b3",
          fallbackFigure: "/figures/finding-3-routine.png",
        },
        {
          // 构图回环 — camera ends where Beat 1.1 started, closing the loop.
          id: "outro",
          range: [0.945, 1.0],
          shotRef: "act3.b4",
          hud: { kind: "letterbox", subtitle: "An exploratory instrument · not a deployable system" },
          fallbackFigure: "/figures/synthesis-hero.png",
        },
      ],
    },
  ],
  shots: {
    // Act 1 — the world before the apparatus.
    // Beat 1.1: cold open / "intro before the intro". Eye-level horizontal
    // approach from beyond the fog. The city crystallizes out of the mist.
    "act1.b1": {
      id: "act1.b1",
      kind: "push-in",
      from: PRE_INTRO_FAR,
      to: PRE_INTRO_NEAR,
      lookAt: ORIGIN,
      ease: "smoothstep",
    },
    // Beat 1.2: observer lifts. Same city, now read as a layout — which is
    // the visual gesture of "blindspot reveal" (the bigger pattern emerges
    // only when you step back).
    "act1.b2": {
      id: "act1.b2",
      kind: "pull-back",
      from: PRE_INTRO_NEAR,
      to: ENTRY_HOLD,
      lookAt: ORIGIN,
      ease: "smoothstep",
    },
    "act1.b3": {
      id: "act1.b3",
      kind: "establishing",
      orbit: { center: ORIGIN, radius: 11, degrees: [-30, 25] },
      ease: "smoothstep",
    },

    // Act 2 — the apparatus, dissected. Map → agent → network → control panel.
    "act2.b1": {
      id: "act2.b1",
      kind: "dolly-arc",
      path: [ORBIT_END, [-7, 4.4, 9], [-9, 5, 0], ARC_FAR_SIDE],
      lookAt: ORIGIN,
      ease: "smoothstep",
    },
    "act2.b2": {
      id: "act2.b2",
      kind: "push-in",
      from: ARC_FAR_SIDE,
      to: STREET_DIVE,
      lookAt: ORIGIN,
      ease: "smoothstep",
    },
    "act2.b3": {
      id: "act2.b3",
      kind: "pull-back",
      from: STREET_DIVE,
      to: NETWORK_VIEW,
      lookAt: ORIGIN,
      ease: "smoothstep",
    },
    "act2.b4": {
      id: "act2.b4",
      kind: "focus-rack",
      anchor: NETWORK_VIEW,
      lookAt: ORIGIN, // intervention agent visual proxy lives at table center
      focusFrom: 5,
      focusTo: 1.6, // intervention layer — focus tightens onto a single agent
      ease: "smoothstep",
    },

    // Act 3 — three findings + outro. Each finding has its own vantage
    // matched to MDX scene-level camera; these shotRefs are fallbacks.
    // Camera path:
    //   Act 2 end [0,11,11] →
    //   F1 siphon  → overhead close [0, 10, 6] (push-in toward city)
    //   F2 friction → orbit other side [4, 8, -2] (different angle)
    //   F3 routine cliff → broad god view [0, 13, 4] (pull back, 1000 dots)
    //   outro → OUTRO_LOOP [0, 0, 9.5] → OUTRO_FADE (构图回环 = back to intro plane)
    "act3.b1": {
      id: "act3.b1",
      kind: "push-in",
      from: [0, 11, 11],
      to: [0, 10, 6],
      lookAt: ORIGIN,
      ease: "smoothstep",
    },
    "act3.b2": {
      id: "act3.b2",
      kind: "dolly-arc",
      path: [[0, 10, 6], [3, 9, 2], [4.5, 8.5, -1], [4, 8, -2]],
      lookAt: ORIGIN,
      ease: "smoothstep",
    },
    "act3.b3": {
      id: "act3.b3",
      kind: "pull-back",
      from: [4, 8, -2],
      to: [0, 13, 4],
      lookAt: ORIGIN,
      ease: "smoothstep",
    },
    // Outro: 4-point path with deliberate hold at OUTRO_LOOP.
    //   0    → 0.39  descend from god-view down to the opening-state plane
    //   0.39 → 0.61  hold at OUTRO_LOOP — loop closes, camera stays put
    //   0.61 → 1.00  pure -Z retreat into the fog wall, scroll-driven
    "act3.b4": {
      id: "act3.b4",
      kind: "dolly-arc",
      path: [[0, 13, 4], OUTRO_LOOP, OUTRO_LOOP, OUTRO_FADE],
      lookAt: ORIGIN,
      ease: "smoothstep",
    },
  },
};

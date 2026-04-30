/**
 * Pure camera-parameter interpolation for each Shot kind.
 *
 * Returns a `CameraState` (position + lookAt + focal hint). The render
 * layer is responsible for applying it to whatever camera abstraction
 * it uses (R3F PerspectiveCamera, vanilla three, Theatre, etc.).
 *
 * This module is **engine-agnostic**: imports zero React, zero three,
 * zero DOM. Pure math + the cinema score type.
 */

import type { Shot, Vec3 } from "./types";
import { lerp, smoothstep } from "./easing";

export type CameraState = {
  position: Vec3;
  lookAt: Vec3;
  /** Hint for camera focal distance (DoF) — render layer interprets. */
  focalDistance: number;
};

const lerpVec3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

const lengthVec3 = (v: Vec3) => Math.hypot(v[0], v[1], v[2]);
const subVec3 = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

const DEG = Math.PI / 180;

/**
 * Resolve a Shot at local progress `localT` ∈ [0, 1] into a CameraState.
 * Smoothstep is applied to soften ramps; specific Shot kinds add their own
 * shape on top.
 */
export function shotToState(shot: Shot, localT: number): CameraState {
  const t = smoothstep(localT);

  switch (shot.kind) {
    case "establishing": {
      const { center, radius, degrees } = shot.orbit;
      const angle = lerp(degrees[0], degrees[1], t) * DEG;
      const position: Vec3 = [
        center[0] + Math.sin(angle) * radius,
        center[1] + radius * 0.4,
        center[2] + Math.cos(angle) * radius,
      ];
      return { position, lookAt: center, focalDistance: radius };
    }

    case "push-in":
    case "pull-back": {
      const position = lerpVec3(shot.from, shot.to, t);
      const focal = lengthVec3(subVec3(position, shot.lookAt));
      return { position, lookAt: shot.lookAt, focalDistance: focal };
    }

    case "dolly-arc": {
      const { path, lookAt } = shot;
      if (path.length < 2) {
        return { position: path[0] ?? [0, 0, 0], lookAt, focalDistance: 1 };
      }
      // Piecewise linear along the path (cubic spline can come later).
      const segments = path.length - 1;
      const scaled = t * segments;
      const idx = Math.min(segments - 1, Math.floor(scaled));
      const localSeg = scaled - idx;
      const position = lerpVec3(path[idx], path[idx + 1], localSeg);
      const focal = lengthVec3(subVec3(position, lookAt));
      return { position, lookAt, focalDistance: focal };
    }

    case "match-dissolve": {
      // Match-dissolve keeps camera roughly fixed; render layer crossfades
      // material/color elsewhere. We still allow a tiny drift between from/to
      // so the camera isn't perfectly locked (which reads as broken).
      const position = lerpVec3(shot.from, shot.to, t);
      const focal = lengthVec3(subVec3(position, shot.lookAt));
      return { position, lookAt: shot.lookAt, focalDistance: focal };
    }

    case "focus-rack": {
      // Camera position holds; only focalDistance moves (DoF rack).
      // lookAt MUST differ from anchor or three's lookAt() goes degenerate.
      const focalDistance = lerp(shot.focusFrom, shot.focusTo, t);
      return { position: shot.anchor, lookAt: shot.lookAt, focalDistance };
    }

    default: {
      // Exhaustiveness — TypeScript will complain if a new Shot kind lands
      // without a case here.
      const _exhaustive: never = shot;
      void _exhaustive;
      return { position: [0, 0, 5], lookAt: [0, 0, 0], focalDistance: 5 };
    }
  }
}

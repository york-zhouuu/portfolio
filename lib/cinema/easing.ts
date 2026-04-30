/**
 * Pure scalar math used by the camera score, HUD fades, and any time-based
 * blending. Distilled from the 第一版 cinemaShared utilities — kept as a tiny
 * function module with no React, no DOM, no state.
 */

export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function smoothstep(t: number) {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
}

/** Map a global progress to a 0..1 phase within [start, end], smoothstepped. */
export function phase(progress: number, start: number, end: number) {
  const span = Math.max(0.0001, end - start);
  return smoothstep((progress - start) / span);
}

/**
 * Ramp up between [startIn, endIn] then ramp down between [startOut, endOut].
 * Useful for HUD elements that should fade in, hold, then fade out.
 */
export function blendPhases(
  progress: number,
  startIn: number,
  endIn: number,
  startOut: number,
  endOut: number,
) {
  return phase(progress, startIn, endIn) * (1 - phase(progress, startOut, endOut));
}

/** Re-map t∈[fromMin, fromMax] into [toMin, toMax] linearly, clamped. */
export function remap(t: number, fromMin: number, fromMax: number, toMin: number, toMax: number) {
  const localT = clamp((t - fromMin) / Math.max(0.0001, fromMax - fromMin));
  return lerp(toMin, toMax, localT);
}

/**
 * Tiny critically-damped spring smoother. Engine-agnostic on purpose: the
 * cinema timeline shouldn't care whether maath / framer-motion / Theatre
 * is wired up. We use this to soften scroll → t so camera doesn't jitter
 * on fast wheel events.
 *
 * Swap point: replace this with `damp` from maath if we want exactly the
 * same numerics as drei demos, or hand t to a Theatre playback head.
 */

export type SpringState = { value: number; velocity: number };

export function makeSpring(initial = 0): SpringState {
  return { value: initial, velocity: 0 };
}

/**
 * Spring profile for cinema-scroll-pacing motion → still transitions.
 * stiffness=220 → settling time ≈ 4/sqrt(220) ≈ 0.27s. Slightly over-damped
 * (1.05× critical) so the camera lerps in WITHOUT overshoot or any felt
 * "lurch" at scene boundaries. Tuned 2026-04-27 after author reported
 * "潜在跳的感觉" — was 400, perceptibly twitchy on fast scrolls.
 */
export const SPRING_PROFILE_HOLD = {
  stiffness: 220,
  damping: Math.sqrt(4 * 220) * 1.05,
} as const;

/** Default profile — softer, used for general-purpose interpolation. */
export const SPRING_PROFILE_DEFAULT = {
  stiffness: 80,
  damping: Math.sqrt(4 * 80),
} as const;

/**
 * Advance a critically-damped spring one step.
 *
 * @param state mutable spring state
 * @param target where it wants to be
 * @param stiffness 0..∞ — higher = snappier, default 80 feels filmic
 * @param damping 0..∞ — sqrt(4*stiffness) is critical
 * @param dt seconds since last step
 */
export function stepSpring(
  state: SpringState,
  target: number,
  dt: number,
  stiffness = 80,
  damping = Math.sqrt(4 * 80),
): number {
  const force = -stiffness * (state.value - target);
  const drag = -damping * state.velocity;
  const accel = force + drag;
  state.velocity += accel * dt;
  state.value += state.velocity * dt;
  return state.value;
}

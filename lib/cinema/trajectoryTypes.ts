/**
 * Trajectory recorder types — a Waypoint captures the camera state
 * (position + lookAt) at a moment in time, plus the desired mapState
 * (mode / dim / overlay) at that moment, plus a duration to the next
 * waypoint. A Trajectory is an ordered list of Waypoints.
 *
 * Output target: each consecutive Waypoint pair = one mdx scene block
 * with `camera.from`, `camera.to`, `camera.lookAt`, and `mapState`.
 */

import type { Vec3 } from "./types";

export type DevMapMode = "matte" | "blueprint";
export type DevMapOverlay = "none" | "agents_trajectories" | "digital_silos_heatmap";

export type DevMapState = {
  mode: DevMapMode;
  dim: number; // 0..1
  overlay: DevMapOverlay;
};

export type Waypoint = {
  id: string;
  position: Vec3;
  lookAt: Vec3;
  mapState: DevMapState;
  /** Seconds to the next waypoint. 0 if last (or single waypoint). */
  durationToNext: number;
  /** Optional human-friendly label. */
  label?: string;
};

export type TrajectoryTemplate = {
  id: string;
  name: string;
  description: string;
  /** id is auto-generated when applied. */
  waypoints: Omit<Waypoint, "id">[];
};

export const DEFAULT_MAP_STATE: DevMapState = {
  mode: "matte",
  dim: 0.5,
  overlay: "none",
};

export const DEFAULT_DURATION = 3;

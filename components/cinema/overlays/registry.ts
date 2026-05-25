/**
 * Map overlay registry — pluggable visual overlays drawn on top of the
 * sand table (agent particles, heatmaps, labels, …).
 *
 * Each overlay is a React component receiving `progress` (0..1) so it can
 * fade itself in/out per the resolved mapState. Unknown names render `null`
 * (gracefully ignored), so authors can ship MDX referencing future overlays
 * without breaking builds.
 *
 * Per cinema-content-language-foundations D3: this propose registers ONLY
 * `none`. Concrete overlays (agents_trajectories / digital_silos_heatmap)
 * arrive in the follow-up `cinema-map-overlays` propose.
 */

import type { ComponentType } from "react";
import type { NormalizedSandTable } from "@/lib/cinema/geometry";
import type { ResolvedPickup, ResolvedSpotlight } from "@/lib/cinema/mapState";
import { AgentsTrajectoriesOverlay } from "./AgentsTrajectoriesOverlay";
import { DigitalSilosOverlay } from "./DigitalSilosOverlay";
import {
  Finding1SiphonOverlay,
  Finding2FrictionOverlay,
  Finding3RoutineCliffOverlay,
} from "./FindingAnchorsOverlay";
import { StoriesPointersOverlay } from "./StoriesPointersOverlay";
import { PushMomentOverlay } from "./PushMomentOverlay";
import { TieTimelapseOverlay } from "./TieTimelapseOverlay";

export type MapOverlayProps = {
  progress: number;
  /** Scene-local scroll t in [0,1] — clean timeline for scripted events. */
  sceneLocalT?: number;
  sandTable: NormalizedSandTable | null;
  /** Active spotlight targets — narrative-only highlight (no click). */
  spotlights?: ResolvedSpotlight[];
  /** Active pickup targets — highlight + click hitbox bound to a story. */
  pickups?: ResolvedPickup[];
};

const OVERLAY_REGISTRY: Record<string, ComponentType<MapOverlayProps>> = {
  none: () => null,
  agents_trajectories: AgentsTrajectoriesOverlay,
  digital_silos_heatmap: DigitalSilosOverlay,
  push_moment: PushMomentOverlay,
  tie_timelapse: TieTimelapseOverlay,
  finding_1_siphon: Finding1SiphonOverlay,
  finding_2_friction: Finding2FrictionOverlay,
  finding_3_routine_cliff: Finding3RoutineCliffOverlay,
  stories_pointers: StoriesPointersOverlay,
};

/** Look up a registered overlay; returns null component if unknown. */
export function getOverlay(name: string): ComponentType<MapOverlayProps> {
  return OVERLAY_REGISTRY[name] ?? OVERLAY_REGISTRY.none;
}

export function isOverlayRegistered(name: string): boolean {
  return name in OVERLAY_REGISTRY;
}

/** Registration hook used by follow-up proposes (cinema-map-overlays etc.). */
export function registerOverlay(
  name: string,
  component: ComponentType<MapOverlayProps>,
): void {
  OVERLAY_REGISTRY[name] = component;
}

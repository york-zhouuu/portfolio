"use client";

import type { NormalizedSandTable } from "@/lib/cinema/geometry";
import type { ResolvedPickup, ResolvedSpotlight } from "@/lib/cinema/mapState";
import { getOverlay } from "./registry";

/**
 * MapOverlay — renders the active overlay component looked up by name.
 * Spotlights are narrative-only highlights (no click). Pickups are
 * highlights + a click hitbox bound to a resident story slug.
 *
 * Lives inside the R3F Canvas tree alongside SandTable.
 */
export function MapOverlay({
  name,
  progress,
  sceneLocalT,
  sandTable,
  spotlights,
  pickups,
}: {
  name: string;
  progress: number;
  sceneLocalT?: number;
  sandTable: NormalizedSandTable | null;
  spotlights?: ResolvedSpotlight[];
  pickups?: ResolvedPickup[];
}) {
  // Publish the currently-active overlay name + progress so DOM-side
  // labels (StreamLabelLayer) can identify which of the 4 streams of
  // evidence the sandbox is currently showing. Cleared when overlay is
  // "none" so labels fade out cleanly.
  if (typeof window !== "undefined") {
    if (name === "none") {
      window.__sswtActiveOverlay = null;
    } else {
      window.__sswtActiveOverlay = { name, progress };
    }
  }
  const Component = getOverlay(name);
  return (
    <Component
      progress={progress}
      sceneLocalT={sceneLocalT}
      sandTable={sandTable}
      spotlights={spotlights}
      pickups={pickups}
    />
  );
}

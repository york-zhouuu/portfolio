"use client";

import type { NormalizedSandTable } from "@/lib/cinema/geometry";
import { getOverlay } from "./registry";

/**
 * MapOverlay — renders the active overlay component looked up by name.
 * Unknown names = no-op (renders null). progress ∈ [0,1] is passed to the
 * registered component which decides how to apply fade-in / fade-out.
 * sandTable is forwarded so geometry-aware overlays (agents, heatmaps) can
 * sample positions from the sand-table road network.
 *
 * Lives inside the R3F Canvas tree alongside SandTable.
 */
export function MapOverlay({
  name,
  progress,
  sandTable,
}: {
  name: string;
  progress: number;
  sandTable: NormalizedSandTable | null;
}) {
  const Component = getOverlay(name);
  return <Component progress={progress} sandTable={sandTable} />;
}

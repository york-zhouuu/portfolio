/**
 * Material mode registry — pluggable sand-table material schemes.
 *
 * Each mode is a "MaterialSet" defining per-layer color / roughness /
 * metalness / opacity. SandTable looks up the active mode by name; unknown
 * names fall back to "matte". Cross-fade between modes is rendered by
 * SandTable when modePrev is non-null (paint each layer with two materials,
 * opacities weighted by modeFade).
 *
 * Per cinema-content-language-foundations D4: this propose registers ONLY
 * `matte` (the existing visual). `blueprint` and others are added by the
 * follow-up `cinema-map-modes` propose.
 */

import type { CinemaTheme } from "@/lib/cinema/theme";
import { blueprintMaterialFactory } from "./blueprint";
import { schematicMaterialFactory } from "./schematic";

export type MaterialLayer =
  | "ground"
  | "walkway"
  | "road"
  | "waterway"
  | "water"
  | "park"
  | "building";

export type EdgeSpec = {
  color: string;
  opacity: number;
  /** EdgesGeometry threshold angle in degrees (default 15). */
  threshold?: number;
};

export type MaterialSpec = {
  color: string;
  roughness: number;
  metalness: number;
  opacity: number;
  /** flatShading affects building only; other layers ignore. */
  flatShading?: boolean;
  /** Optional edge highlight rendered as <lineSegments> on the same mesh. */
  edges?: EdgeSpec;
};

export type MaterialSet = Record<MaterialLayer, MaterialSpec>;
export type MaterialFactory = (theme: CinemaTheme) => MaterialSet;

/** Default `matte` mode — the original look, parameterized by theme. */
export const matteMaterialFactory: MaterialFactory = (theme) => ({
  ground: { color: theme.ground, roughness: 0.95, metalness: 0, opacity: 1 },
  walkway: { color: theme.road, roughness: 0.95, metalness: 0, opacity: 0.32 },
  road: { color: theme.road, roughness: 0.92, metalness: 0, opacity: 0.78 },
  waterway: { color: theme.water, roughness: 0.55, metalness: 0.1, opacity: 0.92 },
  water: { color: theme.water, roughness: 0.55, metalness: 0.1, opacity: 0.95 },
  park: { color: theme.park, roughness: 0.9, metalness: 0, opacity: 0.92 },
  building: { color: theme.buildingTop, roughness: 0.85, metalness: 0, opacity: 1, flatShading: true },
});

const MATERIAL_REGISTRY: Record<string, MaterialFactory> = {
  matte: matteMaterialFactory,
  blueprint: blueprintMaterialFactory,
  schematic: schematicMaterialFactory,
};

/**
 * Look up a material set for a given mode. Unknown modes fall back to matte.
 * Caller decides whether to log / lint-warn the fallback.
 */
export function getMaterialSet(mode: string, theme: CinemaTheme): MaterialSet {
  const factory = MATERIAL_REGISTRY[mode] ?? matteMaterialFactory;
  return factory(theme);
}

/** True if a mode is registered. False = unknown / will fallback. */
export function isModeRegistered(mode: string): boolean {
  return mode in MATERIAL_REGISTRY;
}

/** Register a new mode (used by follow-up propose like cinema-map-modes). */
export function registerMaterialMode(name: string, factory: MaterialFactory): void {
  MATERIAL_REGISTRY[name] = factory;
}

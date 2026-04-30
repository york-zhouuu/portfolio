/**
 * Pure geometry transforms — convert the asset-pipeline's
 * `map-geometry.json` (Lane Cove footprints + streets, in local x/y meters)
 * into three.js-compatible primitives, normalized to a unit-ish world
 * centered on the origin.
 *
 * No three.js imports here — return plain arrays / numbers so this is
 * trivially testable and the renderer can decide what to materialize.
 *
 * Important: we intentionally **ignore** the asset's declared `bounds`
 * field and recompute the active extent from buildings + parks (the
 * city core). Streets/water can extend beyond this without compressing
 * the city scale.
 */

import type {
  MapBuilding,
  MapGeometryAsset,
  Vec2,
} from "@/lib/content/load-sswt-assets";
import type { CinemaTheme } from "./theme";

export type Bounds2D = { minX: number; minY: number; maxX: number; maxY: number };

export type NormalizedBuilding = {
  id: string;
  /** 2D footprint in world units, centered around origin. */
  shape: Vec2[];
  /** Extruded height in world units (after theme scaling). */
  height: number;
};

export type NormalizedRoad = {
  id: string;
  /** Closed polygon outline in world units (filled mesh). */
  shape: Vec2[];
};

export type NormalizedRibbon = {
  id: string;
  /** Polyline points in world units. */
  points: Vec2[];
  /** Ribbon width in WORLD UNITS — bake meters × horizontalScale. */
  width: number;
  /** Discriminate visual register (water / pedestrian). */
  kind: string;
};

export type NormalizedPoi = {
  name: string;
  /** Single point in world units. */
  point: Vec2;
};

export type NormalizedPark = {
  id: string;
  name: string;
  type: "park" | "playground" | "garden";
  /** Polygon footprint in world units. */
  shape: Vec2[];
};

export type NormalizedWater = {
  id: string;
  name?: string;
  shape: Vec2[];
};

export type NormalizedSandTable = {
  bounds: Bounds2D;
  buildings: NormalizedBuilding[];
  /** Drivable road footprints (atlas, filled polygons). */
  roads: NormalizedRoad[];
  /** Pedestrian paths from OSM (rendered as thin ribbons). */
  walkways: NormalizedRibbon[];
  /** Rivers/streams from OSM (rendered as wider water-colored ribbons). */
  waterways: NormalizedRibbon[];
  pois: NormalizedPoi[];
  parks: NormalizedPark[];
  water: NormalizedWater[];
  /** World-unit half-extent on the X-Z plane (max axis). */
  halfExtent: number;
};

/**
 * Meters per story when a building only has `floors` (no explicit height).
 * Per source-project guide §3: residential 3 m / floor; commercial 4–5 m.
 * Used only as fallback — exporter usually bakes a real metric height.
 */
const STORY_METERS = 3;

function rawHeightMeters(b: MapBuilding, fallback: number): number {
  if (typeof b.height === "number" && b.height > 0) return b.height;
  if (typeof b.floors === "number" && b.floors > 0) {
    return b.floors * STORY_METERS;
  }
  return fallback;
}

/**
 * Compute the city core extent — buildings + parks only. Streets, water,
 * waterways may extend further but shouldn't compress the city scale.
 */
function computeActiveBounds(asset: MapGeometryAsset): Bounds2D {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const grow = (p: Vec2) => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  };
  for (const b of asset.buildings) for (const v of b.footprint) grow(v);
  for (const k of asset.parks ?? []) for (const v of k.footprint) grow(v);
  if (!Number.isFinite(minX)) return asset.bounds;
  return { minX, maxX, minY, maxY };
}

/**
 * Center the geometry on origin and scale so the longer axis fits within
 * `worldExtent` (theme-driven). Building heights inherit a vertical scale
 * that's a multiple of the horizontal one (sand-table exaggeration).
 */
export function normalizeSandTable(
  asset: MapGeometryAsset,
  theme: CinemaTheme,
): NormalizedSandTable {
  const active = computeActiveBounds(asset);
  const cx = (active.minX + active.maxX) / 2;
  const cy = (active.minY + active.maxY) / 2;
  const span = Math.max(active.maxX - active.minX, active.maxY - active.minY);
  const horizontalScale = (2 * theme.worldExtent) / Math.max(1, span);
  const verticalScale = horizontalScale * theme.buildingHeightExaggeration;

  const project = (p: Vec2): Vec2 => ({
    x: (p.x - cx) * horizontalScale,
    y: (p.y - cy) * horizontalScale,
  });

  const buildings: NormalizedBuilding[] = asset.buildings.map((b) => ({
    id: b.id,
    shape: b.footprint.map(project),
    height:
      Math.max(2, rawHeightMeters(b, theme.defaultBuildingHeight)) *
      verticalScale,
  }));

  const roads: NormalizedRoad[] = asset.roads.map((r) => ({
    id: r.id,
    shape: r.footprint.map(project),
  }));

  const walkways: NormalizedRibbon[] = asset.walkways.map((w) => ({
    id: w.id,
    points: w.path.map(project),
    width: w.widthMeters * horizontalScale,
    kind: w.kind,
  }));

  const waterways: NormalizedRibbon[] = asset.waterways.map((w) => ({
    id: w.id,
    points: w.path.map(project),
    width: w.widthMeters * horizontalScale,
    kind: w.kind,
  }));

  const pois: NormalizedPoi[] = asset.pois
    .filter((p) => !p.name.startsWith("way/") && !p.name.startsWith("node/"))
    .map((p) => ({ name: p.name, point: project(p.point) }));

  const parks: NormalizedPark[] = (asset.parks ?? []).map((k) => ({
    id: k.id,
    name: k.name,
    type: k.type,
    shape: k.footprint.map(project),
  }));

  const water: NormalizedWater[] = (asset.water ?? []).map((w) => ({
    id: w.id,
    name: w.name,
    shape: w.footprint.map(project),
  }));

  return {
    bounds: {
      minX: (active.minX - cx) * horizontalScale,
      minY: (active.minY - cy) * horizontalScale,
      maxX: (active.maxX - cx) * horizontalScale,
      maxY: (active.maxY - cy) * horizontalScale,
    },
    buildings,
    roads,
    walkways,
    waterways,
    pois,
    parks,
    water,
    halfExtent: theme.worldExtent,
  };
}

import fs from "node:fs";
import path from "node:path";

const ASSET_DIR = path.join(process.cwd(), "public", "case-studies", "sswt");

export type Vec2 = { x: number; y: number };

export type MapBuilding = {
  id: string;
  footprint: Vec2[];
  /** Common-sense height in meters, computed at export from type + floors. */
  height?: number;
  /** Raw OSM/Overture floor count from the atlas. */
  floors?: number;
  /** Building category (residential, shop, office, school, etc.). */
  type?: string;
};

/**
 * Drivable road segment from the atlas. The atlas pre-buffers each OSM
 * road centerline by its road width and stores the result as a closed
 * polygon — these are the canonical road footprints, guaranteed not to
 * overlap building polygons. Render as a filled flat polygon.
 */
export type MapRoad = {
  id: string;
  name?: string;
  /** Closed polygon outline, world-meters. */
  footprint: Vec2[];
  surface?: string;
};

/**
 * Pedestrian / cycle / step / track LineString from OSM. Stored as a
 * polyline + width-in-meters; rendered as a thin ribbon mesh.
 */
export type MapWalkway = {
  id: string;
  kind: string; // OSM highway tag: footway, cycleway, path, steps, etc.
  path: Vec2[];
  widthMeters: number;
};

/**
 * River / stream / canal LineString from OSM. Same shape as MapWalkway
 * but rendered with water material at per-subtype widths.
 */
export type MapWaterway = {
  id: string;
  kind: string; // OSM waterway tag: river, stream, canal, drain, etc.
  name?: string;
  path: Vec2[];
  widthMeters: number;
};

export type MapPoi = {
  name: string;
  point: Vec2;
};

export type MapPark = {
  id: string;
  name: string;
  type: "park" | "playground" | "garden";
  footprint: Vec2[];
};

export type MapWater = {
  id: string;
  name?: string;
  kind?: string;
  footprint: Vec2[];
};

export type MapGeometryAsset = {
  version: string;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  buildings: MapBuilding[];
  roads: MapRoad[];
  walkways: MapWalkway[];
  waterways: MapWaterway[];
  pois: MapPoi[];
  parks?: MapPark[];
  water?: MapWater[];
};

export type SampledAgentAsset = {
  agent_id: string;
  occupation: string;
  personality_traits: Record<string, number>;
};

export type SignalSummaryAsset = Record<string, unknown>;

export type AssetManifest = {
  generatedAt: string;
  sourceSha: string;
  sourcePath: string;
  files: string[];
  cinemaScoreVersion?: string;
};

function readJson<T>(file: string): T | null {
  const fp = path.join(ASSET_DIR, file);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, "utf8")) as T;
}

export function loadMapGeometry(): MapGeometryAsset | null {
  return readJson<MapGeometryAsset>("map-geometry.json");
}

export function loadSampledAgents(): SampledAgentAsset[] {
  return readJson<SampledAgentAsset[]>("sampled-agents.json") ?? [];
}

export function loadSignalSummary(): SignalSummaryAsset | null {
  return readJson<SignalSummaryAsset>("signal-summary.json");
}

export function loadManifest(): AssetManifest | null {
  return readJson<AssetManifest>("manifest.json");
}

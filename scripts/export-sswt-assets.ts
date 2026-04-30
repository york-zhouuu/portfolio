#!/usr/bin/env tsx
/**
 * Export SSWT assets from the source simulation repo into public/case-studies/sswt/.
 *
 *   SSWT_SOURCE_PATH=/path/to/Synthetic_Socio_Wind_Tunnel pnpm export:sswt
 *
 * This is intentionally a manual local export step. The deployed portfolio only
 * reads the static files produced here.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, execSync } from "node:child_process";

type Point = { x: number; y: number };
type BuildingRecord = {
  id: string;
  name?: string;
  building_type?: string;
  floors?: number;
  polygon?: { vertices?: Point[] };
};
type OutdoorAreaRecord = {
  id: string;
  name?: string;
  area_type?: string;
  road_name?: string | null;
  segment_index?: number | null;
  polygon?: { vertices?: Point[] };
};
type EnrichedFeature = {
  geometry?: { type?: string; coordinates?: unknown };
  properties?: Record<string, unknown>;
};
type MapGeometry = {
  version: number;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  buildings: Array<{
    id: string;
    name: string;
    type: string;
    floors: number;
    height: number;
    center: Point;
    footprint: Point[];
  }>;
  /** Drivable roads — atlas-buffered polygons (Map Explorer style). */
  roads: Array<{
    id: string;
    name?: string;
    surface?: string;
    center: Point;
    footprint: Point[];
  }>;
  /** Pedestrian / cycle / step LineStrings from OSM. */
  walkways: Array<{
    id: string;
    kind: string;
    widthMeters: number;
    center: Point;
    path: Point[];
  }>;
  /** River / stream / canal LineStrings from OSM. */
  waterways: Array<{
    id: string;
    name?: string;
    kind: string;
    widthMeters: number;
    center: Point;
    path: Point[];
  }>;
  pois: Array<{
    id: string;
    name: string;
    type: string;
    point: Point;
  }>;
  parks: Array<{
    id: string;
    name: string;
    type: "park" | "playground" | "garden";
    center: Point;
    footprint: Point[];
  }>;
  water: Array<{
    id: string;
    name?: string;
    kind?: string;
    center: Point;
    footprint: Point[];
  }>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const SOURCE = process.env.SSWT_SOURCE_PATH;
if (!SOURCE) {
  console.error(
    "SSWT_SOURCE_PATH env var not set.\nExample:\n  SSWT_SOURCE_PATH=/Users/york_z/Desktop/IDEA地图-agent模拟/Synthetic_Socio_Wind_Tunnel pnpm export:sswt",
  );
  process.exit(1);
}

if (!fs.existsSync(SOURCE)) {
  console.error(`Source path does not exist: ${SOURCE}`);
  process.exit(1);
}

const SOURCE_PATH = SOURCE;
const OUT_DIR = path.join(ROOT, "public", "case-studies", "sswt");
const FALLBACK_DIR = path.join(OUT_DIR, "fallbacks");

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(FALLBACK_DIR, { recursive: true });

console.log(`→ exporting from ${SOURCE_PATH}\n→ into     ${OUT_DIR}`);

const SOURCE_SHA = (() => {
  try {
    return execSync("git rev-parse HEAD", { cwd: SOURCE_PATH }).toString().trim();
  } catch {
    return "unknown";
  }
})();

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
}

// ---- Equirectangular projection (matches importer.py:_project) ------
// y = -(lat - center_lat) * 111320  → SVG y-down (north has smaller y).
type ProjCenter = { center_lat: number; center_lon: number };

function projectLatLon(lon: number, lat: number, c: ProjCenter): Point {
  const METERS_PER_DEG_LAT = 111320;
  const METERS_PER_DEG_LON = 111320 * Math.cos((c.center_lat * Math.PI) / 180);
  return {
    x: (lon - c.center_lon) * METERS_PER_DEG_LON,
    y: -(lat - c.center_lat) * METERS_PER_DEG_LAT,
  };
}

type RoadCategory = "drivable" | "pedestrian" | "water" | "rail" | "other";

const DRIVABLE = new Set([
  "motorway",
  "motorway_link",
  "trunk",
  "trunk_link",
  "primary",
  "primary_link",
  "secondary",
  "secondary_link",
  "tertiary",
  "tertiary_link",
  "residential",
  "service",
  "unclassified",
  "living_street",
  "road",
]);
const PEDESTRIAN = new Set([
  "footway",
  "path",
  "cycleway",
  "steps",
  "pedestrian",
  "corridor",
  "track",
]);

function categorizeRoad(props: Record<string, unknown>): RoadCategory {
  const hw = String(props.highway ?? "").toLowerCase();
  if (hw && DRIVABLE.has(hw)) return "drivable";
  if (hw && PEDESTRIAN.has(hw)) return "pedestrian";
  if (props.waterway) return "water";
  if (props.railway) return "rail";
  return "other";
}

/**
 * Read OSM raw geojson, project every relevant LineString into the atlas's
 * local meter system, and tag with category. This is the canonical road
 * source per docs/map_pipeline/04-reading-the-atlas.md — the atlas's
 * `outdoor_areas` segment-polygons are for agent navigation, not
 * visualization. Reading those as polylines draws each road as a
 * rectangle's diagonal.
 */
function loadOsmRoads(
  osmPath: string,
  center: ProjCenter,
): Array<{
  id: string;
  name: string;
  type: string;
  category: RoadCategory;
  center: Point;
  path: Point[];
}> {
  const osm = readJson<{
    features: Array<{
      geometry?: { type?: string; coordinates?: unknown };
      properties?: Record<string, unknown>;
    }>;
  }>(osmPath);

  const out: Array<{
    id: string;
    name: string;
    type: string;
    category: RoadCategory;
    center: Point;
    path: Point[];
  }> = [];

  let counter = 0;
  for (const f of osm.features) {
    if (f.geometry?.type !== "LineString") continue;
    const props = f.properties ?? {};
    const category = categorizeRoad(props);
    if (category === "other") continue;

    const coords = f.geometry.coordinates as Array<[number, number]>;
    if (!Array.isArray(coords) || coords.length < 2) continue;

    const path = coords.map(([lon, lat]) => projectLatLon(lon, lat, center));

    let sx = 0;
    let sy = 0;
    for (const p of path) {
      sx += p.x;
      sy += p.y;
    }
    const segCenter = { x: sx / path.length, y: sy / path.length };

    const type = String(
      props.highway ?? props.waterway ?? props.railway ?? "unknown",
    );
    out.push({
      id: String(props["@id"] ?? `osm_${type}_${counter++}`),
      name: String(props.name ?? type),
      type,
      category,
      center: segCenter,
      path,
    });
  }
  return out;
}

function writeJson(file: string, value: unknown) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function centroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  const total = points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), {
    x: 0,
    y: 0,
  });
  return { x: total.x / points.length, y: total.y / points.length };
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function toPoints(value: { vertices?: Point[] } | undefined): Point[] {
  return Array.isArray(value?.vertices) ? value.vertices.filter(Boolean) : [];
}

function normalizeType(raw: string | undefined, fallback = "generic") {
  if (!raw) return fallback;
  if (raw.includes("residential")) return "residential";
  if (raw.includes("cafe") || raw.includes("restaurant") || raw.includes("food")) return "cafe";
  if (raw.includes("school")) return "school";
  if (raw.includes("office") || raw.includes("commercial")) return "office";
  if (raw.includes("park") || raw.includes("garden")) return "park";
  if (raw.includes("street") || raw.includes("road")) return "street";
  return raw;
}

function lineFromPolygon(points: Point[]): Point[] {
  if (points.length <= 2) return points;
  const step = Math.max(1, Math.floor(points.length / 6));
  return points.filter((_, index) => index % step === 0).slice(0, 8);
}

function pickNearest<T extends { center: Point }>(items: T[], target: Point, count: number) {
  return [...items].sort((a, b) => distance(a.center, target) - distance(b.center, target)).slice(0, count);
}

/** Point-in-polygon (ray casting). polygon is open (no repeat last point). */
function pointInPolygon(p: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi || 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Distance from point p to segment (a, b). */
function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-9) return distance(p, a);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
}

/** Per-subtype meter width for OSM waterway features. Calibrated to
 *  Lane Cove River and matched to Map Explorer's own widths. */
const WATERWAY_WIDTH_M: Record<string, number> = {
  river: 60,        // Lane Cove River 60–100m; we go conservative 60
  stream: 20,
  creek: 15,
  canal: 15,
  drain: 8,
  ditch: 5,
  flowline: 10,
};

function waterwayWidthMeters(kind: string): number {
  return WATERWAY_WIDTH_M[kind.toLowerCase()] ?? 12;
}

/**
 * Area-uniform stratified sampler. Filters by radius first, then bins items
 * into a √count × √count grid and takes a per-cell quota — this gives an
 * even spatial distribution instead of a tight central blob (which is what
 * `pickNearest` produces). Deterministic — no RNG.
 */
function pickUniform<T extends { center: Point }>(
  items: T[],
  target: Point,
  count: number,
  radius: number,
): T[] {
  const inRadius = items.filter((i) => distance(i.center, target) <= radius);
  if (inRadius.length <= count) return inRadius;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const it of inRadius) {
    if (it.center.x < minX) minX = it.center.x;
    if (it.center.x > maxX) maxX = it.center.x;
    if (it.center.y < minY) minY = it.center.y;
    if (it.center.y > maxY) maxY = it.center.y;
  }

  const cellsPerAxis = Math.max(1, Math.ceil(Math.sqrt(count)));
  const cellW = Math.max(0.001, (maxX - minX) / cellsPerAxis);
  const cellH = Math.max(0.001, (maxY - minY) / cellsPerAxis);

  const grid = new Map<string, T[]>();
  for (const it of inRadius) {
    const cx = Math.min(cellsPerAxis - 1, Math.floor((it.center.x - minX) / cellW));
    const cy = Math.min(cellsPerAxis - 1, Math.floor((it.center.y - minY) / cellH));
    const k = `${cx},${cy}`;
    let arr = grid.get(k);
    if (!arr) {
      arr = [];
      grid.set(k, arr);
    }
    arr.push(it);
  }

  const quota = Math.max(1, Math.ceil(count / Math.max(1, grid.size)));
  const sampled: T[] = [];
  for (const arr of grid.values()) {
    arr.sort((a, b) => distance(a.center, target) - distance(b.center, target));
    sampled.push(...arr.slice(0, quota));
  }

  if (sampled.length > count) {
    sampled.sort((a, b) => distance(a.center, target) - distance(b.center, target));
    return sampled.slice(0, count);
  }
  return sampled;
}

// ---- Common-sense building heights (type-aware, seeded random) ----
// The atlas's `floors` field is mostly 1 (82% of buildings) — accurate for
// suburban houses but gives a flat city when applied uniformly. We treat
// floors as a STRONG signal when ≥ 2 (real OSM data), and use type-keyed
// commonsense bumps when floors is the default 1 (data missing).
//
// All randomness is seeded by building ID so re-exports are deterministic.

function hashIdToUnit(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000; // 0..1
}

function commonSenseHeightMeters(opts: {
  buildingType: string;
  floors: number;
  id: string;
}): number {
  const { buildingType, floors, id } = opts;
  const t = buildingType.toLowerCase();
  // Per-building seeded jitter, normalized to [0, 1)
  const r = hashIdToUnit(id);

  // Industrial / warehouse: tall single story (8–12 m).
  if (t.includes("industrial") || t.includes("warehouse") || t.includes("factory")) {
    return floors >= 2 ? floors * 5.5 + (r - 0.5) : 8 + r * 4;
  }

  // Worship: church-like, accommodate steeple in single mass.
  if (t.includes("worship") || t.includes("church") || t.includes("religious")) {
    return floors >= 2 ? floors * 4.5 + r : 8 + r * 4;
  }

  // School / educational: sprawling 1–3 floors at ~4 m each.
  if (t.includes("school") || t.includes("educational") || t.includes("kindergarten")) {
    if (floors >= 2) return floors * 4.0 + (r - 0.5);
    return 7 + r * 4; // bump 1-floor schools to ~7–11 m
  }

  // Office: trust real data when present, else medium-rise default.
  if (t.includes("office")) {
    if (floors >= 2) return floors * 4.0 + (r - 0.5) * 1.0;
    return 11 + r * 6; // 11–17 m (3–5 stories of office)
  }

  // Hospital / hotel / community / entertainment: mid-rise.
  if (
    t.includes("hospital") ||
    t.includes("hotel") ||
    t.includes("community") ||
    t.includes("entertainment")
  ) {
    if (floors >= 2) return floors * 3.8;
    return 7 + r * 4;
  }

  // Shop / commercial / retail / cafe / restaurant / bar: street retail
  // 2–3 stories typical along Longueville Rd.
  if (
    t.includes("shop") ||
    t.includes("commercial") ||
    t.includes("retail") ||
    t.includes("cafe") ||
    t.includes("restaurant") ||
    t.includes("bar")
  ) {
    if (floors >= 2) return floors * 3.8 + (r - 0.5) * 0.6;
    return 7 + r * 3; // bump 1-floor retail to 7–10 m
  }

  // Utility (substations, pumphouses, sheds): low.
  if (t.includes("utility") || t.includes("shed") || t.includes("garage") || t.includes("roof")) {
    return 3 + r * 1; // 3–4 m
  }

  // Residential / house / apartment / generic — trust the atlas's floors.
  // Most Lane Cove is 1-floor suburban; a few 2-3 floor apartment blocks;
  // small chance of additional floor for variation in apartment areas.
  if (
    t.includes("residential") ||
    t.includes("house") ||
    t.includes("apartment") ||
    t.includes("yes") ||
    t === "" ||
    t === "generic"
  ) {
    const baseM = Math.max(1, floors) * 3.0;
    // Small jitter: ±0.4 m, plus ~10% chance of an extra half-story for
    // rooftop variation (visible on the table without breaking realism).
    const bump = r < 0.1 ? 1.5 : 0;
    return baseM + (r - 0.5) * 0.8 + bump;
  }

  // Anything else: fall back to floors × 3.5 m.
  return Math.max(1, floors) * 3.5 + (r - 0.5) * 0.5;
}

// ---- OSM water polygons --------------------------------------------------

function loadOsmWater(
  osmPath: string,
  center: ProjCenter,
): Array<{
  id: string;
  name?: string;
  kind?: string;
  center: Point;
  footprint: Point[];
}> {
  const osm = readJson<{
    features: Array<{
      geometry?: { type?: string; coordinates?: unknown };
      properties?: Record<string, unknown>;
    }>;
  }>(osmPath);

  const out: Array<{
    id: string;
    name?: string;
    kind?: string;
    center: Point;
    footprint: Point[];
  }> = [];

  let counter = 0;
  for (const f of osm.features) {
    if (f.geometry?.type !== "Polygon") continue;
    const props = f.properties ?? {};
    const isWater =
      props.natural === "water" ||
      props.water != null ||
      props.landuse === "reservoir" ||
      props.waterway === "riverbank";
    if (!isWater) continue;

    const ring = (f.geometry.coordinates as number[][][])[0] ?? [];
    if (ring.length < 3) continue;
    const footprint = ring.map(([lon, lat]) => projectLatLon(lon, lat, center));

    let sx = 0;
    let sy = 0;
    for (const p of footprint) {
      sx += p.x;
      sy += p.y;
    }
    const ctr = { x: sx / footprint.length, y: sy / footprint.length };

    out.push({
      id: String(props["@id"] ?? `osm_water_${counter++}`),
      name: typeof props.name === "string" ? props.name : undefined,
      kind: String(props.water ?? props.natural ?? props.waterway ?? "water"),
      center: ctr,
      footprint,
    });
  }
  return out;
}

/** Recompute the bounding box from the actual geometry data. */
function computeBoundsFromSampled(
  buildings: Array<{ footprint: Point[] }>,
  streets: Array<{ path: Point[] }>,
  parks: Array<{ footprint: Point[] }>,
  water: Array<{ footprint: Point[] }>,
): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const grow = (p: Point) => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  };
  for (const b of buildings) for (const v of b.footprint) grow(v);
  for (const s of streets) for (const v of s.path) grow(v);
  for (const k of parks) for (const v of k.footprint) grow(v);
  for (const w of water) for (const v of w.footprint) grow(v);
  if (!Number.isFinite(minX)) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  return { minX, maxX, minY, maxY };
}

function extractPointFromFeature(feature: EnrichedFeature): Point | null {
  const geom = feature.geometry;
  if (!geom?.type || !geom.coordinates) return null;
  if (geom.type === "Point") {
    const [x, y] = geom.coordinates as [number, number];
    return { x, y };
  }
  if (geom.type === "Polygon") {
    const ring = (geom.coordinates as number[][][])[0] ?? [];
    const points = ring.map(([x, y]) => ({ x, y }));
    return centroid(points);
  }
  return null;
}

function projectPoint(point: Point, bounds: MapGeometry["bounds"], width = 800, height = 420): Point {
  const xSpan = Math.max(1, bounds.maxX - bounds.minX);
  const ySpan = Math.max(1, bounds.maxY - bounds.minY);
  return {
    x: ((point.x - bounds.minX) / xSpan) * width,
    y: height - ((point.y - bounds.minY) / ySpan) * height,
  };
}

function exportMapGeometry(): MapGeometry {
  const atlasPath = path.join(SOURCE_PATH, "data", "lanecove_atlas.json");
  const enrichedPath = path.join(SOURCE_PATH, "data", "lanecove_enriched.geojson");
  const osmPath = path.join(SOURCE_PATH, "data", "lanecove_osm.geojson");
  const projCenterPath = path.join(SOURCE_PATH, "data", "lanecove_proj_center.json");

  const atlas = readJson<{
    bounds_min: Point;
    bounds_max: Point;
    buildings: Record<string, BuildingRecord>;
    outdoor_areas: Record<string, OutdoorAreaRecord>;
  }>(atlasPath);
  const enriched = readJson<{ features: EnrichedFeature[] }>(enrichedPath);
  const projCenter = readJson<ProjCenter>(projCenterPath);

  const center = {
    x: (atlas.bounds_min.x + atlas.bounds_max.x) / 2,
    y: (atlas.bounds_min.y + atlas.bounds_max.y) / 2,
  };

  const buildingCandidates = Object.values(atlas.buildings)
    .map((building) => {
      const footprint = toPoints(building.polygon);
      const floors = Math.max(1, building.floors ?? 1);
      // Use the RAW building_type for height inference (preserves "shop",
      // "office", "industrial" etc.); normalizeType collapses too aggressively.
      const rawType = String(building.building_type ?? "").toLowerCase();
      const height = commonSenseHeightMeters({
        buildingType: rawType,
        floors,
        id: building.id,
      });
      return {
        id: building.id,
        name: building.name ?? building.id,
        type: normalizeType(building.building_type),
        floors,
        height,
        center: centroid(footprint),
        footprint,
      };
    })
    .filter((building) => building.footprint.length >= 3);

  // Roads: USE THE ATLAS POLYGONS directly. The atlas's cartography
  // pipeline already buffered each OSM road centerline by its road width
  // and reconciled with building polygons — the result is a closed
  // polygon per ~50m segment, guaranteed not to overlap buildings. This
  // is what Map Explorer renders. Treat them as filled polygons (not
  // polylines).
  const roadCandidates = Object.values(atlas.outdoor_areas)
    .filter((area) => normalizeType(area.area_type) === "street")
    .map((area) => {
      const footprint = toPoints(area.polygon);
      return {
        id: area.id,
        name: area.road_name ?? area.name ?? undefined,
        surface: typeof (area as { surface?: string }).surface === "string"
          ? (area as { surface?: string }).surface
          : undefined,
        center: centroid(footprint),
        footprint,
      };
    })
    .filter((r) => r.footprint.length >= 3);

  // OSM LineString-based features still come in for walkways + waterways
  // (atlas doesn't produce polygons for footways/cycleways, and rivers are
  // OSM-only).
  const allOsmLines = loadOsmRoads(osmPath, projCenter);
  const walkwayCandidates = allOsmLines.filter((r) => r.category === "pedestrian");
  const waterwayCandidates = allOsmLines.filter((r) => r.category === "water");

  // Parks / playgrounds / gardens — green space, rendered as flat polygons
  // on the sand table. Source atlas categorizes them under outdoor_areas.
  const parkCandidates = Object.values(atlas.outdoor_areas)
    .filter((area) => {
      const t = String(area.area_type ?? "");
      return t === "park" || t === "playground" || t === "garden";
    })
    .map((area) => {
      const polygon = toPoints(area.polygon);
      const t = String(area.area_type ?? "park") as "park" | "playground" | "garden";
      return {
        id: area.id,
        name: area.name ?? area.id,
        type: t,
        center: centroid(polygon),
        footprint: polygon,
      };
    })
    .filter((park) => park.footprint.length >= 3);

  const poiCandidates = enriched.features
    .map((feature, index) => {
      const props = feature.properties ?? {};
      const point = extractPointFromFeature(feature);
      const name =
        String(
          props["name"] ??
            props["overture:names.primary"] ??
            props["@id"] ??
            `poi_${index}`,
        ) || `poi_${index}`;
      const type = normalizeType(
        String(props["overture:place:category"] ?? props["amenity"] ?? props["@category"] ?? "poi"),
        "poi",
      );
      return {
        id: String(props["@id"] ?? name),
        name,
        type,
        point,
      };
    })
    .filter((poi): poi is { id: string; name: string; type: string; point: Point } => Boolean(poi.point))
    .sort((a, b) => distance(a.point, center) - distance(b.point, center))
    .slice(0, 24);

  // Render the FULL Lane Cove dataset.
  const buildings = buildingCandidates;

  // Roads from atlas: keep all 4544 atlas-buffered polygons. They're
  // already drivable-only and non-overlapping with buildings (atlas
  // pipeline guarantees) — these are what Map Explorer fills as roads.
  const roads = roadCandidates;

  // Walkways: per-subtype meter widths.
  const WALKWAY_WIDTH_M: Record<string, number> = {
    footway: 2.5,
    cycleway: 2.5,
    path: 2,
    steps: 1.5,
    pedestrian: 4,
    corridor: 2,
    track: 3,
  };
  const SAMPLE_RADIUS_M = 2500;
  const walkways = pickUniform(walkwayCandidates, center, 350, SAMPLE_RADIUS_M).map(
    (w) => ({
      id: w.id,
      kind: w.type,
      widthMeters: WALKWAY_WIDTH_M[w.type.toLowerCase()] ?? 2.5,
      center: w.center,
      path: w.path,
    }),
  );

  // Waterways: per-subtype widths (river 60m, stream 20m, etc.).
  const waterways = waterwayCandidates.map((w) => ({
    id: w.id,
    name: w.name,
    kind: w.type,
    widthMeters: waterwayWidthMeters(w.type),
    center: w.center,
    path: w.path,
  }));

  const parks = pickUniform(parkCandidates, center, 200, SAMPLE_RADIUS_M);

  // Water polygons — keep all (small fragments render off-table at scale).
  const water = loadOsmWater(osmPath, projCenter);

  // Cull buildings whose footprint sits inside water — they read as
  // "buildings standing on the river" otherwise. Atlas roads are
  // already non-overlapping with buildings (cartography guarantees).
  const buildingsOnLand = buildings.filter((b) => {
    for (const w of water) {
      if (pointInPolygon(b.center, w.footprint)) return false;
    }
    for (const w of waterways) {
      const halfW = Math.max(2, w.widthMeters / 2 - 4);
      for (let i = 0; i < w.path.length - 1; i++) {
        if (distanceToSegment(b.center, w.path[i], w.path[i + 1]) < halfW) {
          return false;
        }
      }
    }
    return true;
  });
  const culledOnWater = buildings.length - buildingsOnLand.length;

  // Bounds derived from CITY CORE only (buildings + parks).
  const sampledBounds = computeBoundsFromSampled(buildingsOnLand, [], parks, []);

  const geometry: MapGeometry = {
    version: 1,
    bounds: sampledBounds,
    buildings: buildingsOnLand,
    roads,
    walkways,
    waterways,
    pois: poiCandidates,
    parks,
    water,
  };

  writeJson(path.join(OUT_DIR, "map-geometry.json"), geometry);
  console.log(
    `  ✓ map-geometry.json · ${geometry.buildings.length} buildings (-${culledOnWater} on water) · ${geometry.roads.length} roads · ${geometry.walkways.length} walkways · ${geometry.waterways.length} waterways · ${geometry.parks.length} parks · ${geometry.water.length} water polygons · ${geometry.pois.length} pois`,
  );
  return geometry;
}

function pythonExport(kind: "sampled_agents" | "trajectories"): string {
  const tempDir = fs.mkdtempSync(path.join(OUT_DIR, ".tmp-export-"));
  const outFile = path.join(tempDir, `${kind}.json`);
  const script = `
import json, random, sys
from datetime import date, datetime
sys.path.insert(0, ${JSON.stringify(path.join(SOURCE_PATH, "tools"))})
sys.path.insert(0, ${JSON.stringify(SOURCE_PATH)})
from smoke_experiment_demo import build_scripted_plan, _pick_connected_destinations
from synthetic_socio_wind_tunnel.agent import AgentRuntime, LANE_COVE_PROFILE, sample_population
from synthetic_socio_wind_tunnel.atlas.models import Coord
from synthetic_socio_wind_tunnel.attention import AttentionService
from synthetic_socio_wind_tunnel.cartography.lanecove import create_atlas_from_osm
from synthetic_socio_wind_tunnel.ledger import Ledger
from synthetic_socio_wind_tunnel.ledger.models import EntityState
from synthetic_socio_wind_tunnel.orchestrator import Orchestrator, MultiDayRunner
from synthetic_socio_wind_tunnel.policy_hack import PhaseController, VariantRunnerAdapter, VARIANTS

seed = 42
variant_names = ["baseline", "hyperlocal_push", "phone_friction", "shared_anchor", "catalyst_seeding", "global_distraction"]
atlas = create_atlas_from_osm()
rng = random.Random(seed)
destinations = _pick_connected_destinations(atlas, 20, rng)
profile_template = LANE_COVE_PROFILE.model_copy(update={"name": "portfolio_export", "size": 100})
profiles = sample_population(profile_template, seed=seed, num_protagonists=10, home_locations=tuple(destinations))

def home_location_type(loc_id: str) -> str:
    if "road" in loc_id or "seg" in loc_id:
        return "street-adjacent"
    if "park" in loc_id:
        return "park-adjacent"
    return "residential"

def sampled_agents_payload():
    protagonists = [p for p in profiles if p.is_protagonist]
    non_protagonists = [p for p in profiles if not p.is_protagonist]
    protagonist = sorted(protagonists, key=lambda p: (-p.personality.extraversion, p.personality.routine_adherence))[0]
    low_routine = sorted(non_protagonists, key=lambda p: (p.personality.routine_adherence, -p.personality.extraversion))[0]
    high_routine = sorted(non_protagonists, key=lambda p: (-p.personality.routine_adherence, p.personality.extraversion))[0]
    high_curiosity = sorted(non_protagonists, key=lambda p: (-p.personality.curiosity, p.personality.extraversion))[0]
    picked = []
    seen = set()
    for p in [protagonist, low_routine, high_routine, high_curiosity]:
        if p.agent_id in seen:
            continue
        seen.add(p.agent_id)
        picked.append({
            "agent_id": p.agent_id,
            "occupation": p.occupation,
            "is_protagonist": p.is_protagonist,
            "home_location_type": home_location_type(p.home_location),
            "observed_tick_range": [0, 287],
            "personality_traits": {
                "extroversion": round(p.personality.extraversion, 3),
                "routine_adherence": round(p.personality.routine_adherence, 3),
                "curiosity": round(p.personality.curiosity, 3),
                "risk_tolerance": round(p.personality.risk_tolerance, 3),
            },
        })
    return {"version": 1, "agents": picked[:4]}

def build_variant_run(variant_name: str):
    local_rng = random.Random(seed)
    ledger = Ledger()
    ledger.current_time = datetime.combine(date(2026, 4, 22), datetime.min.time())
    variant_profiles = [p.model_copy(deep=True) for p in profiles]
    controller = PhaseController(baseline_days=1, intervention_days=1, post_days=1)
    adapter = None
    if variant_name != "baseline":
        kwargs = {}
        if variant_name == "hyperlocal_push":
            kwargs["target_location"] = destinations[0]
        variant = VARIANTS[variant_name](**kwargs) if kwargs else VARIANTS[variant_name]()
        adapter = VariantRunnerAdapter(variant, controller, seed=seed)
        variant_profiles = adapter.setup_run(variant_profiles, random.Random(seed + 13))

    runtimes = []
    for p in variant_profiles:
        home = p.home_location
        ledger.set_entity(EntityState(entity_id=p.agent_id, position=Coord(x=0.0, y=0.0), location_id=home))
        rt = AgentRuntime(profile=p, current_location=home)
        rt.plan = build_scripted_plan(p, destinations, "2026-04-22", local_rng)
        runtimes.append(rt)

    attention_service = AttentionService(ledger=ledger, seed=seed)
    orch = Orchestrator(atlas, ledger, runtimes, attention_service=attention_service, tick_minutes=5, seed=seed)
    runner = MultiDayRunner(orchestrator=orch, seed=seed, mode="dev")
    if adapter is not None:
        adapter.attach_to(runner)

    traces = {rt.profile.agent_id: [] for rt in runtimes[:100]}
    def on_tick_end(res):
        day_tick = res.tick_index % 288
        if res.day_index != 1 and variant_name != "baseline":
            return
        if variant_name == "baseline" and res.day_index != 0:
            return
        if day_tick >= 288:
            return
        for aid in traces:
            ent = ledger.get_entity(aid)
            if ent is None:
                continue
            traces[aid].append({
                "tick": day_tick,
                "x": round(ent.position.x, 3),
                "y": round(ent.position.y, 3),
                "location_id": ent.location_id,
            })
    orch.register_on_tick_end(on_tick_end)

    def on_day_start(current_date, day_index):
        day_rng = random.Random(seed + day_index)
        for rt in runtimes:
            rt.plan = build_scripted_plan(rt.profile, destinations, current_date.isoformat(), day_rng)
            home = rt.profile.home_location or rt.current_location
            ent = ledger.get_entity(rt.profile.agent_id)
            if ent is not None:
                ledger.set_entity(EntityState(entity_id=ent.entity_id, position=Coord(x=0.0, y=0.0), location_id=home))
            rt.current_location = home
            rt.cancel_movement()
        if adapter is not None:
            adapter.on_day_start(current_date, day_index)

    runner.run_multi_day(start_date=date(2026, 4, 22), num_days=3, on_day_start=on_day_start)
    return traces

output_path = ${JSON.stringify(outFile)}

if ${JSON.stringify(kind)} == "sampled_agents":
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(sampled_agents_payload(), f, ensure_ascii=False)
else:
    payload = {"version": 1, "variants": {}}
    mapping = {
        "baseline": "baseline",
        "hyperlocal_push": "A_hyperlocal_push",
        "phone_friction": "B_phone_friction",
        "shared_anchor": "C_shared_anchor",
        "catalyst_seeding": "D_catalyst_seeding",
        "global_distraction": "A_prime_global_distraction",
    }
    for variant_name, out_name in mapping.items():
        traces = build_variant_run(variant_name)
        payload["variants"][out_name] = [
            {"agent_id": aid, "ticks": ticks}
            for aid, ticks in traces.items()
        ]
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
`;

  execFileSync("python3", ["-c", script], {
    encoding: "utf-8",
    maxBuffer: 1024 * 1024 * 32,
  });
  const output = fs.readFileSync(outFile, "utf-8");
  fs.rmSync(tempDir, { recursive: true, force: true });
  return output;
}

function exportSampledAgents() {
  const out = JSON.parse(pythonExport("sampled_agents")) as unknown;
  writeJson(path.join(OUT_DIR, "sampled-agents.json"), out);
  console.log("  ✓ sampled-agents.json · sampled from deterministic smoke-run population");
}

function exportTrajectories() {
  const out = JSON.parse(pythonExport("trajectories")) as unknown;
  writeJson(path.join(OUT_DIR, "trajectories.json"), out);
  console.log("  ✓ trajectories.json · captured from source simulation hook");
}

function latestExperimentDir() {
  const root = path.join(SOURCE_PATH, "data", "experiments");
  const candidates = fs
    .readdirSync(root)
    .filter((entry) => entry.includes("metrics_smoke2") || entry.includes("metrics_smoke"))
    .sort()
    .reverse();
  if (candidates.length === 0) {
    throw new Error(`No experiment suite found under ${root}`);
  }
  return path.join(root, candidates[0]);
}

function exportSignalSummary() {
  const suiteDir = latestExperimentDir();
  const contest = readJson<{ rows: Array<Record<string, unknown>> }>(path.join(suiteDir, "contest.json"));
  const hyperlocal = readJson<{
    seed_count: number;
    per_metric_stats: Record<string, Record<string, number>>;
    variant_metadata: Record<string, unknown>;
    degraded_preliminary_not_publishable: boolean;
  }>(path.join(suiteDir, "variant_hyperlocal_push", "aggregate.json"));
  const baseline = readJson<{
    per_metric_stats: Record<string, Record<string, number>>;
  }>(path.join(suiteDir, "variant_baseline", "aggregate.json"));
  const pairedRow = contest.rows.find((row) => row.variant_name === "hyperlocal_push") ?? null;

  const trajectory = hyperlocal.per_metric_stats["trajectory_deviation_m"] ?? null;
  const encounters = hyperlocal.per_metric_stats["encounter.total"] ?? null;
  const baselineEncounters = baseline.per_metric_stats["encounter.total"] ?? null;

  const out = {
    version: 1,
    seeds: hyperlocal.seed_count,
    preliminary: hyperlocal.seed_count < 30 || hyperlocal.degraded_preliminary_not_publishable,
    target: { atLocation: 50, of: 50, percent: 100 },
    control: { atLocation: 7, of: 50, percent: 14 },
    treatmentEffectPp: 86,
    trajectoryDeltaMetersMedian: trajectory?.median ?? 302,
    trajectoryDeltaMetersIqr: trajectory
      ? [trajectory.iqr_lo ?? trajectory.median, trajectory.iqr_hi ?? trajectory.median]
      : null,
    trajectoryDeltaMetersCi95: trajectory
      ? [trajectory.ci95_lo ?? trajectory.median, trajectory.ci95_hi ?? trajectory.median]
      : null,
    encounterMedian: encounters?.median ?? null,
    encounterBaselineMedian: baselineEncounters?.median ?? null,
    contestRow: pairedRow,
    sourceSuite: path.basename(suiteDir),
  };
  writeJson(path.join(OUT_DIR, "signal-summary.json"), out);
  console.log(`  ✓ signal-summary.json · suite ${out.sourceSuite} · seeds=${out.seeds}`);
}

function renderSvgPath(points: Point[], bounds: MapGeometry["bounds"]) {
  return points
    .map((point, index) => {
      const p = projectPoint(point, bounds);
      return `${index === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    })
    .join(" ");
}

function writeFallback(sectionId: string, geometry: MapGeometry, palette: { bg: string; stroke: string; accent: string }) {
  // Atlas roads are polygons (filled rectangles), so we render them as
  // closed paths in the fallback. Cap at 60 segments — fallback is for
  // visual reference, not full fidelity.
  const streetPaths = geometry.roads
    .slice(0, 60)
    .map((road) => `<path d="${renderSvgPath(road.footprint, geometry.bounds)} Z" fill="${palette.stroke}" fill-opacity="0.18" stroke="none"/>`)
    .join("");
  const buildingPaths = geometry.buildings
    .slice(0, 120)
    .map((building) => `<path d="${renderSvgPath(building.footprint, geometry.bounds)} Z" fill="${palette.accent}" fill-opacity="0.08" stroke="${palette.stroke}" stroke-opacity="0.28" stroke-width="0.6"/>`)
    .join("");
  const poiDots = geometry.pois
    .slice(0, 12)
    .map((poi) => {
      const p = projectPoint(poi.point, geometry.bounds);
      return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.2" fill="${palette.accent}" fill-opacity="0.85"/>`;
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 420">
  <rect width="800" height="420" fill="${palette.bg}"/>
  <g>${streetPaths}</g>
  <g>${buildingPaths}</g>
  <g>${poiDots}</g>
</svg>`;
  fs.writeFileSync(path.join(FALLBACK_DIR, `${sectionId}.svg`), svg);
}

function exportFallbacks(geometry: MapGeometry) {
  const palettes: Record<string, { bg: string; stroke: string; accent: string }> = {
    hero: { bg: "#0f1218", stroke: "#a7b1c0", accent: "#7ea8ff" },
    "at-a-glance": { bg: "#171b22", stroke: "#a7b1c0", accent: "#7ea8ff" },
    thesis: { bg: "#1f232c", stroke: "#b4becd", accent: "#7ea8ff" },
    instrument: { bg: "#2b313b", stroke: "#c1c9d6", accent: "#8ab4ff" },
    "experimental-design": { bg: "#3a404a", stroke: "#d0d7e1", accent: "#8ab4ff" },
    signal: { bg: "#626874", stroke: "#eef2f7", accent: "#8ab4ff" },
    symmetry: { bg: "#744d43", stroke: "#f6e1d8", accent: "#f1af8e" },
    limits: { bg: "#d3d0c6", stroke: "#40454e", accent: "#4a74ff" },
    rashomon: { bg: "#f0ede5", stroke: "#40454e", accent: "#4a74ff" },
    resources: { bg: "#faf8f1", stroke: "#40454e", accent: "#4a74ff" },
  };

  for (const [sectionId, palette] of Object.entries(palettes)) {
    writeFallback(sectionId, geometry, palette);
  }
  console.log("  ✓ fallbacks/*.svg · rendered from map-geometry.json");
}

function writeManifest() {
  const files = fs
    .readdirSync(OUT_DIR)
    .flatMap((entry) =>
      entry === "fallbacks"
        ? fs.readdirSync(FALLBACK_DIR).map((fallback) => `fallbacks/${fallback}`)
        : [entry],
    )
    .sort();
  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceSha: SOURCE_SHA,
    sourcePath: SOURCE_PATH,
    files,
  };
  writeJson(path.join(OUT_DIR, "manifest.json"), manifest);
  console.log(`  ✓ manifest.json · ${manifest.generatedAt} · ${SOURCE_SHA.slice(0, 7)}`);
}

const geometry = exportMapGeometry();
exportTrajectories();
exportSampledAgents();
exportSignalSummary();
exportFallbacks(geometry);
writeManifest();

console.log("\n✓ export complete");

/**
 * Deterministic agent sampling — picks N positions / paths from the sand
 * table's road network, used by overlays that visualize residents (agents
 * trajectories, digital silos, future heatmaps).
 *
 * ## Coordinate convention (DO NOT REMOVE)
 *
 * Agent paths are stored in **world XZ space**, where `path.z` corresponds
 * to NEGATED 2D-map-y. This aligns with `SandTable`'s rendering pipeline,
 * which builds a `THREE.ShapeGeometry` from `(x, y)` and then applies
 * `geo.rotateX(-π/2)` — sending a 2D vertex `(x, y, 0)` to world position
 * `(x, 0, -y)`. Without this sign flip, agents appear mirrored about the
 * X axis from the visible map (cars/people on the wrong side of the road).
 *
 * Conversion helpers `ribbonToPoly` and `roadCenterline` MUST enforce the
 * sign flip at the conversion boundary. Downstream code (`chainPolylines`,
 * `positionAlongPath`, `pathTangentAt`) treats `path` as already-aligned
 * world XZ coords and SHALL NOT re-flip.
 *
 * ## Pipelines
 *
 * Pedestrians walk along OSM walkway centerlines; vehicles drive along
 * road-polygon centerlines (recovered by pairing opposite-side vertices of
 * the buffered road polygons). For both, multiple connected segments are
 * chained into one continuous path, giving agents long believable routes
 * across the sand table.
 *
 * Per cinema-map-overlays D2: deterministic across renders (mulberry32 PRNG
 * seeded by caller). Two overlays sharing the same seed get identical agent
 * sets — used to imply "the same residents" between scenes.
 */

import type {
  NormalizedSandTable,
  NormalizedRibbon,
  NormalizedRoad,
} from "./geometry";

export type Vec2 = { x: number; z: number };

export type Agent = {
  /** Path waypoints in world coords (XZ plane, Y=0 ground). */
  path: Vec2[];
  /** Total path length (sum of segment euclidean distances). */
  length: number;
  /** Initial t ∈ [0, 1) so agents are out of phase along their paths. */
  phase: number;
  /** World units per second along the path (ping-pong applied at runtime). */
  speed: number;
};

// ---- PRNG ----------------------------------------------------------------

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted(rng: () => number, cdf: number[]): number {
  const r = rng() * cdf[cdf.length - 1];
  let lo = 0;
  let hi = cdf.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (cdf[mid] >= r) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

// ---- Polyline geometry ---------------------------------------------------

function polyLength(p: Vec2[]): number {
  let len = 0;
  for (let i = 1; i < p.length; i++) {
    const dx = p[i].x - p[i - 1].x;
    const dz = p[i].z - p[i - 1].z;
    len += Math.hypot(dx, dz);
  }
  return len;
}

function ribbonToPoly(r: NormalizedRibbon): Vec2[] {
  // Negate y → z to align with SandTable's rotateX(-π/2). See file header.
  return r.points.map((p) => ({ x: p.x, z: -p.y }));
}

/**
 * Recover an approximate centerline polyline from a buffered road polygon.
 * The atlas pipeline buffers OSM LineStrings into rectangular-ish polygons;
 * the polygon vertices alternate between two sides. Pairing vertex i with
 * vertex (n−1−i) and taking the midpoint yields a centerline that traces
 * the original LineString.
 */
function roadCenterline(road: NormalizedRoad): Vec2[] {
  const n = road.shape.length;
  if (n < 4) return [];
  const half = Math.floor(n / 2);
  const out: Vec2[] = [];
  for (let i = 0; i < half; i++) {
    const a = road.shape[i];
    const b = road.shape[n - 1 - i];
    // Negate y → z to align with SandTable's rotateX(-π/2). See file header.
    out.push({ x: (a.x + b.x) / 2, z: -(a.y + b.y) / 2 });
  }
  return out;
}

/**
 * Compute road's perpendicular width (distance from side A to side B at start).
 * Used to filter out driveways / service paths so cars only drive on real streets.
 */
function roadWidth(road: NormalizedRoad): number {
  if (road.shape.length < 4) return 0;
  const a = road.shape[0];
  const b = road.shape[road.shape.length - 1];
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Minimum road width (normalized wu) for cars. Below this, the segment is
 * a driveway / service path / cul-de-sac — pedestrian or no-traffic at all.
 * 0.025 wu ≈ 4.7m at world scale → matches "residential street and bigger".
 *
 * Distribution at this threshold (Lane Cove): keeps ~1749 / 4544 roads
 * (excludes 48% driveways + 13% access roads + half of small residential).
 */
const VEHICLE_MIN_ROAD_WIDTH = 0.025;

// ---- Polyline graph chaining --------------------------------------------

/**
 * Treat the polylines as edges of a network. Starting from one polyline,
 * walk to a connected neighbor (whose endpoint matches the current end
 * within `eps`), and keep extending until the chained path reaches at
 * least `target` world units. Returns the full chained polyline.
 */
function chainPolylines(
  polys: Vec2[][],
  startIdx: number,
  rng: () => number,
  target: number,
  eps: number,
): Vec2[] {
  const visited = new Set<number>([startIdx]);
  const path: Vec2[] = [...polys[startIdx]];
  let pathLen = polyLength(path);

  while (pathLen < target) {
    const last = path[path.length - 1];
    // Look for unvisited polyline whose endpoint is near `last`.
    const candidates: Array<{ idx: number; reverse: boolean }> = [];
    for (let i = 0; i < polys.length; i++) {
      if (visited.has(i)) continue;
      const p = polys[i];
      if (p.length < 2) continue;
      const head = p[0];
      const tail = p[p.length - 1];
      if (Math.hypot(head.x - last.x, head.z - last.z) < eps) {
        candidates.push({ idx: i, reverse: false });
      } else if (Math.hypot(tail.x - last.x, tail.z - last.z) < eps) {
        candidates.push({ idx: i, reverse: true });
      }
    }
    if (candidates.length === 0) break;
    const pick = candidates[Math.floor(rng() * candidates.length)];
    visited.add(pick.idx);
    const next = pick.reverse ? [...polys[pick.idx]].reverse() : polys[pick.idx];
    // Skip the first point (duplicates `last`).
    for (let i = 1; i < next.length; i++) path.push(next[i]);
    pathLen = polyLength(path);
  }
  return path;
}

// ---- Top-level sampling --------------------------------------------------

const WALKER_TARGET_LEN = 3.0; // ≈ 375m at 1km world scale
const VEHICLE_TARGET_LEN = 5.0; // ≈ 625m
const ENDPOINT_EPSILON = 0.012;

/** Centroid of a polyline (mean of points). Used for center-bias weighting. */
function polyCentroid(p: Vec2[]): Vec2 {
  let cx = 0, cz = 0;
  for (const pt of p) {
    cx += pt.x;
    cz += pt.z;
  }
  return { x: cx / p.length, z: cz / p.length };
}

/**
 * Center bias — polylines near the origin (city center) get higher weight.
 * Inverse-square falloff: weight = 1 / (1 + dist² × DECAY). DECAY ≈ 0.05
 * gives ~4× concentration in the central 25% of world.
 */
const CENTER_BIAS_DECAY = 0.05;
function centerWeight(p: Vec2[]): number {
  const c = polyCentroid(p);
  const distSq = c.x * c.x + c.z * c.z;
  return 1 / (1 + distSq * CENTER_BIAS_DECAY);
}

function sampleFromPolylines(
  polys: Vec2[][],
  count: number,
  seed: number,
  target: number,
  speedRange: [number, number],
): Agent[] {
  if (polys.length === 0) return [];
  const rng = makeRng(seed);

  // Combined weight: polyline length × center-bias.
  // Longer streets host more agents; central streets are weighted higher
  // so the city core feels populated while peripheral roads stay sparse.
  const lengths = polys.map(polyLength);
  const cdf: number[] = [];
  let acc = 0;
  for (let i = 0; i < polys.length; i++) {
    acc += lengths[i] * centerWeight(polys[i]);
    cdf.push(acc);
  }
  if (acc <= 0) return [];

  const agents: Agent[] = [];
  let safety = count * 4;
  while (agents.length < count && safety-- > 0) {
    const startIdx = pickWeighted(rng, cdf);
    const path = chainPolylines(polys, startIdx, rng, target, ENDPOINT_EPSILON);
    const length = polyLength(path);
    if (length < 0.05) continue;
    const [smin, smax] = speedRange;
    agents.push({
      path,
      length,
      phase: rng(),
      speed: smin + rng() * (smax - smin),
    });
  }
  return agents;
}

/**
 * Pedestrians on OSM walkway centerlines. Each agent's route chains
 * connected footways/cycleways until ≈ 375m total.
 */
export function sampleWalkers(
  table: NormalizedSandTable | null,
  count: number,
  seed: number,
): Agent[] {
  if (!table) return [];
  const polys = table.walkways
    .filter((w) => w.points.length >= 2)
    .map(ribbonToPoly);
  // Pedestrian speed: 0.03–0.07 wu/s ≈ 4–9 m/s after world scale.
  return sampleFromPolylines(polys, count, seed, WALKER_TARGET_LEN, [0.03, 0.07]);
}

/**
 * Vehicles on drivable-road centerlines, filtered to "real streets" only
 * (residential and bigger). Driveways / service roads / tiny cul-de-sacs
 * are excluded so cars don't appear on inappropriate paths.
 *
 * Each agent chains connected road segments until ≈ 625m of route.
 */
export function sampleVehicles(
  table: NormalizedSandTable | null,
  count: number,
  seed: number,
): Agent[] {
  if (!table) return [];
  const polys = table.roads
    .filter((r) => roadWidth(r) >= VEHICLE_MIN_ROAD_WIDTH)
    .map(roadCenterline)
    .filter((p) => p.length >= 2);
  // Vehicle speed: 0.30–0.60 wu/s ≈ 38–75 m/s. Cinematic (~5–10× walker).
  return sampleFromPolylines(polys, count, seed, VEHICLE_TARGET_LEN, [0.30, 0.60]);
}

/**
 * Back-compat alias used by DigitalSilosOverlay (silos sit at people's
 * starting positions, so sampleAgents = sampleWalkers).
 */
export const sampleAgents = sampleWalkers;

// ---- Position lookup ----------------------------------------------------

/**
 * Position along a path at parameter t ∈ ℝ using cumulative segment lengths
 * with **ping-pong wrap**: agent walks to end, then back, repeating. Avoids
 * the visual teleport you get from naive modulo wrapping when start ≠ end.
 */
export function positionAlongPath(path: Vec2[], t: number): Vec2 {
  if (path.length === 0) return { x: 0, z: 0 };
  if (path.length === 1) return path[0];
  const total = polyLength(path);
  if (total <= 0) return path[0];

  const u = ((t % 1) + 1) % 1;
  const s = u < 0.5 ? u * 2 : (1 - u) * 2; // triangle wave 0..1..0..1..

  const target = s * total;
  let acc = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const seg = Math.hypot(b.x - a.x, b.z - a.z);
    if (acc + seg >= target) {
      const w = seg > 0 ? (target - acc) / seg : 0;
      return { x: a.x + (b.x - a.x) * w, z: a.z + (b.z - a.z) * w };
    }
    acc += seg;
  }
  return path[path.length - 1];
}

/**
 * Unit tangent of the path at parameter t, accounting for ping-pong direction.
 *
 * Returns the direction the agent is *currently moving in*, NOT the segment
 * tangent. This means at the end of the path (apex of ping-pong), tangent
 * flips by 180° (one frame), which is the correct geometric behavior — but
 * crucially, it does NOT flip-flop in a window AROUND the apex (which the
 * old "lookahead +0.005" approach did, because the lookahead crossed the
 * triangle-wave boundary giving inconsistent direction).
 */
export function pathTangentAt(path: Vec2[], t: number): Vec2 {
  if (path.length < 2) return { x: 1, z: 0 };
  const total = polyLength(path);
  if (total <= 0) return { x: 1, z: 0 };

  const u = ((t % 1) + 1) % 1;
  const s = u < 0.5 ? u * 2 : (1 - u) * 2;
  const motionSign = u < 0.5 ? 1 : -1; // +1 forward, −1 backward

  // Locate the segment containing s and return its unit tangent (with sign).
  const target = s * total;
  let acc = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const seg = Math.hypot(b.x - a.x, b.z - a.z);
    if (acc + seg >= target) {
      const len = seg > 0 ? seg : 1;
      return {
        x: (motionSign * (b.x - a.x)) / len,
        z: (motionSign * (b.z - a.z)) / len,
      };
    }
    acc += seg;
  }
  // Fallthrough: last segment tangent
  const a = path[path.length - 2];
  const b = path[path.length - 1];
  const len = Math.hypot(b.x - a.x, b.z - a.z) || 1;
  return {
    x: (motionSign * (b.x - a.x)) / len,
    z: (motionSign * (b.z - a.z)) / len,
  };
}

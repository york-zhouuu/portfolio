"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { NormalizedRibbon, NormalizedSandTable } from "@/lib/cinema/geometry";
import type { CinemaTheme } from "@/lib/cinema/theme";
import {
  getMaterialSet,
  type MaterialSpec,
} from "@/lib/cinema/materials/registry";

/**
 * SandTable — renders the full Lane Cove geometry.
 *
 * Layer model (low Y → high Y):
 *   −0.001  ground plane
 *    0.001  walkway ribbons (footways, cycleways)
 *    0.002  ROAD POLYGONS — atlas-buffered rectangles, FILLED
 *    0.003  waterway ribbons (rivers, streams) + water polygons
 *    0.005  parks / playgrounds / gardens
 *    0.000+ buildings (extruded UP from Y=0)
 *
 * Per cinema-content-language-foundations D4: materials come from the
 * registry keyed by `mode`. When `modePrev` is non-null, both material sets
 * are painted with opacities weighted by `modeFade` (cross-fade). `dim`
 * multiplies every layer's color toward black uniformly.
 */
export function SandTable({
  geometry,
  theme,
  mode = "matte",
  modePrev = null,
  modeFade = 1,
  dim = 1,
}: {
  geometry: NormalizedSandTable;
  theme: CinemaTheme;
  mode?: string;
  modePrev?: string | null;
  modeFade?: number;
  dim?: number;
}) {
  const buildingsGeo = useMemo(() => buildMergedBuildings(geometry), [geometry]);
  const roadsGeo = useMemo(() => buildRoadPolygonsGeo(geometry), [geometry]);
  const walkwaysGeo = useMemo(
    () => buildRibbonGeo(geometry.walkways),
    [geometry.walkways],
  );
  const waterwaysGeo = useMemo(
    () => buildRibbonGeo(geometry.waterways),
    [geometry.waterways],
  );
  const parkGeo = useMemo(() => buildParkGeometry(geometry), [geometry]);
  const waterGeo = useMemo(() => buildWaterGeometry(geometry), [geometry]);

  const matsCur = useMemo(() => getMaterialSet(mode, theme), [mode, theme]);
  const matsPrev = useMemo(
    () => (modePrev && modePrev !== mode ? getMaterialSet(modePrev, theme) : null),
    [modePrev, mode, theme],
  );

  const groundSize = geometry.halfExtent * 2.4;

  const groundPlane = useMemo(() => {
    const g = new THREE.PlaneGeometry(groundSize, groundSize);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [groundSize]);

  // Precomputed edge geometries — built ONCE at mount for every layer that
  // could carry edges in any registered mode. This sidesteps the previous
  // ~50ms hitch when blueprint mode first activated and EdgesGeometry was
  // built for buildings inside the render loop. Now mode swap is just a
  // material/visibility toggle on already-existing line segments.
  const buildingsEdges = useMemo(
    () => (buildingsGeo ? new THREE.EdgesGeometry(buildingsGeo, 15) : null),
    [buildingsGeo],
  );
  const roadsEdges = useMemo(
    () => (roadsGeo ? new THREE.EdgesGeometry(roadsGeo, 15) : null),
    [roadsGeo],
  );

  // Render each layer once with current material; if cross-fading, render the
  // SAME geometry again with prev material at complementary opacity.
  const layers = (
    <>
      <Layer
        geometry={groundPlane}
        position={[0, -0.001, 0]}
        spec={matsCur.ground}
        dim={dim}
        alphaScale={modeFade}
        receiveShadow
      />
      {walkwaysGeo ? (
        <Layer geometry={walkwaysGeo} position={[0, 0.001, 0]} spec={matsCur.walkway} dim={dim} alphaScale={modeFade} receiveShadow />
      ) : null}
      {roadsGeo ? (
        <Layer geometry={roadsGeo} edgeGeo={roadsEdges} position={[0, 0.002, 0]} spec={matsCur.road} dim={dim} alphaScale={modeFade} receiveShadow />
      ) : null}
      {waterwaysGeo ? (
        <Layer geometry={waterwaysGeo} position={[0, 0.003, 0]} spec={matsCur.waterway} dim={dim} alphaScale={modeFade} receiveShadow />
      ) : null}
      {waterGeo ? (
        <Layer geometry={waterGeo} position={[0, 0.003, 0]} spec={matsCur.water} dim={dim} alphaScale={modeFade} receiveShadow />
      ) : null}
      {parkGeo ? (
        <Layer geometry={parkGeo} position={[0, 0.005, 0]} spec={matsCur.park} dim={dim} alphaScale={modeFade} receiveShadow />
      ) : null}
      {buildingsGeo ? (
        <Layer geometry={buildingsGeo} edgeGeo={buildingsEdges} spec={matsCur.building} dim={dim} alphaScale={modeFade} castShadow receiveShadow />
      ) : null}
    </>
  );

  // During cross-fade, paint the previous material set at complementary alpha.
  const layersPrev = matsPrev ? (
    <>
      <Layer
        geometry={groundPlane}
        position={[0, -0.001, 0]}
        spec={matsPrev.ground}
        dim={dim}
        alphaScale={1 - modeFade}
      />
      {walkwaysGeo ? (
        <Layer geometry={walkwaysGeo} position={[0, 0.001, 0]} spec={matsPrev.walkway} dim={dim} alphaScale={1 - modeFade} />
      ) : null}
      {roadsGeo ? (
        <Layer geometry={roadsGeo} edgeGeo={roadsEdges} position={[0, 0.002, 0]} spec={matsPrev.road} dim={dim} alphaScale={1 - modeFade} />
      ) : null}
      {waterwaysGeo ? (
        <Layer geometry={waterwaysGeo} position={[0, 0.003, 0]} spec={matsPrev.waterway} dim={dim} alphaScale={1 - modeFade} />
      ) : null}
      {waterGeo ? (
        <Layer geometry={waterGeo} position={[0, 0.003, 0]} spec={matsPrev.water} dim={dim} alphaScale={1 - modeFade} />
      ) : null}
      {parkGeo ? (
        <Layer geometry={parkGeo} position={[0, 0.005, 0]} spec={matsPrev.park} dim={dim} alphaScale={1 - modeFade} />
      ) : null}
      {buildingsGeo ? (
        <Layer geometry={buildingsGeo} edgeGeo={buildingsEdges} spec={matsPrev.building} dim={dim} alphaScale={1 - modeFade} />
      ) : null}
    </>
  ) : null;

  return (
    <group>
      {layersPrev}
      {layers}
    </group>
  );
}

/**
 * Layer — one geometry rendered with surface (mesh + standard material) and,
 * if `spec.edges` is set AND `edgeGeo` is provided, an additional line
 * overlay. Edge geometries are precomputed at SandTable level to avoid the
 * mid-scroll EdgesGeometry build hitch on first blueprint activation.
 */
function Layer({
  geometry,
  edgeGeo,
  position,
  spec,
  dim,
  alphaScale,
  castShadow,
  receiveShadow,
}: {
  geometry: THREE.BufferGeometry;
  edgeGeo?: THREE.BufferGeometry | null;
  position?: [number, number, number];
  spec: MaterialSpec;
  dim: number;
  alphaScale: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  return (
    <>
      <mesh
        geometry={geometry}
        position={position}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <Material spec={spec} dim={dim} alphaScale={alphaScale} />
      </mesh>
      {edgeGeo && spec.edges ? (
        <lineSegments geometry={edgeGeo} position={position}>
          <lineBasicMaterial
            color={spec.edges.color}
            transparent
            opacity={spec.edges.opacity * alphaScale}
          />
        </lineSegments>
      ) : null}
    </>
  );
}

/**
 * Single-material renderer applying dim (color attenuation) and alpha.
 * Pulled out so cross-fade rendering is two identical mesh trees with
 * different MaterialSet inputs.
 */
function Material({
  spec,
  dim,
  alphaScale,
}: {
  spec: MaterialSpec;
  dim: number;
  alphaScale: number;
}) {
  // Apply dim by scaling base color toward black. Three.js MeshStandardMaterial
  // accepts a Color object; we let R3F coerce string + multiply.
  const color = useMemo(() => new THREE.Color(spec.color).multiplyScalar(dim), [spec.color, dim]);
  const opacity = spec.opacity * alphaScale;
  const transparent = opacity < 1 || alphaScale < 1;
  return (
    <meshStandardMaterial
      color={color}
      roughness={spec.roughness}
      metalness={spec.metalness}
      transparent={transparent}
      opacity={opacity}
      flatShading={spec.flatShading}
    />
  );
}

/**
 * Merge all building extrusions into a single non-indexed BufferGeometry.
 * ExtrudeGeometry returns non-indexed by default; for safety we normalize
 * each sub-geometry via toNonIndexed() before concatenating.
 */
function buildMergedBuildings(table: NormalizedSandTable): THREE.BufferGeometry | null {
  const positions: number[] = [];
  const normals: number[] = [];

  for (const building of table.buildings) {
    if (building.shape.length < 3) continue;
    const shape = new THREE.Shape();
    shape.moveTo(building.shape[0].x, building.shape[0].y);
    for (let i = 1; i < building.shape.length; i++) {
      shape.lineTo(building.shape[i].x, building.shape[i].y);
    }
    shape.closePath();

    let geo: THREE.BufferGeometry = new THREE.ExtrudeGeometry(shape, {
      depth: building.height,
      bevelEnabled: false,
    });
    geo.rotateX(-Math.PI / 2);

    if (geo.index) {
      const nonIndexed = geo.toNonIndexed();
      geo.dispose();
      geo = nonIndexed;
    }
    geo.computeVertexNormals();

    const posAttr = geo.attributes.position;
    const normAttr = geo.attributes.normal;
    for (let i = 0; i < posAttr.count; i++) {
      positions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
      normals.push(normAttr.getX(i), normAttr.getY(i), normAttr.getZ(i));
    }
    geo.dispose();
  }

  if (positions.length === 0) return null;
  const merged = new THREE.BufferGeometry();
  merged.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(new Float32Array(positions), 3),
  );
  merged.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(new Float32Array(normals), 3),
  );
  return merged;
}

/**
 * Build a flat ShapeGeometry containing every road polygon. One draw call
 * for ~4500 atlas-buffered road segments.
 */
function buildRoadPolygonsGeo(table: NormalizedSandTable): THREE.BufferGeometry | null {
  if (table.roads.length === 0) return null;
  const shapes: THREE.Shape[] = [];
  for (const road of table.roads) {
    if (road.shape.length < 3) continue;
    const shape = new THREE.Shape();
    shape.moveTo(road.shape[0].x, road.shape[0].y);
    for (let i = 1; i < road.shape.length; i++) {
      shape.lineTo(road.shape[i].x, road.shape[i].y);
    }
    shape.closePath();
    shapes.push(shape);
  }
  if (shapes.length === 0) return null;
  const geo = new THREE.ShapeGeometry(shapes);
  geo.rotateX(-Math.PI / 2);
  return geo;
}

/**
 * Build ribbon meshes from polylines with per-segment width — used for
 * walkways and waterways. For each consecutive vertex pair (a, b), emit
 * a quad (a-perp, a+perp, b+perp, b-perp).
 */
function buildRibbonGeo(ribbons: NormalizedRibbon[]): THREE.BufferGeometry | null {
  if (ribbons.length === 0) return null;
  const positions: number[] = [];
  const indices: number[] = [];
  let vIdx = 0;

  for (const ribbon of ribbons) {
    if (ribbon.points.length < 2) continue;
    const halfW = ribbon.width / 2;

    for (let i = 0; i < ribbon.points.length - 1; i++) {
      const a = ribbon.points[i];
      const b = ribbon.points[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len < 1e-6) continue;
      const px = (-dy / len) * halfW;
      const py = (dx / len) * halfW;

      positions.push(a.x - px, 0, a.y - py);
      positions.push(a.x + px, 0, a.y + py);
      positions.push(b.x + px, 0, b.y + py);
      positions.push(b.x - px, 0, b.y - py);

      indices.push(vIdx, vIdx + 1, vIdx + 2);
      indices.push(vIdx, vIdx + 2, vIdx + 3);
      vIdx += 4;
    }
  }

  if (positions.length === 0) return null;
  const geom = new THREE.BufferGeometry();
  geom.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(new Float32Array(positions), 3),
  );
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

function buildParkGeometry(table: NormalizedSandTable): THREE.BufferGeometry | null {
  if (table.parks.length === 0) return null;
  const shapes: THREE.Shape[] = [];
  for (const park of table.parks) {
    if (park.shape.length < 3) continue;
    const shape = new THREE.Shape();
    shape.moveTo(park.shape[0].x, park.shape[0].y);
    for (let i = 1; i < park.shape.length; i++) {
      shape.lineTo(park.shape[i].x, park.shape[i].y);
    }
    shape.closePath();
    shapes.push(shape);
  }
  if (shapes.length === 0) return null;
  const geo = new THREE.ShapeGeometry(shapes);
  geo.rotateX(-Math.PI / 2);
  return geo;
}

function buildWaterGeometry(table: NormalizedSandTable): THREE.BufferGeometry | null {
  if (table.water.length === 0) return null;
  const shapes: THREE.Shape[] = [];
  for (const w of table.water) {
    if (w.shape.length < 3) continue;
    const shape = new THREE.Shape();
    shape.moveTo(w.shape[0].x, w.shape[0].y);
    for (let i = 1; i < w.shape.length; i++) {
      shape.lineTo(w.shape[i].x, w.shape[i].y);
    }
    shape.closePath();
    shapes.push(shape);
  }
  if (shapes.length === 0) return null;
  const geo = new THREE.ShapeGeometry(shapes);
  geo.rotateX(-Math.PI / 2);
  return geo;
}

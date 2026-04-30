/**
 * Geometry factories — humans (pedestrians) + cars.
 *
 * Style register: 性冷淡 / Scandinavian minimal — architectural scale-figure
 * proportions, single tone, faceted-but-elegant. Inspired by SketchUp scale
 * figures and Polestar / Tesla low-poly renders.
 *
 * Per agent-models-v2-minimal D1/D2:
 *   Person   ~0.30 tall, 7.5 head heights, head + tapered torso + 2 legs
 *            (no arms — silhouette stays "scale-figure" abstract)
 *   Car      ~0.18 long, sedan side profile via ExtrudeGeometry + 4 wheels
 *
 * Each function returns a single merged BufferGeometry with per-vertex colors
 * baked in. One InstancedMesh draw call per agent class.
 */

import * as THREE from "three";

// ---- Merge helper --------------------------------------------------------

function mergeGeos(sources: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  for (const src of sources) {
    src.computeVertexNormals();
    let g: THREE.BufferGeometry = src;
    if (g.index) g = g.toNonIndexed();
    const pos = g.getAttribute("position") as THREE.BufferAttribute;
    const norm = g.getAttribute("normal") as THREE.BufferAttribute | undefined;
    const col = g.getAttribute("color") as THREE.BufferAttribute | undefined;
    for (let i = 0; i < pos.count; i++) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
    }
    if (norm) {
      for (let i = 0; i < norm.count; i++) {
        normals.push(norm.getX(i), norm.getY(i), norm.getZ(i));
      }
    }
    if (col) {
      for (let i = 0; i < col.count; i++) {
        colors.push(col.getX(i), col.getY(i), col.getZ(i));
      }
    }
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(new Float32Array(positions), 3),
  );
  if (normals.length === positions.length) {
    merged.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(new Float32Array(normals), 3),
    );
  } else {
    merged.computeVertexNormals();
  }
  if (colors.length === positions.length) {
    merged.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(new Float32Array(colors), 3),
    );
  }
  return merged;
}

function paint(geo: THREE.BufferGeometry, hex: string): THREE.BufferGeometry {
  const c = new THREE.Color(hex);
  const count = geo.getAttribute("position").count;
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(arr, 3));
  return geo;
}

/**
 * Conditionally paint vertices based on a spatial predicate. Used for the
 * car cabin glass strip — vertices above a y threshold get one color,
 * everything else keeps the default.
 */
function paintConditional(
  geo: THREE.BufferGeometry,
  predicate: (x: number, y: number, z: number) => boolean,
  matchHex: string,
  defaultHex: string,
): THREE.BufferGeometry {
  const matchC = new THREE.Color(matchHex);
  const defC = new THREE.Color(defaultHex);
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const arr = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const c = predicate(x, y, z) ? matchC : defC;
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(arr, 3));
  return geo;
}

// ---- Person — Lowpoly Crowd asset (Desirefx) ----------------------------
//
// 12 pose variants extracted by scripts/extract-figures.ts. Overlay buckets
// agents across multiple poses for crowd variety; each bucket is its own
// InstancedMesh sharing one geometry.

import { FIGURES, FIGURE_NAMES } from "./agentMeshes-data";

const HIP_Y_THRESHOLD = 0.020; // half of 0.04 total height — upper/lower split

const COL_PERSON_UPPER = "#dcd5c8"; // warm bone (head + torso)
const COL_PERSON_LOWER = "#a8a39a"; // cool greige (legs)

/** Subset of figures to rotate through — kept small so bucket count is low. */
export const PERSON_POSE_NAMES = FIGURE_NAMES.slice(0, 6); // 6 distinct poses

/** Build geometry for one named figure with two-tone vertex coloring. */
export function buildFigureGeometry(figureName: string): THREE.BufferGeometry {
  const data = FIGURES[figureName];
  if (!data) {
    throw new Error(
      `Figure "${figureName}" not found in FIGURES; rerun scripts/extract-figures.ts`,
    );
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(data.positions.slice(), 3),
  );
  geo.setIndex(new THREE.Uint32BufferAttribute(data.indices.slice(), 1));
  geo.computeVertexNormals();

  const upper = new THREE.Color(COL_PERSON_UPPER);
  const lower = new THREE.Color(COL_PERSON_LOWER);
  const vertCount = data.positions.length / 3;
  const colors = new Float32Array(vertCount * 3);
  for (let i = 0; i < vertCount; i++) {
    const y = data.positions[i * 3 + 1];
    const c = y > HIP_Y_THRESHOLD ? upper : lower;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return geo;
}

/** Back-compat single-pose factory, used by silos overlay. */
export function buildPersonGeometry(): THREE.BufferGeometry {
  return buildFigureGeometry(PERSON_POSE_NAMES[0]);
}

// ---- Car — sedan side profile via ExtrudeGeometry -----------------------

// Car sized to fit on actual road centerlines.
//   Lane Cove road width (normalized): 0.025–0.060 wu (residential to primary)
//   Real car 4.5m long → 0.018 wu; we use 0.045 (2.5× exaggerated for legibility)
//   At 0.045 vs road 0.036, ratio ≈ 1.25 (slightly oversize but reads as on-road)
const CAR_LENGTH = 0.045; // x extent
const CAR_HEIGHT = 0.015; // y extent
const CAR_WIDTH = 0.024;  // z extent (extrude depth) — fits within road width

const COL_CAR_BODY = "#cfc6b8";   // dusty bone body
const COL_CAR_GLASS = "#3a3833";  // deep charcoal cabin top
const COL_CAR_WHEEL = "#252320";  // warm dark wheels

const GLASS_Y_THRESHOLD = 0.0075; // vertices above this y get glass color

// All scaled to CAR_LENGTH=0.045 (5.17× smaller than original 0.18)
const WHEEL_RADIUS = 0.0035;
const WHEEL_WIDTH = 0.0030;
const WHEEL_X = 0.015;
const WHEEL_Z = 0.0085;

function buildCarBodyShape(): THREE.Shape {
  // Side profile (xy plane), origin at car center bottom. Forward = +x.
  // 9 anchor points trace sedan silhouette; scaled 0.250× from v3.
  const shape = new THREE.Shape();
  shape.moveTo(-0.0225, 0.0000);            // rear bumper bottom
  shape.lineTo(-0.0225, 0.0050);            // rear bumper top
  shape.lineTo(-0.0188, 0.0063);            // trunk lid back
  shape.lineTo(-0.0150, 0.0100);            // roof rear (cabin top start)
  shape.lineTo(0.0050, 0.0100);             // roof front (cabin top end)
  shape.lineTo(0.0100, 0.0063);             // windshield base
  shape.lineTo(0.0200, 0.0055);             // bonnet front
  shape.lineTo(0.0225, 0.0030);             // front bumper top
  shape.lineTo(0.0225, 0.0000);             // front bumper bottom
  shape.closePath();
  return shape;
}

export function buildCarGeometry(): THREE.BufferGeometry {
  const shape = buildCarBodyShape();
  const body = new THREE.ExtrudeGeometry(shape, {
    depth: CAR_WIDTH,
    bevelEnabled: false,
  });
  // Center the extrusion along z (it extrudes from 0 → +depth by default)
  body.translate(0, 0, -CAR_WIDTH / 2);
  // Glass strip: any vertex with y > threshold (cabin top region) gets glass
  paintConditional(body, (_, y) => y > GLASS_Y_THRESHOLD, COL_CAR_GLASS, COL_CAR_BODY);

  // Wheels — 4 cylinders rotated so axis aligns with X (the car's length axis)
  const makeWheel = (sx: number, sz: number) => {
    const w = new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_WIDTH, 8);
    w.rotateZ(Math.PI / 2);
    w.translate(sx * WHEEL_X, WHEEL_RADIUS, sz * WHEEL_Z);
    paint(w, COL_CAR_WHEEL);
    return w;
  };
  const wheels = [
    makeWheel(1, 1),
    makeWheel(1, -1),
    makeWheel(-1, 1),
    makeWheel(-1, -1),
  ];

  const merged = mergeGeos([body, ...wheels]);
  body.dispose();
  wheels.forEach((w) => w.dispose());
  return merged;
}

// expose dimensions for tests / debug overlays if ever needed
export const __MESH_DIMS = {
  CAR_LENGTH,
  CAR_HEIGHT,
  CAR_WIDTH,
  PERSON_TOTAL_HEIGHT: 0.30, // matches scripts/extract-figures.ts TARGET_HEIGHT
};

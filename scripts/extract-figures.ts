#!/usr/bin/env tsx
/**
 * Extract a curated set of standing figures from a crowd OBJ. Produces a
 * TS module under `lib/cinema/agentMeshes-data.ts` with each figure's
 * position + index buffers, scaled and centered so that:
 *   - feet sit at y=0
 *   - centered on x/z = 0
 *   - height matches our target (TARGET_HEIGHT ≈ 0.30 world units)
 *
 * Usage:
 *   pnpm tsx scripts/extract-figures.ts <path-to-crowd.obj>
 */

import fs from "node:fs";
import path from "node:path";

type Vec3 = [number, number, number];

type Group = {
  name: string;
  vertexIndices: Set<number>;
  /** Triangulated face list — each face is 3 (or 4) vertex indices. */
  faces: number[][];
};

// World ≈ ±8 wu, normalization gives 1 wu ≈ 250m for Lane Cove bounds.
// Real human 1.7m → 0.0068 wu. We exaggerate 5–6× → 0.040 wu so figures
// stay visible from god-view (Y=15) without dwarfing the road network.
// Real car length 4.5m → 0.018 wu; we use 0.045 (2.5× exaggerated) to stay
// readable. At these sizes car-to-road ratio ≈ 1.25 (just visible on road).
const TARGET_HEIGHT = 0.04;

// Curated picks: most-vertical standing figures with healthy face count.
// 12 figures gives variety if we ever switch to option B (per-agent pose).
const SELECTED = [
  "Desirefx_me_27",
  "Desirefx_me_32",
  "Desirefx_me_39",
  "Desirefx_me_28",
  "Desirefx_me_15",
  "Desirefx_me_71",
  "Desirefx_me_13",
  "Desirefx_me_53",
  "Desirefx_me_73",
  "Desirefx_me_26",
  "Desirefx_me_90",
  "Desirefx_me_40",
];

function parseOBJ(text: string): { vertices: Vec3[]; groups: Group[] } {
  const vertices: Vec3[] = [];
  const groups: Group[] = [];
  const byName = new Map<string, Group>();
  let current: Group | null = null;

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("v ")) {
      const [, sx, sy, sz] = line.split(/\s+/);
      vertices.push([parseFloat(sx), parseFloat(sy), parseFloat(sz)]);
    } else if (line.startsWith("g ") || line.startsWith("o ")) {
      const name = line.slice(2).trim();
      const existing = byName.get(name);
      if (existing) {
        current = existing;
      } else {
        current = { name, vertexIndices: new Set(), faces: [] };
        groups.push(current);
        byName.set(name, current);
      }
    } else if (line.startsWith("f ")) {
      if (!current) continue;
      const parts = line.slice(2).trim().split(/\s+/);
      const verts = parts.map((p) => {
        const v = parseInt(p.split("/")[0], 10);
        return v > 0 ? v - 1 : vertices.length + v;
      });
      for (const v of verts) current.vertexIndices.add(v);
      current.faces.push(verts);
    }
  }
  return { vertices, groups };
}

type FigureData = {
  name: string;
  positions: Float32Array;
  indices: Uint32Array;
  /** Original height in OBJ units (for diagnostic/debug). */
  origHeight: number;
};

function extractFigure(
  group: Group,
  globalVertices: Vec3[],
  scale: number,
): FigureData {
  // Build a remapped vertex array (only verts referenced by this group).
  const localIdx = new Map<number, number>();
  const positions: number[] = [];
  for (const gIdx of group.vertexIndices) {
    localIdx.set(gIdx, positions.length / 3);
    const [x, y, z] = globalVertices[gIdx];
    positions.push(x, y, z);
  }
  // Triangulate faces (handle quads by fan from vertex 0).
  const indices: number[] = [];
  for (const face of group.faces) {
    const localVerts = face.map((g) => localIdx.get(g)!);
    if (localVerts.length === 3) {
      indices.push(localVerts[0], localVerts[1], localVerts[2]);
    } else if (localVerts.length === 4) {
      indices.push(localVerts[0], localVerts[1], localVerts[2]);
      indices.push(localVerts[0], localVerts[2], localVerts[3]);
    } else if (localVerts.length > 4) {
      // Fan triangulation
      for (let i = 1; i < localVerts.length - 1; i++) {
        indices.push(localVerts[0], localVerts[i], localVerts[i + 1]);
      }
    }
  }

  // Compute bounding box for scaling + centering
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i], y = positions[i + 1], z = positions[i + 2];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }
  const origHeight = maxY - minY;
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  // Scale so figure's height = TARGET_HEIGHT; translate so feet at y=0, centered xz=0.
  const scaled = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    scaled[i] = (positions[i] - cx) * scale;
    scaled[i + 1] = (positions[i + 1] - minY) * scale;
    scaled[i + 2] = (positions[i + 2] - cz) * scale;
  }

  return {
    name: group.name,
    positions: scaled,
    indices: new Uint32Array(indices),
    origHeight,
  };
}

/** Format a typed-array as a compact JS literal. */
function formatTypedArrayLiteral(arr: Float32Array | Uint32Array, isFloat: boolean): string {
  // Limit precision so the bundle stays small.
  const parts: string[] = [];
  for (let i = 0; i < arr.length; i++) {
    parts.push(isFloat ? (arr[i] as number).toFixed(5) : String(arr[i]));
  }
  return parts.join(",");
}

function main() {
  const objPath = process.argv[2];
  if (!objPath) {
    console.error("Usage: tsx scripts/extract-figures.ts <path-to-obj>");
    process.exit(1);
  }
  const text = fs.readFileSync(path.resolve(objPath), "utf8");
  const { vertices, groups } = parseOBJ(text);
  const byName = new Map(groups.map((g) => [g.name, g]));

  const out: FigureData[] = [];
  for (const name of SELECTED) {
    const g = byName.get(name);
    if (!g) {
      console.warn(`[!] Figure '${name}' not found in OBJ — skipping`);
      continue;
    }
    // Compute bbox to derive scale
    const verts = [...g.vertexIndices];
    let minY = Infinity, maxY = -Infinity;
    for (const i of verts) {
      const y = vertices[i][1];
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const origH = maxY - minY;
    const scale = TARGET_HEIGHT / origH;
    out.push(extractFigure(g, vertices, scale));
  }

  // Emit TS module with all figures.
  const outPath = path.resolve("lib/cinema/agentMeshes-data.ts");
  let emitted = `/**
 * Auto-generated by scripts/extract-figures.ts — do not edit by hand.
 * Source: Lowpoly People Crowd Low-poly 3D model (Desirefx).
 *
 * Each figure is normalized to TARGET_HEIGHT = ${TARGET_HEIGHT} world units,
 * with feet at y=0 and centered on x/z=0. Drop-in replacement for hand-built
 * person geometry; use FIGURES[name].positions / .indices to construct
 * THREE.BufferGeometry at runtime.
 */

export type FigureGeometryData = {
  /** Vertex positions, flattened xyz, world units. */
  positions: Float32Array;
  /** Triangle indices into positions/3. */
  indices: Uint32Array;
};

`;
  for (const fig of out) {
    emitted += `// ${fig.name} — orig height ${fig.origHeight.toFixed(0)} OBJ units, ${fig.positions.length / 3} vertices, ${fig.indices.length / 3} triangles\n`;
    emitted += `const ${fig.name.replace(/[^a-zA-Z0-9_]/g, "_")}_pos = new Float32Array([${formatTypedArrayLiteral(fig.positions, true)}]);\n`;
    emitted += `const ${fig.name.replace(/[^a-zA-Z0-9_]/g, "_")}_idx = new Uint32Array([${formatTypedArrayLiteral(fig.indices, false)}]);\n\n`;
  }
  emitted += `export const FIGURES: Record<string, FigureGeometryData> = {\n`;
  for (const fig of out) {
    const safe = fig.name.replace(/[^a-zA-Z0-9_]/g, "_");
    emitted += `  "${fig.name}": { positions: ${safe}_pos, indices: ${safe}_idx },\n`;
  }
  emitted += `};\n\nexport const FIGURE_NAMES = [\n${out.map((f) => `  "${f.name}",`).join("\n")}\n];\n`;

  fs.writeFileSync(outPath, emitted, "utf8");
  console.log(`Wrote ${out.length} figures to ${outPath}`);
  console.log(`File size: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);
  for (const fig of out) {
    console.log(
      `  ${fig.name.padEnd(20)} ${(fig.positions.length / 3).toString().padStart(4)} verts, ${(fig.indices.length / 3).toString().padStart(4)} tris`,
    );
  }
}

main();

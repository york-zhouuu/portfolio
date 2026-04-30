#!/usr/bin/env tsx
/**
 * Scan an OBJ file's groups and print bounding boxes, vertex/face counts.
 * Used to pick a "standing figure" template from the Lowpoly Crowd pack.
 *
 * Usage:
 *   pnpm tsx scripts/scan-crowd-obj.ts /absolute/path/to/crowd.obj
 *
 * Output: a sorted table of all groups with their dimensions, sorted by
 * "verticality" (Y-extent ÷ max(X,Z)-extent) so tall standing figures
 * float to the top of the list.
 */

import fs from "node:fs";
import path from "node:path";

type Group = {
  name: string;
  vertexIndices: Set<number>;
  faceCount: number;
};

function parseOBJ(text: string): { vertices: Array<[number, number, number]>; groups: Group[] } {
  const vertices: Array<[number, number, number]> = [];
  const groups: Group[] = [];
  const byName = new Map<string, Group>();
  let current: Group | null = null;

  const lines = text.split("\n");
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("v ")) {
      const [, sx, sy, sz] = line.split(/\s+/);
      vertices.push([parseFloat(sx), parseFloat(sy), parseFloat(sz)]);
    } else if (line.startsWith("g ") || line.startsWith("o ")) {
      // Some OBJs declare the same name via both `o NAME` and `g NAME` —
      // dedupe by name so faces aggregate into one Group.
      const name = line.slice(2).trim();
      const existing = byName.get(name);
      if (existing) {
        current = existing;
      } else {
        current = { name, vertexIndices: new Set(), faceCount: 0 };
        groups.push(current);
        byName.set(name, current);
      }
    } else if (line.startsWith("f ")) {
      if (!current) {
        // Auto-create unnamed group if file starts with faces before any g/o
        current = { name: "(unnamed)", vertexIndices: new Set(), faceCount: 0 };
        groups.push(current);
      }
      const parts = line.slice(2).trim().split(/\s+/);
      // each part is "v" or "v/t" or "v/t/n" or "v//n"
      const verts = parts.map((p) => {
        const v = parseInt(p.split("/")[0], 10);
        // OBJ indices are 1-based; negative means relative
        return v > 0 ? v - 1 : vertices.length + v;
      });
      for (const v of verts) current.vertexIndices.add(v);
      // triangles or quads: faceCount as triangle count
      current.faceCount += Math.max(1, verts.length - 2);
    }
  }
  return { vertices, groups };
}

function bbox(group: Group, vertices: Array<[number, number, number]>) {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const i of group.vertexIndices) {
    const [x, y, z] = vertices[i];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }
  return {
    minX, minY, minZ, maxX, maxY, maxZ,
    extentX: maxX - minX,
    extentY: maxY - minY,
    extentZ: maxZ - minZ,
  };
}

function main() {
  const objPath = process.argv[2];
  if (!objPath) {
    console.error("Usage: tsx scripts/scan-crowd-obj.ts <path-to-obj>");
    process.exit(1);
  }
  const text = fs.readFileSync(path.resolve(objPath), "utf8");
  const { vertices, groups } = parseOBJ(text);
  console.log(`Parsed ${vertices.length} vertices, ${groups.length} groups\n`);

  type Row = {
    name: string;
    verts: number;
    faces: number;
    width: number;
    height: number;
    depth: number;
    verticality: number;
    minY: number;
  };
  const rows: Row[] = groups.map((g) => {
    const b = bbox(g, vertices);
    const wide = Math.max(b.extentX, b.extentZ);
    return {
      name: g.name,
      verts: g.vertexIndices.size,
      faces: g.faceCount,
      width: b.extentX,
      height: b.extentY,
      depth: b.extentZ,
      verticality: wide > 0 ? b.extentY / wide : Infinity,
      minY: b.minY,
    };
  });

  // Sort by verticality desc — tall standing figures first
  rows.sort((a, b) => b.verticality - a.verticality);

  console.log(
    "name".padEnd(28) +
      "verts".padStart(7) +
      "faces".padStart(7) +
      "  W".padStart(8) +
      "  H".padStart(8) +
      "  D".padStart(8) +
      "  H/W".padStart(8) +
      "  ground?".padStart(10),
  );
  console.log("─".repeat(80));
  for (const r of rows) {
    const isGround = /ground/i.test(r.name);
    const onFloor = r.minY < 1; // figure starts at y≈0
    const looksLikeStanding = r.verticality > 1.4 && onFloor && !isGround;
    const tag = isGround ? "GROUND" : looksLikeStanding ? "★STAND" : onFloor ? "" : "elev";
    console.log(
      r.name.padEnd(28) +
        String(r.verts).padStart(7) +
        String(r.faces).padStart(7) +
        r.width.toFixed(0).padStart(8) +
        r.height.toFixed(0).padStart(8) +
        r.depth.toFixed(0).padStart(8) +
        r.verticality.toFixed(2).padStart(8) +
        tag.padStart(10),
    );
  }
}

main();

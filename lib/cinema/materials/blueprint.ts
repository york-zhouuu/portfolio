/**
 * Blueprint material mode — engineering-drawing / X-ray look.
 *
 * Per cinema-map-modes D2: cool-blue palette, low-opacity surfaces so the
 * geometry reads through itself, and accent edges on buildings + roads to
 * surface the structural grid. Pairs with `matte` as a strong visual swap
 * for "看穿表象" narrative beats (Beat 1.1 v2 scene-1-4 ↑).
 *
 * Color choices are NOT theme-derived — blueprint should land at a
 * consistent register regardless of the surrounding warm-cream theme,
 * because that contrast IS the point.
 */

import type { MaterialFactory, MaterialSet } from "./registry";

export const blueprintMaterialFactory: MaterialFactory = (): MaterialSet => ({
  ground: {
    color: "#0a1830",
    roughness: 1,
    metalness: 0,
    opacity: 0.95,
  },
  walkway: {
    color: "#5cd0ff",
    roughness: 0.9,
    metalness: 0,
    opacity: 0.10,
  },
  road: {
    color: "#5cd0ff",
    roughness: 0.9,
    metalness: 0,
    opacity: 0.18,
    edges: { color: "#9ae6ff", opacity: 0.45 },
  },
  waterway: {
    color: "#3b9ad8",
    roughness: 0.8,
    metalness: 0.05,
    opacity: 0.45,
  },
  water: {
    color: "#3b9ad8",
    roughness: 0.8,
    metalness: 0.05,
    opacity: 0.50,
  },
  park: {
    color: "#264a6b",
    roughness: 0.95,
    metalness: 0,
    opacity: 0.18,
  },
  building: {
    color: "#7eb8e8",
    roughness: 0.7,
    metalness: 0,
    opacity: 0.16,
    flatShading: true,
    edges: { color: "#a8d4ff", opacity: 0.85, threshold: 12 },
  },
});

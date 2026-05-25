/**
 * Schematic material mode — paper-style line drawing matching the v7
 * poster figures (`docs/poster_map_*.svg`, `tools/build_atlas_thumbnail.py`).
 *
 * Per CLAUDE.md "2.5D 视觉规范": cream paper background `#FCFAF6`, gray
 * `#9E988C` stroke 0.15mm @ 0.55 opacity for buildings + roads, with
 * pink `#FF4D8F` / yellow `#FFD23F` accents added by overlay layers.
 *
 * Used by Act-3 finding figure scenes at iso 30° elevation — direct
 * visual transposition of the v7 paper figures into the cinema sandbox.
 *
 * NOTE the visual register flip: matte scenes use a dark warm-cream
 * world; schematic flips to light paper — punctuating the moment as
 * "we're switching to figure-view".
 */

import type { MaterialFactory, MaterialSet } from "./registry";

const PAPER_BG = "#FCFAF6";       // v7 paper cream
const BUILDING_FILL = "#F0EBE0";   // slightly darker than bg so footprints read
const STROKE = "#8A847A";          // v7 gray stroke (slightly darker for plan view)
const STROKE_DIM = "#B8B2A4";      // softer secondary stroke
const WATER_TINT = "#C8DCEA";      // pale blue for water (v7-ish)

export const schematicMaterialFactory: MaterialFactory = (): MaterialSet => ({
  ground: {
    color: PAPER_BG,
    roughness: 1,
    metalness: 0,
    opacity: 1.0,
  },
  walkway: {
    color: STROKE_DIM,
    roughness: 0.9,
    metalness: 0,
    opacity: 0.0,        // hide noise — only roads + buildings carry the grid
  },
  road: {
    color: STROKE_DIM,
    roughness: 0.9,
    metalness: 0,
    opacity: 0.22,        // light fill — road network reads as gray strokes at plan view
    edges: { color: STROKE, opacity: 0.70 },
  },
  waterway: {
    color: WATER_TINT,
    roughness: 0.85,
    metalness: 0,
    opacity: 0.6,
  },
  water: {
    color: WATER_TINT,
    roughness: 0.85,
    metalness: 0,
    opacity: 0.65,
  },
  park: {
    color: STROKE_DIM,
    roughness: 0.95,
    metalness: 0,
    opacity: 0.18,        // light park tint
    edges: { color: STROKE_DIM, opacity: 0.45 },
  },
  building: {
    color: BUILDING_FILL,  // slightly darker than paper — footprints read from above
    roughness: 0.9,
    metalness: 0,
    opacity: 1.0,
    flatShading: true,
    edges: { color: STROKE, opacity: 0.95, threshold: 10 },
  },
});

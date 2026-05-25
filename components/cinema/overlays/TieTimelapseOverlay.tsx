"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MapOverlayProps } from "./registry";

/**
 * TieTimelapseOverlay — Act 2.3.2 "the network is not input — it's output".
 *
 * Reveals up to 800 real social ties as the scene scrolls. Ties are sorted
 * by encounter count (strongest first); at sceneLocalT = 0 nothing is
 * visible, at sceneLocalT = 1 all ties form the emergent network. Each
 * line's brightness is scaled by tie strength so the network's hot spots
 * pop visually.
 *
 * Data source: /case-studies/sswt/tie-graph.json
 *   - Reconstructed from snapshot's memory_store_state.agent_events
 *     encounter events
 *   - Each tie has real (x, y) coords from ledger_state.entities
 *   - Top 800 by encounter count (full graph is 53,466 pairs)
 */

type Tie = {
  a: string;
  b: string;
  count: number;
  strength: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
};

type TieGraphData = {
  schema: string;
  total_ties_reconstructed: number;
  ties_exported: number;
  ties: Tie[];
};

const REVEAL_WINDOW = 0.04; // each tie fades over this fraction of sceneLocalT

export function TieTimelapseOverlay({ progress, sceneLocalT = 0 }: MapOverlayProps) {
  const [data, setData] = useState<TieGraphData | null>(null);
  const colorAttrRef = useRef<THREE.BufferAttribute>(null);

  useEffect(() => {
    fetch("/case-studies/sswt/tie-graph.json")
      .then((r) => r.json())
      .then(setData)
      .catch((e) => console.warn("TieTimelapseOverlay: failed to load", e));
  }, []);

  // Bake positions array once. Each tie = 2 vertices × 3 floats.
  // y = 0.02 to lift just above ground plane.
  const positions = useMemo(() => {
    if (!data) return null;
    const arr = new Float32Array(data.ties.length * 2 * 3);
    for (let i = 0; i < data.ties.length; i++) {
      const t = data.ties[i];
      arr[i * 6 + 0] = t.ax;
      arr[i * 6 + 1] = 0.02;
      arr[i * 6 + 2] = t.ay;
      arr[i * 6 + 3] = t.bx;
      arr[i * 6 + 4] = 0.02;
      arr[i * 6 + 5] = t.by;
    }
    return arr;
  }, [data]);

  // Color buffer — mutated each frame to drive per-tie reveal + intensity.
  const colors = useMemo(() => {
    if (!data) return null;
    return new Float32Array(data.ties.length * 2 * 3);
  }, [data]);

  useFrame(() => {
    if (!data || !colors || !colorAttrRef.current) return;
    const N = data.ties.length;
    // Tie reveal threshold spans [0, 0.95] so the last few aren't crammed
    // at exactly t=1. By scene exit progress=0 fades everything down anyway.
    for (let i = 0; i < N; i++) {
      const tie = data.ties[i];
      const revealT = (i / N) * 0.95;
      let alpha = 0;
      if (sceneLocalT > revealT + REVEAL_WINDOW) alpha = 1;
      else if (sceneLocalT > revealT) alpha = (sceneLocalT - revealT) / REVEAL_WINDOW;
      // Tie brightness scaled by strength so hot ties pop.
      const c = alpha * (0.25 + 0.75 * tie.strength) * progress;
      // Warm amber (#f4c674) -> additive RGB
      const r = c * 0.96;
      const g = c * 0.78;
      const b = c * 0.46;
      const base = i * 6;
      colors[base + 0] = r;
      colors[base + 1] = g;
      colors[base + 2] = b;
      colors[base + 3] = r;
      colors[base + 4] = g;
      colors[base + 5] = b;
    }
    colorAttrRef.current.needsUpdate = true;
  });

  if (!data || !positions || !colors) return null;

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          ref={colorAttrRef}
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </lineSegments>
  );
}

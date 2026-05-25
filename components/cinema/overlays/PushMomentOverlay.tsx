"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MapOverlayProps } from "./registry";
import type { NormalizedSandTable } from "@/lib/cinema/geometry";

/**
 * PushMomentOverlay — Act 2.4.3 "five waves over scene scroll" demo.
 *
 * Driven by `sceneLocalT` (clean scroll progress from useResolvedMapState),
 * not wall-clock. Five push waves fire at scene-local t = 0.10 / 0.28 /
 * 0.46 / 0.64 / 0.82 — mirroring the real 5-pushes-per-day cadence of
 * hyperlocal_push variant. Each wave:
 *   - flashes the push-notification card with the next content_template
 *     (cycling through the real 5 templates from hyperlocal_push.py)
 *   - pulses the 50 target dots
 *   - bumps cumulative drift toward st_aidans by 1/5 = 0.2
 *
 * Result: scroll forward → see push hit → see dots drift → see next push.
 * By scene end, dots have settled at their day-end positions.
 *
 * Data source: /case-studies/sswt/variants/hyperlocal_push-day4.json
 */

type PushAgent = {
  agent_id: string;
  day_start_location_id: string | null;
  day_end_location_id: string | null;
  movement_ticks: number;
};

type PushMomentData = {
  variant: string;
  day_index: number;
  target_location_id: string;
  target_location_name?: string;
  push_time_iso: string;
  hyperlocal_radius_m: number;
  content_templates: string[];
  example_content: string;
  agents: PushAgent[];
};

const PUSH_WAVES_T = [0.1, 0.28, 0.46, 0.64, 0.82];
const WAVE_FADE_IN = 0.04;
const WAVE_HOLD = 0.07;
const WAVE_FADE_OUT = 0.04;
const WAVE_TOTAL = WAVE_FADE_IN + WAVE_HOLD + WAVE_FADE_OUT; // 0.15
const DRIFT_SMOOTH = 0.05; // each wave eases drift over 0.05 t units

function centroid(
  shape: Array<{ x: number; y: number }>,
): { x: number; y: number } | null {
  if (shape.length === 0) return null;
  let sx = 0;
  let sy = 0;
  for (const p of shape) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / shape.length, y: sy / shape.length };
}

function lookupCenter(
  sandTable: NormalizedSandTable | null,
  locationId: string | null,
): { x: number; y: number } | null {
  if (!sandTable || !locationId) return null;
  const bld = sandTable.buildings.find((b) => b.id === locationId);
  if (bld) return centroid(bld.shape);
  const road = sandTable.roads.find((r) => r.id === locationId);
  if (road) return centroid(road.shape);
  return null;
}

/** Smoothly accumulating drift: each wave bumps drift by 1/5 over 0.05 t. */
function computeDrift(sceneLocalT: number): number {
  let drift = 0;
  for (let i = 0; i < PUSH_WAVES_T.length; i++) {
    const waveT = PUSH_WAVES_T[i];
    if (sceneLocalT >= waveT + DRIFT_SMOOTH) {
      drift = (i + 1) / PUSH_WAVES_T.length;
    } else if (sceneLocalT >= waveT) {
      const f = (sceneLocalT - waveT) / DRIFT_SMOOTH;
      // smoothstep
      const s = f * f * (3 - 2 * f);
      drift = i / PUSH_WAVES_T.length + s / PUSH_WAVES_T.length;
      break;
    }
  }
  return Math.min(1, drift);
}

/** Per-card opacity for the "累积同屏" stacked-cards effect.
 *  Wave i's card:
 *    - 0 before its wave fires
 *    - 0→1 across WAVE_FADE_IN once t crosses waveT
 *    - holds at 1 during WAVE_HOLD (active push moment)
 *    - 1→0.45 across WAVE_FADE_OUT (settles into the stack)
 *    - stays at 0.45 indefinitely (累积态 — all earlier pushes remain visible)
 */
function computeCardOpacity(sceneLocalT: number, waveT: number): number {
  const dt = sceneLocalT - waveT;
  if (dt < 0) return 0;
  if (dt < WAVE_FADE_IN) return dt / WAVE_FADE_IN;
  if (dt < WAVE_FADE_IN + WAVE_HOLD) return 1;
  if (dt < WAVE_TOTAL) {
    const f = (dt - WAVE_FADE_IN - WAVE_HOLD) / WAVE_FADE_OUT;
    return 1 - 0.55 * f;
  }
  return 0.45;
}

/** Per-wave pulse scale on the 50 dots — sharp spike at wave fire, decays. */
function computePulse(sceneLocalT: number): number {
  for (const waveT of PUSH_WAVES_T) {
    const dt = sceneLocalT - waveT;
    if (dt >= 0 && dt < 0.08) {
      const f = dt / 0.08;
      return 1 + 1.4 * (1 - f) * (1 - f); // strong on impact, decays
    }
  }
  return 1;
}

export function PushMomentOverlay({ progress, sceneLocalT = 0, sandTable }: MapOverlayProps) {
  const [data, setData] = useState<PushMomentData | null>(null);
  const dotsRef = useRef<THREE.InstancedMesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    fetch("/case-studies/sswt/variants/hyperlocal_push-day4.json")
      .then((r) => r.json())
      .then((d: PushMomentData) => {
        setData(d);
        const locName = d.target_location_name ?? d.target_location_id;
        // Pre-render content for each wave card so PushCardLayer has text
        // to display the moment a card fades in (no flash-of-empty).
        const cards: PushCardSlot[] = PUSH_WAVES_T.map((_, i) => ({
          content: d.content_templates[i % d.content_templates.length].replace(
            "{location}",
            locName,
          ),
          opacity: 0,
        }));
        publishCardsState({
          cards,
          dayIndex: d.day_index,
          totalWaves: PUSH_WAVES_T.length,
        });
      })
      .catch((e) => console.warn("PushMomentOverlay: failed to load data", e));
    return () => publishCardsState(null);
  }, []);

  const trajectories = useMemo(() => {
    if (!data || !sandTable) return [];
    return data.agents
      .map((a) => {
        const start = lookupCenter(sandTable, a.day_start_location_id);
        const end = lookupCenter(sandTable, a.day_end_location_id);
        if (!start) return null;
        return { start, end: end ?? start };
      })
      .filter(
        (x): x is { start: { x: number; y: number }; end: { x: number; y: number } } =>
          x !== null,
      );
  }, [data, sandTable]);

  const targetCenter = useMemo(() => {
    if (!data || !sandTable) return null;
    return lookupCenter(sandTable, data.target_location_id);
  }, [data, sandTable]);

  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const dummyPos = useMemo(() => new THREE.Vector3(), []);
  const dummyQuat = useMemo(() => new THREE.Quaternion(), []);
  const dummyScale = useMemo(() => new THREE.Vector3(1, 1, 1), []);

  useFrame(() => {
    if (!dotsRef.current || trajectories.length === 0 || !data) return;
    const now = performance.now() / 1000;

    const drift = computeDrift(sceneLocalT);
    const pulse = computePulse(sceneLocalT);

    for (let i = 0; i < trajectories.length; i++) {
      const t = trajectories[i];
      const x = t.start.x + (t.end.x - t.start.x) * drift;
      const z = t.start.y + (t.end.y - t.start.y) * drift;
      dummyPos.set(x, 0.03, z);
      dummyScale.set(pulse, pulse, pulse);
      matrix.compose(dummyPos, dummyQuat, dummyScale);
      dotsRef.current.setMatrixAt(i, matrix);
    }
    dotsRef.current.instanceMatrix.needsUpdate = true;

    // Update per-card opacities (stacked累积 effect).
    const locName = data.target_location_name ?? data.target_location_id;
    const cards: PushCardSlot[] = PUSH_WAVES_T.map((waveT, i) => ({
      content: data.content_templates[i % data.content_templates.length].replace(
        "{location}",
        locName,
      ),
      opacity: computeCardOpacity(sceneLocalT, waveT) * progress,
    }));
    publishCardsState({
      cards,
      dayIndex: data.day_index,
      totalWaves: PUSH_WAVES_T.length,
    });

    if (ringRef.current && targetCenter) {
      const breath = 0.9 + 0.1 * Math.sin(now * 1.3);
      const waveBump = pulse > 1 ? 1.2 : 1.0;
      const scale = breath * waveBump;
      ringRef.current.scale.set(scale, scale, scale);
    }
  });

  if (!data || trajectories.length === 0) return null;

  return (
    <group>
      {targetCenter ? (
        <mesh
          ref={ringRef}
          position={[targetCenter.x, 0.02, targetCenter.y]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.18, 0.26, 48]} />
          <meshBasicMaterial
            color="#f4c674"
            transparent
            opacity={progress * 0.85}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ) : null}
      <instancedMesh ref={dotsRef} args={[undefined, undefined, trajectories.length]}>
        <sphereGeometry args={[0.05, 14, 10]} />
        <meshBasicMaterial
          color="#ff5b3a"
          transparent
          opacity={progress * 0.95}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// DOM bridge — see CLAUDE.md "R3F overlay → DOM" section.
// ---------------------------------------------------------------------------

export type PushCardSlot = {
  content: string;
  opacity: number;
};

export type PushCardsBusState = {
  cards: PushCardSlot[];
  dayIndex: number;
  totalWaves: number;
};

declare global {
  interface Window {
    __sswtPushCards?: PushCardsBusState | null;
  }
}

function publishCardsState(state: PushCardsBusState | null) {
  if (typeof window === "undefined") return;
  window.__sswtPushCards = state;
}

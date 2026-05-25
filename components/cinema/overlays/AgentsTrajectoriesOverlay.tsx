"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import {
  sampleWalkers,
  sampleVehicles,
  positionAlongPath,
  pathTangentAt,
  type Agent,
} from "@/lib/cinema/agentSampling";
import {
  buildFigureGeometry,
  buildCarGeometry,
  PERSON_POSE_NAMES,
} from "@/lib/cinema/agentMeshes";
import type { ResolvedPickup, ResolvedSpotlight } from "@/lib/cinema/mapState";
import { useReaderContext } from "@/components/reader/ReaderContext";
import type { MapOverlayProps } from "./registry";

/**
 * Agents trajectories overlay — pedestrians + vehicles.
 *
 * Per cinema-map-overlays D3 + iteration 2026-04-27:
 *   - 60 humans walk OSM walkway centerlines (chained for long routes).
 *     Distributed across 6 different lowpoly poses → "crowd" variety.
 *   - 25 cars drive recovered road centerlines (chained, ~625m each).
 *
 * Each agent's matrix is composed of:
 *   - position (along its path, ping-pong wrap)
 *   - yaw (face direction of travel — fixes the "sliding standing figure"
 *     feel by rotating the model to face where it's going)
 */
// Density bumped progressively per author request:
//   v1: 80 walkers / 25 cars
//   v2: 120 / 50 (after coord-fix surfaced the city center)
//   v3: 200 / 80 (this is "feels like a city")
// 280 total still well within budget — M1 ~0.4ms/frame, no GPU concerns
// until 500+ on instanced spheres or 1000+ general.
const PEOPLE_COUNT = 200;
const PEOPLE_SEED = 42;
const CAR_COUNT = 80;
const CAR_SEED = 99;

/* Path tangent now derived analytically (pathTangentAt) — no lookahead. */

/**
 * Walking gait constants. Step rate ≈ 2 Hz (real human ~1.8–2.2 Hz).
 * Bob amplitude ≈ 2% of person height (matches biomechanics: pelvis bobs
 * ~3–4cm on a 1.7m human).
 */
const STRIDE_FREQ = Math.PI * 2; // angular freq → 2 peaks/sec via abs(sin)
const STRIDE_BOB_AMPL = 0.0008;  // ~2% of person height (0.04 wu)
const STRIDE_STRETCH_AMPL = 0.025; // y-scale wobble ±2.5% (scale-invariant)

export function AgentsTrajectoriesOverlay({
  progress,
  sceneLocalT,
  sandTable,
  spotlights,
  pickups,
}: MapOverlayProps) {
  const people = useMemo(
    () => sampleWalkers(sandTable, PEOPLE_COUNT, PEOPLE_SEED),
    [sandTable],
  );
  const cars = useMemo(
    () => sampleVehicles(sandTable, CAR_COUNT, CAR_SEED),
    [sandTable],
  );

  // Bucket pedestrians by pose: agent i → pose i % POSES.length
  const peopleBuckets = useMemo(() => {
    const out: Agent[][] = PERSON_POSE_NAMES.map(() => []);
    people.forEach((agent, i) => {
      out[i % PERSON_POSE_NAMES.length].push(agent);
    });
    return out;
  }, [people]);

  // Build one geometry per pose, kept stable across rerenders.
  const personGeometries = useMemo(
    () => PERSON_POSE_NAMES.map((name) => buildFigureGeometry(name)),
    [],
  );
  const carGeometry = useMemo(() => buildCarGeometry(), []);

  const peopleRefs = useRef<Array<THREE.InstancedMesh | null>>(
    PERSON_POSE_NAMES.map(() => null),
  );
  const carsRef = useRef<THREE.InstancedMesh>(null);

  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);
  const yAxis = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const scaleVec = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  const posVec = useMemo(() => new THREE.Vector3(), []);

  /**
   * Compute matrix at agent's path-t with yaw aligned to direction of travel.
   * For pedestrians (`isPerson=true`), additionally apply walking gait:
   *   - Y-bob (2 Hz peaks) — figure rises mid-stride, drops on impact
   *   - Y-stretch — slightly elongates mid-stride, compresses on impact
   * Both phase-shifted by agent.phase so the crowd doesn't march in sync.
   */
  function setAgentMatrix(
    target: THREE.InstancedMesh,
    i: number,
    agent: Agent,
    now: number,
    isPerson: boolean,
  ) {
    const t = (now * agent.speed) / agent.length + agent.phase;
    const cur = positionAlongPath(agent.path, t);
    // Use analytic path tangent (motion-direction-aware) instead of two-point
    // lookahead. Old approach misbehaved at ping-pong apex: lookahead crossed
    // the triangle-wave boundary, computing yaw "between" forward/backward
    // for several frames near the apex. New approach: tangent at exact t,
    // signed by motion direction → clean 180° flip in a single frame at apex.
    const tan = pathTangentAt(agent.path, t);
    let yaw = 0;
    if (tan.x !== 0 || tan.z !== 0) {
      // Asset's default forward axis differs:
      //   - lowpoly figure OBJ:  forward ≈ -Z (three.js convention)
      //     → yaw such that (-Z) rotates to (tan.x, tan.z) = atan2(tan.x, -tan.z)
      //   - ExtrudeGeometry car: forward = +X (length axis along X)
      //     → yaw such that (+X) rotates to (tan.x, tan.z) = atan2(-tan.z, tan.x)
      yaw = isPerson ? Math.atan2(tan.x, -tan.z) : Math.atan2(-tan.z, tan.x);
    }

    let yOffset = 0;
    let yScale = 1;
    if (isPerson) {
      // Stride phase, randomized per agent so the crowd is asynchronous.
      const stridePhase = now * STRIDE_FREQ + agent.phase * Math.PI * 2;
      // Bob: |sin| peaks twice per 2π cycle = 2 Hz with STRIDE_FREQ = 2π
      yOffset = Math.abs(Math.sin(stridePhase)) * STRIDE_BOB_AMPL;
      // Stretch in sync with bob: tallest at peak, shortest at impact
      yScale = 1 + Math.sin(stridePhase * 2) * STRIDE_STRETCH_AMPL;
    }

    posVec.set(cur.x, yOffset, cur.z);
    quat.setFromAxisAngle(yAxis, yaw);
    scaleVec.set(1, yScale, 1);
    matrix.compose(posVec, quat, scaleVec);
    target.setMatrixAt(i, matrix);
  }

  // Initial placement so first frame already has agents oriented.
  useEffect(() => {
    const now = performance.now() / 1000;
    peopleBuckets.forEach((bucket, bi) => {
      const mesh = peopleRefs.current[bi];
      if (!mesh || bucket.length === 0) return;
      bucket.forEach((agent, i) => setAgentMatrix(mesh, i, agent, now, true));
      mesh.instanceMatrix.needsUpdate = true;
    });
    if (carsRef.current && cars.length > 0) {
      cars.forEach((agent, i) => setAgentMatrix(carsRef.current!, i, agent, now, false));
      carsRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [peopleBuckets, cars]);

  useFrame(() => {
    const now = performance.now() / 1000;
    peopleBuckets.forEach((bucket, bi) => {
      const mesh = peopleRefs.current[bi];
      if (!mesh || bucket.length === 0) return;
      bucket.forEach((agent, i) => setAgentMatrix(mesh, i, agent, now, true));
      mesh.instanceMatrix.needsUpdate = true;
    });
    if (carsRef.current && cars.length > 0) {
      cars.forEach((agent, i) => setAgentMatrix(carsRef.current!, i, agent, now, false));
      carsRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  if (people.length === 0 && cars.length === 0) return null;

  // Spotlight + pickup markers — for each active target whose index lands
  // inside the sampled people array, render a beacon (ring + vertical
  // light column) at that agent's per-frame world position. Spotlights are
  // narrative-only; pickups also expose a click hitbox bound to a story.
  const activeSpotlights = (spotlights ?? []).filter(
    (s) => s.intensity > 0.05 && s.targetAgentIndex >= 0 && s.targetAgentIndex < people.length,
  );
  const activePickups = (pickups ?? []).filter(
    (p) => p.intensity > 0.05 && p.targetAgentIndex >= 0 && p.targetAgentIndex < people.length,
  );

  return (
    <group>
      {peopleBuckets.map((bucket, bi) =>
        bucket.length > 0 ? (
          <instancedMesh
            key={PERSON_POSE_NAMES[bi]}
            ref={(m) => {
              peopleRefs.current[bi] = m;
            }}
            args={[personGeometries[bi], undefined, bucket.length]}
            castShadow
          >
            <meshStandardMaterial
              vertexColors
              roughness={0.85}
              metalness={0}
              flatShading
              transparent
              opacity={progress}
            />
          </instancedMesh>
        ) : null,
      )}
      {cars.length > 0 ? (
        <instancedMesh
          ref={carsRef}
          args={[carGeometry, undefined, cars.length]}
          castShadow
        >
          <meshStandardMaterial
            vertexColors
            roughness={0.75}
            metalness={0.05}
            flatShading
            transparent
            opacity={progress}
          />
        </instancedMesh>
      ) : null}
      {activeSpotlights.map((s) => (
        <AgentBeacon
          key={`spot-${s.targetAgentIndex}`}
          agent={people[s.targetAgentIndex]}
          intensity={s.intensity}
          showInternals={s.showInternals ?? false}
          seed={s.targetAgentIndex}
          dataAgentId={s.dataAgentId}
          sceneLocalT={sceneLocalT ?? 0}
        />
      ))}
      {activePickups.map((p) => (
        <PickupMarker
          key={`pick-${p.storySlug}-${p.targetAgentIndex}`}
          agent={people[p.targetAgentIndex]}
          pickup={p}
        />
      ))}
    </group>
  );
}

/**
 * AgentBeacon — visual highlight that follows a specific sampled agent
 * each frame: flat ground ring + pulsing vertical light column + cap dot.
 * Pure-visual; no pointer events. Used for narrative spotlights ("look at
 * this person"). Pickup markers compose this with a click hitbox.
 */
// Module-level cache for the real agent-activity dataset. Loaded once on
// first AgentBeacon mount; shared by all spotlight beacons in the scene.
type AgentEvent = { tick: number; kind: string };
type AgentActivityDoc = {
  tick_span: [number, number];
  bar_classes: string[];
  agents: Array<{ agent_id: string; events: AgentEvent[] }>;
};
let agentActivityPromise: Promise<AgentActivityDoc | null> | null = null;
function loadAgentActivity(): Promise<AgentActivityDoc | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!agentActivityPromise) {
    agentActivityPromise = fetch("/case-studies/sswt/agent-activity.json")
      .then((r) => (r.ok ? (r.json() as Promise<AgentActivityDoc>) : null))
      .catch(() => null);
  }
  return agentActivityPromise;
}

/** Distance-decayed alpha for class events within ±WINDOW ticks of playbackTick. */
function classAlpha(events: AgentEvent[], kind: string, playbackTick: number): number {
  const WINDOW = 18;
  let best = 0;
  for (const e of events) {
    if (e.kind !== kind) continue;
    const d = Math.abs(e.tick - playbackTick);
    if (d > WINDOW) continue;
    const f = 1 - d / WINDOW;
    const a = f * f; // quadratic decay
    if (a > best) best = a;
  }
  return best;
}

function AgentBeacon({
  agent,
  intensity,
  showInternals = false,
  seed = 0,
  dataAgentId,
  sceneLocalT = 0,
}: {
  agent: Agent;
  intensity: number;
  showInternals?: boolean;
  seed?: number;
  dataAgentId?: string;
  sceneLocalT?: number;
}) {
  // Load real activity dataset once; component re-renders when it lands.
  const [activity, setActivity] = useState<AgentActivityDoc | null>(null);
  useEffect(() => {
    loadAgentActivity().then(setActivity);
  }, []);
  const agentData = useMemo(() => {
    if (!activity || !dataAgentId) return null;
    return activity.agents.find((a) => a.agent_id === dataAgentId) ?? null;
  }, [activity, dataAgentId]);
  const groupRef = useRef<THREE.Group>(null);
  const pulseMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // LLM tier mock cycle — 3 colored vertical bars (Opus / Haiku / Sonnet).
  // Refs so we can mutate material color/opacity per frame without re-renders.
  const tierMatRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([null, null, null]);
  // 6 decision-step dots — gray inactive, glow when active.
  const stepMatRefs = useRef<Array<THREE.MeshBasicMaterial | null>>(
    Array(6).fill(null),
  );
  // 4-segment attention bar (physical / phone / task / conversation).
  const attMatRefs = useRef<Array<THREE.MeshBasicMaterial | null>>(
    Array(4).fill(null),
  );

  useFrame(() => {
    const now = performance.now() / 1000;
    const t = (now * agent.speed) / agent.length + agent.phase;
    const cur = positionAlongPath(agent.path, t);
    if (groupRef.current) {
      groupRef.current.position.set(cur.x, 0, cur.z);
    }
    if (pulseMatRef.current) {
      const pulse = 0.55 + 0.35 * Math.sin(now * Math.PI);
      pulseMatRef.current.opacity = intensity * pulse;
    }

    if (showInternals) {
      // Tell the DOM-side legend "internals are live this frame".
      // It fades in/out based on the timestamp window.
      if (typeof window !== "undefined") {
        window.__sswtInternalsActiveUntil = performance.now() + 250;
      }
      // Per-agent phase offset so multiple spotlights desync.
      const phase = (seed * 0.37) % 1;

      // 3-bar event-class flame.
      //   Real path: when dataAgentId + agentData present, drive bars
      //   from sceneLocalT-mapped playback tick against real events.
      //   Mock path: cycle.
      // Bar 0 = encounter (green), 1 = notification (blue), 2 = reflection (purple).
      const tierColors = ["#6ee7b7", "#93c5fd", "#c4b5fd"];
      if (agentData && activity) {
        const [tMin, tMax] = activity.tick_span;
        const playbackTick = tMin + sceneLocalT * (tMax - tMin);
        const alphas = [
          classAlpha(agentData.events, "encounter", playbackTick),
          classAlpha(agentData.events, "notification", playbackTick),
          classAlpha(agentData.events, "reflection", playbackTick),
        ];
        for (let i = 0; i < 3; i++) {
          const mat = tierMatRefs.current[i];
          if (!mat) continue;
          mat.color.set(tierColors[i]);
          // Min 0.18 baseline so the bar is always faintly there, peaks
          // strongly when a real event lands near the playback tick.
          mat.opacity = intensity * (0.18 + 0.82 * alphas[i]);
        }
      } else {
        // Mock cycle fallback (no real data bound).
        const tierT = ((now / 3.5) + phase) % 1;
        let activeTier = -1;
        let tierAlpha = 0;
        if (tierT < 0.18) {
          activeTier = Math.floor(((now / 3.5) + phase) * 1000) % 3;
          tierAlpha = Math.sin((tierT / 0.18) * Math.PI);
        }
        for (let i = 0; i < 3; i++) {
          const mat = tierMatRefs.current[i];
          if (!mat) continue;
          if (i === activeTier) {
            mat.color.set(tierColors[i]);
            mat.opacity = intensity * (0.45 + 0.55 * tierAlpha);
          } else {
            mat.color.set("#9a8a6e");
            mat.opacity = intensity * 0.42;
          }
        }
      }

      // Decision-step cycle: 6-step stack, ~1.4 s per step.
      const stepIdx = Math.floor(((now / 1.4) + phase * 6) % 6);
      for (let i = 0; i < 6; i++) {
        const mat = stepMatRefs.current[i];
        if (!mat) continue;
        if (i === stepIdx) {
          mat.color.set("#fde6a8");
          mat.opacity = intensity * 1.0;
        } else {
          mat.color.set("#8a7560");
          mat.opacity = intensity * 0.48;
        }
      }

      // Attention 4-segment cycle: physical / phone / task / conversation.
      // Weighted distribution — agents mostly stay on physical_world, phone
      // takes ~20% of the time, task/convo are rarer flares. Real signal
      // will come from AttentionState.attention_target in SSWT exports.
      const attBucket = ((now / 2.5) + seed * 0.41) % 1;
      let activeAtt = 0; // physical
      if (attBucket >= 0.65 && attBucket < 0.86) activeAtt = 1; // phone
      else if (attBucket >= 0.86 && attBucket < 0.95) activeAtt = 2; // task
      else if (attBucket >= 0.95) activeAtt = 3; // conversation
      const attColors = ["#a8e6a3", "#ff7b6b", "#a8c8ff", "#d0b0ff"];
      for (let i = 0; i < 4; i++) {
        const mat = attMatRefs.current[i];
        if (!mat) continue;
        if (i === activeAtt) {
          mat.color.set(attColors[i]);
          mat.opacity = intensity * 0.92;
        } else {
          mat.color.set("#5a4a32");
          mat.opacity = intensity * 0.22;
        }
      }
    }
  });

  // Per user feedback: beacon (ring / column / cap) is just the POSITION
  // anchor — the real signal is the 3-widget stack above (那个"此刻在做什么
  // 的标记"). So: beacon shrunk to a discreet stake, widgets enlarged 2-2.5×.
  // Goal: 30+ beacons visible as small clean position dots, each with a
  // crisply readable internal-state cluster floating above their head.
  const ringInner = 0.10 * intensity;
  const ringOuter = 0.15 * intensity;
  const beaconHeight = 0.55 * intensity;

  return (
    <group ref={groupRef}>
      {/* Small clean ring — position anchor only */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[ringInner, ringOuter, 48]} />
        <meshBasicMaterial
          color="#f4c674"
          transparent
          opacity={intensity * 0.72}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Thin stalk — lifts the widgets above the head without dominating */}
      <mesh position={[0, beaconHeight / 2, 0]} scale={[1, intensity, 1]}>
        <cylinderGeometry args={[0.010, 0.010, beaconHeight, 8, 1, true]} />
        <meshBasicMaterial
          ref={pulseMatRef}
          color="#f4c674"
          transparent
          opacity={intensity * 0.55}
          toneMapped={false}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Tiny top cap — subtle terminator */}
      <mesh position={[0, beaconHeight, 0]}>
        <sphereGeometry args={[0.025 * intensity, 10, 8]} />
        <meshBasicMaterial
          color="#fde6a8"
          transparent
          opacity={intensity * 0.85}
          toneMapped={false}
        />
      </mesh>
      {showInternals ? (
        <group position={[0, beaconHeight + 0.12, 0]}>
          {/* LLM tier flame: 3 vertical bars (encounter / notif / reflection)
              Enlarged 2.5× per user request — these widgets are the actual
              "此刻在做什么的标记" and must read clearly from camera distance. */}
          {[0, 1, 2].map((i) => (
            <mesh
              key={`tier-${i}`}
              position={[(i - 1) * 0.10, 0.12, 0]}
            >
              <boxGeometry args={[0.055, 0.20, 0.055]} />
              <meshBasicMaterial
                ref={(m) => {
                  tierMatRefs.current[i] = m;
                }}
                transparent
                opacity={intensity * 0.55}
                toneMapped={false}
                depthWrite={false}
              />
            </mesh>
          ))}
          {/* 6 decision-step dots — enlarged 2.5× */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <mesh
              key={`step-${i}`}
              position={[(i - 2.5) * 0.055, 0.36, 0]}
            >
              <sphereGeometry args={[0.028, 12, 8]} />
              <meshBasicMaterial
                ref={(m) => {
                  stepMatRefs.current[i] = m;
                }}
                transparent
                opacity={intensity * 0.65}
                toneMapped={false}
              />
            </mesh>
          ))}
          {/* Attention 4-segment bar — enlarged 2.2× */}
          {[0, 1, 2, 3].map((i) => (
            <mesh
              key={`att-${i}`}
              position={[(i - 1.5) * 0.055, 0.52, 0]}
            >
              <boxGeometry args={[0.04, 0.05, 0.04]} />
              <meshBasicMaterial
                ref={(m) => {
                  attMatRefs.current[i] = m;
                }}
                transparent
                opacity={intensity * 0.55}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>
      ) : null}
    </group>
  );
}

/**
 * PickupMarker — AgentBeacon + click hitbox bound to a resident-story
 * slug. The hitbox is a transparent cylinder large enough for touch +
 * tracks the same path as the beacon. Clicks dispatch openReader on
 * the global ReaderContext.
 */
function PickupMarker({ agent, pickup }: { agent: Agent; pickup: ResolvedPickup }) {
  const reader = useReaderContext();
  const hitboxRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const now = performance.now() / 1000;
    const t = (now * agent.speed) / agent.length + agent.phase;
    const cur = positionAlongPath(agent.path, t);
    if (hitboxRef.current) {
      hitboxRef.current.position.set(cur.x, 0, cur.z);
    }
  });

  const beaconHeight = 0.7 * pickup.intensity;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!reader) return;
    e.stopPropagation();
    reader.openReader(pickup.storySlug);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (typeof document !== "undefined") document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    if (typeof document !== "undefined") document.body.style.cursor = "";
  };

  return (
    <>
      <AgentBeacon agent={agent} intensity={pickup.intensity} />
      <group ref={hitboxRef}>
        <mesh
          position={[0, beaconHeight / 2 + 0.1, 0]}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <cylinderGeometry args={[0.32, 0.32, beaconHeight + 0.3, 12]} />
          <meshBasicMaterial
            transparent
            opacity={0}
            depthWrite={false}
            colorWrite={false}
          />
        </mesh>
      </group>
    </>
  );
}

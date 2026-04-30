"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
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

export function AgentsTrajectoriesOverlay({ progress, sandTable }: MapOverlayProps) {
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
    </group>
  );
}

"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sampleAgents } from "@/lib/cinema/agentSampling";
import type { MapOverlayProps } from "./registry";

/**
 * Digital silos overlay — every agent grows a vertical red light pillar
 * (information silo / attention enclave). Per cinema-map-overlays D4.
 *
 * Shares seed=42 / count=60 with the people pool in AgentsTrajectoriesOverlay
 * so silo positions equal the same 60 residents' starting points (path[0]) —
 * implies "the same residents, now visualized as encapsulated rather than
 * moving". Cars are not represented here (silos = info bubble, only people).
 */
const AGENT_COUNT = 200; // matches AgentsTrajectoriesOverlay PEOPLE_COUNT
const AGENT_SEED = 42;
const SILO_HEIGHT = 0.5;
const SILO_RADIUS_TOP = 0.018;
const SILO_RADIUS_BOTTOM = 0.022;
const PULSE_FREQ_HZ = 1.5;

export function DigitalSilosOverlay({ progress, sandTable }: MapOverlayProps) {
  const agents = useMemo(
    () => sampleAgents(sandTable, AGENT_COUNT, AGENT_SEED),
    [sandTable],
  );
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matrix = useMemo(() => new THREE.Matrix4(), []);

  // Lock silo positions once per agents list change (silos don't move).
  useEffect(() => {
    if (!meshRef.current || agents.length === 0) return;
    agents.forEach((agent, i) => {
      const start = agent.path[0];
      // Cylinder geometry default centers on origin → translate so base = ground.
      matrix.makeTranslation(start.x, SILO_HEIGHT / 2, start.z);
      meshRef.current!.setMatrixAt(i, matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [agents, matrix]);

  // Subtle pulse on opacity to suggest "active digital connection".
  useFrame(() => {
    if (!meshRef.current) return;
    const now = performance.now() / 1000;
    const pulse = 0.6 + 0.4 * Math.sin(now * PULSE_FREQ_HZ * Math.PI * 2);
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    if (mat) mat.opacity = progress * pulse;
  });

  if (agents.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, agents.length]}>
      <cylinderGeometry args={[SILO_RADIUS_TOP, SILO_RADIUS_BOTTOM, SILO_HEIGHT, 8, 1, true]} />
      <meshBasicMaterial
        color="#ff3366"
        transparent
        opacity={progress}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

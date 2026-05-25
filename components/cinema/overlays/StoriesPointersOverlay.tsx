"use client";

import { useMemo } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { MapOverlayProps } from "./registry";
import {
  sampleWalkers,
  positionAlongPath,
  type Agent,
} from "@/lib/cinema/agentSampling";

/**
 * StoriesPointersOverlay — figure-caption annotation pattern. Each of
 * three featured residents gets:
 *
 *   - small static dot at their position in the city (no animation)
 *   - 2-segment elbow leader line (straight up, then over to label)
 *   - bare clickable HTML label at the line's end (name + role + arrow)
 *
 * Visual layout:
 *   - Hannah  → upper-LEFT label, elbow up then up-left
 *   - Mary    → lower-RIGHT (below horizon), elbow down then right
 *   - a0290   → upper-RIGHT, elbow up then up-right
 *
 * This 1-below + 2-above distribution + spread offsets keeps the three
 * callouts visually balanced. Labels use screen-projected positioning
 * (no `distanceFactor` — drei was shrinking hit areas to pixels).
 */

const PEOPLE_COUNT = 200;
const PEOPLE_SEED = 42;

type LayoutPlan = {
  /** elbow midpoint Y (world units, relative to anchor) */
  elbowY: number;
  /** final label end position (world units, relative to anchor) */
  endDx: number;
  endY: number;
  endDz: number;
};

type ResidentMeta = {
  slug: string;
  name: string;
  roleZh: string;
  roleEn: string;
  agentIndex: number;
  layout: LayoutPlan;
};

const RESIDENTS: ResidentMeta[] = [
  {
    slug: "hannah",
    name: "Hannah",
    roleZh: "36 · 咖啡店老板娘",
    roleEn: "36 · café owner",
    agentIndex: 12,
    // upper-LEFT — elbow goes up first, then horizontally to the left
    layout: { elbowY: 2.2, endDx: -2.6, endY: 2.2, endDz: 0 },
  },
  {
    slug: "mary",
    name: "Mary",
    roleZh: "退休教师 · 清晨遛狗",
    roleEn: "retired teacher · dawn walk",
    agentIndex: 42,
    // lower-RIGHT (BELOW horizon) — elbow drops down, then right
    layout: { elbowY: -1.1, endDx: 2.2, endY: -1.1, endDz: 0 },
  },
  {
    slug: "a0290",
    name: "Agent #0290",
    roleZh: "27 · 夜班咖啡师",
    roleEn: "27 · night-shift barista",
    agentIndex: 88,
    // upper-RIGHT — elbow up, then right
    layout: { elbowY: 1.7, endDx: 2.8, endY: 1.7, endDz: 0 },
  },
];

const LINE_COLOR = "#E8E2D2";
const LINE_OPACITY = 0.55;
const ANCHOR_OPACITY = 0.7;

function ResidentCallout({
  resident,
  agent,
  progress,
}: {
  resident: ResidentMeta;
  agent: Agent;
  progress: number;
}) {
  // Freeze the walker's anchor position at t=0.
  const anchor = useMemo(() => positionAlongPath(agent.path, 0), [agent]);

  const elbow = useMemo(
    () => ({
      x: anchor.x,
      y: resident.layout.elbowY,
      z: anchor.z,
    }),
    [anchor, resident.layout.elbowY],
  );

  const labelEnd = useMemo(
    () => ({
      x: anchor.x + resident.layout.endDx,
      y: resident.layout.endY,
      z: anchor.z + resident.layout.endDz,
    }),
    [anchor, resident.layout],
  );

  // Two-segment elbow line: anchor → elbow → labelEnd.
  // BufferGeometry with `gl.LINE_STRIP` so we don't need duplicate vertices.
  const lineGeom = useMemo(() => {
    const positions = new Float32Array([
      anchor.x, 0.04, anchor.z,
      elbow.x, elbow.y, elbow.z,
      labelEnd.x, labelEnd.y, labelEnd.z,
    ]);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [anchor, elbow, labelEnd]);

  const handleClick = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("open-resident-story", { detail: { slug: resident.slug } }),
    );
  };

  return (
    <group>
      {/* Static dot at city anchor (just above ground) */}
      <mesh position={[anchor.x, 0.04, anchor.z]}>
        <sphereGeometry args={[0.035, 12, 8]} />
        <meshBasicMaterial
          color={LINE_COLOR}
          transparent
          opacity={progress * ANCHOR_OPACITY}
          toneMapped={false}
        />
      </mesh>
      {/* Elbow leader line — straight up then over (or straight down then over) */}
      <line>
        <primitive object={lineGeom} attach="geometry" />
        <lineBasicMaterial
          attach="material"
          color={LINE_COLOR}
          transparent
          opacity={progress * LINE_OPACITY}
          toneMapped={false}
        />
      </line>
      {/* Endpoint dot — small punctuation where label sits */}
      <mesh position={[labelEnd.x, labelEnd.y, labelEnd.z]}>
        <sphereGeometry args={[0.022, 10, 8]} />
        <meshBasicMaterial
          color={LINE_COLOR}
          transparent
          opacity={progress * 0.78}
          toneMapped={false}
        />
      </mesh>
      {/* Clickable label — screen-projected (NO distanceFactor) so
          the click hit-area stays at its natural CSS size. */}
      <Html
        position={[labelEnd.x, labelEnd.y, labelEnd.z]}
        center
        zIndexRange={[50, 0]}
        style={{
          opacity: progress,
          transition: "opacity 220ms ease",
          userSelect: "none",
          pointerEvents: "none", // outer none, inner button auto
        }}
      >
        <ResidentLabel resident={resident} onClick={handleClick} />
      </Html>
    </group>
  );
}

function ResidentLabel({
  resident,
  onClick,
}: {
  resident: ResidentMeta;
  onClick: () => void;
}) {
  const isZh =
    typeof document !== "undefined" &&
    (document.documentElement.lang === "zh" ||
      document.documentElement.lang.startsWith("zh"));
  const role = isZh ? resident.roleZh : resident.roleEn;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-1 px-3 py-2 font-sans text-white"
      style={{
        pointerEvents: "auto",
        textShadow: "0 0 10px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.6)",
        // Move the label slightly UP from the endpoint dot so the dot
        // stays visible — translation in screen pixels.
        transform: "translateY(-22px)",
      }}
    >
      <span className="inline-flex items-center gap-1.5 text-[14px] leading-[1.15] underline decoration-white/45 decoration-1 underline-offset-[5px] transition-all duration-200 group-hover:decoration-white group-hover:decoration-2">
        <span className="font-medium">{resident.name}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden
        >
          <path
            d="M5 12h14M13 5l7 7-7 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
        {role}
      </span>
    </button>
  );
}

export function StoriesPointersOverlay({ progress, sandTable }: MapOverlayProps) {
  const people = useMemo(
    () => (sandTable ? sampleWalkers(sandTable, PEOPLE_COUNT, PEOPLE_SEED) : []),
    [sandTable],
  );

  if (!sandTable || people.length === 0) return null;

  return (
    <group>
      {RESIDENTS.map((r) => {
        const agent = people[r.agentIndex];
        if (!agent) return null;
        return (
          <ResidentCallout
            key={r.slug}
            resident={r}
            agent={agent}
            progress={progress}
          />
        );
      })}
    </group>
  );
}

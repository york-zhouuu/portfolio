"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { MapOverlayProps } from "./registry";
import type { NormalizedSandTable } from "@/lib/cinema/geometry";

/**
 * FindingAnchorsOverlay — sandbox-native rendering of the Act-3 Finding
 * visualisations, faithful to the v7 paper figures
 * (`tools/hero_figure_siphon.py`, `tools/f2_geographic_3panel.py`).
 *
 * Data source: `public/case-studies/sswt/finding-anchors.json` — generated
 * offline by `SSWT/tools/dump_finding_dwell_for_portfolio.py` from seed-44
 * per-POI dwell ticks. Contains top-30 POIs by HP-vs-BL delta plus the top
 * 5 anchors per condition.
 *
 * Visual layers (matching v7's `paint_panel`):
 *   1. Heat circles — 30 orange `#D14B12` semi-transparent discs, radius
 *      sqrt-scaled by delta_ticks so AREA is proportional to attention
 *      gain. PLC Preschool dominates ~10× any other anchor.
 *   2. Anchor rings — 5 dark-red `#7A2F0E` outline circles marking the
 *      named anchors.
 *   3. HTML callouts — white-bg / red-border label boxes with
 *      "{name}\n+{delta//1000}K · {ratio:.0f}×", positioned offset by
 *      quadrant (matching v7's smart-placement logic).
 *
 * F2 uses two color sets (HP yellow + PF pink) + bigger overlap rings.
 */

const HEAT_COLOR = "#D14B12";       // v7 dwell heat circles
const ANCHOR_RING_COLOR = "#7A2F0E"; // v7 anchor ring (deep red)
const HP_COLOR = "#FFD23F";          // v7 yellow — HP-only
const PF_COLOR = "#FF4D8F";          // v7 hot pink — PF-only
const OVERLAP_COLOR = "#1B1F2A";     // v7 ink — overlap (both)

// ---- Data types matching dump_finding_dwell_for_portfolio.py output --------

type FindingPoi = {
  id: string;
  name: string;
  type: string;
  x: number; // atlas meters — not used at runtime; we look up normalized
  y: number;
  bl: number;
  hp: number;
  delta_ticks: number;
  ratio: number;
};

type F3Agent = {
  agent_id: string;
  bl_location_id: string;
  movable: boolean;
};

type FindingData = {
  _meta: {
    source: string;
    atlas: string;
    n_pois_total: number;
    world_bounds_meters: { min_x: number; max_x: number; min_y: number; max_y: number };
    movable_threshold_m?: number;
  };
  f1_siphon: {
    top_pois: FindingPoi[];
    top_anchors: FindingPoi[];
  };
  f2_friction: {
    hp_anchors: FindingPoi[];
    pf_anchors: FindingPoi[];
    overlap_ids: string[];
    top_pois_hp: FindingPoi[];
    top_pois_pf: FindingPoi[];
  };
  f3_routine_cliff?: {
    agents: F3Agent[];
    n_movable: number;
    n_locked: number;
    threshold_m: number;
  };
};

let findingDataPromise: Promise<FindingData | null> | null = null;
function loadFindingData(): Promise<FindingData | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!findingDataPromise) {
    findingDataPromise = fetch("/case-studies/sswt/finding-anchors.json")
      .then((r) => (r.ok ? (r.json() as Promise<FindingData>) : null))
      .catch(() => null);
  }
  return findingDataPromise;
}

function centroid(shape: Array<{ x: number; y: number }>): { x: number; y: number } | null {
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
  id: string,
): { x: number; y: number } | null {
  if (!sandTable) return null;
  const b = sandTable.buildings.find((b) => b.id === id);
  if (b) return centroid(b.shape);
  const p = sandTable.parks.find((p) => p.id === id);
  if (p) return centroid(p.shape);
  return null;
}

// ---- HEAT CIRCLE — v7 exact formula: linear radius + linear alpha ----------
//
// v7 spec (tools/hero_figure_siphon.py:158-164):
//   radius = 25 + intensity * 250   # meters, linear in intensity
//   alpha  = 0.18 + intensity * 0.55  # linear, range 0.18-0.73
//
// In normalized world units (Lane Cove ~1500m scene window mapped to ±8 wu
// half-extent), 1 meter ≈ 0.0053 wu, so 25-275m = 0.13-1.46 wu. Hold the
// world ranges tight to v7.

const HEAT_RADIUS_MIN = 0.13;       // = 25m in normalized world units
const HEAT_RADIUS_RANGE = 1.33;     // = 250m range → max 1.46 wu
const HEAT_ALPHA_MIN = 0.18;
const HEAT_ALPHA_RANGE = 0.55;

function HeatCircle({
  x,
  z,
  intensity,         // 0..1
  color,
  progress,
}: {
  x: number;
  z: number;
  intensity: number;
  color: string;
  progress: number;
}) {
  // v7 uses LINEAR scaling of radius (not sqrt). PLC dominates because its
  // intensity is ~1.0 while next-rank Anytime Fitness is ~0.11, so the
  // visual disparity IS the siphon punchline.
  const radius = HEAT_RADIUS_MIN + intensity * HEAT_RADIUS_RANGE;
  const alpha = HEAT_ALPHA_MIN + intensity * HEAT_ALPHA_RANGE;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.015, z]}>
      <circleGeometry args={[radius, 48]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={progress * alpha}
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  );
}

// ---- ANCHOR RING — dark-red outline around the named top-5 ------------------

function AnchorRing({
  x,
  z,
  progress,
  color = ANCHOR_RING_COLOR,
  radius = 0.36,
}: {
  x: number;
  z: number;
  progress: number;
  color?: string;
  radius?: number;
}) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.025, z]}>
      <ringGeometry args={[radius * 0.85, radius, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={progress * 0.85}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ---- HTML CALLOUT — white-bg red-border label box w/ arrow line -------------
//
// Position rule from v7: offset 340/280m in quadrant direction (away from
// the anchor cluster center). In normalized world units 340m ≈ 1.8 wu.
// The line is drawn as a separate <line>; the box is via drei <Html>.

const CALLOUT_OFFSET = 1.65;

function AnchorCallout({
  x,
  z,
  centerX,
  centerZ,
  name,
  metric,
  progress,
  group,
}: {
  x: number;
  z: number;
  centerX: number;
  centerZ: number;
  name: string;
  metric: string;
  progress: number;
  group?: "hp" | "pf" | "overlap";
}) {
  // Quadrant-aware offset (away from cluster center).
  const dx = x - centerX;
  const dz = z - centerZ;
  const offX = dx >= 0 ? CALLOUT_OFFSET : -CALLOUT_OFFSET;
  const offZ = dz >= 0 ? CALLOUT_OFFSET * 0.82 : -CALLOUT_OFFSET * 0.82;
  const labelX = x + offX;
  const labelZ = z + offZ;

  // Connector line from anchor → label box.
  const linePoints = useMemo(() => {
    const arr = new Float32Array(6);
    arr[0] = x;
    arr[1] = 0.03;
    arr[2] = z;
    arr[3] = labelX;
    arr[4] = 0.03;
    arr[5] = labelZ;
    return arr;
  }, [x, z, labelX, labelZ]);

  const accentColor =
    group === "hp" ? HP_COLOR
    : group === "pf" ? PF_COLOR
    : group === "overlap" ? OVERLAP_COLOR
    : ANCHOR_RING_COLOR;

  return (
    <group>
      {/* Connector line */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePoints, 3]}
            count={2}
            array={linePoints}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={accentColor}
          transparent
          opacity={progress * 0.7}
          toneMapped={false}
        />
      </lineSegments>
      {/* HTML callout — projects DOM into 3D space */}
      <Html
        position={[labelX, 0.05, labelZ]}
        center
        distanceFactor={6}
        style={{
          opacity: progress,
          transition: "opacity 200ms ease",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-sans), Inter, sans-serif",
            background: "#FFFFFF",
            border: `1.5px solid ${accentColor}`,
            borderRadius: 4,
            padding: "5px 8px",
            color: "#1B1F2A",
            fontSize: 11,
            lineHeight: 1.25,
            fontWeight: 600,
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 10.5 }}>{name}</div>
          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 1 }}>{metric}</div>
        </div>
      </Html>
    </group>
  );
}

// ---- F1 SIPHON ------------------------------------------------------------

function Finding1SiphonImpl({ progress, sandTable }: MapOverlayProps) {
  const [data, setData] = useState<FindingData | null>(null);
  useEffect(() => {
    loadFindingData().then(setData);
  }, []);

  const rendered = useMemo(() => {
    if (!data || !sandTable) return null;
    const f1 = data.f1_siphon;
    // v7 ranks heat circles by HP DWELL VALUE (val/max_val), not by delta.
    // The dwell volume — not the lift — defines the siphon visual punchline.
    // (top_pois is already sorted desc by delta which approximates the HP
    // ranking closely for PLC-dominant case; we use the hp field for the
    // intensity calculation to match v7 exactly.)
    const maxHp = Math.max(...f1.top_pois.map((p) => p.hp));
    const pois = f1.top_pois
      .map((p) => {
        const c = lookupCenter(sandTable, p.id);
        if (!c) return null;
        return { ...p, x: c.x, z: c.y, intensity: p.hp / Math.max(1, maxHp) };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    const anchors = f1.top_anchors
      .map((p) => {
        const c = lookupCenter(sandTable, p.id);
        if (!c) return null;
        const cleanName = (p.name || p.id).replace(/_/g, " ").slice(0, 32);
        const k = Math.round(p.delta_ticks / 1000);
        const metric = `+${k}K · ${Math.round(p.ratio)}×`;
        return { ...p, x: c.x, z: c.y, displayName: cleanName, metric };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    // Cluster center for callout offset direction.
    const cx = anchors.reduce((s, a) => s + a.x, 0) / Math.max(1, anchors.length);
    const cz = anchors.reduce((s, a) => s + a.z, 0) / Math.max(1, anchors.length);
    return { pois, anchors, cx, cz };
  }, [data, sandTable]);

  if (!rendered) return null;

  return (
    <group>
      {/* Layer 1: 30 orange heat circles, sized by delta */}
      {rendered.pois.map((p) => (
        <HeatCircle
          key={`heat-${p.id}`}
          x={p.x}
          z={p.z}
          intensity={p.intensity}
          color={HEAT_COLOR}
          progress={progress}
        />
      ))}
      {/* Layer 2: 5 dark-red anchor rings */}
      {rendered.anchors.map((a) => (
        <AnchorRing key={`ring-${a.id}`} x={a.x} z={a.z} progress={progress} />
      ))}
      {/* Layer 3: 5 white-box callouts */}
      {rendered.anchors.map((a) => (
        <AnchorCallout
          key={`callout-${a.id}`}
          x={a.x}
          z={a.z}
          centerX={rendered.cx}
          centerZ={rendered.cz}
          name={a.displayName}
          metric={a.metric}
          progress={progress}
        />
      ))}
    </group>
  );
}

// ---- F2 FRICTION ----------------------------------------------------------

function Finding2FrictionImpl({ progress, sandTable }: MapOverlayProps) {
  const [data, setData] = useState<FindingData | null>(null);
  useEffect(() => {
    loadFindingData().then(setData);
  }, []);

  const rendered = useMemo(() => {
    if (!data || !sandTable) return null;
    const f2 = data.f2_friction;
    const overlapSet = new Set(f2.overlap_ids);

    const project = (p: FindingPoi, fallbackColor: string) => {
      const c = lookupCenter(sandTable, p.id);
      if (!c) return null;
      const isOverlap = overlapSet.has(p.id);
      const cleanName = (p.name || p.id).replace(/_/g, " ").slice(0, 26);
      const k = Math.round(p.delta_ticks / 1000);
      const metric = `+${k}K`;
      const group = isOverlap ? "overlap" : fallbackColor === HP_COLOR ? "hp" : "pf";
      return {
        ...p,
        x: c.x,
        z: c.y,
        color: isOverlap ? OVERLAP_COLOR : fallbackColor,
        group: group as "hp" | "pf" | "overlap",
        displayName: cleanName,
        metric,
      };
    };

    const hpRanked = f2.top_pois_hp.slice(0, 30).map((p) => project(p, HP_COLOR)).filter(Boolean);
    const pfRanked = f2.top_pois_pf.slice(0, 30).map((p) => project(p, PF_COLOR)).filter(Boolean);
    // v7 uses raw dwell VALUE per panel (val/max_val), not delta. For the
    // hp dwell field, max across the top 30. For pf, the .hp field actually
    // holds the PF dwell since project() runs once per variant.
    const maxHp = Math.max(...f2.top_pois_hp.map((p) => p.hp));
    const maxPf = Math.max(...f2.top_pois_pf.map((p) => p.hp));

    const hpAnchors = f2.hp_anchors.map((p) => project(p, HP_COLOR)).filter(Boolean);
    const pfAnchors = f2.pf_anchors.map((p) => project(p, PF_COLOR)).filter(Boolean);

    const allAnchors = [...hpAnchors, ...pfAnchors] as Array<NonNullable<ReturnType<typeof project>>>;
    const cx = allAnchors.reduce((s, a) => s + a.x, 0) / Math.max(1, allAnchors.length);
    const cz = allAnchors.reduce((s, a) => s + a.z, 0) / Math.max(1, allAnchors.length);

    return {
      hp: hpRanked.filter((x): x is NonNullable<typeof x> => x !== null),
      pf: pfRanked.filter((x): x is NonNullable<typeof x> => x !== null),
      maxHp,
      maxPf,
      hpAnchors: hpAnchors.filter((x): x is NonNullable<typeof x> => x !== null),
      pfAnchors: pfAnchors.filter((x): x is NonNullable<typeof x> => x !== null),
      cx,
      cz,
    };
  }, [data, sandTable]);

  if (!rendered) return null;

  // Deduplicate callouts on anchor id so overlap renders once with overlap color.
  const calloutMap = new Map<string, NonNullable<ReturnType<typeof Object>>>();
  for (const a of rendered.hpAnchors) calloutMap.set(a.id, a);
  for (const a of rendered.pfAnchors) {
    // PF takes priority if overlap so the overlap dark color shows.
    if (!calloutMap.has(a.id) || a.group === "overlap") calloutMap.set(a.id, a);
  }
  const callouts = Array.from(calloutMap.values());

  return (
    <group>
      {/* HP heat layer (yellow), behind. v7 uses raw HP dwell val/max_hp. */}
      {rendered.hp.map((p) => (
        <HeatCircle
          key={`hp-heat-${p.id}`}
          x={p.x}
          z={p.z}
          intensity={p.hp / Math.max(1, rendered.maxHp)}
          color={HP_COLOR}
          progress={progress * 0.85}
        />
      ))}
      {/* PF heat layer (pink), in front of HP. Note: p.hp field holds PF
          dwell here because project() pulled from top_pois_pf. */}
      {rendered.pf.map((p) => (
        <HeatCircle
          key={`pf-heat-${p.id}`}
          x={p.x}
          z={p.z}
          intensity={p.hp / Math.max(1, rendered.maxPf)}
          color={PF_COLOR}
          progress={progress * 0.85}
        />
      ))}
      {/* Anchor rings — overlap gets bigger ring */}
      {callouts.map((a) => (
        <AnchorRing
          key={`ring-${a.id}`}
          x={a.x}
          z={a.z}
          progress={progress}
          color={a.color}
          radius={a.group === "overlap" ? 0.5 : 0.32}
        />
      ))}
      {/* Callouts */}
      {callouts.map((a) => (
        <AnchorCallout
          key={`callout-${a.id}`}
          x={a.x}
          z={a.z}
          centerX={rendered.cx}
          centerZ={rendered.cz}
          name={a.displayName}
          metric={a.metric}
          progress={progress}
          group={a.group}
        />
      ))}
    </group>
  );
}

// ---- F3 ROUTINE CLIFF ------------------------------------------------------
//
// 1,000 dots at each agent's BL end-position (looked up via atlas building/park
// centroid). 310 pink "movable" (HP shifted them ≥100m) + 690 grey "locked"
// (HP barely moved them) — matches `tools/f3_movable_map.py` exactly. Adds
// one HTML stat callout in the corner with the 31% / 69% split.

// v7 exact (tools/f3_movable_map.py:106-109):
//   PINK_DEEP = "#C8245E"  · movable dot
//   GREY_DEEP = "#5F584F"  · locked dot
const MOVABLE_COLOR = "#C8245E";   // v7 PINK_DEEP — those who move
const LOCKED_COLOR = "#5F584F";    // v7 GREY_DEEP — those who don't

function Finding3RoutineCliffImpl({ progress, sandTable }: MapOverlayProps) {
  const [data, setData] = useState<FindingData | null>(null);
  useEffect(() => {
    loadFindingData().then(setData);
  }, []);

  const rendered = useMemo(() => {
    if (!data || !data.f3_routine_cliff || !sandTable) return null;
    const f3 = data.f3_routine_cliff;
    // Project each agent to its BL end-position centroid in world units.
    // Dedup nothing — collocated agents stack visually (data is faithful).
    const movable: Array<{ x: number; z: number }> = [];
    const locked: Array<{ x: number; z: number }> = [];
    for (const a of f3.agents) {
      const c = lookupCenter(sandTable, a.bl_location_id);
      if (!c) continue;
      (a.movable ? movable : locked).push({ x: c.x, z: c.y });
    }
    return {
      movable,
      locked,
      nMovable: f3.n_movable,
      nLocked: f3.n_locked,
      total: f3.agents.length,
    };
  }, [data, sandTable]);

  if (!rendered) return null;

  return (
    <group>
      {/* LOCKED dots — render first so movable sit on top. v7 alpha 0.32. */}
      <Dots dots={rendered.locked} color={LOCKED_COLOR} radius={0.040} alpha={0.32 * progress} />
      {/* MOVABLE dots — v7 s=26 vs locked s=14 (~1.36× radius), alpha 0.78. */}
      <Dots dots={rendered.movable} color={MOVABLE_COLOR} radius={0.055} alpha={0.78 * progress} />
      {/* Stat callout — top-left corner of sandbox */}
      <Html
        position={[-6.5, 0.1, -5.5]}
        center
        distanceFactor={5}
        style={{
          opacity: progress,
          transition: "opacity 200ms ease",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-sans), Inter, sans-serif",
            background: "#FFFFFF",
            border: `1.5px solid ${MOVABLE_COLOR}`,
            borderRadius: 4,
            padding: "8px 12px",
            color: "#1B1F2A",
            fontSize: 11,
            lineHeight: 1.35,
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
          }}
        >
          <div style={{ fontWeight: 700, color: MOVABLE_COLOR, fontSize: 14 }}>
            {rendered.nMovable} movable
          </div>
          <div style={{ fontSize: 10, color: "#6A645A", marginTop: 2 }}>
            HP shifted them ≥ 100 m
          </div>
          <div style={{ fontWeight: 700, color: LOCKED_COLOR, fontSize: 14, marginTop: 6 }}>
            {rendered.nLocked} locked
          </div>
          <div style={{ fontSize: 10, color: "#6A645A", marginTop: 2 }}>
            no intervention reached them
          </div>
        </div>
      </Html>
    </group>
  );
}

/** Render a flat scatter of small disks — efficient via instancedMesh would
 *  be ideal but for 1k dots a plain map is fine. */
function Dots({
  dots,
  color,
  radius,
  alpha,
}: {
  dots: Array<{ x: number; z: number }>;
  color: string;
  radius: number;
  alpha: number;
}) {
  return (
    <group>
      {dots.map((d, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[d.x, 0.018, d.z]}
        >
          <circleGeometry args={[radius, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={alpha}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export function Finding1SiphonOverlay(props: MapOverlayProps) {
  return <Finding1SiphonImpl {...props} />;
}

export function Finding2FrictionOverlay(props: MapOverlayProps) {
  return <Finding2FrictionImpl {...props} />;
}

export function Finding3RoutineCliffOverlay(props: MapOverlayProps) {
  return <Finding3RoutineCliffImpl {...props} />;
}

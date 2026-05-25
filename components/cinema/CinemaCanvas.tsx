"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import type { CameraScore } from "@/lib/cinema/types";
import type { CaseStudyAct } from "@/lib/content/case-study-schema";
import type { MapGeometryAsset } from "@/lib/content/load-sswt-assets";
import { resolveTheme, type CinemaTheme } from "@/lib/cinema/theme";
import { normalizeSandTable } from "@/lib/cinema/geometry";
import {
  beatAt,
  buildBeatLayout,
  mapScrollToScoreT,
  scrollToT,
} from "@/lib/cinema/scrollCinema";
import { useResolvedMapState } from "@/lib/cinema/useResolvedMapState";
import { SandTable } from "./SandTable";
import { CameraRig } from "./CameraRig";
import { Atmosphere } from "./Atmosphere";
import { MapOverlay } from "./overlays/MapOverlay";

/**
 * CinemaCanvas — the cinema floor. Mounts a single fixed-position R3F Canvas
 * that hosts the sand-table world. Reads scroll → t once at the page level
 * and passes it down via ref (no per-section progress hooks anywhere).
 *
 * Iteration seam: swap the children of <Canvas> to flip the entire visual
 * register (e.g., to a 2D abstract version, a glitched holographic version,
 * etc.) without touching the page route or the score data.
 */
export function CinemaCanvas({
  score,
  acts,
  geometry,
  themeOverrides,
}: {
  score: CameraScore;
  acts: CaseStudyAct[];
  geometry: MapGeometryAsset | null;
  themeOverrides?: Partial<CinemaTheme>;
}) {
  const theme = useMemo(() => resolveTheme(themeOverrides), [themeOverrides]);
  const sandTable = useMemo(
    () => (geometry ? normalizeSandTable(geometry, theme) : null),
    [geometry, theme],
  );

  // Single global t. Updated once per rAF by the canvas root; CameraRig and
  // any other consumers read from this ref (NOT from window.scroll directly).
  const tRef = useRef(0);
  const [debug, setDebug] = useState({ t: 0, beatId: "—" });

  // Per-beat boundary layout — page DOM range ↔ score t range.
  // Without this, a CPS-bumped Beat 1.1 (which can take 80%+ of vertical
  // scroll) would also consume 80% of cinema time, leaving no camera budget
  // for the rest of the case study. The piecewise mapping keeps each beat's
  // share of camera time pinned to its score range regardless of text length.
  const beatLayout = useMemo(() => buildBeatLayout(score, acts), [score, acts]);

  // Resolved per-frame mapState (mode / modePrev / modeFade / dim / overlay).
  // Single source of truth for the renderer; cross-scene smoothing handled inside.
  const resolvedMap = useResolvedMapState(score, acts);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const raw = docHeight > 0 ? window.scrollY / docHeight : 0;
      const piecewise = mapScrollToScoreT(raw, beatLayout);
      const next = scrollToT(piecewise);
      tRef.current = next;
      const current = beatAt(score, next);
      setDebug((prev) =>
        prev.t === next && prev.beatId === (current?.beat.id ?? "—")
          ? prev
          : { t: next, beatId: current?.beat.id ?? "—" },
      );
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [score, beatLayout]);

  return (
    <div className="cinema-floor" aria-hidden>
      <Canvas
        camera={{ position: [0, 8, 8], fov: 38, near: 0.1, far: 200 }}
        dpr={[1, 1.75]}
        shadows
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(theme.background), 1);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
        }}
      >
        <Atmosphere
          theme={theme}
          score={score}
          tRef={tRef}
          mapMode={resolvedMap.mode}
          modeFade={resolvedMap.modeFade}
        />
        {sandTable ? (
          <SandTable
            geometry={sandTable}
            theme={theme}
            mode={resolvedMap.mode}
            modePrev={resolvedMap.modePrev}
            modeFade={resolvedMap.modeFade}
            dim={resolvedMap.dim}
          />
        ) : null}
        <MapOverlay
          name={resolvedMap.overlay}
          progress={resolvedMap.overlayProgress}
          sceneLocalT={resolvedMap.sceneLocalT}
          sandTable={sandTable}
          spotlights={resolvedMap.spotlights}
          pickups={resolvedMap.pickups}
        />
        <CameraRig score={score} acts={acts} tRef={tRef} />
      </Canvas>

      <div className="pointer-events-none absolute bottom-3 left-4 font-mono text-caption text-fg/50 mix-blend-difference">
        cinema · t={debug.t.toFixed(3)} · beat={debug.beatId}
        {!sandTable ? " · (geometry missing)" : ""}
      </div>
    </div>
  );
}

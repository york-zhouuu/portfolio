"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { MapGeometryAsset } from "@/lib/content/load-sswt-assets";
import { resolveTheme } from "@/lib/cinema/theme";
import { normalizeSandTable } from "@/lib/cinema/geometry";
import { SandTable } from "@/components/cinema/SandTable";
import { MapOverlay } from "@/components/cinema/overlays/MapOverlay";
import { Atmosphere } from "@/components/cinema/Atmosphere";
import type { DevMapState, Waypoint } from "@/lib/cinema/trajectoryTypes";
import type { CameraReadout } from "./TrajectoryClient";
import type { CameraScore } from "@/lib/cinema/types";

// Atmosphere needs a score for fog/glow timing (just for visuals — t fixed at 0)
const NULL_SCORE: CameraScore = {
  version: "dev",
  acts: [],
  shots: {},
};

type Props = {
  geometry: MapGeometryAsset | null;
  mapState: DevMapState;
  onReadoutChange: (r: CameraReadout) => void;
  cameraSeed: CameraReadout | null;
  previewing: boolean;
  waypoints: Waypoint[];
  pressedKeysRef: React.MutableRefObject<Set<string>>;
};

export function DevCinemaCanvas({
  geometry,
  mapState,
  onReadoutChange,
  cameraSeed,
  previewing,
  waypoints,
  pressedKeysRef,
}: Props) {
  const theme = useMemo(() => resolveTheme(), []);
  const sandTable = useMemo(
    () => (geometry ? normalizeSandTable(geometry, theme) : null),
    [geometry, theme],
  );

  const tRef = useRef(0);

  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 4, 8], fov: 38, near: 0.1, far: 200 }}
        dpr={[1, 1.75]}
        shadows
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(theme.background), 1);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
        }}
      >
        <Atmosphere theme={theme} score={NULL_SCORE} tRef={tRef} />
        {sandTable ? (
          <SandTable
            geometry={sandTable}
            theme={theme}
            mode={mapState.mode}
            modePrev={mapState.mode}
            modeFade={1}
            dim={mapState.dim}
          />
        ) : null}
        <MapOverlay
          name={mapState.overlay}
          progress={1}
          sandTable={sandTable}
        />
        <DevCameraDriver
          cameraSeed={cameraSeed}
          previewing={previewing}
          waypoints={waypoints}
          onReadoutChange={onReadoutChange}
          pressedKeysRef={pressedKeysRef}
        />
      </Canvas>
    </div>
  );
}

/**
 * DevCameraDriver — wraps OrbitControls (free-fly) + emits camera readout
 * + drives preview playback when `previewing`.
 *
 * When `cameraSeed` changes (template loaded / waypoint clicked), the camera
 * snaps to that position once. Otherwise OrbitControls owns the camera.
 *
 * When `previewing` is true, the camera is animated through `waypoints`
 * (linear lerp by durationToNext). OrbitControls is disabled during preview.
 */
function DevCameraDriver({
  cameraSeed,
  previewing,
  waypoints,
  onReadoutChange,
  pressedKeysRef,
}: {
  cameraSeed: CameraReadout | null;
  previewing: boolean;
  waypoints: Waypoint[];
  onReadoutChange: (r: CameraReadout) => void;
  pressedKeysRef: React.MutableRefObject<Set<string>>;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls> | null>(null);
  const elapsedRef = useRef(0);
  const lastSeedRef = useRef<CameraReadout | null>(null);
  const lastReportedRef = useRef<CameraReadout>({
    position: [0, 0, 0],
    lookAt: [0, 0, 0],
  });

  // Apply seed when it changes
  useEffect(() => {
    if (!cameraSeed) return;
    if (cameraSeed === lastSeedRef.current) return;
    lastSeedRef.current = cameraSeed;
    camera.position.set(...cameraSeed.position);
    if (controlsRef.current) {
      controlsRef.current.target.set(...cameraSeed.lookAt);
      controlsRef.current.update();
    }
  }, [cameraSeed, camera]);

  // Reset preview elapsed when toggling
  useEffect(() => {
    elapsedRef.current = 0;
  }, [previewing]);

  useFrame((_state, delta) => {
    // Keyboard nudge (WASD / QE / Arrow) — skip during preview
    if (!previewing && pressedKeysRef.current.size > 0) {
      applyNudge(camera, controlsRef.current, pressedKeysRef.current, delta);
    }

    // Preview playback — animate camera through waypoints
    if (previewing && waypoints.length >= 2) {
      elapsedRef.current += delta;
      const total = waypoints.reduce((s, w) => s + w.durationToNext, 0);
      const tElapsed = total > 0 ? elapsedRef.current % total : 0;

      let acc = 0;
      let segIdx = 0;
      for (let i = 0; i < waypoints.length - 1; i++) {
        const segDur = Math.max(0.001, waypoints[i].durationToNext);
        if (tElapsed < acc + segDur) {
          segIdx = i;
          break;
        }
        acc += segDur;
        segIdx = i + 1;
      }
      if (segIdx >= waypoints.length - 1) segIdx = waypoints.length - 2;

      const segDur = Math.max(0.001, waypoints[segIdx].durationToNext);
      const segLocalT = (tElapsed - acc) / segDur;
      const tLerp = Math.max(0, Math.min(1, segLocalT));

      const a = waypoints[segIdx];
      const b = waypoints[segIdx + 1];
      camera.position.set(
        lerp(a.position[0], b.position[0], tLerp),
        lerp(a.position[1], b.position[1], tLerp),
        lerp(a.position[2], b.position[2], tLerp),
      );
      const tx = lerp(a.lookAt[0], b.lookAt[0], tLerp);
      const ty = lerp(a.lookAt[1], b.lookAt[1], tLerp);
      const tz = lerp(a.lookAt[2], b.lookAt[2], tLerp);
      camera.lookAt(tx, ty, tz);
      if (controlsRef.current) {
        controlsRef.current.target.set(tx, ty, tz);
      }
    }

    // Emit readout (throttled)
    const target = controlsRef.current?.target;
    const pos: [number, number, number] = [
      camera.position.x,
      camera.position.y,
      camera.position.z,
    ];
    const look: [number, number, number] = target
      ? [target.x, target.y, target.z]
      : [0, 0, 0];
    const last = lastReportedRef.current;
    const moved =
      Math.abs(pos[0] - last.position[0]) > 0.01 ||
      Math.abs(pos[1] - last.position[1]) > 0.01 ||
      Math.abs(pos[2] - last.position[2]) > 0.01 ||
      Math.abs(look[0] - last.lookAt[0]) > 0.01 ||
      Math.abs(look[1] - last.lookAt[1]) > 0.01 ||
      Math.abs(look[2] - last.lookAt[2]) > 0.01;
    if (moved) {
      lastReportedRef.current = { position: pos, lookAt: look };
      onReadoutChange({ position: pos, lookAt: look });
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!previewing}
      enablePan
      enableZoom
      enableRotate
      makeDefault
      target={[0, 0, 0]}
      minDistance={0.1}
      maxDistance={50}
    />
  );
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const BASE_STEP = 0.2; // wu per frame at 60fps baseline
const TMP_FORWARD = new THREE.Vector3();
const TMP_RIGHT = new THREE.Vector3();
const WORLD_UP = new THREE.Vector3(0, 1, 0);

/**
 * Apply WASD / QE / Arrow nudge to camera + OrbitControls.target.
 *
 * WASD / QE move camera AND target equally (strafe-style; view direction
 * unchanged). Arrows move only the target (rotates view around camera).
 *
 * Step is frame-rate independent: BASE_STEP × stepMul × clamp(delta * 6, 1).
 * stepMul: Shift = 5x, Alt = 0.1x, otherwise 1x.
 */
function applyNudge(
  camera: THREE.Camera,
  controls: { target: THREE.Vector3; update: () => void } | null,
  keys: Set<string>,
  delta: number,
) {
  const stepMul =
    keys.has("ShiftLeft") || keys.has("ShiftRight") ? 5 :
    keys.has("AltLeft") || keys.has("AltRight") ? 0.1 :
    1;
  const step = BASE_STEP * stepMul * Math.min(delta * 6, 1);

  // Forward direction in XZ plane (no vertical component for ground move)
  camera.getWorldDirection(TMP_FORWARD);
  TMP_FORWARD.y = 0;
  if (TMP_FORWARD.lengthSq() < 1e-6) {
    TMP_FORWARD.set(0, 0, -1); // fallback if camera looks straight up/down
  }
  TMP_FORWARD.normalize();
  TMP_RIGHT.crossVectors(TMP_FORWARD, WORLD_UP).normalize();

  let dx = 0, dy = 0, dz = 0;
  if (keys.has("KeyW")) { dx += TMP_FORWARD.x * step; dz += TMP_FORWARD.z * step; }
  if (keys.has("KeyS")) { dx -= TMP_FORWARD.x * step; dz -= TMP_FORWARD.z * step; }
  if (keys.has("KeyD")) { dx += TMP_RIGHT.x * step; dz += TMP_RIGHT.z * step; }
  if (keys.has("KeyA")) { dx -= TMP_RIGHT.x * step; dz -= TMP_RIGHT.z * step; }
  if (keys.has("KeyQ")) { dy += step; }
  if (keys.has("KeyE")) { dy -= step; }

  if (dx !== 0 || dy !== 0 || dz !== 0) {
    camera.position.x += dx;
    camera.position.y += dy;
    camera.position.z += dz;
    if (controls) {
      controls.target.x += dx;
      controls.target.y += dy;
      controls.target.z += dz;
      controls.update();
    }
  }

  // Arrow keys — move only target (rotates camera view)
  let tx = 0, tz = 0;
  if (keys.has("ArrowUp"))    { tx += TMP_FORWARD.x * step; tz += TMP_FORWARD.z * step; }
  if (keys.has("ArrowDown"))  { tx -= TMP_FORWARD.x * step; tz -= TMP_FORWARD.z * step; }
  if (keys.has("ArrowRight")) { tx += TMP_RIGHT.x * step; tz += TMP_RIGHT.z * step; }
  if (keys.has("ArrowLeft"))  { tx -= TMP_RIGHT.x * step; tz -= TMP_RIGHT.z * step; }
  if (controls && (tx !== 0 || tz !== 0)) {
    controls.target.x += tx;
    controls.target.z += tz;
    controls.update();
  }
}

"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { CinemaTheme } from "@/lib/cinema/theme";
import { actMoodAtT } from "@/lib/cinema/theme";
import type { CameraScore } from "@/lib/cinema/types";
import { beatAt } from "@/lib/cinema/scrollCinema";

/**
 * Atmosphere — ambient + key light + fog, all driven by theme + the current
 * act mood. Each frame we compute the interpolated mood for the current
 * (act, localT) and apply it to the three.js scene.
 *
 * Schematic-mode override (added per Act-3 finding visual redesign):
 * when mapMode === "schematic", scene.background flips to v7 paper cream
 * and ambient/key light intensities ramp up — so the cream sand-table
 * materials render bright instead of looking dark under cinema lighting.
 * `modeFade` (0..1) drives the crossfade between matte and schematic
 * lighting environments.
 *
 * Iteration seam: post-fx (tilt-shift, grain, vignette) tokens are reserved
 * in `theme.postFx`. When the shader stack lands, mount it here.
 */

const PAPER_BG = new THREE.Color("#FCFAF6");
const PAPER_FOG_COLOR = new THREE.Color("#E8E2D2");

export function Atmosphere({
  theme,
  score,
  tRef,
  mapMode,
  modeFade,
}: {
  theme: CinemaTheme;
  score: CameraScore;
  tRef: React.MutableRefObject<number>;
  mapMode?: string;
  modeFade?: number;
}) {
  const { scene } = useThree();
  const fog = useMemo(
    () => new THREE.Fog(theme.fogColor, theme.fogNear, theme.fogFar),
    [theme.fogColor, theme.fogNear, theme.fogFar],
  );
  const bgColor = useMemo(() => new THREE.Color(theme.background), [theme.background]);
  scene.fog = fog;
  scene.background = bgColor;

  const directionalRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  // Scratch colors so we don't allocate per frame.
  const tmpBg = useMemo(() => new THREE.Color(), []);
  const tmpFog = useMemo(() => new THREE.Color(), []);

  // Compute initial light placement (azimuth/elevation are static; intensity
  // and color move with the act mood).
  const azimuthRad = (theme.keyAzimuth * Math.PI) / 180;
  const elevationRad = (theme.keyElevation * Math.PI) / 180;
  const r = theme.worldExtent * 1.5;
  const keyPosition: [number, number, number] = [
    r * Math.cos(elevationRad) * Math.sin(azimuthRad),
    r * Math.sin(elevationRad),
    r * Math.cos(elevationRad) * Math.cos(azimuthRad),
  ];

  // Per-frame mood interpolation. Cheap (just lerps) so we don't bother memoizing.
  useFrame(() => {
    const t = tRef.current;
    const current = beatAt(score, t);
    if (!current) return;

    // Compute localT relative to the *act* (not the beat) so mood crossfades
    // happen across the whole act span, not per beat.
    const [aStart, aEnd] = current.act.range;
    const actLocalT = (t - aStart) / Math.max(0.0001, aEnd - aStart);
    const mood = actMoodAtT(theme, current.act.id, actLocalT);

    // Schematic blend factor: how strongly to flip to paper-mode environment.
    // mapMode === "schematic" with modeFade=1 → full paper. Crossfade respects
    // modeFade so transitions matte↔schematic feel like a sheet of paper
    // fading in over the dark cinema floor.
    const schematicBlend =
      mapMode === "schematic" ? Math.max(0, Math.min(1, modeFade ?? 1)) : 0;

    // Base atmospheric values from mood.
    tmpBg.set(mood.background);
    tmpFog.set(mood.fogColor);
    let fogNear = mood.fogNear;
    let fogFar = mood.fogFar;
    let ambIntensity = mood.ambientIntensity;
    let keyIntensity = mood.keyIntensity;

    if (schematicBlend > 0) {
      // Crossfade toward paper register.
      tmpBg.lerp(PAPER_BG, schematicBlend);
      tmpFog.lerp(PAPER_FOG_COLOR, schematicBlend);
      // Push fog far away so paper map doesn't haze at distance.
      fogNear = fogNear + (40 - fogNear) * schematicBlend;
      fogFar = fogFar + (120 - fogFar) * schematicBlend;
      // Crank ambient to near-daylight so cream materials render bright.
      ambIntensity = ambIntensity + (1.6 - ambIntensity) * schematicBlend;
      // Pull down directional so harsh shadows don't print onto the paper.
      keyIntensity = keyIntensity + (0.25 - keyIntensity) * schematicBlend;
    }

    fog.color.copy(tmpFog);
    fog.near = fogNear;
    fog.far = fogFar;
    bgColor.copy(tmpBg);

    if (directionalRef.current) {
      directionalRef.current.intensity = keyIntensity;
      directionalRef.current.color.set(mood.keyColor);
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = ambIntensity;
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={theme.ambientIntensity} />
      <directionalLight
        ref={directionalRef}
        position={keyPosition}
        intensity={theme.keyIntensity}
        color={theme.keyColor}
        castShadow
      />
      {/* PostFx slot — empty until shader passes land. */}
    </>
  );
}

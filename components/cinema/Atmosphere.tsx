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
 * Iteration seam: post-fx (tilt-shift, grain, vignette) tokens are reserved
 * in `theme.postFx`. When the shader stack lands, mount it here.
 */
export function Atmosphere({
  theme,
  score,
  tRef,
}: {
  theme: CinemaTheme;
  score: CameraScore;
  tRef: React.MutableRefObject<number>;
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

    fog.color.set(mood.fogColor);
    fog.near = mood.fogNear;
    fog.far = mood.fogFar;
    bgColor.set(mood.background);

    if (directionalRef.current) {
      directionalRef.current.intensity = mood.keyIntensity;
      directionalRef.current.color.set(mood.keyColor);
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = mood.ambientIntensity;
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

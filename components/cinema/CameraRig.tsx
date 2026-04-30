"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { CameraScore } from "@/lib/cinema/types";
import type { CaseStudyAct } from "@/lib/content/case-study-schema";
import { beatAt, sceneAt, shotForBeat } from "@/lib/cinema/scrollCinema";
import { shotToState, type CameraState } from "@/lib/cinema/cameraInterp";
import { dwellEase } from "@/lib/cinema/scene-types";
import { lerp } from "@/lib/cinema/easing";
import { makeSpring, stepSpring, SPRING_PROFILE_HOLD } from "@/lib/cinema/spring";

/**
 * CameraRig — turns (score, frontmatter, scroll t) into an imperative
 * camera transform every frame.
 *
 * Two camera sources (preferring scene-level when available):
 *   1. Scene-level camera segment (`scene.camera.from → to`) with the
 *      "升格" dwell ease — fast at scene boundaries, slow in the middle
 *      so readers have time on each scene's text.
 *   2. Beat-level shot (legacy fallback for beats not yet migrated to
 *      scenes; uses the existing shot kinds + smoothstep).
 */
export function CameraRig({
  score,
  acts,
  tRef,
}: {
  score: CameraScore;
  acts: CaseStudyAct[];
  tRef: React.MutableRefObject<number>;
}) {
  const { camera } = useThree();
  const positionTarget = useMemo(() => new THREE.Vector3(), []);
  const lookAtTarget = useMemo(() => new THREE.Vector3(), []);

  const springX = useRef(makeSpring(0));
  const springY = useRef(makeSpring(8));
  const springZ = useRef(makeSpring(8));

  // Reduced-motion path (cinema-scroll-pacing D8): force every scene to
  // behave like a still — locked at scene.camera.from, no dwell interp.
  // Captured once on mount; OS-level changes mid-session don't matter.
  const reducedMotion = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  useEffect(() => {
    // Seed from first scene (or first beat shot if no scenes).
    const first = sceneAt(score, acts, 0);
    let seed: CameraState | null = null;

    if (first?.scene && first.scene.kind !== "breath") {
      const cam = first.scene.camera;
      seed = {
        position: cam.from,
        lookAt: cam.lookAt,
        focalDistance: 5,
      };
    } else {
      const beatFirst = beatAt(score, 0);
      if (beatFirst) {
        const shot = shotForBeat(score, beatFirst.beat);
        if (shot) seed = shotToState(shot, 0);
      }
    }

    if (!seed) return;
    springX.current.value = seed.position[0];
    springY.current.value = seed.position[1];
    springZ.current.value = seed.position[2];
    camera.position.set(seed.position[0], seed.position[1], seed.position[2]);
    camera.lookAt(seed.lookAt[0], seed.lookAt[1], seed.lookAt[2]);
  }, [camera, score, acts]);

  useFrame((_state, delta) => {
    const t = tRef.current;

    // Try scene-level camera first.
    let next: CameraState | null = null;
    const sceneState = sceneAt(score, acts, t);

    if (sceneState?.scene) {
      const scene = sceneState.scene;
      const cam = scene.camera;
      // cinema-scroll-pacing D5: still-rhythm scenes hold camera *near* `from`,
      // with a very slow automatic drift TOWARD lookAt — a "lean-in breath"
      // rather than a hard freeze. ~3% of cam-to-lookAt distance over the
      // full scene, so over 6.5s of dwell the user perceives a barely-there
      // push-in (drawing the reader closer to the content) instead of a
      // frozen frame. Reduced-motion zeroes the drift entirely.
      // dwellEase is bypassed for still — drift is linear in sceneLocalT.
      if (reducedMotion.current) {
        next = {
          position: cam.from,
          lookAt: cam.lookAt,
          focalDistance: 5,
        };
      } else if (scene.rhythm === "still") {
        // Direction: from camera toward lookAt (push-in)
        const dx = cam.lookAt[0] - cam.from[0];
        const dy = cam.lookAt[1] - cam.from[1];
        const dz = cam.lookAt[2] - cam.from[2];
        const STILL_DRIFT = 0.03; // 3% push-in across each still scene

        // Drift accumulator: count consecutive still scenes that came BEFORE
        // the current one in this beat. Each completed-prior still adds 1×
        // STILL_DRIFT; current scene contributes STILL_DRIFT × sceneLocalT.
        // This makes drift continuous across same-rhythm scene boundaries
        // (was: every new scene snapped position back to its own from).
        let stillStreak = 0;
        const beatScenes = sceneState.fmBeat?.scenes;
        if (beatScenes && sceneState.sceneIndex > 0) {
          for (let i = sceneState.sceneIndex - 1; i >= 0; i--) {
            if (beatScenes[i].rhythm === "still") stillStreak += 1;
            else break;
          }
        }
        const k = STILL_DRIFT * stillStreak + STILL_DRIFT * sceneState.sceneLocalT;
        next = {
          position: [
            cam.from[0] + dx * k,
            cam.from[1] + dy * k,
            cam.from[2] + dz * k,
          ],
          lookAt: cam.lookAt,
          focalDistance: 5,
        };
      } else if (scene.rhythm === "tracking") {
        // cinema-content-language-foundations D5: tracking rhythm — camera
        // moves linearly from→to (no dwellEase, no still drift). Reading-first
        // text behavior comes from sceneTransitionProgress("tracking") which
        // mirrors still's 10/80/10. The visible motion is the "tracking shot
        // with voiceover" effect — eye reads, scenery scrolls behind.
        const t = sceneState.sceneLocalT;
        next = {
          position: [
            lerp(cam.from[0], cam.to[0], t),
            lerp(cam.from[1], cam.to[1], t),
            lerp(cam.from[2], cam.to[2], t),
          ],
          lookAt: cam.lookAt,
          focalDistance: 5,
        };
      } else {
        const eased = dwellEase(sceneState.sceneLocalT);
        next = {
          position: [
            lerp(cam.from[0], cam.to[0], eased),
            lerp(cam.from[1], cam.to[1], eased),
            lerp(cam.from[2], cam.to[2], eased),
          ],
          lookAt: cam.lookAt,
          focalDistance: 5,
        };
      }
    } else {
      // Legacy beat fallback (Beat 1.2 – 3.3 still on old schema).
      const current = beatAt(score, t);
      if (!current) return;
      const shot = shotForBeat(score, current.beat);
      if (!shot) return;
      next = shotToState(shot, current.localT);
    }

    if (!next) return;

    // Use the firmer "HOLD" profile so motion → still transitions converge
    // in ≤ 200ms (cinema-scroll-pacing D5). Same profile for all rhythms
    // keeps the camera identity coherent across the whole take.
    const { stiffness, damping } = SPRING_PROFILE_HOLD;
    stepSpring(springX.current, next.position[0], delta, stiffness, damping);
    stepSpring(springY.current, next.position[1], delta, stiffness, damping);
    stepSpring(springZ.current, next.position[2], delta, stiffness, damping);

    positionTarget.set(
      springX.current.value,
      springY.current.value,
      springZ.current.value,
    );
    lookAtTarget.set(next.lookAt[0], next.lookAt[1], next.lookAt[2]);

    camera.position.copy(positionTarget);
    camera.lookAt(lookAtTarget);
    (camera as THREE.PerspectiveCamera).focus = next.focalDistance;
  });

  return null;
}

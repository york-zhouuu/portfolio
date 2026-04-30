"use client";

/**
 * useResolvedMapState — client-side hook that drives the renderer with
 * a per-frame `ResolvedMapState`. Wraps the engine-agnostic resolver in
 * `mapState.ts` with a rAF loop and React state.
 */

import { useEffect, useMemo, useState } from "react";
import type { CaseStudyAct } from "@/lib/content/case-study-schema";
import type { CameraScore } from "./types";
import { MAP_STATE_DEFAULT } from "./scene-types";
import { buildBeatLayout, mapScrollToScoreT } from "./scrollCinema";
import { resolveMapStateAt, type ResolvedMapState } from "./mapState";

const INITIAL: ResolvedMapState = {
  ...MAP_STATE_DEFAULT,
  modePrev: null,
  modeFade: 1,
  overlayProgress: 0,
};

export function useResolvedMapState(
  score: CameraScore,
  acts: CaseStudyAct[],
): ResolvedMapState {
  const [state, setState] = useState<ResolvedMapState>(INITIAL);
  const beatLayout = useMemo(() => buildBeatLayout(score, acts), [score, acts]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const raw = docHeight > 0 ? window.scrollY / docHeight : 0;
      const t = mapScrollToScoreT(raw, beatLayout);
      const next = resolveMapStateAt(score, acts, t);
      setState((prev) =>
        // Cheap diffing — most fields stable between frames; only update when
        // any numeric field actually moved enough to matter (avoids re-render
        // every frame at static scroll positions).
        Math.abs(prev.dim - next.dim) > 0.001 ||
        prev.mode !== next.mode ||
        prev.modePrev !== next.modePrev ||
        Math.abs(prev.modeFade - next.modeFade) > 0.001 ||
        prev.overlay !== next.overlay ||
        Math.abs(prev.overlayProgress - next.overlayProgress) > 0.001
          ? next
          : prev,
      );
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [score, acts, beatLayout]);

  return state;
}

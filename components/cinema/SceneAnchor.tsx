"use client";

import { useEffect, useRef, useState } from "react";
import type { CaseStudyScene } from "@/lib/content/case-study-schema";
import { sceneTransitionProgress } from "@/lib/cinema/scrollCinema";
import { SceneTitle } from "./scenes/SceneTitle";
import { SceneLead } from "./scenes/SceneLead";
import { SceneBodySection } from "./scenes/SceneBodySection";
import { ScenePullQuote } from "./scenes/ScenePullQuote";
import { SceneBreath } from "./scenes/SceneBreath";
import { SceneDataHit } from "./scenes/SceneDataHit";

/**
 * SceneAnchor — wraps a single scene marker in a `position: sticky` container
 * so the scene's text "钉" in the viewport while the user scrolls through
 * the marker's tall section.
 *
 * Per cinema-scroll-pacing D4: replaces the old fixed-inset SceneLayer's
 * single-point rendering with distributed per-section rendering. Cross-fade
 * between adjacent scenes happens naturally as adjacent sections animate
 * their own enter/exit windows at the boundary.
 *
 * sceneLocalT is computed from the parent <section>'s scroll position
 * relative to viewport — independent per scene, no global state.
 */
export function SceneAnchor({ scene }: { scene: CaseStudyScene }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [localT, setLocalT] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const wrap = wrapRef.current;
      if (wrap) {
        const parent = wrap.parentElement; // the <section> marker
        if (parent) {
          const rect = parent.getBoundingClientRect();
          const vh = window.innerHeight;
          // Section is engaged when its top is at or above viewport top.
          const scrolled = Math.max(0, -rect.top);
          const usable = Math.max(1, rect.height - vh);
          const t = Math.max(0, Math.min(1, scrolled / usable));
          setLocalT(t);
          // Only render content while the section overlaps the viewport.
          setVisible(rect.top < vh && rect.bottom > 0);
        }
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const { enterProgress, exitProgress } = sceneTransitionProgress(localT, scene.rhythm);

  return (
    <div
      ref={wrapRef}
      className="sticky-scene"
      // 100vh fallback for ancient iOS, 100svh primary on modern browsers.
      // svh stays stable while the address bar collapses (no "jumping" text).
    >
      {visible ? (
        <SceneRenderer
          scene={scene}
          sceneLocalT={localT}
          enterProgress={enterProgress}
          exitProgress={exitProgress}
        />
      ) : null}
    </div>
  );
}

function SceneRenderer({
  scene,
  sceneLocalT,
  enterProgress,
  exitProgress,
}: {
  scene: CaseStudyScene;
  sceneLocalT: number;
  enterProgress: number;
  exitProgress: number;
}) {
  switch (scene.kind) {
    case "title":
      return <SceneTitle scene={scene} enterProgress={enterProgress} exitProgress={exitProgress} />;
    case "lead":
      return <SceneLead scene={scene} enterProgress={enterProgress} exitProgress={exitProgress} />;
    case "body-section":
      return <SceneBodySection scene={scene} sceneLocalT={sceneLocalT} enterProgress={enterProgress} exitProgress={exitProgress} />;
    case "pull-quote":
      return <ScenePullQuote scene={scene} enterProgress={enterProgress} exitProgress={exitProgress} />;
    case "breath":
      return <SceneBreath />;
    case "data-hit":
      return <SceneDataHit scene={scene} sceneLocalT={sceneLocalT} enterProgress={enterProgress} exitProgress={exitProgress} />;
    default:
      return null;
  }
}

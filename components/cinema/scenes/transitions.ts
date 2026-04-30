/**
 * Map a TransitionKind + enter/exit progress to inline CSS style.
 *
 * Standard timing: enter and exit each occupy 18% of the scene's localT.
 * Cross-fade between adjacent scenes is allowed (36% overlap window).
 */

import type { CSSProperties } from "react";
import type { TransitionKind } from "@/lib/cinema/scene-types";

export function transitionStyle(
  enterKind: TransitionKind,
  exitKind: TransitionKind,
  enterProgress: number,
  exitProgress: number,
): CSSProperties {
  const opacity = enterProgress * exitProgress;
  const transforms: string[] = [];

  switch (enterKind) {
    case "slide-up":
      transforms.push(`translateY(${(1 - enterProgress) * 30}px)`);
      break;
    case "slide-side":
      transforms.push(`translateX(${(1 - enterProgress) * 40}px)`);
      break;
    case "scale-in":
      transforms.push(`scale(${0.95 + enterProgress * 0.05})`);
      break;
    case "fade":
    case "none":
    default:
      break;
  }

  switch (exitKind) {
    case "slide-up":
      transforms.push(`translateY(-${(1 - exitProgress) * 30}px)`);
      break;
    case "slide-side":
      transforms.push(`translateX(-${(1 - exitProgress) * 40}px)`);
      break;
    case "scale-in":
      transforms.push(`scale(${1 - (1 - exitProgress) * 0.05})`);
      break;
    default:
      break;
  }

  return {
    opacity,
    transform: transforms.length ? transforms.join(" ") : undefined,
    willChange: "opacity, transform",
  };
}

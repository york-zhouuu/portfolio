"use client";

import dynamic from "next/dynamic";

/**
 * Client-only mount point for CinemaCanvas. Three.js + R3F evaluate side
 * effects at module level that can choke when Next.js tries to walk the
 * module graph during server compilation. `ssr: false` defers the import
 * until the browser actually needs it, which sidesteps the
 * "Cannot read properties of undefined (reading 'call')" webpack runtime
 * error that R3F triggers under RSC.
 *
 * Iteration seam: this is also where you'd plug a loading shell, a
 * progressive-enhancement layer, or a different renderer entirely.
 */
export const CinemaCanvasMount = dynamic(
  () => import("./CinemaCanvas").then((m) => ({ default: m.CinemaCanvas })),
  {
    ssr: false,
    loading: () => (
      <div
        className="cinema-floor"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 50% 60%, oklch(var(--glow) / 0.18), transparent 60%), oklch(var(--bg))",
        }}
      />
    ),
  },
);

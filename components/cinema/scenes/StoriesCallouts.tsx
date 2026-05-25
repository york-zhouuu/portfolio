"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useReaderContext } from "@/components/reader/ReaderContext";

/**
 * StoriesCallouts — three figure-caption callouts that render as plain
 * DOM (SVG leader lines + button labels) in the t=1 outro stories scene.
 *
 * Layout — three-segment elbow leaders that DIVE INTO the city silhouette
 * and get visually occluded by it (fake 3D depth):
 *
 *   Hannah  TL  label (12,22) → elbow (22,33) → into-city (22,50)
 *   a0290   TR  label (88,22) → elbow (78,33) → into-city (78,50)
 *   Mary    BR  label (85,72) → elbow (72,66) → up-into-city (72,50)
 *
 * Each polyline's bottom end sits INSIDE the skyline silhouette
 * (y=50 is well past building rooftops at y≈38-45). The line is then
 * occluded via an SVG mask whose alpha gradient matches the rough
 * skyline level:
 *
 *   skylineOcclude  (for Hannah / a0290 — label above horizon):
 *     y < 38         mask=1   line fully visible
 *     y ∈ [38, 42]   gradient fade visible → hidden
 *     y > 42         mask=0   line hidden (eaten by buildings)
 *
 *   horizonOcclude  (for Mary — label below horizon):
 *     y < 52         mask=0   line hidden (behind city base)
 *     y ∈ [52, 56]   gradient fade hidden → visible
 *     y > 56         mask=1   line fully visible (in foreground)
 *
 * Effect: each line plunges into the city and disappears, the way a
 * physical wire would if the buildings were occluding it. No literal
 * dot is drawn — the line just vanishes into the silhouette.
 *
 * Non-crossing proof — x ranges:
 *   Hannah  x ∈ [12, 22]
 *   a0290   x ∈ [78, 88]
 *   Mary    x ∈ [72, 85]
 * Hannah vs a0290 / Hannah vs Mary: zero x overlap. a0290 vs Mary
 * overlap on x∈[78,85] but a0290 is y≤33 and Mary is y≥68.8 in that
 * strip — >35 viewBox units apart.
 *
 * All lines stay outside the centered intro text (x∈[~30,70], y∈[~44,64]).
 */
export function StoriesCallouts() {
  const { locale } = useLocale();
  const reader = useReaderContext();
  const zh = locale === "zh";

  // Three-segment elbow leaders: label → diagonal → vertical dive into
  // the city silhouette. SVG mask (skylineOcclude / horizonOcclude)
  // fades each line out where it crosses the skyline — fake 3D depth.
  const callouts = [
    {
      slug: "hannah",
      name: "Hannah",
      role: zh ? "36 · 咖啡店老板娘" : "36 · café owner",
      labelStyle: { top: "20svh", left: "10vw" } as React.CSSProperties,
      polyline: "12,22 22,33 22,50",
    },
    {
      slug: "a0290",
      name: zh ? "温迪" : "Wendy",
      role: zh ? "33 · ICU 护士" : "33 · ICU nurse",
      labelStyle: { top: "20svh", right: "10vw" } as React.CSSProperties,
      polyline: "88,22 78,33 78,50",
    },
    {
      slug: "mary",
      name: zh ? "老何" : "Old He",
      role: zh ? "退休教师 · 清晨遛狗" : "retired teacher · dawn walk",
      labelStyle: { bottom: "22svh", right: "12vw" } as React.CSSProperties,
      polyline: "85,72 72,66 72,50",
    },
  ];

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* SVG layer for the occluded leader lines. NO anchor dot —
          each line just dives into the city silhouette and fades out
          via the masks defined here. */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          {/* Soft fade band at the rooftop level (y=38..42).
              Mask=white above → line fully visible; mask=black below
              → line hidden behind the buildings. */}
          <linearGradient
            id="storiesSkylineFade"
            x1="0"
            x2="0"
            y1="38"
            y2="42"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#fff" />
            <stop offset="100%" stopColor="#000" />
          </linearGradient>
          <mask id="storiesSkylineOcclude" maskUnits="userSpaceOnUse">
            <rect x="0" y="0" width="100" height="38" fill="#fff" />
            <rect
              x="0"
              y="38"
              width="100"
              height="4"
              fill="url(#storiesSkylineFade)"
            />
            <rect x="0" y="42" width="100" height="58" fill="#000" />
          </mask>

          {/* Mirror band at the city base (y=52..56). For Mary the
              line is hidden ABOVE the band (behind the city base) and
              emerges INTO the foreground below it. */}
          <linearGradient
            id="storiesHorizonFade"
            x1="0"
            x2="0"
            y1="52"
            y2="56"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#000" />
            <stop offset="100%" stopColor="#fff" />
          </linearGradient>
          <mask id="storiesHorizonOcclude" maskUnits="userSpaceOnUse">
            <rect x="0" y="0" width="100" height="52" fill="#000" />
            <rect
              x="0"
              y="52"
              width="100"
              height="4"
              fill="url(#storiesHorizonFade)"
            />
            <rect x="0" y="56" width="100" height="44" fill="#fff" />
          </mask>
        </defs>
        {callouts.map((c) => {
          const useHorizonMask = c.slug === "mary";
          return (
            <polyline
              key={c.slug}
              points={c.polyline}
              fill="none"
              stroke="#E8E2D2"
              strokeOpacity="0.62"
              vectorEffect="non-scaling-stroke"
              style={{ strokeWidth: 1 }}
              mask={`url(#${useHorizonMask ? "storiesHorizonOcclude" : "storiesSkylineOcclude"})`}
            />
          );
        })}
      </svg>

      {/* DOM-rendered clickable labels — fixed positions, no projection */}
      {callouts.map((c) => (
        <button
          key={c.slug}
          type="button"
          onClick={() => reader?.openReader(c.slug)}
          className="group absolute flex flex-col items-start gap-1 px-2 py-1 font-sans text-white"
          style={{
            ...c.labelStyle,
            pointerEvents: "auto",
            textShadow:
              "0 0 10px rgba(0,0,0,0.65), 0 1px 2px rgba(0,0,0,0.55)",
          }}
        >
          <span className="inline-flex items-center gap-1.5 text-[15px] leading-[1.15] underline decoration-white/40 decoration-1 underline-offset-[6px] transition-all duration-200 group-hover:decoration-white group-hover:decoration-2">
            <span className="font-medium">{c.name}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            >
              <path
                d="M5 12h14M13 5l7 7-7 7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/60">
            {c.role}
          </span>
        </button>
      ))}
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadCaseStudy } from "@/lib/content/load-case-study";
import { CinemaCanvasMount } from "@/components/cinema/CinemaCanvasMount";
import { HudLayer } from "@/components/hud/HudLayer";
import { SceneAnchor } from "@/components/cinema/SceneAnchor";
import { ReportSheet } from "@/components/cinema/ReportSheet";
import { StoriesSheet } from "@/components/cinema/StoriesSheet";
import { TitleCard } from "@/components/cinema/TitleCard";
import { sswtCinemaScore } from "@/lib/cinema/score.sswt";
import { loadMapGeometry } from "@/lib/content/load-sswt-assets";
import { DEFAULT_LOCALE, pickLang } from "@/lib/i18n/types";
import { computeSvh } from "@/lib/cinema/scene-types";

// Single-project portfolio: the home route renders the SSWT case study
// directly. No /work/[slug] indirection — the project is the site.
const PROJECT_SLUG = "synthetic-socio-wind-tunnel";

export async function generateMetadata(): Promise<Metadata> {
  const study = await loadCaseStudy(PROJECT_SLUG);
  if (!study) return {};
  const { frontmatter } = study;
  const title = pickLang(frontmatter.title, DEFAULT_LOCALE);
  const description = pickLang(
    frontmatter.description ?? frontmatter.subtitle,
    DEFAULT_LOCALE,
  );
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function HomePage() {
  const study = await loadCaseStudy(PROJECT_SLUG);
  if (!study) notFound();

  const { frontmatter } = study;
  const score = sswtCinemaScore;
  const geometry = loadMapGeometry();

  return (
    <>
      <CinemaCanvasMount score={score} acts={frontmatter.acts} geometry={geometry} />
      <HudLayer score={score} acts={frontmatter.acts} />
      <article
        className="relative z-10"
        aria-label={pickLang(frontmatter.title, DEFAULT_LOCALE)}
      >
        {/* Opening title card — ~56svh of "what / who / when / scale"
            so cold readers get oriented before Act 1 cold-open. */}
        <TitleCard frontmatter={frontmatter} />

        {frontmatter.acts.flatMap((act) => {
          // All acts render through SceneAnchor. Act 2 previously used an
          // interactive console (Act2Console), now reverted to 4 narrative
          // scenes (城市 / 居民 / 一天 / 四种方案) per "passive cinema > click"
          // principle. The MDX scenes drive the camera + sandbox state.
          return act.beats.flatMap((beat) => {
            const scenes = beat.scenes ?? [];
            if (scenes.length > 0) {
              return scenes.map((scene) => (
                <section
                  key={`${beat.id}/${scene.id}`}
                  id={`${beat.id}--${scene.id}`}
                  data-act={act.id}
                  data-beat={beat.id}
                  data-scene={scene.id}
                  style={{ height: `${computeSvh(scene)}svh` }}
                >
                  <h2 className="sr-only">
                    {pickLang(act.title, DEFAULT_LOCALE)} · {beat.id} · {scene.id}
                  </h2>
                  <SceneAnchor scene={scene} />
                </section>
              ));
            }
            return [
              <section
                key={beat.id}
                id={beat.id}
                data-act={act.id}
                data-beat={beat.id}
                style={{ height: "100svh" }}
              >
                <h2 className="sr-only">
                  {pickLang(act.title, DEFAULT_LOCALE)} · {beat.id}
                </h2>
                <p className="sr-only">{pickLang(beat.claim, DEFAULT_LOCALE)}</p>
              </section>,
            ];
          });
        })}
      </article>
      {/* Two body-level modal sheets (portals) — no inline scroll
          footprint, opens-via global window event. */}
      <ReportSheet />
      <StoriesSheet />
    </>
  );
}

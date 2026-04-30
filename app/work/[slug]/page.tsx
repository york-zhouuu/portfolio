import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  caseStudyExists,
  listCaseStudySlugs,
  loadCaseStudy,
} from "@/lib/content/load-case-study";
import { CinemaCanvasMount } from "@/components/cinema/CinemaCanvasMount";
import { HudLayer } from "@/components/hud/HudLayer";
import { SceneAnchor } from "@/components/cinema/SceneAnchor";
import { sswtCinemaScore } from "@/lib/cinema/score.sswt";
import { loadMapGeometry } from "@/lib/content/load-sswt-assets";
import { DEFAULT_LOCALE, pickLang } from "@/lib/i18n/types";
import { computeSvh } from "@/lib/cinema/scene-types";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return listCaseStudySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!caseStudyExists(slug)) return {};
  const study = await loadCaseStudy(slug);
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

export default async function CaseStudyPage({ params }: PageProps) {
  const { slug } = await params;
  const study = await loadCaseStudy(slug);
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
        {/*
         * One marker <section> per scene. Free scroll — no scroll-snap.
         * Each section embeds a <SceneAnchor> which uses `position: sticky`
         * to "钉" the scene text in the viewport while the user scrolls
         * through the section's tall scroll budget (computeSvh / CPS).
         * Sticky pinning + camera HOLD on still rhythm = even fast scrolls
         * don't fly past text; the eye anchors to a stationary surface.
         *
         * Legacy beats (no scenes[]) get a single 100svh marker, no anchor.
         */}
        {frontmatter.acts.flatMap((act) =>
          act.beats.flatMap((beat) => {
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
          }),
        )}
      </article>
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { caseStudyExists, loadCaseStudy } from "@/lib/content/load-case-study";
import { loadMapGeometry } from "@/lib/content/load-sswt-assets";
import { TrajectoryClient } from "./TrajectoryClient";

export const metadata: Metadata = {
  title: "Trajectory Recorder · DEV",
  description: "Camera waypoint recorder for case-study mdx authoring",
  robots: { index: false, follow: false, nocache: true },
};

type SearchParams = { slug?: string };

const DEFAULT_SLUG = "synthetic-socio-wind-tunnel";

/**
 * Dev tool — Camera trajectory recorder.
 *
 * Reuses the real cinema canvas (SandTable + overlays) but replaces
 * CameraRig with FreeFlyCamera + RecorderPanel UI. Author flies the
 * camera, captures waypoints, and exports YAML scene-fragments to paste
 * into the case-study mdx.
 *
 * NOT for production. Page carries `noindex,nofollow` and a top banner.
 */
export default async function TrajectoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { slug = DEFAULT_SLUG } = await searchParams;

  if (!caseStudyExists(slug)) notFound();

  const study = await loadCaseStudy(slug);
  if (!study) notFound();

  const geometry = loadMapGeometry();

  return <TrajectoryClient slug={slug} geometry={geometry} />;
}

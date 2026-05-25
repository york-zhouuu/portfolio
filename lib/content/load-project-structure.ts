import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { CaseStudyFrontmatterSchema } from "./case-study-schema";
import type { I18nString } from "@/lib/i18n/types";

/**
 * Lightweight project structure for the top-of-page act chapter index.
 * Only parses frontmatter (no MDX compile) so layout can include this
 * in its render path without re-paying the cost.
 */
export type ProjectActSummary = {
  id: string;
  title: I18nString;
  /** DOM id of the first scene under the first beat of this act.
   *  Matches the `id` attribute on the corresponding <section> in app/page.tsx.
   *  Used by SiteNav's act-jump buttons to scroll-to-anchor. */
  firstSectionId: string;
};

export type ProjectStructure = {
  title: I18nString;
  acts: ProjectActSummary[];
};

const CONTENT_DIR = path.join(process.cwd(), "content", "case-studies");

export function loadProjectStructure(slug: string): ProjectStructure | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data } = matter(raw);
  const parsed = CaseStudyFrontmatterSchema.safeParse(data);
  if (!parsed.success) return null;
  const fm = parsed.data;

  const acts: ProjectActSummary[] = fm.acts.map((act) => {
    const firstBeat = act.beats[0];
    const firstScene = firstBeat.scenes?.[0];
    // Section id mirrors what app/page.tsx renders:
    //   scene-driven beats → `${beat.id}--${scene.id}`
    //   legacy beats       → `${beat.id}`
    const firstSectionId = firstScene
      ? `${firstBeat.id}--${firstScene.id}`
      : firstBeat.id;
    return { id: act.id, title: act.title, firstSectionId };
  });

  return { title: fm.title, acts };
}

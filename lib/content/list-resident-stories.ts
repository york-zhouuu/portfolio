import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { CaseStudyFrontmatterSchema } from "./case-study-schema";
import type { Locale } from "@/lib/i18n/types";

const CONTENT_DIR = path.join(process.cwd(), "content", "case-studies");

/**
 * Resident story entry as consumed by the reader UI. Enriches the schema
 * type with `studySlug` (derived from the parent case-study slug) so the
 * iframe src can be constructed without a separate lookup.
 */
export type ResidentStoryListing = {
  slug: string;
  studySlug: string;
  displayName: { zh: string; en: string };
  role: { zh: string; en: string };
  languages: Locale[];
  agentId?: string;
};

/**
 * Build the flat list of resident stories aggregated across every case
 * study. Runs at build/SSR time on the Node side (filesystem access).
 */
export function listResidentStories(): ResidentStoryListing[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const out: ResidentStoryListing[] = [];
  for (const file of fs.readdirSync(CONTENT_DIR)) {
    if (!file.endsWith(".mdx")) continue;
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
    const { data } = matter(raw);
    const parsed = CaseStudyFrontmatterSchema.safeParse(data);
    if (!parsed.success) continue; // skip malformed; content-lint reports
    const fm = parsed.data;
    for (const entry of fm.residentStories ?? []) {
      out.push({
        slug: entry.slug,
        studySlug: fm.slug,
        displayName: entry.displayName,
        role: entry.role,
        languages: entry.languages,
        agentId: entry.agentId,
      });
    }
  }
  return out;
}

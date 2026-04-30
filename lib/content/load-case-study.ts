import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import {
  CaseStudyFrontmatterSchema,
  type CaseStudyFrontmatter,
} from "./case-study-schema";

const CONTENT_DIR = path.join(process.cwd(), "content", "case-studies");

export function listCaseStudySlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

export function caseStudyExists(slug: string): boolean {
  return fs.existsSync(path.join(CONTENT_DIR, `${slug}.mdx`));
}

export type LoadedCaseStudy = {
  frontmatter: CaseStudyFrontmatter;
  content: React.ReactElement;
};

export async function loadCaseStudy(slug: string): Promise<LoadedCaseStudy | null> {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content: source } = matter(raw);
  const frontmatter = CaseStudyFrontmatterSchema.parse(data);

  const { content } = await compileMDX({
    source,
    options: { parseFrontmatter: false },
  });

  return { frontmatter, content };
}

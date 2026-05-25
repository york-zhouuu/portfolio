/**
 * sync-resident-stories — copy self-contained resident story HTML from the
 * SSWT research repo into portfolio public/.
 *
 * Usage:
 *   pnpm sync:resident-stories <path-to-sswt-repo>
 *   pnpm sync:resident-stories <path-to-sswt-repo> --force
 *
 * Source pattern:
 *   <sswt-repo>/docs/case_studies/_published/*.html
 *
 * Destination:
 *   portfolio/public/case-studies/<study-slug>/people/
 *   defaults to <study-slug> = "synthetic-socio-wind-tunnel"
 *
 * Manual, one-shot, single-direction. portfolio build must not depend on the
 * SSWT repo being available at build time — HTML lives in portfolio's own git.
 */

import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from "node:fs";
import { join, basename, resolve } from "node:path";

const args = process.argv.slice(2);
const force = args.includes("--force");
const positional = args.filter((a) => !a.startsWith("--"));

if (positional.length < 1) {
  console.error(
    "Usage: pnpm sync:resident-stories <path-to-sswt-repo> [--force] [--study=<slug>]",
  );
  process.exit(1);
}

const studyArg = args.find((a) => a.startsWith("--study="));
const studySlug = studyArg
  ? studyArg.slice("--study=".length)
  : "synthetic-socio-wind-tunnel";

const sswtRoot = resolve(positional[0]);
const sourceDir = join(sswtRoot, "docs", "case_studies", "_published");
const destDir = resolve(`public/case-studies/${studySlug}/people`);

if (!existsSync(sourceDir)) {
  console.error(`Source not found: ${sourceDir}`);
  process.exit(1);
}

mkdirSync(destDir, { recursive: true });

const files = readdirSync(sourceDir).filter((f) => f.endsWith(".html"));

if (files.length === 0) {
  console.error(`No .html files at ${sourceDir}`);
  process.exit(1);
}

let copied = 0;
let skipped = 0;

for (const file of files) {
  const src = join(sourceDir, file);
  const dst = join(destDir, basename(file));
  const srcStat = statSync(src);

  if (existsSync(dst) && !force) {
    const dstStat = statSync(dst);
    if (dstStat.mtimeMs >= srcStat.mtimeMs) {
      console.log(
        `skip  ${file}  (dest mtime ${new Date(dstStat.mtimeMs).toISOString()} ≥ source; pass --force to override)`,
      );
      skipped++;
      continue;
    }
  }

  copyFileSync(src, dst);
  const sizeKb = (srcStat.size / 1024).toFixed(1);
  console.log(`copy  ${file}  (${sizeKb} KB, mtime ${new Date(srcStat.mtimeMs).toISOString()})`);
  copied++;
}

console.log(`\nDone. ${copied} copied, ${skipped} skipped. Dest: ${destDir}`);

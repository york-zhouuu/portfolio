#!/usr/bin/env tsx
/**
 * content-lint — validate every MDX case study against:
 *   1. Zod frontmatter schema (acts × beats × five-tuple)
 *   2. shotRef ↔ camera score consistency (per cinemaScoreVersion)
 *   3. fallbackFigure file existence
 *   4. terminology lockdown (glossary.json — canonical / forbidden)
 *   5. mock persona ban
 *
 * Exits non-zero on any violation. Wired to CI + pre-build.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { CaseStudyFrontmatterSchema, type CaseStudyScene } from "../lib/content/case-study-schema";
import { sswtCinemaScore } from "../lib/cinema/score.sswt";
import { CPS_ZH, MAX_DWELL_S, REACTION_S, BODY_DISCOUNT_FACTOR } from "../lib/cinema/scene-types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Glossary = {
  version: string;
  terms: Array<{ canonical_en: string; canonical_zh?: string; forbidden?: string[] }>;
  forbidden_personas: string[];
};

const ROOT = path.join(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content", "case-studies");
const GLOSSARY_PATH = path.join(ROOT, "docs", "glossary.json");
const PUBLIC_DIR = path.join(ROOT, "public");

const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);

function loadGlossary(): Glossary {
  return JSON.parse(fs.readFileSync(GLOSSARY_PATH, "utf8")) as Glossary;
}

function lintFile(filePath: string, glossary: Glossary) {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const parsed = CaseStudyFrontmatterSchema.safeParse(data);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      fail(`${filePath} · ${issue.path.join(".")} · ${issue.message}`);
    }
    return;
  }

  const fm = parsed.data;

  if (fm.cinemaScoreVersion !== sswtCinemaScore.version) {
    fail(
      `${filePath} · cinemaScoreVersion mismatch (frontmatter=${fm.cinemaScoreVersion}, score=${sswtCinemaScore.version})`,
    );
  }

  const knownShotIds = new Set(Object.keys(sswtCinemaScore.shots));

  for (const act of fm.acts) {
    for (const beat of act.beats) {
      if (!knownShotIds.has(beat.shotRef)) {
        fail(`${filePath} · act ${act.id} beat ${beat.id} · shotRef "${beat.shotRef}" not in score`);
      }

      const figureRel = beat.fallbackFigure.replace(/^\//, "");
      const figureAbs = path.join(PUBLIC_DIR, figureRel);
      if (!fs.existsSync(figureAbs)) {
        // skip — fallback figures are authored later; warn but don't fail.
        // toggle to fail() once D-day for storyboard ships.
        console.warn(`  warn · ${filePath} · ${beat.id} · fallbackFigure missing: ${figureAbs}`);
      }
    }
  }

  // Resident stories — every declared (slug × language) HTML must exist.
  // Convention: zh canonical = <slug>.html; other langs = <slug>_<lang>.html.
  for (const entry of fm.residentStories ?? []) {
    for (const lang of entry.languages) {
      const filename = lang === "zh" ? `${entry.slug}.html` : `${entry.slug}_${lang}.html`;
      const assetAbs = path.join(
        PUBLIC_DIR,
        "case-studies",
        fm.slug,
        "people",
        filename,
      );
      if (!fs.existsSync(assetAbs)) {
        fail(
          `${filePath} · residentStories[${entry.slug}].${lang} · missing asset: ${assetAbs} (run \`pnpm sync:resident-stories <sswt-repo>\`)`,
        );
      }
    }
  }

  // Scene-level mapState.pickup — every pickup.storySlug must be declared
  // in frontmatter residentStories, and targetAgentIndex must be inside
  // the sampled-walker count used by AgentsTrajectoriesOverlay.
  const PEOPLE_SAMPLE_COUNT = 200; // mirror AgentsTrajectoriesOverlay PEOPLE_COUNT
  const knownStorySlugs = new Set(
    (fm.residentStories ?? []).map((s) => s.slug),
  );
  for (const act of fm.acts) {
    for (const beat of act.beats) {
      for (const scene of beat.scenes ?? []) {
        const pickup = scene.mapState?.pickup;
        if (!pickup) continue;
        if (!knownStorySlugs.has(pickup.storySlug)) {
          fail(
            `${filePath} · beat ${beat.id} scene ${scene.id} mapState.pickup.storySlug "${pickup.storySlug}" not in frontmatter.residentStories`,
          );
        }
        if (pickup.targetAgentIndex < 0 || pickup.targetAgentIndex >= PEOPLE_SAMPLE_COUNT) {
          fail(
            `${filePath} · beat ${beat.id} scene ${scene.id} mapState.pickup.targetAgentIndex ${pickup.targetAgentIndex} out of range [0,${PEOPLE_SAMPLE_COUNT})`,
          );
        }
      }
    }
  }

  // Terminology lockdown — scan zh + en branches of every claim/hud field
  // plus MDX body. Strip canonical mentions first so forbidden-substring
  // checks don't false-fire on them.
  const flattenI18n = (v: unknown): string[] => {
    if (typeof v === "string") return [v];
    if (v && typeof v === "object" && "zh" in v && "en" in v) {
      const obj = v as { zh: unknown; en: unknown };
      return [String(obj.zh ?? ""), String(obj.en ?? "")];
    }
    return [];
  };
  const hudStrings = (b: { hud?: Record<string, unknown> }): string[] => {
    if (!b.hud) return [];
    if ("text" in b.hud) return flattenI18n(b.hud.text);
    if ("subtitle" in b.hud) return flattenI18n(b.hud.subtitle);
    return [];
  };
  const rawHaystack = [
    ...fm.acts.flatMap((a) => flattenI18n(a.title)),
    ...fm.acts.flatMap((a) => a.beats.flatMap((b) => flattenI18n(b.claim))),
    ...fm.acts.flatMap((a) => a.beats.flatMap(hudStrings)),
    ...flattenI18n(fm.title),
    ...flattenI18n(fm.subtitle),
    ...(fm.description ? flattenI18n(fm.description) : []),
    content,
  ].join("\n");

  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const canonicalForms = glossary.terms.flatMap((t) =>
    [t.canonical_en, t.canonical_zh].filter((x): x is string => Boolean(x)),
  );
  const sanitized = canonicalForms.reduce(
    (acc, form) => acc.replace(new RegExp(escape(form), "gi"), "·".repeat(form.length)),
    rawHaystack,
  );

  for (const term of glossary.terms) {
    for (const bad of term.forbidden ?? []) {
      const re = new RegExp(`\\b${escape(bad)}\\b`, "i");
      if (re.test(sanitized)) {
        fail(
          `${filePath} · forbidden variant "${bad}" of ${term.canonical_en} — use canonical form`,
        );
      }
    }
  }

  for (const persona of glossary.forbidden_personas) {
    const re = new RegExp(`\\b${persona}\\b`, "i");
    if (re.test(rawHaystack)) {
      fail(`${filePath} · forbidden mock persona "${persona}"`);
    }
  }

  // Cinema-scroll-pacing checks ------------------------------------------
  // All currently emit warnings (not failures) so Beat 1.1's grandfather
  // 7-still configuration doesn't block builds. Phase 5 task 6.1 (in a
  // follow-up after beat-1-1-storyboard updates) flips these to fail().

  // 1. Rhythm sequence (cinema-scroll-pacing D3 + foundations: tracking ≤ 1)
  for (const act of fm.acts) {
    for (const beat of act.beats) {
      const scenes = beat.scenes;
      if (!scenes || scenes.length === 0) continue;
      let runStill = 0;
      let runMotion = 0;
      let runTracking = 0;
      scenes.forEach((scene, idx) => {
        if (scene.rhythm === "still") {
          runStill += 1;
          runMotion = 0;
          runTracking = 0;
          if (runStill > 2) {
            console.warn(
              `  warn · ${filePath} · beat ${beat.id} scene ${scene.id} (idx ${idx}) — rhythm sequence: ${runStill} consecutive "still" (max 2). Insert a motion / tracking / bridge scene.`,
            );
          }
        } else if (scene.rhythm === "motion") {
          runMotion += 1;
          runStill = 0;
          runTracking = 0;
          if (runMotion > 1) {
            console.warn(
              `  warn · ${filePath} · beat ${beat.id} scene ${scene.id} (idx ${idx}) — rhythm sequence: ${runMotion} consecutive "motion" (max 1).`,
            );
          }
        } else if (scene.rhythm === "tracking") {
          runTracking += 1;
          runStill = 0;
          runMotion = 0;
          if (runTracking > 1) {
            console.warn(
              `  warn · ${filePath} · beat ${beat.id} scene ${scene.id} (idx ${idx}) — rhythm sequence: ${runTracking} consecutive "tracking" (max 1).`,
            );
          }
        } else {
          // bridge — resets all run counters
          runStill = 0;
          runMotion = 0;
          runTracking = 0;
        }
      });
    }
  }

  // 2. Char-cap, per-paragraph (foundations D8 + cinema-cps-body-discount).
  //    Applies to still / tracking rhythms (reading-first).
  //    Primary chunks (heading-equivalent) get base cap.
  //    Body chunks (paragraphs / twinColumns paragraphs+citations / data-hit
  //    support paragraphs) get base cap × (1 / BODY_DISCOUNT_FACTOR), since
  //    body chars contribute only 1/20 to dwell — long body content doesn't
  //    inflate scene length the way a long heading would.
  for (const act of fm.acts) {
    for (const beat of act.beats) {
      const scenes = beat.scenes;
      if (!scenes) continue;
      for (const scene of scenes) {
        if (scene.rhythm !== "still" && scene.rhythm !== "tracking") continue;
        const baseCap = (MAX_DWELL_S - REACTION_S) * CPS_ZH[scene.emphasis];
        const chunks = paragraphsForCharCap(scene);
        chunks.forEach((p, idx) => {
          const chars = Math.max(p.zh, p.en);
          const cap = p.layer === "body" ? baseCap / BODY_DISCOUNT_FACTOR : baseCap;
          if (chars > cap) {
            console.warn(
              `  warn · ${filePath} · beat ${beat.id} scene ${scene.id} ${p.label}[${idx}] — char-cap: ${chars} chars > ${cap.toFixed(0)} (layer=${p.layer}, emphasis=${scene.emphasis}, CPS=${CPS_ZH[scene.emphasis]}).`,
            );
          }
        });
      }
    }
  }

  // 3. Emphasis distribution (D9): linger > 15% / brief > 40% / standard < 40%
  const allScenes: CaseStudyScene[] = fm.acts.flatMap((a) =>
    a.beats.flatMap((b) => b.scenes ?? []),
  );
  if (allScenes.length > 0) {
    const counts: Record<string, number> = { brief: 0, standard: 0, dwell: 0, linger: 0 };
    for (const s of allScenes) counts[s.emphasis] = (counts[s.emphasis] ?? 0) + 1;
    const total = allScenes.length;
    const pct = (k: string) => (counts[k] / total) * 100;
    if (pct("linger") > 15) {
      console.warn(
        `  warn · ${filePath} · emphasis distribution: linger ${pct("linger").toFixed(0)}% > 15% (重点过多 = 没有重点; consider downgrading some to dwell/standard)`,
      );
    }
    if (pct("brief") > 40) {
      console.warn(
        `  warn · ${filePath} · emphasis distribution: brief ${pct("brief").toFixed(0)}% > 40% (过场比例过高)`,
      );
    }
    if (pct("standard") < 40) {
      console.warn(
        `  warn · ${filePath} · emphasis distribution: standard ${pct("standard").toFixed(0)}% < 40% (基线段过少, 节奏可能失衡)`,
      );
    }
  }

  // 4. Per-beat rhythm + emphasis + mapState summary (foundations adds mapState)
  for (const act of fm.acts) {
    for (const beat of act.beats) {
      const scenes = beat.scenes;
      if (!scenes || scenes.length === 0) continue;
      const rhythmStr = scenes.map((s) => s.rhythm[0].toUpperCase()).join("");
      const empCounts: Record<string, number> = { brief: 0, standard: 0, dwell: 0, linger: 0 };
      for (const s of scenes) empCounts[s.emphasis] = (empCounts[s.emphasis] ?? 0) + 1;
      const empSummary = (["brief", "standard", "dwell", "linger"] as const)
        .filter((k) => empCounts[k] > 0)
        .map((k) => `${k}=${empCounts[k]}`)
        .join(" ");
      const modes = new Set<string>();
      const overlays = new Set<string>();
      for (const s of scenes) {
        if (s.mapState?.mode) modes.add(s.mapState.mode);
        if (s.mapState?.overlay) overlays.add(s.mapState.overlay);
      }
      const mapSummary =
        modes.size > 0 || overlays.size > 0
          ? ` mapState=[modes: ${[...modes].join(",") || "default"}; overlays: ${[...overlays].join(",") || "none"}]`
          : "";
      console.log(
        `  info · ${path.basename(filePath)} · beat ${beat.id}: rhythm=[${rhythmStr}] emphasis=[${empSummary}]${mapSummary}`,
      );
    }
  }

  // 5. Map mode / overlay registration warnings.
  //    foundations: matte / none. cinema-map-modes: + blueprint.
  //    cinema-map-overlays: + agents_trajectories / digital_silos_heatmap.
  const KNOWN_MODES = new Set(["matte", "blueprint", "schematic"]);
  const KNOWN_OVERLAYS = new Set([
    "none",
    "agents_trajectories",
    "digital_silos_heatmap",
    "push_moment",
    "tie_timelapse",
    "finding_1_siphon",
    "finding_2_friction",
    "finding_3_routine_cliff",
    "stories_pointers",
  ]);
  for (const act of fm.acts) {
    for (const beat of act.beats) {
      for (const scene of beat.scenes ?? []) {
        const mode = scene.mapState?.mode;
        if (mode && !KNOWN_MODES.has(mode)) {
          console.warn(
            `  warn · ${filePath} · beat ${beat.id} scene ${scene.id} — unknown mapState.mode "${mode}", will fallback to "matte" (register via cinema-map-modes propose)`,
          );
        }
        const overlay = scene.mapState?.overlay;
        if (overlay && !KNOWN_OVERLAYS.has(overlay)) {
          console.warn(
            `  warn · ${filePath} · beat ${beat.id} scene ${scene.id} — unknown mapState.overlay "${overlay}", will render null (register via cinema-map-overlays propose)`,
          );
        }
      }
    }
  }

  // 6. Motion + heavy text → suggest tracking (foundations: Apple "tracking
  //    shot with voiceover" semantics — author intent likely to be tracking)
  for (const act of fm.acts) {
    for (const beat of act.beats) {
      for (const scene of beat.scenes ?? []) {
        if (scene.rhythm !== "motion") continue;
        if (scene.emphasis === "brief") continue;
        const paragraphs = paragraphsForCharCap(scene);
        const longest = paragraphs.reduce(
          (m, p) => Math.max(m, p.zh, p.en),
          0,
        );
        if (paragraphs.length > 1 || longest > 30) {
          console.warn(
            `  warn · ${filePath} · beat ${beat.id} scene ${scene.id} — motion + reading-heavy text (${paragraphs.length}段, longest=${longest} chars). Consider rhythm="tracking" (camera moves + sticky reading-first text + 10/80/10 fade band)`,
          );
        }
      }
    }
  }
}

// Helper used by char-cap + motion-suggest checks. Returns each chunk's
// {zh, en} char counts + layer (primary | body) + label (for diagnostics).
//
// "primary" chunks are heading-equivalent — full CPS weight, strict cap.
// "body" chunks are scanning-style content — char-cap × 20 (per
// BODY_DISCOUNT_FACTOR) since they contribute 1/20 to dwell budget.
type CharCapChunk = {
  zh: number;
  en: number;
  layer: "primary" | "body";
  label: string;
};

function paragraphsForCharCap(scene: CaseStudyScene): CharCapChunk[] {
  const out: CharCapChunk[] = [];
  const push = (s: { zh: string; en: string }, layer: "primary" | "body", label: string) =>
    out.push({ zh: s.zh.length, en: s.en.length, layer, label });

  if (scene.kind === "title") {
    push(scene.text, "primary", "text");
    if (scene.subtitle) push(scene.subtitle, "primary", "subtitle");
  } else if (scene.kind === "lead") {
    // Lead is the act/intro elevator pitch — semantically a *passage*, not a
    // heading. Treat as body so the strict 30-char primary cap doesn't fire
    // on multi-paragraph leads (the natural form for an intro that needs to
    // set up a broader → specific frame).
    push(scene.text, "body", "text");
  } else if (scene.kind === "body-section") {
    if (scene.paragraphs) {
      scene.paragraphs.forEach((p) => push(p, "body", "paragraph"));
    }
    if (scene.twinColumns) {
      for (const [sideName, side] of [["left", scene.twinColumns.left], ["right", scene.twinColumns.right]] as const) {
        side.paragraphs?.forEach((p) => push(p, "body", `twinColumns.${sideName}.paragraph`));
        side.citations?.forEach((c) => push(c.text, "body", `twinColumns.${sideName}.citation`));
      }
    }
  } else if (scene.kind === "pull-quote") {
    push(scene.text, "primary", "text");
  } else if (scene.kind === "data-hit") {
    push(scene.caption, "primary", "caption");
    if (scene.paragraphs) {
      scene.paragraphs.forEach((p) => push(p, "body", "paragraph"));
    }
  }
  return out;
}

function main() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.log("no content directory yet, nothing to lint");
    return;
  }
  const glossary = loadGlossary();
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => path.join(CONTENT_DIR, f));

  for (const file of files) lintFile(file, glossary);

  if (errors.length) {
    console.error(`\ncontent-lint failed with ${errors.length} error(s):`);
    for (const err of errors) console.error(`  ✗ ${err}`);
    process.exit(1);
  } else {
    console.log(`content-lint: ${files.length} file(s) clean`);
  }
}

main();

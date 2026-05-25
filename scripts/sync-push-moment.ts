/**
 * sync-push-moment — export hyperlocal_push variant data for the
 * Act 2.4.3 "before / push! / after" demo.
 *
 * Pulls:
 *   1. variant_metadata (target_agent_ids, target_location)
 *   2. content_templates (hard-coded — these live in
 *      synthetic_socio_wind_tunnel/policy_hack/variants/hyperlocal_push.py
 *      and rarely change)
 *   3. day-4 position changes for the first N target agents only
 *
 * Output:
 *   public/case-studies/sswt/variants/hyperlocal_push-day4.json
 *
 * Why only N target agents (default 50): 500 agent × per-tick animation
 * blows the frame budget. 50 is enough to read the "they all moved toward
 * the church" effect without melting the GPU.
 *
 * Usage:
 *   pnpm sync:push-moment <path-to-sswt-repo> [--agents=50]
 *
 * Manual, single-direction, like sync:resident-stories.
 */

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("--"));

if (positional.length < 1) {
  console.error("Usage: pnpm sync:push-moment <path-to-sswt-repo> [--agents=50]");
  process.exit(1);
}

const sswtRoot = resolve(positional[0]);
const agentLimitArg = args.find((a) => a.startsWith("--agents="));
const AGENT_LIMIT = agentLimitArg ? parseInt(agentLimitArg.slice("--agents=".length), 10) : 50;
const DAY_INDEX = 4; // intervention day 1

// The latest publishable v7 fork-from-day-4 run, all-variants backup.
// This is the canonical source for the 4-variant comparison data.
const RUN_DIR = join(
  sswtRoot,
  "data/experiments/20260522_212423_publishable_v7_day4to13_fork_seed45_BACKUP_20260523_022549_FULL_ALLVARIANTS",
);
const VARIANT_DIR = join(RUN_DIR, "variant_hyperlocal_push");

if (!existsSync(VARIANT_DIR)) {
  console.error(`Variant directory not found: ${VARIANT_DIR}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 1. Content templates — mirrored from
//    synthetic_socio_wind_tunnel/policy_hack/variants/hyperlocal_push.py
//    _DEFAULT_TEMPLATES tuple. Update if upstream changes.
// ---------------------------------------------------------------------------
const CONTENT_TEMPLATES = [
  "距离你不到 500 米的 {location} 今晚 7:30 有社区即兴音乐会，进场免费。",
  "{location} 街角的老烘焙店今晚最后一天营业，全场八折。",
  "听说有人在 {location} 藏了一张关于这条街历史的便签——有人找到了吗？",
  "{location} 附近今晚有邻居自发办的读书分享，主题是《村上春树》。",
  "刚听说 {location} 周围有几只走失的橘猫，遛狗的邻居们在协助找。",
];

// ---------------------------------------------------------------------------
// 2. Variant metadata
// ---------------------------------------------------------------------------
const metaFile = join(VARIANT_DIR, "seed_45.json");
console.log(`reading ${metaFile}`);
const meta = JSON.parse(readFileSync(metaFile, "utf8"));
const variantMeta = meta?.multi_day_result?.metadata?.variant_metadata ?? {};
const allTargets: string[] = variantMeta.target_agent_ids ?? [];
const targetLocation: string = variantMeta.target_location ?? "";

if (allTargets.length === 0 || !targetLocation) {
  console.error("variant_metadata missing target_agent_ids or target_location");
  process.exit(1);
}

const targets = allTargets.slice(0, AGENT_LIMIT);

// Lookup human-readable name for target_location from atlas (so the push
// card can read "St Aidan's Anglican Church", not "st_aidans_anglican_church").
const atlasFile = join(sswtRoot, "data/lanecove_atlas.json");
let targetLocationName = targetLocation;
if (existsSync(atlasFile)) {
  const atlas = JSON.parse(readFileSync(atlasFile, "utf8"));
  const blds = atlas.buildings ?? {};
  const outs = atlas.outdoor_areas ?? {};
  const found = blds[targetLocation] ?? outs[targetLocation];
  if (found?.name) targetLocationName = found.name;
}

console.log(
  `target_location = ${targetLocation} (${targetLocationName}), targets = ${targets.length} / ${allTargets.length} total`,
);

// ---------------------------------------------------------------------------
// 3. Position changes — filter to day 4 + selected targets
// ---------------------------------------------------------------------------
const posFile = join(VARIANT_DIR, "seed_45_positions.json");
console.log(`reading ${posFile} (this is ~50MB and slow)`);
const posStat = statSync(posFile);
console.log(`  size: ${(posStat.size / 1024 / 1024).toFixed(1)} MB`);

const positions = JSON.parse(readFileSync(posFile, "utf8"));
const allChanges: Array<{
  tick: number;
  day: number;
  agent_id: string;
  location_id: string;
}> = positions.changes ?? [];

console.log(`  total changes: ${allChanges.length}`);

const targetSet = new Set(targets);
const dayChanges = allChanges.filter(
  (c) => c.day === DAY_INDEX && targetSet.has(c.agent_id),
);
console.log(`  day ${DAY_INDEX} changes for targets: ${dayChanges.length}`);

// For each agent: find first and last location during day 4
const perAgent = new Map<string, { firstTick: number; firstLoc: string; lastTick: number; lastLoc: string }>();
for (const c of dayChanges) {
  const cur = perAgent.get(c.agent_id);
  if (!cur) {
    perAgent.set(c.agent_id, {
      firstTick: c.tick,
      firstLoc: c.location_id,
      lastTick: c.tick,
      lastLoc: c.location_id,
    });
  } else {
    if (c.tick < cur.firstTick) {
      cur.firstTick = c.tick;
      cur.firstLoc = c.location_id;
    }
    if (c.tick > cur.lastTick) {
      cur.lastTick = c.tick;
      cur.lastLoc = c.location_id;
    }
  }
}

// If an agent has no day-4 change at all, still include with sentinel — caller can skip.
const agents = targets.map((id) => {
  const r = perAgent.get(id);
  return {
    agent_id: id,
    day_start_location_id: r?.firstLoc ?? null,
    day_end_location_id: r?.lastLoc ?? null,
    movement_ticks: r ? r.lastTick - r.firstTick : 0,
  };
});

const withData = agents.filter((a) => a.day_start_location_id !== null).length;
console.log(`  agents with day-${DAY_INDEX} position data: ${withData} / ${agents.length}`);

// ---------------------------------------------------------------------------
// 4. Compose output
// ---------------------------------------------------------------------------
const out = {
  schema: "push-moment.v1",
  variant: "hyperlocal_push",
  day_index: DAY_INDEX,
  push_time_iso: "T09:00:00", // hyperlocal_push.py apply_day_start sets hour=9
  target_location_id: targetLocation,
  target_location_name: targetLocationName,
  hyperlocal_radius_m: 1000,
  content_templates: CONTENT_TEMPLATES,
  /** First template instantiated; portfolio overlay can pick any of the 5. */
  example_content: CONTENT_TEMPLATES[0].replace("{location}", targetLocationName),
  agents,
  source: {
    repo: "Synthetic-Socio-Wind-Tunnel",
    run: "20260522_212423_publishable_v7_day4to13_fork_seed45_BACKUP_20260523_022549_FULL_ALLVARIANTS",
    variant_dir: "variant_hyperlocal_push",
    generated_at: new Date().toISOString(),
  },
};

const destDir = resolve("public/case-studies/sswt/variants");
mkdirSync(destDir, { recursive: true });
const destFile = join(destDir, "hyperlocal_push-day4.json");
writeFileSync(destFile, JSON.stringify(out, null, 2));

const outStat = statSync(destFile);
console.log(`\nwrote ${destFile} (${(outStat.size / 1024).toFixed(1)} KB)`);

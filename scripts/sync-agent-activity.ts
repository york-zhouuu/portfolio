/**
 * sync-agent-activity — extract per-agent event timelines from a SSWT
 * snapshot for the 3 spotlight archetypes in Act 2.2.2 (agent beat).
 *
 * Replaces the mocked LLM-tier flame above each spotlight beacon with
 * REAL events (encounter / notification / reflection) keyed by tick so
 * scene scroll plays back the agent's actual activity.
 *
 * Discovery (CLAUDE.md addendum): SSWT's llm.jsonl is system-level —
 * no agent_id, single nano (DeepSeek) tier. The "Opus / Haiku / Sonnet"
 * 3-tier story is poster narrative, not runtime reality. So we drive
 * the 3-bar widget with the next-best honest per-agent signal: event
 * classes that ARE captured per-agent (encounter / notification /
 * reflection in memory_store_state.agent_events).
 *
 * Output:
 *   public/case-studies/sswt/agent-activity.json
 *     {
 *       source: "...",
 *       tick_span: [min, max],
 *       agents: [{ agent_id, events: [{ tick, kind }, ...], by_kind: {...} }]
 *     }
 *
 * Usage:
 *   pnpm sync:agent-activity <path-to-sswt-repo>
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("--"));
if (positional.length < 1) {
  console.error("Usage: pnpm sync:agent-activity <path-to-sswt-repo>");
  process.exit(1);
}
const sswtRoot = resolve(positional[0]);

const SNAPSHOT = join(
  sswtRoot,
  "data/experiments/20260522_212423_publishable_v7_day4to13_fork_seed45_BACKUP_20260523_022549_FULL_ALLVARIANTS/variant_hyperlocal_push/seed_45_pid15611_tick4020.snapshot.json",
);

// Pick 3 agents to mirror the 3 sampled walker indices (30/75/130) used
// as spotlight slots in scene-2-2-2. Real IDs from seed 45.
const SPOTLIGHT_AGENTS = ["a_45_0030", "a_45_0075", "a_45_0130"];

// Event kinds we surface in the 3-bar widget. Each maps to one of the
// existing visual slots (bar 0, 1, 2) — relabeled from "LLM tier" to
// "event class" since real LLM tier data isn't per-agent.
const RELEVANT_KINDS = ["encounter", "notification", "reflection"];

if (!existsSync(SNAPSHOT)) {
  console.error(`Snapshot not found: ${SNAPSHOT}`);
  process.exit(1);
}

console.log(`reading ${SNAPSHOT} (~491MB, ~10s)`);
const snap = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
const agentEvents: Record<string, Array<Record<string, unknown>>> =
  snap?.memory_store_state?.agent_events ?? {};
console.log(`  loaded ${Object.keys(agentEvents).length} agents in memory store`);

type AgentTimeline = {
  agent_id: string;
  events: Array<{ tick: number; kind: string }>;
  by_kind: Record<string, number>;
  by_day: Record<string, number>;
};

const out: AgentTimeline[] = [];
let globalMinTick = Infinity;
let globalMaxTick = -Infinity;

for (const agentId of SPOTLIGHT_AGENTS) {
  const events = agentEvents[agentId] ?? [];
  if (events.length === 0) {
    console.warn(`  ! agent ${agentId} has 0 events`);
  }
  const timeline: Array<{ tick: number; kind: string }> = [];
  const byKind: Record<string, number> = {};
  const byDay: Record<string, number> = {};
  for (const e of events) {
    const kind = String(e.kind ?? "");
    byKind[kind] = (byKind[kind] ?? 0) + 1;
    const day = String(e.day_index ?? -1);
    byDay[day] = (byDay[day] ?? 0) + 1;
    if (!RELEVANT_KINDS.includes(kind)) continue;
    const tick = typeof e.tick === "number" ? e.tick : -1;
    if (tick < 0) continue;
    timeline.push({ tick, kind });
    if (tick < globalMinTick) globalMinTick = tick;
    if (tick > globalMaxTick) globalMaxTick = tick;
  }
  timeline.sort((a, b) => a.tick - b.tick);
  out.push({
    agent_id: agentId,
    events: timeline,
    by_kind: byKind,
    by_day: byDay,
  });
  console.log(
    `  ${agentId}: total=${events.length} relevant=${timeline.length} kinds=${JSON.stringify(byKind)}`,
  );
}

const result = {
  schema: "agent-activity.v1",
  source: {
    repo: "Synthetic-Socio-Wind-Tunnel",
    snapshot: "seed_45_pid15611_tick4020.snapshot.json",
    variant: "hyperlocal_push",
    generated_at: new Date().toISOString(),
  },
  /** Inclusive tick range covering events in `agents`. Portfolio overlay
   *  maps sceneLocalT (0→1) to this range to compute "current playback tick". */
  tick_span: [globalMinTick, globalMaxTick],
  /** Each bar's data class. Maps to AgentBeacon's 3 widget bars in order. */
  bar_classes: RELEVANT_KINDS,
  agents: out,
  note: "Real per-agent event timeline from snapshot. Real LLM-tier-per-agent data does not exist in SSWT (llm.jsonl is system-level, single nano tier). These 3 event classes are the most informative per-agent signal that IS captured.",
};

const destDir = resolve("public/case-studies/sswt");
mkdirSync(destDir, { recursive: true });
const destFile = join(destDir, "agent-activity.json");
writeFileSync(destFile, JSON.stringify(result, null, 2));
const size = readFileSync(destFile).length;
console.log(`\nwrote ${destFile} (${(size / 1024).toFixed(1)} KB)`);
console.log(`tick_span: [${globalMinTick}, ${globalMaxTick}]`);

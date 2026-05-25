/**
 * sync-tie-graph — reconstruct the social tie graph from a SSWT snapshot
 * for the Act 2.3.2 "network is output not input" tie timelapse.
 *
 * SocialGraphService isn't serialized into snapshots directly, but it's
 * deterministic from encounter events in memory_store_state.agent_events
 * + the same scoring as service.record_noticed_encounter():
 *   strength = N / (N + 10)
 *
 * Each tie's two endpoints get a real (x, y) coord from the entity's
 * current position in ledger_state.entities. By scene end the portfolio
 * sandbox shows the actual social graph that emerged from 1000 agents
 * colliding in shared space — not a sketch.
 *
 * Output:
 *   public/case-studies/sswt/tie-graph.json
 *
 * Usage:
 *   pnpm sync:tie-graph <path-to-sswt-repo> [--top=800]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("--"));
if (positional.length < 1) {
  console.error("Usage: pnpm sync:tie-graph <path-to-sswt-repo> [--top=800]");
  process.exit(1);
}
const sswtRoot = resolve(positional[0]);
const topArg = args.find((a) => a.startsWith("--top="));
const TOP_N = topArg ? parseInt(topArg.slice("--top=".length), 10) : 800;

const SNAPSHOT = join(
  sswtRoot,
  "data/experiments/20260522_212423_publishable_v7_day4to13_fork_seed45_BACKUP_20260523_022549_FULL_ALLVARIANTS/variant_hyperlocal_push/seed_45_pid15611_tick4020.snapshot.json",
);

if (!existsSync(SNAPSHOT)) {
  console.error(`Snapshot not found: ${SNAPSHOT}`);
  process.exit(1);
}

console.log(`reading ${SNAPSHOT} (~491MB)`);
const snap = JSON.parse(readFileSync(SNAPSHOT, "utf8"));

const entities: Record<
  string,
  { position?: { x: number; y: number } }
> = snap?.ledger_state?.entities ?? {};
console.log(`  entities: ${Object.keys(entities).length}`);

const agentEvents: Record<string, Array<Record<string, unknown>>> =
  snap?.memory_store_state?.agent_events ?? {};

type TieAccum = { a: string; b: string; count: number; firstTick: number };

console.log("  reconstructing tie graph from encounter events ...");
const ties = new Map<string, TieAccum>();
for (const [aid, events] of Object.entries(agentEvents)) {
  for (const e of events) {
    if (e.kind !== "encounter") continue;
    const actor = e.actor_id as string | undefined;
    if (!actor || actor === aid) continue;
    const [a, b] = [aid, actor].sort();
    const key = `${a}|${b}`;
    const tick = (e.tick as number) ?? 0;
    const cur = ties.get(key);
    if (!cur) {
      ties.set(key, { a, b, count: 1, firstTick: tick });
    } else {
      cur.count += 1;
      if (tick < cur.firstTick) cur.firstTick = tick;
    }
  }
}
console.log(`  reconstructed ${ties.size} unique tie pairs`);

const allTies = [...ties.values()].sort((x, y) => y.count - x.count);
const top = allTies.slice(0, TOP_N);

let kept = 0;
let dropped = 0;
const out: Array<{
  a: string;
  b: string;
  count: number;
  strength: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
}> = [];
for (const t of top) {
  const ea = entities[t.a]?.position;
  const eb = entities[t.b]?.position;
  if (!ea || !eb) {
    dropped += 1;
    continue;
  }
  out.push({
    a: t.a,
    b: t.b,
    count: t.count,
    strength: t.count / (t.count + 10),
    ax: ea.x,
    ay: ea.y,
    bx: eb.x,
    by: eb.y,
  });
  kept += 1;
}

const result = {
  schema: "tie-graph.v1",
  source: {
    repo: "Synthetic-Socio-Wind-Tunnel",
    snapshot: "seed_45_pid15611_tick4020.snapshot.json",
    variant: "hyperlocal_push",
    generated_at: new Date().toISOString(),
  },
  total_ties_reconstructed: ties.size,
  ties_exported: kept,
  ties_dropped_no_position: dropped,
  /** Ties sorted by encounter count descending. Portfolio overlay reveals
   *  them in this order as sceneLocalT advances (top tie first). */
  ties: out,
  note: "Reconstructed from memory_store_state.agent_events encounter events. Mirrors SocialGraphService strength formula = N/(N+10). Positions from ledger_state.entities snapshot at tick 4020.",
};

const destDir = resolve("public/case-studies/sswt");
mkdirSync(destDir, { recursive: true });
const destFile = join(destDir, "tie-graph.json");
writeFileSync(destFile, JSON.stringify(result));
const size = statSync(destFile).size;
console.log(`\nwrote ${destFile} (${(size / 1024).toFixed(1)} KB)`);
console.log(`  kept: ${kept}, dropped (missing position): ${dropped}`);
console.log(`  top-1 tie count: ${top[0]?.count ?? "n/a"}`);

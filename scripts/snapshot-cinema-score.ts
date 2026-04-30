#!/usr/bin/env tsx
/**
 * snapshot-cinema-score — export the in-code cinema score as a JSON artifact
 * into public/case-studies/sswt/cinema-score.json. Bumps a hash check —
 * fails if the score content changed but `version` did not.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { sswtCinemaScore } from "../lib/cinema/score.sswt";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT = path.join(__dirname, "..", "public", "case-studies", "sswt", "cinema-score.json");
const PREV = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : null;

const json = JSON.stringify(sswtCinemaScore, null, 2);
const hash = crypto.createHash("sha256").update(json).digest("hex").slice(0, 12);

if (PREV && PREV.version === sswtCinemaScore.version && PREV._hash !== hash) {
  console.error(
    `score content changed but version did not — bump score.sswt.ts version (current ${sswtCinemaScore.version})`,
  );
  process.exit(1);
}

fs.writeFileSync(OUT, JSON.stringify({ ...sswtCinemaScore, _hash: hash }, null, 2));
console.log(`cinema score snapshot written: ${OUT} (version ${sswtCinemaScore.version}, hash ${hash})`);

## Context

### The two pipelines

The cinema scene uses two parallel pipelines that both convert 2D map data to 3D world coordinates:

**Pipeline A — SandTable (the visible map)**
```
asset.roads[i].footprint[j]  ── normalize ──►  NormalizedRoad.shape[j] = {x, y}
                                                       │
                                                       │  THREE.Shape from {x, y}
                                                       ▼
                                                ShapeGeometry (in XY plane, z=0)
                                                       │
                                                       │  geo.rotateX(-π/2)
                                                       ▼
                                                3D mesh at world (x, 0, −y)
```

**Pipeline B — agentSampling (the trajectories agents walk)**
```
NormalizedRoad.shape[j] = {x, y}  ── ribbonToPoly / roadCenterline ──►  path[i] = {x, z: y}
                                                                              │
                                                                              │  used directly
                                                                              ▼
                                                                       agent placed at (x, 0, z)
                                                                                          = (x, 0, y)
```

### The mismatch

Pipeline A's `rotateX(-π/2)` flips the sign on the y axis when projecting to z (the rotation matrix sends `(x, y, 0)` to `(x, 0, −y)`).

Pipeline B preserves the sign — `path.z := original.y` directly.

The two pipelines diverge by exactly **one negation**. The result: agents appear mirrored across the X axis from the visible map.

### Why it took this long to spot

- Sand table is symmetric-ish around the X axis, so a Y-flipped agent looks "in the area" rather than "obviously off"
- 200+ agents on a 1km² faceted map is visually noisy
- ping-pong direction reversal looked like the cause when actually it just amplified the mirroring
- Only when the user noticed cars NOT following identifiable streets (Pacific Highway etc.) did the mirror become apparent

## Goals / Non-Goals

**Goals:**
- Single root-cause fix: align Pipeline B with Pipeline A
- Document the convention in code so future contributors don't reintroduce it
- Verify post-fix by inspecting one or two well-known streets

**Non-Goals:**
- ❌ Not changing SandTable's `rotateX(-π/2)` (that's load-bearing — refactoring would touch every other downstream consumer)
- ❌ Not introducing a coordinate-system abstraction (would be over-engineering for a 3-line fix)
- ❌ Not adding integration tests (no test framework yet; manual verification suffices)

## Decisions

### D1 — Negate `y` when assigning to `z` in agentSampling

The bug is fully resolved by 3 numeric flips:

```diff
 function ribbonToPoly(r: NormalizedRibbon): Vec2[] {
-  return r.points.map((p) => ({ x: p.x, z: p.y }));
+  return r.points.map((p) => ({ x: p.x, z: -p.y }));
 }

 function roadCenterline(road: NormalizedRoad): Vec2[] {
   ...
   for (let i = 0; i < half; i++) {
     ...
-    out.push({ x: (a.x + b.x) / 2, z: (a.y + b.y) / 2 });
+    out.push({ x: (a.x + b.x) / 2, z: -(a.y + b.y) / 2 });
   }
   ...
 }
```

(The `roadWidth` function uses raw `y` values for distance computation — those are unaffected; distance is sign-invariant.)

**Why per-converter rather than at agent-position-time**:
The fix could go in `setAgentMatrix` (negate `cur.z` when placing). But that's the wrong layer — `path` is reused for `pathTangentAt`, `polyLength`, `chainPolylines`, etc. Negating only at render time would leave path geometry inconsistent with rendered map (length unaffected but tangent direction wrong → yaw bug returns).

Fixing at the **conversion boundary** keeps `path` semantically aligned with the world: every `path[i] = {x, z}` is a valid world position, no mental conversion needed elsewhere.

### D2 — Document the convention

Add a comment block at the top of `agentSampling.ts` explaining:
> Coordinate convention: agent paths are stored in world XZ space, where `path.z` corresponds to NEGATED 2D-map-y to align with SandTable's `rotateX(-π/2)`. Helpers in this file enforce the sign flip at conversion. Do not change without auditing SandTable rendering.

This documents the trap so future code reviewers / contributors don't re-flip.

### D3 — Verification protocol (manual)

Post-fix, pick 3 known geographic landmarks and verify agents trace them:

1. **Pacific Highway** (longest continuous road in our dataset, 16 wide segments)
   - In dev tools, log agent positions for one agent assigned to a Pacific Highway segment
   - Cross-check that the position track matches the visible Pacific Highway in the canvas
2. **Lane Cove River** (waterway feature added in last cartography fix)
   - No agents should ever walk through the river — if they do, mirror persists
3. **A residential cul-de-sac** (excluded by our `> 0.025 wu` filter)
   - Agents should NOT appear in cul-de-sacs (filter intact)
   - But if they did appear in pre-fix mirror, verify they no longer do

## Risks / Trade-offs

- **[The mirror is in the OTHER direction]** If the rotation sign analysis is wrong (e.g., the bug is a `+y` not `-y` issue), the fix introduces NEW mirroring instead of removing it.
  → Mitigation: rotateX matrix math (verified above) gives `(x, y, 0) → (x, 0, -y)` for angle `-π/2`. Confidence: high. If empirically wrong, swap signs.

- **[Other consumers of `NormalizedRoad.shape` rely on the un-negated y]** Search confirmed that `agentSampling.ts` is the only consumer that reads `.y` and writes to `.z`. SandTable does its own three.js rotation. Other code paths (`buildBeatLayout`, `mapState` resolver, etc.) don't touch road geometry.
  → Mitigation: grepped — only place is `agentSampling.ts`.

- **[New roads / walkways added later might re-introduce the bug if they bypass these helpers]** If someone writes a new geometry consumer, they need to know about the convention.
  → Mitigation: D2 comment block.

## Migration Plan

1. **Phase 0** — Apply D1 (3 sign flips) + D2 (doc comment).
2. **Phase 1** — typecheck + lint + build green (no schema change, should pass without trouble).
3. **Phase 2** — Manual visual verification (D3): run `pnpm dev`, scroll through Beat 1.1 with overlay active, confirm cars on roads.
4. **Phase 3** — If post-fix the mirror is in the OTHER direction, flip signs again (one-line revert per spot).

Rollback: trivial — single commit, three sign flips. `git revert` restores prior behavior.

## Open Questions

1. **Q1 — Should `Vec2` in agentSampling rename `{x, z}` to something less misleading?** The current type uses `z` field name to indicate "world Z axis", but the value comes from `y` of map-space. Renaming would clarify but adds churn. Skip for now.

2. **Q2 — Is there an analogous bug in pinned silos (`DigitalSilosOverlay`)?** Silos use `agent.path[0]` for position. Same path source → same fix automatically applies. ✓

3. **Q3 — Are camera positions in mdx affected?** Camera coords (e.g., `[0, 0.2, 12]`) are world-space already, set by author. Not affected by this fix.

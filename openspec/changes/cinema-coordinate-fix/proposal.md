## Why

**Severe alignment bug**: agents (people, cars) walk / drive on paths that are visually mirrored across the world X axis from the rendered map. Cars that should be on Pacific Highway appear on the opposite side of the river. People walk through buildings.

Root cause is a **single sign mismatch between two parallel pipelines** that both convert 2D map-space `Vec2 {x, y}` to 3D world space:

```
SandTable rendering (correct):
   Shape vertex (x, y) in XY plane (z=0)
        ↓ geo.rotateX(-π/2)
   World position (x, 0, −y)        ← y axis NEGATED (rotation around X)

agentSampling (current — buggy):
   NormalizedRoad.shape[i] = (x, y)
        ↓ ribbonToPoly / roadCenterline
   path[i] = { x: v.x, z: v.y }     ← y assigned to z DIRECTLY (no negation)
   
⇒ Agents are placed at (X, 0, +Y) while the rendered road is at (X, 0, −Y).
⇒ Agents appear mirrored about the X axis from the visible map.
```

This explains every recent visual artifact:
- "Cars driving randomly" — they ARE driving along correct topology, just mirrored
- "Agents walking through buildings" — same mirror
- All "doesn't follow road" complaints

## What Changes

- **Single fix point**: in `lib/cinema/agentSampling.ts`, all conversions from `NormalizedRoad.shape[i].y` / `NormalizedRibbon.points[i].y` to path's `z` SHALL **negate the value**.
  - `roadCenterline`: `z: (a.y + b.y) / 2` → `z: -(a.y + b.y) / 2`
  - `ribbonToPoly`: `z: p.y` → `z: -p.y`
- **Add explicit alignment documentation** in `agentSampling.ts` referencing SandTable's `rotateX(-π/2)` so future contributors don't reintroduce the bug.
- **Verification**: post-fix, manually pick 3 well-known landmarks (Pacific Highway, Lane Cove River, a known intersection) and verify agents trace them correctly in the rendered scene.
- **No schema / mdx changes required** — this is a pure rendering-pipeline alignment fix.

## Capabilities

### Modified Capabilities

- `cinematic-case-study-page` — `<AgentsTrajectoriesOverlay>` now renders at coords aligned with the visible map (was mirrored).

### New Capabilities

_None._

## Impact

- **Code**: `lib/cinema/agentSampling.ts` (3 small numeric edits + comment block).
- **No effect on**: schema, mdx, mapState, materials, geometry of agents, scroll pacing, anything else.
- **Bundle**: zero size delta (just sign flips).
- **Performance**: zero impact (no extra ops).
- **Risk**:
  - Low. Fix is a single sign flip on the same axis everywhere it's read from a `NormalizedRoad/Ribbon`.
  - **Sanity check**: run dev, look at any scene with overlay active — cars should now visibly track Pacific Highway and other recognizable arteries.
- **Why this didn't surface earlier**: the visual ambiguity at small scale (200+ agents on a faceted sand table) made the mirror hard to spot until camera angles aligned to known landmarks.

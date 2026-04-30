## ADDED Requirements

### Requirement: Agent paths align with SandTable rendering coordinates

The conversion from `NormalizedRoad.shape[i]` / `NormalizedRibbon.points[i]` (which carry 2D map-space `Vec2 {x, y}`) into agent path waypoints `{x, z}` SHALL apply a sign flip on the y axis: `path.z = -original.y`.

This aligns agent positions with the rendered SandTable, which projects the same source data through `THREE.ShapeGeometry` + `geo.rotateX(-Math.PI / 2)` — a rotation that sends 2D-y to negative world-z.

#### Scenario: agent placed at correct world position

- **WHEN** an agent samples a polyline whose source had y=Y (e.g., the centerline of Pacific Highway segment with map-y = 1500)
- **THEN** the agent's matrix position must place it at world-z = −Y, matching where the SandTable rendered that road

#### Scenario: an agent appears mirrored from the visible road

- **WHEN** post-fix testing shows an agent walking parallel to a visible road but on the opposite side
- **THEN** the sign flip was applied to the wrong axis or wrong direction; revisit pipeline alignment in `lib/cinema/agentSampling.ts`

### Requirement: Coordinate convention documented in agentSampling

`lib/cinema/agentSampling.ts` SHALL include a top-level comment block stating:

> Coordinate convention: agent paths are stored in world XZ space, where `path.z` corresponds to **negated** 2D-map-y to align with SandTable's `rotateX(-π/2)`. Conversion helpers (`ribbonToPoly`, `roadCenterline`) enforce this sign flip at the conversion boundary. Downstream code (chainPolylines, positionAlongPath, pathTangentAt) treats `path` as already-aligned world coords.

#### Scenario: someone adds a new path source

- **WHEN** a new consumer of `NormalizedRoad` / `NormalizedRibbon` is added that reads `.y` and stores into `path.z`
- **THEN** that consumer MUST also negate, per the documented convention

### Requirement: Verification — agents trace identifiable streets

After this fix is applied, manual visual verification SHALL confirm:

1. Cars on Pacific Highway (the longest, widest contiguous road) are visibly on the rendered Pacific Highway, not parallel to it on the opposite side.
2. No agent crosses Lane Cove River or other water polygons (no agent paths sample water geometry).
3. With the existing road-width filter (`width > 0.025 wu`), cars do not appear on small driveways or service roads.

#### Scenario: cars visibly traverse Pacific Highway

- **WHEN** the user loads the cinema page and scrolls to a scene with `agents_trajectories` overlay active
- **THEN** at least some of the 50 vehicles MUST visibly drive along the painted Pacific Highway centerline (not offset by full road width)

#### Scenario: agents walk through buildings

- **WHEN** an agent's matrix position falls within a building footprint
- **THEN** indicates remaining coordinate misalignment OR walkway data error; investigate sand-table rendering vs path conversion

## ADDED Requirements

### Requirement: Person geometry — architectural scale-figure proportions

`buildPersonGeometry` SHALL produce a humanoid silhouette with **architectural scale-figure** proportions:

- Total height ≈ 0.30 world units
- Head : total ratio ≈ 1 : 7.5
- Stack: legs (50%), torso (35%), neck/head (15%)
- **No arms** — silhouette is head + tapered torso + 2 legs only
- Head: SphereGeometry r=0.020, 8×6 segments
- Torso: tapered cylinder, top r=0.024 (shoulders), bottom r=0.020 (waist), 6 segments
- Legs: 2 cylinders r=0.013, 5 segments, x-offset 0.012

#### Scenario: figure rendered with arms

- **WHEN** any future iteration adds back arm primitives
- **THEN** that iteration MUST justify the addition (远视角辨识失败 etc.) and document the trade-off

### Requirement: Person two-tone palette

The merged person geometry SHALL carry vertex colors for exactly two tones:

- Upper body (head + torso): `#dcd5c8` (warm bone)
- Lower body (legs): `#a8a39a` (cool greige, slightly darker)

No skin tone, no shirt accent. Both tones in the warm-grey hue band, distinguished primarily by brightness — embodies the "性冷淡 / Scandinavian minimal" register.

#### Scenario: figure renders with saturated tones

- **WHEN** any color channel saturation > 0.15
- **THEN** the palette violates the "性冷淡" goal and SHALL be muted

### Requirement: Car geometry — sedan side profile via ExtrudeGeometry

`buildCarGeometry` SHALL build the car body using `THREE.Shape` + `THREE.ExtrudeGeometry`:

- Side-profile shape with ≥ 8 anchor points tracing: rear bumper → trunk → roof rear → roof front → windshield top → bonnet → front bumper → bottom edge
- Total length ≈ 0.18, total height ≈ 0.04, length-to-height ratio ≥ 4.5
- Extrude depth (car width) ≈ 0.06
- 4 wheels — cylinders r=0.014, height 0.012, 8 radial segments, rotated π/2 around Z so axis aligns with X
- Wheels positioned partially inside body wheel arches (visible from outside but tucked into bottom)

#### Scenario: car length-to-height ratio under 4

- **WHEN** the car geometry produces ratio < 4
- **THEN** proportions are too SUV/box-like for the design intent; revisit profile anchors

### Requirement: Car palette — single body + glass strip

The merged car geometry SHALL carry vertex colors:

- Body (everything below cabin roofline): `#cfc6b8` (dusty bone)
- Glass strip (vertices with y > 0.030, the cabin top section): `#3a3833` (deep charcoal)
- Wheels: `#252320` (warm dark)

Glass strip identified by **spatial check on vertex y-position** (not vertex index hack), so the test is robust to ExtrudeGeometry vertex ordering changes between three.js versions.

#### Scenario: glass appears on body sides

- **WHEN** vertex coloring spills onto sides (y < 0.030 vertices painted glass)
- **THEN** the y-threshold check is wrong; adjust threshold or refine geometry

### Requirement: Material tuning — matte, no metallic shine

Both InstancedMesh materials SHALL use:

- `vertexColors: true`
- `flatShading: true`
- `roughness: 0.75–0.85` (matte to nearly-matte)
- `metalness: 0–0.05` (no shine on figures, barely a hint on cars)
- No `emissive`

This produces "architect's basswood model" register — physical, hand-crafted, no digital glow.

#### Scenario: emissive added back

- **WHEN** any iteration sets emissiveIntensity > 0
- **THEN** violates the "性冷淡 matte" target; document deviation reason

### Requirement: Backward compatibility — no schema / interface changes

This change SHALL NOT modify:

- `MapOverlayProps` interface (registry接口)
- `Agent` type / `sampleWalkers` / `sampleVehicles` / `positionAlongPath` (路径机制)
- mdx Beat 1.1 5 scenes 内容
- Spring profile / camera / mapState resolver

The propose is **purely a geometry + material iteration** within the existing overlay infrastructure.

#### Scenario: change touches schema or registry interface

- **WHEN** propose implementation modifies any file outside `lib/cinema/agentMeshes.ts` or `components/cinema/overlays/AgentsTrajectoriesOverlay.tsx` (material props)
- **THEN** scope creep — file the additional change as a separate propose

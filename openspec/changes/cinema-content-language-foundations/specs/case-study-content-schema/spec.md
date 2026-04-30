## ADDED Requirements

### Requirement: Scene mapState 字段（4 子字段全 optional）

`SceneBase` SHALL 增加可选字段 `mapState?: { mode?, dim?, overlay?, highlight? }`，所有子字段 optional：

```ts
type MapMode = string;            // "matte" | "blueprint" | 任意（未注册则 fallback）
type MapOverlayName = string;     // "none" | "agents_trajectories" | …
interface MapState {
  mode?: MapMode;          // default "matte"
  dim?: number;            // 0..1，default 1.0
  overlay?: MapOverlayName;// default "none"
  highlight?: string[];    // 默认空数组（未来扩展占位）
}
```

未填 mapState 的 scene 视为全 default。现有 MDX 不需要任何改动即可继续 build。

#### Scenario: scene 不写 mapState

- **WHEN** scene frontmatter 没有 `mapState`
- **THEN** Zod 解析通过；运行时 mapState = `{ mode: "matte", dim: 1, overlay: "none", highlight: [] }`

#### Scenario: scene 写 mapState 含未注册 mode

- **WHEN** scene 写 `mapState.mode: "watercolor"` 但渲染层未注册该 mode
- **THEN** Zod 解析通过（mode 是 string，不限枚举）；content-lint 输出 warning；运行时 fallback `matte`

#### Scenario: dim 越界

- **WHEN** scene 写 `mapState.dim: 1.5` 或 `mapState.dim: -0.1`
- **THEN** Zod 报错（要求 0..1 之间）

### Requirement: SceneKind `data-hit` 新增

`Scene` discriminated union SHALL 增加新成员 `kind: "data-hit"`：

```ts
SceneDataHit = SceneBase & {
  kind: "data-hit";
  number: string;                    // 主数字 / 短文本（"1,000" / "14 days" 等）
  caption: I18nString;               // 必填：单行注释
  paragraphs?: I18nString[];         // 可选：supporting text，progressive reveal
};
```

字符数：number 不计入 char-cap（视为视觉元素）；caption 与 paragraphs 计入（同 emphasis 的 per-paragraph cap）。

#### Scenario: data-hit 缺 caption

- **WHEN** data-hit scene 没有 `caption` 字段
- **THEN** Zod 报错

#### Scenario: data-hit number 字段为空

- **WHEN** data-hit scene 写 `number: ""`
- **THEN** Zod 报错（min length 1）

### Requirement: RhythmKind `"tracking"` 新增

`RhythmKind` SHALL 扩展为 `"motion" | "still" | "bridge" | "tracking"`。

tracking 语义：相机沿 from→to 线性匀速移动，文字 sticky 钉视口，CPS dwell 用 still 公式，fade band 用 still 的 10/80/10。

`tracking` rhythm 的 scene MUST 同时声明 `camera.from` 与 `camera.to`，且 from ≠ to（否则没有 tracking 必要——应该改用 still）。

#### Scenario: tracking scene 缺 to

- **WHEN** scene 写 `rhythm: tracking` 但 `camera.to` 未提供或与 from 完全相等
- **THEN** Zod refine 报错（指明 tracking 必须有可见位移）

### Requirement: 节奏交替规则增加 tracking

content-lint 节奏序列规则 SHALL 在 cinema-scroll-pacing 既有规则上加入 tracking：

- 连续 `still` MUST ≤ 2
- 连续 `motion` MUST ≤ 1
- 连续 `tracking` MUST ≤ 1（**新增**）
- `bridge` 不计入连续计数（重置流）

#### Scenario: 两连 tracking

- **WHEN** beat scenes 序列含连续两个 tracking
- **THEN** content-lint 报 warning（cinema-scroll-pacing Phase 5 后切 error）

### Requirement: Progressive reveal 多 paragraph 字数 cap

content-lint 字数上限规则 SHALL 改为 per-paragraph 检查（不再 per-scene），以匹配 progressive reveal 的"每段独立 dwell"语义：

- body-section.paragraphs 数组中每段独立检查
- data-hit.paragraphs 数组中每段独立检查
- title.text / lead.text / pull-quote.text 视为单 paragraph 检查
- 上限同 emphasis：brief=72 / standard=54 / dwell=42 / linger=30

#### Scenario: body-section 单段超 cap

- **WHEN** body-section 的 `paragraphs[i]` 字数 > emphasis cap
- **THEN** content-lint 报错；信息含 paragraph index、字数、emphasis、对应 cap

#### Scenario: body-section 多段总字数超原来 per-scene cap 但每段都合规

- **WHEN** body-section 有 3 段各 30 字（共 90），emphasis = standard（per-paragraph cap 54）
- **THEN** content-lint 通过（per-paragraph 没人超）

### Requirement: SVH 计算支持多 paragraph

`computeStillSvh` / 新增 `computeBodySectionSvh` SHALL 处理多 paragraph：

```
total_svh(scene) = Σ paragraph_svh(p_i)  for each p in scene.paragraphs

paragraph_svh(p) = secondsToSvh(clamp(chars(p) / CPS + reaction, MIN, MAX))
```

单 paragraph（N=1）行为与原 computeStillSvh 等价。

#### Scenario: 单 paragraph body-section svh

- **WHEN** body-section 只有 1 个 paragraph 80 字 emphasis=standard
- **THEN** svh = clamp(80/9 + 0.5, 1.5, 6.5) = 6.5s × 100 = 650svh（与原行为一致）

#### Scenario: 多 paragraph body-section svh

- **WHEN** body-section 有 3 个 paragraph，分别 30/40/20 字，emphasis=standard
- **THEN** svh = secondsToSvh(30/9+0.5) + secondsToSvh(40/9+0.5) + secondsToSvh(20/9+0.5) ≈ 380 + 490 + 270 = 1140svh

### Requirement: lint warning — motion + 多 paragraph 建议改 tracking

content-lint SHALL 在以下条件输出 warning（不阻断）：

- scene `rhythm === "motion"`
- 且 scene 文字有多 paragraph 或单 paragraph 字数 > 30
- 且 emphasis ≠ brief

提示作者考虑改用 tracking rhythm（"motion 的语义是无文字 / 单字，长文应该用 tracking"）。

#### Scenario: motion scene 配长文

- **WHEN** scene 是 motion + body-section + 2 paragraph 各 40 字 + standard emphasis
- **THEN** lint warning："Consider rhythm=tracking for reading-while-camera-moves; motion is for visual-only or single-word"

## MODIFIED Requirements

_本 propose 不修改既有 case-study-content-schema requirements；所有变化以 ADDED 形式新增。_

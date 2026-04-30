## Why

`case-study-script-v1` v3 propose（产品向 5 幕 alignment）已敲定 Act I 重写决定（Q1=A / Q2=B / Q3=C / Q4=B / Q5=B / Q6=A / Q7c=C）：

- **Act I = 1 个 beat（4 scene）**——不再是 v3 之前的 3 beat 拆分
- **作者 v4 JSON**「附近的消失」是这 1 beat 的 single source of truth
- **Tone 决定性变了**：从"系统级 Bug"keynote 风 → "Medium 深度文章 / 标准产品设计 Research"——平实、克制、措辞专业
- 现 mdx 的 attention-boundary act 中 3 个旧 beat（`open-real-world` 5 scene + `blindspot-reveal` 3 scene + `instrument-summon` grandfather）**全部删除**，由单一 v4 beat `disappearance-of-nearby` 替换

本 propose 是 case-study-script-v1 的**第一个实施 step**——Act I 落地。

## What Changes

### 1. Schema 扩展（最小、向后兼容）

`TwinColumns.left/right` 加可选 `paragraphs?: I18nString[]` 字段，与现有 `items: KvItem[]` 并列。

**用途**：v4 scene-1-2 evidence 用 split-columns 双栏文本对比（"物理属性 ABS" / "社会属性 Reddit"）。现 KvItem 形态（key + value）不足以承载长叙述，需要每列支持长 paragraph 段落。

**约束**：每列必须有 `items` 或 `paragraphs` 其一（refine 校验）。已有 mdx 中所有 twinColumns 用法仅含 `items`，**不破坏**。

### 2. mdx 改动（attention-boundary act）

- **删除**：`open-real-world` (5 scene)、`blindspot-reveal` (3 scene)、`instrument-summon` (grandfather)
- **新增**：`disappearance-of-nearby` (4 scene per v4 JSON)
- attention-boundary act 现仅含 1 beat
- `references` / `epigraph` 顶层字段保留

### 3. v4 JSON → mdx YAML 翻译

按作者 v4 JSON 1:1 翻译，附以下微调（已 sign-off）：

| v4 字段 / 值 | mdx 翻译 / 调整 |
|---|---|
| scene-1-1 from = `[0, 0.2, 5]`, rhythm = still | from = `[0, 0.2, 5.15]`, to = `[0, 0.2, 5]`, rhythm = **tracking**（实现 3% push-in；still 要求 from === to）|
| scene-1-1 dim = 0.5 | 保持 dim 0.5（晨光 / 沉思感，作者确认）|
| scene-1-2 kind = `juxtaposition`, layout = `split-columns` | kind = `body-section`, layout = `twin-column`, twinColumns.{left,right}.paragraphs[] 承载文本 |
| scene-1-1 title = "附近的消失" | beat-level `title.zh = "附近的消失"`, scene 内部不重复显示 |
| 1km² 沙盘表述（camera notes 中）| 替换为"~17 km² 数字孪生"（Atlas 真尺度 3.6 × 4.7 km，留至 Act II.1 surface）|

### 4. Camera 接续

- v4 末位 to = `[0, 12, 12]`
- 后续 Act II.1 atlas-ledger 起点 MUST = `[0, 12, 12]`（zero-jump continuity）

### 5. Provenance 同步

`docs/case-study-data-provenance.md` 同步 Act I v4 数据：

- ABS Lane Cove ~38k 居民（real，待 quickstats 精校）
- Reddit "对邻居陌生" 切片（mock + TODO 真爬或换公开 study）
- Atlas 3.6 × 4.7 km / OSM + Overture（real，narrative 在 Act II.1 出现）
- 删除 v1 Beat 1.2 的 14% / 86 pp / +302m 在 Act I 的 surface（这些数下放到 Act III/IV）

### 6. 三层机制链 framing

per Q5=B，「algorithmic / spatial / perceptual 三层」**移除 Act I**——v4 Act I 仅以"Attention Displacement"单概念收。三层框架将在 Act II.3 policy-engine 落地（与三类 Hack 一一对应）。

## Capabilities

### Modified Capabilities

- `case-study-content-schema` — TwinColumns 加 paragraphs 字段（最小扩展）
- `cinematic-case-study-page` — Act I 由旧 3 beat 改为 v4 单 beat 4 scene；measured Medium-style tone 落地

### New Capabilities

_None — 不需要新 R3F overlay。`agents_trajectories` / `digital_silos_heatmap` 已存在，按 v4 mapState 复用。_

## Impact

- **改动文件**：
  - `lib/cinema/scene-types.ts` — TwinColumns 类型 + countCharsZh/En 含 twinColumns paragraphs
  - `lib/content/case-study-schema.ts` — zod TwinColumns refine
  - `components/cinema/scenes/SceneBodySection.tsx` — 渲染 twinColumns paragraphs
  - `scripts/content-lint.ts` — char-cap 检查含 twinColumns paragraphs
  - `content/case-studies/synthetic-socio-wind-tunnel.mdx` — 删 3 beat / 加 1 beat
  - `docs/case-study-data-provenance.md` — Act I 表重写

- **不动**：cinema canvas / theme / camera score 顶层 / i18n / agent overlay / map state 系统 / 其他 act

- **依赖**：cinema-content-language-foundations ✓ done · cinema-map-modes ✓ done · cinema-map-overlays ✓ done · cinema-coordinate-fix ✓ done · beat-1-1-storyboard ✓ done (内容被覆盖) · beat-1-2-storyboard ✓ done (内容被删除) · case-study-script-v1 ✓ alignment frozen · **cinema-cps-body-discount ⏸ blocking**（必须先 merge：v4 长文本依赖 body-discount 公式才能保证镜头节奏）

- **风险 / trade-offs**：
  - Beat 1.2 (blindspot-reveal) 之前刚 storyboard 完，本 propose 删除——**已知 sunk cost**，v4 框架决定，可接受
  - Reddit 数据 mock + TODO，release 前需作者真爬或换公开 study
  - score range 从 act-1 占 cinema-t [0, 0.22] 收缩到 [0, ~0.10-0.12]——piecewise mapping 自动调整，但需校核 cinema-t 总分布

- **lint 期望**：
  - rhythm = `[TMTB]` (tracking / motion / tracking / bridge) — 4 scene
  - emphasis = `[linger=1, dwell=2, standard=1]` — distribution OK
  - mapState 模式 = `[matte, blueprint]`，overlay = `[digital_silos_heatmap, agents_trajectories]`
  - 无 char-cap warning（v4 文案均在 cap 内：scene-1-1 26 字 / scene-1-2 118 字双栏 / scene-1-3 133 字四段 / scene-1-4 66 字 pull-quote）

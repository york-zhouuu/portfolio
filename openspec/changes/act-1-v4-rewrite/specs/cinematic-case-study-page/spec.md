## MODIFIED Requirements

### Requirement: Act I 由 1 个 beat 4 scene 组成（v4）

`attention-boundary` act MUST 仅由单个 beat `disappearance-of-nearby` 组成。该 beat 含以下 4 条 scene（按顺序），对应作者 v4 JSON「附近的消失」：

1. `scene-1-1-paradox` — kind: title, rhythm: tracking, emphasis: linger
2. `scene-1-2-evidence` — kind: body-section (twin-column), rhythm: motion, emphasis: standard
3. `scene-1-3-attention-displacement` — kind: body-section (right-column), rhythm: tracking, emphasis: standard
4. `scene-1-4-sandbox-reveal` — kind: pull-quote (center), rhythm: bridge, emphasis: dwell

每条 scene 的具体字段值由本 propose design.md D5 定义。偏离 v4 JSON 需开新 propose。

#### Scenario: attention-boundary act 含多个 beat

- **WHEN** attention-boundary act 在 frontmatter `beats[]` 数组中含超过 1 个 beat
- **THEN** 与 case-study-script-v1 v4 alignment 不一致，需评审

#### Scenario: scene 数量错误

- **WHEN** disappearance-of-nearby beat 的 scenes 数组长度不等于 4
- **THEN** 与 v4 JSON 不一致，需评审

#### Scenario: scene 顺序错误

- **WHEN** scenes 顺序与上述 4 步不符
- **THEN** 视为偏离 v4 JSON

### Requirement: 旧 attention-boundary beat 全部移除

mdx frontmatter 中 attention-boundary act 的 `beats[]` 数组 MUST 不含以下旧 beat ID：`open-real-world`、`blindspot-reveal`、`instrument-summon`。

依据：v4 alignment Q1=A 决定 Act I = 1 beat；旧 3 beat 在叙述上被 v4 单 beat 覆盖。score 引用 / URL fragment / analytics 已 grep 验证无 external dependent code。

#### Scenario: 留下任意旧 beat ID

- **WHEN** attention-boundary act 的 beats[] 含 `open-real-world` / `blindspot-reveal` / `instrument-summon` 任一
- **THEN** 视为迁移不彻底，违反本 requirement

### Requirement: Act I 末位 camera 接 Act II.1 起点

`disappearance-of-nearby` beat 末位 scene `scene-1-4-sandbox-reveal` 的 `camera.to` MUST = `[0, 12, 12]`，作为 Act II.1 atlas-ledger 起点的 binding constraint。

后续 act-2 propose 中 atlas-ledger 第一 scene `camera.from` MUST = `[0, 12, 12]`，保 Act I → Act II zero-jump continuity。

#### Scenario: Act I 末位 camera 不等于 [0, 12, 12]

- **WHEN** scene-1-4-sandbox-reveal `camera.to` 不为 `[0, 12, 12]`
- **THEN** 破坏 Act I → Act II 接续约定，需评审

### Requirement: Act I mapState 全程显式

Act I 4 个 scene 的 `mapState` 字段 MUST 全部显式声明（不依赖 default），按 design.md D5：

| scene | mode | dim | overlay |
|---|---|---|---|
| scene-1-1-paradox | matte | 0.5 | （未设，默认 none） |
| scene-1-2-evidence | matte | 0.6 | digital_silos_heatmap |
| scene-1-3-attention-displacement | blueprint | 0.5 | agents_trajectories |
| scene-1-4-sandbox-reveal | blueprint | 0.3 | agents_trajectories |

体现"matte（现实视角）→ blueprint（沙盘 X-ray）"的视觉切换；overlay 接力 digital_silos → agents_trajectories。

#### Scenario: mapState 字段缺失

- **WHEN** Act I 中某 scene 没有写 mapState 或写错值
- **THEN** 视为偏离 v4 alignment 设计

### Requirement: Act I lint 期望状态

实施完成后 `pnpm content:lint` 输出 SHALL 包含针对 disappearance-of-nearby beat 的 info 摘要：

```
rhythm=[TMTB] emphasis=[linger=1 standard=2 dwell=1] mapState=[modes: matte,blueprint; overlays: digital_silos_heatmap,agents_trajectories]
```

- 无 char-cap warning（v4 文案 + D4 emphasis 调整后均在 cap 内）
- 无 rhythm sequence warning（TMTB 序列合规：tracking ≤ 2 / motion 1 / bridge 1 / no still 不报警）
- 仍允许 fallbackFigure missing warning（pre-existing）

#### Scenario: lint 出现 char-cap warning

- **WHEN** content-lint 在 disappearance-of-nearby beat 报 char-cap warning
- **THEN** 该段超 emphasis cap，需要拆分或下调 emphasis（违反实施意图）


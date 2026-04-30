## ADDED Requirements

### Requirement: Beat 1.1 由 v2 脚本的 5 条 scene 组成

Beat `open-real-world` (Beat 1.1) MUST 在 frontmatter 中由以下 5 条 scene（按顺序）组成，对应 `docs/references/beat-1-1-script-v2.json`：

1. `scene-1-1-thesis` — kind: title, rhythm: still, emphasis: dwell
2. `scene-1-2-data-hit` — kind: data-hit, rhythm: tracking, emphasis: dwell
3. `scene-1-3-evidence` — kind: body-section (right-column), rhythm: still, emphasis: standard
4. `scene-1-4-core-concept` — kind: pull-quote, rhythm: bridge, emphasis: linger
5. `scene-1-5-macro` — kind: body-section (right-column), rhythm: tracking, emphasis: standard

每条 scene 的具体字段值（camera / mapState / paragraphs / heading）由本 propose 的 design.md D1–D5 定义。偏离 v2 脚本需开新 propose。

#### Scenario: scene 数量错误

- **WHEN** Beat 1.1 scenes 数组长度不等于 5
- **THEN** 该 Beat 与 v2 脚本不一致，需评审是否更新 v2 reference 或 propose

#### Scenario: scene 顺序错误

- **WHEN** Beat 1.1 scenes 顺序与上述 5 步不符
- **THEN** 视为偏离 v2 脚本，需评审

### Requirement: Beat 1.1 mapState 全程显式

Beat 1.1 5 个 scene 的 `mapState` 字段 MUST 全部显式声明（不依赖 default），按 design.md D5 表：

| scene | mode | dim | overlay |
|---|---|---|---|
| scene-1-1-thesis | matte | 0.8 | （未设，默认 none） |
| scene-1-2-data-hit | matte | 0.8 | agents_trajectories |
| scene-1-3-evidence | matte | 0.5 | agents_trajectories |
| scene-1-4-core-concept | blueprint | 0.5 | （未设，默认 none） |
| scene-1-5-macro | blueprint | 0.5 | digital_silos_heatmap |

体现"matte → blueprint"的视觉切换 + agents trajectories → digital silos 的 overlay 接力。

#### Scenario: mapState 字段缺失

- **WHEN** Beat 1.1 中某 scene 没有写 mapState 或写错值
- **THEN** 视为偏离 v2 设计；视觉过渡可能不正确

### Requirement: Beat 1.1 lint 期望状态

实施完成后 `pnpm content:lint` 输出 SHALL 包含：

- 一行 info 摘要：`rhythm=[STSBT] emphasis=[standard=2 dwell=2 linger=1] mapState=[modes: matte,blueprint; overlays: agents_trajectories,digital_silos_heatmap]`
- 无 char-cap warning（v2 paragraph 字数已设计在 emphasis cap 内）
- 无 rhythm sequence warning（STSBT 序列合规：连续 still / tracking / motion 各不超上限，bridge 隔开）
- 仍然允许 fallbackFigure missing warning（独立问题）

#### Scenario: lint 出现 char-cap warning

- **WHEN** lint 在 Beat 1.1 报 char-cap warning
- **THEN** 该 paragraph 字数超 emphasis cap，需要拆分或降低 emphasis（违反本 propose 实施意图）

#### Scenario: lint 出现 rhythm sequence warning

- **WHEN** lint 在 Beat 1.1 报 rhythm sequence warning
- **THEN** 视为 v2 设计错——回头 design.md 修

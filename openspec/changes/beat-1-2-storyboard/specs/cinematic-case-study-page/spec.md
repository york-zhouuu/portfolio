## ADDED Requirements

### Requirement: Beat 1.2 由 3 条 scene 组成（紧凑版）

Beat `blindspot-reveal` (Beat 1.2) MUST 在 frontmatter 中由以下 **3 条** scene（按顺序）组成，对应 design.md D1：

1. `scene-1-2-1-data-hit` — kind: data-hit, rhythm: tracking, emphasis: dwell
2. `scene-1-2-2-mechanism` — kind: body-section (right-column), rhythm: still, emphasis: standard
3. `scene-1-2-3-lever` — kind: pull-quote, rhythm: bridge, emphasis: dwell

每条 scene 的具体字段值（camera / mapState / paragraphs / heading / number / caption / unit / text / attribution）由 design.md D1+D3 定义。偏离上述 3-scene 结构需开新 propose。

#### Scenario: scene 数量错误

- **WHEN** Beat 1.2 scenes 数组长度不等于 3
- **THEN** 该 Beat 与 design.md D1 不一致，需评审是否更新 design 或 propose

#### Scenario: scene 顺序错误

- **WHEN** Beat 1.2 scenes 顺序与上述 3 步不符
- **THEN** 视为偏离设计，需评审

### Requirement: Beat 1.2 grandfather 字段全部移除

Beat 1.2 (`blindspot-reveal`) MUST NOT 在 frontmatter 中保留 legacy 顶层字段 `title` / `lead` / `body` / `pullQuote` / `hud`。新的 beat 顶层 frontmatter 只允许保留：`id` / `claim` / `shotRef` / `fallbackFigure` / `sources` / `scenes`。

依据：grandfather 字段在迁移到 scenes[] 后只用于 sr-only / SEO fallback，cinema 渲染优先 scenes[]。同时保留两套表达会造成内容真相分裂。

#### Scenario: 留下 grandfather 字段

- **WHEN** Beat 1.2 frontmatter 含 `title` / `lead` / `body` / `pullQuote` / `hud` 中任意一个
- **THEN** 视为迁移不彻底，违反本 requirement

### Requirement: Beat 1.2 mapState 全程显式

Beat 1.2 三个 scene 的 `mapState` 字段 MUST 全部显式声明（不依赖 default），按 design.md D1 表：

| scene | mode | dim | overlay |
|---|---|---|---|
| scene-1-2-1-data-hit | blueprint | 0.6 | agents_trajectories |
| scene-1-2-2-mechanism | blueprint | 0.5 | agents_trajectories |
| scene-1-2-3-lever | matte | 0.7 | （未设，默认 none）|

体现"在 blueprint 模式下钉数字、解释机制 → 1.2.2→1.2.3 边界自动 cross-fade 至 matte，金句出场时材质已回归实物沙盘 → Beat 1.3 instrument summon 直接续接 matte，零跳变"。

#### Scenario: mapState 字段缺失

- **WHEN** Beat 1.2 中某 scene 没有写 mapState 或写错值
- **THEN** 视为偏离设计；视觉过渡可能不正确

### Requirement: Beat 1.2 camera 接 Beat 1.1 末位

Beat 1.2 第一个 scene (`scene-1-2-1-data-hit`) 的 `camera.from` MUST 等于 Beat 1.1 末位 scene (`scene-1-5-macro`) 的 `camera.to`，即 `[-4, 15, 6]`。zero-jump continuity 是 Act 1 的视觉约定。

Beat 1.2 末位 scene (`scene-1-2-3-lever`) 的 `camera.to` MUST 等于 `[0, 8, 4]`，作为 Beat 1.3 起点占位（待 Beat 1.3 storyboard 接管）。

#### Scenario: Beat 1.2 起点 camera 与 Beat 1.1 末位不一致

- **WHEN** scene-1-2-1-data-hit `camera.from` 不等于 scene-1-5-macro `camera.to`
- **THEN** 视为破坏 Act 1 zero-jump continuity 约定

### Requirement: Beat 1.2 数字与 provenance 文档一致

Beat 1.2 mdx 中出现的所有数字 / 命名值 (14% / 50 control / 7 偶遇 / 100% / 86 pp) MUST 在 `docs/case-study-data-provenance.md` § "SSWT / Beat 1.2 — Blindspot Reveal" 表中已登记。新增数字必须先登记再写入 mdx。

#### Scenario: mdx 出现未登记数字

- **WHEN** Beat 1.2 mdx 出现未在 provenance 表登记的具体数字
- **THEN** 违反"加新数字工作流"，需要补登记或删除

### Requirement: Beat 1.2 lint 期望状态

实施完成后 `pnpm content:lint` 输出 SHALL 包含针对 Beat 1.2 的 info 摘要：

```
rhythm=[TSB] emphasis=[dwell=2 standard=1] mapState=[modes: blueprint,matte; overlays: agents_trajectories]
```

- 无 char-cap warning（design.md D5：所有 zh 段 ≤ 26 字，远在 dwell/standard cap 内）
- 无 rhythm sequence warning（TSB 序列合规：连续 still ≤ 1 / motion 0 / tracking ≤ 1，bridge 隔开）
- 仍允许 fallbackFigure missing warning（pre-existing）
- emphasis distribution warning (dwell 67%) 视为已知 trade-off（design.md D5 已 self-evaluate）

#### Scenario: lint 出现 char-cap warning

- **WHEN** lint 在 Beat 1.2 报 char-cap warning
- **THEN** 该段字数超 emphasis cap，需要拆分或降低 emphasis（违反实施意图）

#### Scenario: lint 出现 rhythm sequence warning

- **WHEN** lint 在 Beat 1.2 报 rhythm sequence warning
- **THEN** 视为 design 错——回头 design.md D1 修

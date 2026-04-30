## Why

形式骨架已就位（cinema、HUD、storyboard、双语、设计语言），但内容层是占位文本。作者明确指出：之前我交付的 Beat 1.1 散文"远未到内容这两个字"——任何写注意力议题的人都能写那段文字，里面没有「作者标记」（哪些决策做了、什么被拒绝、用什么物件证伪）。

需要一份专门用于**内容创作**的 change：不是架构活，是**把 SSWT 这个项目里真实存在的决策与物件转译为可读取的案例研究**。工作单元从"全篇 800 字 × 10 beat"改为**单个 beat**——一个 beat 一个 beat 想，一个 beat 一个 beat 通过。

## What Changes

- **锁定单一工作单元**：每次只交付一个 beat 的完整态。先 Act 1（3 beat）→ Act 2（4 beat）→ Act 3（3 beat）。不再一次性写完整篇。
- **替换内容模型**：每个 beat 不再是"800 字散文"，而是固定五件套——
  - **Job**（这一 beat 在论证里负责什么）
  - **Decision**（这一段项目里实际做出的决策）
  - **Artifact**（一个具体物件：数字、引用、代码片段、架构图、来自源仓库的截图）
  - **Voice**（这一 beat 的语气位）
  - **Connector body**（200–350 字短散文 + pullQuote，把上面四件串起来）
- **删除现存的"演示用" Beat 1.1 散文**，按新模板重写。
- **建立审稿循环**：每个 beat 的工作 = 草稿 → 作者评审 → 修订 → 锁定。在该 beat 锁定前不开下一个。
- **可能扩展 schema**：若过程中发现需要 `artifacts: ArtifactRef[]`（嵌入图/代码/数据卡）或 `decisions: DecisionEntry[]`，按需 propose 增量；本次先不预扩。
- **不动**：cinema、camera score、design language v1、frontmatter 现有结构、双语机制。这次完全是内容侧。

## Capabilities

### New Capabilities

- `case-study-content-authoring`：内容创作的工作流与每 beat 内容模板。规定单元工作流（草稿 → 评审 → 修订 → 锁定）、Job/Decision/Artifact/Voice/Body 五件套结构、按 Act 顺序推进的次序，以及 lint-level 的"内容已锁定"标记机制。

### Modified Capabilities

_None — 现有 `case-study-content-schema` 不需要破坏性修改；本次只规约内容用法，不动字段定义。_

## Impact

- **写作工作量**：10 个 beat × ~30–60 分钟取材 + 草稿 + 评审/迭代 ≈ 7–10 小时跨多轮。
- **改动文件**：仅 `content/case-studies/synthetic-socio-wind-tunnel.mdx`（每 beat 的 `body` / `pullQuote` 与每 act 的 `epigraph` / `references`）。
- **不改动**：cinema 渲染、camera score、HUD 组件、设计 token、i18n 机制、storyboard 布局（已支持新字段）。
- **不交付的**：Act 1 之后的 beat 在本次先不写——新的 propose 完成 Act 1 后再决定继续推进或调整。
- **作者输入需求**：每个 beat 的草稿前我会从源项目（`/Users/york_z/Desktop/IDEA地图-agent模拟/Synthetic_Socio_Wind_Tunnel/`）读取真材实料，但**关于哪个决策值得突出、哪个物件最能代表这一段、哪一句是你想说的**——这些需要你看到草稿后给方向。

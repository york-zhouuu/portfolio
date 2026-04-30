## Why

之前架构把 cinema 想成"沙盘 + 极简 HUD"，content 想成"sidebar 文字"——结果 Beat 1.1 的 4 节 body 装不进 HUD、又不愿意降级为 sidebar 文字滚动。这反映了一件被回避的事：

**作品的核心论点是"一镜到底 = 内容跟随镜头娓娓道来"。**

不是相机演相机的、文字演文字的、然后用 sidebar 把两者并置。是**内容反推镜头位置 / 文字排版 / 进退场 / 交互节奏**——cinema 是讲故事用的镜头，文字是讲到那里时浮出来的旁白。

意味着：
- **不存在"通用 layout 模式"**——每段内容自己设计自己的 scene
- **storyboard 路由删除**——整个 web 就是这一镜
- **scene 是设计的原子单位**——每个 scene 由 6 个维度共同定义（camera / text-form / transition / interaction / duration / junction）

需要一份框架文档把"per-scene 设计"编码成可重复的工作流，避免每次都重新发明。然后用 Beat 1.1 当样本一次性推完，作者过完再批量推到其它 beat。

## What Changes

- **删除 storyboard 路由**（已执行：`/work/[slug]/storyboard/` + 所有相关引用）。
- **整个 web 只有 cinema 一种渲染**——一镜到底，相机带着内容走。
- **建立 per-scene 设计框架**（design.md 第 2 节）：每个 scene 用 6 个维度表述：
  1. Camera（位置 / 推拉 / 节奏）
  2. Text-form（字号 / 排版 / 整段还是分句）
  3. Transition（淡入 / 滑入 / 拍击）
  4. Interaction（只滚动 / 点击 / hover）
  5. Duration（scroll 预算）
  6. Junction（与前后 scene 的交接）
- **应用框架推完 Beat 1.1 的 7 个 scene**（design.md 第 3 节，作为模板示范 + 立即可用的推荐）。
- **重写 frontmatter schema 以承载 scene 列表**（推迟到实施 propose；本次只列要求）：每个 beat 的 body 不再是单一 markdown 串，而是 `scenes: Scene[]`，每条 scene 含 6 个字段。
- **重新构造 camera score**：不再 1 beat × 1 shot，改为 1 beat × N scenes × N camera waypoint。具体怎么改在实施 propose 里。
- **本次 propose 不写代码**——只产出框架 + Beat 1.1 推荐。作者过完后开实施 propose。

## Capabilities

### Modified Capabilities

- `cinematic-case-study-page`（在 `sswt-cinematic-case-study` 下定义）——本次将该 capability 重新定义为 **scene-driven cinema**：每个 beat 由若干 scene 组成，scene 是 camera + text + transition 的原子单位。
- `case-study-content-schema`——`body: I18nString` 将拆为 `scenes: Scene[]`；`title` / `lead` / `pullQuote` 也成为 scene 的 kind。

### New Capabilities

_None — 不新增能力，只是把 per-scene 设计明确化。_

## Impact

- **Storyboard 路由**：已删除（无 fallback；web 只有 cinema）
- **HUD 概念**：消解为 scene 内部的 text-form 选项之一（letterbox / cue-card 这些不再单独存在为 hud kinds）
- **Camera score**：从 10 shot 重构为 ~40-60 scene waypoints
- **Frontmatter schema**：body 字段重构为 scenes 数组
- **后续 9 beat**：每个都要用本框架走一遍 scene 设计 → 工程量大，但质量上限也高
- **不影响**：sand table 渲染、设计 token、i18n 机制、内容文字本身（文字内容不改，只改如何被切片成 scene 与渲染）

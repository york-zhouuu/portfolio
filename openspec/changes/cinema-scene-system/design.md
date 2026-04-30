## Context

承 `cinema-content-integration` propose 的设计决定，本文档把"scene 是最小单元 + 6 维度框架"落到代码层。

设计准绳：
- **scene-driven**：camera 不再 beat-level 一刀；scene 各自有 camera 段
- **content-first**：内容形态决定 layout 与 transition；layout 不是装饰
- **留白入框**：Breath scene 是合法 kind——纯相机移动、零文字
- **schema 是 scene 列表**：旧的 title / lead / body / pullQuote 折叠为 scene

## Decisions

### D1 — Scene 类型设计

```ts
type SceneKind = "title" | "lead" | "body-section" | "pull-quote" | "breath"
type LayoutKind = "centered" | "right-column" | "twin-column" | "pull-quote-large" | "breath"
type TransitionKind = "fade" | "slide-up" | "slide-side" | "scale-in" | "none"
type DurationKind = "short" | "mid" | "long"   // ~50 / 100 / 140 svh

type Vec3 = readonly [number, number, number]

type SceneCamera = {
  from: Vec3
  to: Vec3       // from === to ⇒ 相机持守
  lookAt: Vec3
}

interface BaseScene {
  id: string
  camera: SceneCamera
  enter: TransitionKind  // 进场（默认 fade）
  exit: TransitionKind   // 退场（默认 fade）
  duration: DurationKind
}

type Scene =
  | (BaseScene & { kind: "title"; text: I18nString; subtitle?: I18nString })
  | (BaseScene & { kind: "lead"; text: I18nString })
  | (BaseScene & {
      kind: "body-section"
      sectionNumber?: string         // "01"
      heading: I18nString
      paragraphs: I18nString[]
      kvList?: KvItem[]
      twinColumns?: { left: KvItem[]; right: KvItem[] }
      layout: "right-column" | "twin-column"
    })
  | (BaseScene & { kind: "pull-quote"; text: I18nString; subtitle?: I18nString })
  | (BaseScene & { kind: "breath" })  // 留白：纯相机段，无文字

type KvItem = { key: I18nString; value: I18nString }
```

### D2 — Camera 串接模型

Beat 内 scene 的 `camera.from` 必须等于上一个 scene 的 `camera.to`（content-lint 校验）。这保证一镜到底物理连续。

每条 scene 的 scroll 范围 = (它的 duration) / (该 beat 内总 duration)，再乘以 beat range。

例：Beat 1.1 范围 [0, 0.10]，7 个 scene 的 duration 是 (50, 80, 120, 140, 120, 140, 70) svh，总和 720svh。Scene 1.1.0 占 50/720 = 6.9% × 0.10 = 0.0069 → 范围 [0, 0.0069]。

实现：`scrollCinema.ts` 加 `sceneAt(t)`，给定全局 t 返回当前 scene + localT。`CameraRig.tsx` 改读 scene-level camera。

### D3 — Layout primitive 渲染契约

每个 layout 是一个 React component，接收：

```ts
type ScenePresentationProps = {
  scene: Scene
  localT: number          // 0..1 within this scene
  enterProgress: number   // 0..1 — derived from localT and enter shape
  exitProgress: number    // 0..1 — derived from localT and exit shape
}
```

Component 自己决定如何用 enter/exit progress 驱动 opacity / translate / scale。

5 个 primitive：

```
SceneTitle          centered. display 字号. fade-up 标准
                    text 必填，subtitle 可选

SceneLead           centered. subhead 字号. fade-up 标准
                    text 必填

SceneBodySection    right-column 或 twin-column
                    sectionNumber + heading + paragraphs + (kvList | twinColumns)
                    KV 用 stagger 进场（每项延迟 0.1s）

ScenePullQuote      centered. display+ italic. scale-in 标准
                    text 必填，subtitle 可选

SceneBreath         无 DOM，仅 scroll spacer
                    duration 用于 "纯相机段" 的 scroll 预算
```

### D4 — Transition 实现

`enterProgress` / `exitProgress` 算法：

```
Scene 内 localT ∈ [0, 1]:
  enterProgress = clamp(localT / 0.18)        // 前 18% 用于进入
  exitProgress  = clamp((1 - localT) / 0.18)  // 末 18% 用于退出
  
Component 把 transition kind 映射成 CSS:
  fade        opacity = enterProgress * exitProgress
  slide-up    transform = translateY((1 - enterProgress) * 30px), opacity = enterProgress * exitProgress
  slide-side  transform = translateX((1 - enterProgress) * 40px), 同上
  scale-in    transform = scale(0.95 + enterProgress * 0.05), 同上
  none        opacity = 1（仅 breath 用）
```

中间 64% (0.18 ~ 0.82) 是 "稳定 dwell" 期——文字完全可见、可读、可选中。

### D5 — Beat 1.1 重写为 scenes[]

按 `cinema-content-integration` design.md D3 的推荐。完整 7 scene：

| # | id | kind | camera 段 | layout | duration |
|---|---|---|---|---|---|
| 0 | title | title | hold @ [0,0,9.5] | centered | short |
| 1 | lead | lead | [0,0,9.5] → [0,0,9] | centered | mid |
| 2 | section-01 | body-section | [0,0,9] → [0,0,7.5] | right-column | mid |
| 3 | section-02 | body-section | [0,0,7.5] → [0,0,6] | right-column | long |
| 4 | section-03 | body-section | [0,0,6] → [0,0,5] | right-column | mid |
| 5 | section-04 | body-section | hold @ [0,0,5] | twin-column | long |
| 6 | pull-quote | pull-quote | hold @ [0,0,5] | pull-quote-large | short |

无 breath scene 在 Beat 1.1（因为 7 个 scene 已经够节奏）。breath 留给 Beat 1.1 → 1.2 之间的 lift 动作（Beat 1.2 第一个 scene 可以是 breath kind，纯 lift 动画无文字）。

### D6 — HudLayer 退化

旧 hud kinds 退场：
- `letterbox`     → 变成 `SceneTitle` / `ScenePullQuote` 的 layout subtype
- `cue-card`      → 由 `SceneBodySection` (right-column) 完整替代
- `hud-panel`     → 同上
- `in-world-label` → **保留**，作为相机锚定的 3D-billboard 文字（与 scroll-driven scene 不冲突）

`HudLayer.tsx` 退化为只渲染 in-world-label。其它命名（letterbox / cue-card / hud-panel）从 schema 与代码中删除。

### D7 — 旧字段退场策略

Beat schema 原有字段：
- `title?: I18nString`
- `lead?: I18nString`
- `body?: I18nString`
- `pullQuote?: I18nString`
- `hud: Hud` (required)
- `claim: I18nString` (required)
- `fallbackFigure: string` (required)

本次：
- 加 `scenes?: Scene[]`（optional 暂时——其它 beat 还没迁）
- `claim` 保留作为 sr-only / metadata 用（screen-reader 朗读、SEO）
- `hud` 改为 `optional`，最终删除（先不阻塞）
- `title / lead / body / pullQuote` 标 deprecated 注释
- `fallbackFigure` 保留——pre-render OG 图与 reduced-motion css 退化用

content-lint 规则：每个 beat 必须有 `scenes` 字段；如果同时有旧字段，警告 (旧字段被忽略)。

## Risks / Trade-offs

- **[scenes[] 写起来繁琐]** → MDX YAML 嵌套深。**Mitigation**：Beat 1.1 写完后**仔细对比 LOC**。如果太冗长，考虑加一个 `scene-builder.ts` 让作者用更紧凑的 DSL 在 TypeScript 里写然后导出 JSON。
- **[scene 切换瞬间不平滑]** → 18% enter / 64% dwell / 18% exit 之间，相邻 scene 的 enter 跟前 scene 的 exit 重叠 36%——同时一进一出。**Mitigation**：先让两个 transition 共存（叠加渲染），visual 调一下。
- **[scenes camera 串接错误（from ≠ 上一 to）]** → 相机会 jitter。**Mitigation**：content-lint 严格校验邻接 scene 的 camera 续接。
- **[breath scene 和文字 scene 混排时 user 困惑]** → 滚到 breath 时屏幕全空。**Mitigation**：breath duration 不超过 short (~50svh)，且只在 beat 间转场使用。

## Open Questions（不阻塞实施）

- Layout 5 种够吗？后续如果加 sand-table-overlay（文字直接锚定 3D 物体）、data-counter-large（大数字 counter）、glossary-tooltip 等，作为新 layout primitive 增量加。
- Twin-column 在 mobile 怎么退化？默认改为竖排两块（先这样，后续 PoC 体验后再调）。

## 决议（作者确认）

- **Cross-scene cross-fade 通过**：相邻 scene 在交接 36% 期间同时存在 DOM、双向 transition 共存——硬切被拒绝。
- **Camera 续接容差 0.05 世界单位**：不再 0.001 严格；scene 间 camera.from / 上 scene 的 camera.to 差值在 ±0.05 内合法。
- **Per-beat propose 工作流**：每个 beat 单独开一份 propose 走完该 beat 全部 scene 的逐条设计 → 实施 → 作者确认。本 propose 是"框架与基础设施"层；具体每个 beat 走自己的 propose（如 `beat-1-1-storyboard`）。
- **本 propose 的 PoC 实施暂停**：`tasks.md` 的 task 2 (Beat 1.1 frontmatter 迁移)、task 3 (SceneLayer 渲染)、task 4 (camera 协调)、task 5 (page 接入) MUST 等 `beat-1-1-storyboard` propose 拍板后再启动——避免类型 / 渲染契约还没冻结就先写代码。

## ADDED Requirements

### Requirement: Scene 是 frontmatter 的最小内容单元

每个 beat 的 frontmatter SHALL 用 `scenes: Scene[]` 表达内容；不再有"single body markdown"。每个 scene MUST 是 `{ id, kind, camera, enter, exit, duration, ...content fields }` 的完整对象。

#### Scenario: Beat 没有 scenes

- **WHEN** 某 beat 既没有 `scenes` 又没有旧字段（title / lead / body / pullQuote）
- **THEN** content-lint 报错并阻断 build

#### Scenario: Beat 同时有 scenes + 旧字段

- **WHEN** 某 beat 同时有 `scenes` 和旧字段（migration 期）
- **THEN** content-lint 警告 "scenes 优先，旧字段被忽略"，build 不阻断

### Requirement: 5 种 Scene kind 限制

Scene 的 `kind` MUST 取自 `"title" | "lead" | "body-section" | "pull-quote" | "breath"`。其它值 SHALL 触发 lint error。

#### Scenario: 未知 scene kind

- **WHEN** scene `kind: "epigraph"`（不在 5 种内）
- **THEN** Zod schema rejection + content-lint 报错

### Requirement: Scene 之间相机续接

同一 beat 内相邻 scene 的 `camera.from` MUST 等于上一 scene 的 `camera.to`（容差 < 0.001 世界单位）。

#### Scenario: Scene camera 不连续

- **WHEN** Scene N 的 camera.to = [0,0,5]，Scene N+1 的 camera.from = [0,0,9]
- **THEN** content-lint 报错指出哪两个 scene 的 camera 没续接

#### Scenario: Beat 之间 camera 不必续接

- **WHEN** Beat 1 末 scene camera.to ≠ Beat 2 首 scene camera.from
- **THEN** 不报错（beat 间用相机 lift / cut 是合法的；续接只在 beat 内部强制）

### Requirement: 5 种 Layout primitive

渲染层 SHALL 提供 5 个 layout primitive：`SceneTitle` / `SceneLead` / `SceneBodySection` / `ScenePullQuote` / `SceneBreath`。每个 primitive 接收 `{ scene, localT, enterProgress, exitProgress }` 并自决 DOM。

#### Scenario: 未注册的 layout

- **WHEN** scene kind 不在上述 5 种内
- **THEN** SceneLayer 渲染 null + console.error；不应让 build 失败

### Requirement: Transition primitive

每条 scene MUST 声明 `enter` 和 `exit`，取自 `"fade" | "slide-up" | "slide-side" | "scale-in" | "none"`。enterProgress / exitProgress 由 SceneLayer 从 localT 计算。

#### Scenario: enter 与 exit 期间叠加渲染

- **WHEN** Scene N 处于 exit 期（exitProgress < 1），Scene N+1 处于 enter 期（enterProgress > 0）
- **THEN** 两个 scene 同时存在于 DOM；都按各自 transition 算 opacity / transform；视觉上 cross-fade

### Requirement: 留白 (breath) scene

`kind: "breath"` 的 scene MUST：
- 不携带任何 text 字段
- 占用一段 scroll budget（用于纯相机移动）
- 渲染时 SceneLayer 输出 null

#### Scenario: Breath scene 之 scroll

- **WHEN** 用户滚动到 breath scene 区间
- **THEN** 屏幕只有 sand table 显形（无文字 overlay），相机按 scene.camera.from → to 移动

### Requirement: HudLayer 退化为 in-world-label only

`HudLayer.tsx` MUST 不再渲染 letterbox / cue-card / hud-panel；只渲染 in-world-label（3D 锚定文字）。letterbox / cue-card / hud-panel 这三种 hud kind 从 schema 移除（migration 期保留为 deprecated）。

#### Scenario: 旧 frontmatter 含 hud.kind = "letterbox"

- **WHEN** Migration 期间某 beat 仍有 `hud: { kind: "letterbox", ... }`
- **THEN** content-lint 提示 "letterbox is deprecated; use SceneTitle/ScenePullQuote layout instead"，但不阻断

## MODIFIED Requirements

### Requirement: 三幕脊柱结构

案例研究页面 SHALL 由且仅由三幕组成；每幕由若干 beat 组成；每个 beat 由若干 scene 组成。Scene 是页面最小可设计单元。

#### Scenario: 路由首屏加载

- **WHEN** 用户首次访问 `/work/synthetic-socio-wind-tunnel`
- **THEN** 页面在 viewport 内呈现 Beat 1.1 的第一个 scene（Scene 1.1.0 Title）+ 沙盘的初始相机状态

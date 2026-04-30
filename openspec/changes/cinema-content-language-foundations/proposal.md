## Why

`cinema-scroll-pacing` 把 rhythm / emphasis / sticky-text / piecewise scroll 装上了。但 Beat 1.1 v2 设计稿（`docs/references/beat-1-1-script-v2.json`）暴露了**真正"内容跟随镜头与地图"还缺的四块地基**：

1. **mapState** — 沙盘不该是单一渲染。每个 scene 应能指定材质模式 / 亮度 / overlay。当前只有"matte / 永远渲染"。
2. **Overlay 接口** — agents trajectories / digital silos heatmap 这类"按内容点亮"的视觉元素需要一个可插拔系统。每个 overlay 一个独立 component，由 mapState 激活。
3. **Tracking rhythm** — 第 4 种节奏类型（相机缓动 + 文字阅读）。当前 motion / still / bridge 三种里，"motion + 长文"被 lint 禁止，但 v2 脚本里 scene 1.2 / 1.5 都需要这种"tracking shot with voiceover"语法。
4. **Progressive reveal + data-hit** — 让 body-section 内多 paragraph 错峰浮现（解决 linger 不该装长文的语义错配），加 data-hit 新 kind 给单数字爆点场景。

这一份 propose **只做接口与抽象，不做具体材质 / 具体 overlay**——那是后续两个 propose 的事。本 propose 让"插拔点都有了"，让 Beat 1.1 之后的内容设计能真的把"镜头 + 地图 + 文字"作为同一节奏流统一编排。

## What Changes

- **新增 scene field `mapState?`** — 包含 `mode / dim / overlay / highlight` 四个可选子字段；schema + Zod default。
- **新增 `useResolvedMapState(t)` resolver** — 跨 scene 平滑插值 dim（lerp）/ mode（cross-fade flag）/ overlay（淡入淡出 progress），输出当前帧的合成 mapState。**资源型不依赖具体渲染**——纯数据流。
- **新增 `<MapOverlay name={...} progress={...}/>` 接口** — 可插拔接口，未注册的 name 视为 no-op；本 propose 内**不**注册任何具体 overlay。
- **新增 `<SandTableMaterials mode={...}/>` 接口** — 材质切换接口，仅 `matte` 已注册（沿用当前实现）。`blueprint` 等留给后续 propose。
- **新增 RhythmKind `"tracking"`** — 第 4 种节奏。CameraRig 走线性 from→to（半速 dwellEase），文字 sticky + 用 still 的 CPS dwell + 10/80/10 fade band。
- **新增 SceneKind `"data-hit"`** — 大数字 + 一行 caption + 可选 paragraphs；右下角小字风格的"实验仪表"感。
- **改动 body-section 渲染：Progressive Reveal** — paragraphs 数组按 sceneLocalT 平均切片，每段独立 enter/hold/exit。每段独立计 svh，scene 总 svh = sum。
- **改动 char-cap lint** — 上限从 per-scene 改为 **per-paragraph**（同 emphasis 的 cap 不变：30/42/54/72）。
- **改动 emphasis svh 公式** — `computeStillSvh` / `computeBodySectionSvh` 处理多 paragraph：每段独立计 dwell，加和。
- **改动节奏交替规则** — 加规则：连续 `tracking` MUST ≤ 1。
- **保留**：sticky-text 架构、reduced-motion 兜底、free scroll 不变。

## Capabilities

### Modified Capabilities

- `case-study-content-schema`（在 `cinema-content-integration` 下定义）—— 新增 mapState / data-hit kind / tracking rhythm / progressive reveal 多 paragraph 处理 / per-paragraph char-cap。
- `cinematic-case-study-page`（在 `sswt-cinematic-case-study` 下定义）—— 渲染层增加 mapState 解析 / overlay 接口 / 材质切换接口 / data-hit 渲染 / body-section 多段错峰。

### New Capabilities

_None — 全部为既有 capability 的扩展。新 SceneKind 和新 Rhythm 都属于现有 scene-system / rhythm-system 的扩展点。_

## Impact

- **Schema 字段**：scene 加 `mapState?` 与新 kind `data-hit`。Zod 默认值 / refine 更新。
- **Renderer**：`<SceneAnchor>` 内 plug 新组件。`<SandTable>` 接受 `mode` prop。整个 cinema canvas 接受 mapState 输出。
- **CameraRig**：tracking 分支（已有 still / motion / bridge → 加 tracking）。
- **Lint**：char-cap per-paragraph + 节奏序列规则更新 + emphasis 分布检查不变。
- **MDX 现状**：Beat 1.1 当前 7 scene 不需要立即改——保留旧形态，等 `beat-1-1-storyboard` 再迁移到 v2 脚本。本 propose 不强制 MDX 重写。
- **依赖关系**：本 propose **必须先于** `cinema-map-modes` / `cinema-map-overlays` / `beat-1-1-storyboard`。
- **不影响**：cinema-scroll-pacing 的其他决策（CPS / sticky / piecewise scroll / 屏息漂移）保留。
- **风险**：mapState 字段一旦上线，所有作者就开始用。本 propose 的 stub 实现必须能容纳"未注册的 mode / overlay 安全降级 = no-op"——不能让后续 propose 上线前 build 都挂掉。

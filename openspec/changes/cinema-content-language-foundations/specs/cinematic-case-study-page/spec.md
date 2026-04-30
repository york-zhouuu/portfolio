## ADDED Requirements

### Requirement: useResolvedMapState 跨 scene 平滑插值

页面 SHALL 提供 hook `useResolvedMapState(score, acts)` 返回当前帧合成 mapState：

```ts
{
  mode: MapMode;
  modePrev: MapMode | null;     // 仅在 cross-fade 中非空
  modeFade: number;             // 0..1，prev → mode 进度
  dim: number;                  // lerp 平滑值
  overlay: MapOverlayName;
  overlayProgress: number;      // 0..1，淡入淡出进度
  highlight: string[];
}
```

跨 scene 的字段插值规则：
- `dim`：线性 lerp 至下个 scene（沿 score-t 进度）
- `mode`：相邻 scene mode 不同时，触发 200ms cross-fade 区间，区间内 modePrev 与 mode 同时挂材质，opacity 互补
- `overlay`：进入/退出独立淡入/淡出（同 sceneTransitionProgress 10/80/10）

#### Scenario: 两 scene dim 不同

- **WHEN** scene A `dim: 0.8`，紧邻 scene B `dim: 0.5`
- **THEN** 跨边界时 dim 从 0.8 lerp 到 0.5，不允许瞬时跳变

#### Scenario: scene 之间 mode 切换

- **WHEN** scene A `mode: "matte"`，scene B `mode: "blueprint"`
- **THEN** 在 scene A 末尾 / scene B 开头 200ms 内 cross-fade（matte opacity 1→0，blueprint opacity 0→1）

### Requirement: MapOverlay 注册表与无名 fallback

`<MapOverlay name={...} progress={...}/>` SHALL 通过注册表（`OVERLAY_REGISTRY: Record<string, FC>`）查表渲染：

- 注册的 name → 该 overlay 的 component 渲染
- 未注册 name → fallback 到 `none`（render null）
- 本 propose 内**仅注册**：`none`
- 后续 propose 注册具体 overlay（agents_trajectories / digital_silos_heatmap / 等）

#### Scenario: scene 写未注册 overlay

- **WHEN** scene `mapState.overlay = "watercolor_layer"` 但 OVERLAY_REGISTRY 没有 watercolor_layer
- **THEN** 运行时 render null（不报错），content-lint 输出 warning

#### Scenario: overlay progress

- **WHEN** scene 进入时 sceneLocalT 进入 enter 区间
- **THEN** MapOverlay 收到 `progress` 0→1，组件按 progress 实现自己的淡入

### Requirement: SandTableMaterials 注册表与材质 cross-fade

`<SandTableMaterials mode={...}/>` SHALL 通过注册表查表选材质：

- 本 propose 注册：`matte`（沿用现有实现）
- 未注册 mode → fallback `matte`
- 不同 mode 切换时，SandTable 同时挂两套材质，opacity 由 modeFade（来自 useResolvedMapState）控制

#### Scenario: mode "matte" → "blueprint"

- **WHEN** mode 从 matte 切到 blueprint，但 blueprint 未在本 propose 注册
- **THEN** fallback 仍 matte，content-lint warning（"unknown mode 'blueprint', fallback to matte"）

#### Scenario: 注册新 mode

- **WHEN** 后续 propose 在 MATERIAL_REGISTRY 加 blueprint factory
- **THEN** 现有 SandTable 不需改动；切到 blueprint 自动 cross-fade

### Requirement: Tracking rhythm 渲染（CameraRig + fade band）

CameraRig SHALL 在检测到 `scene.rhythm === "tracking"` 时执行如下逻辑：

- 相机位置 = `lerp(cam.from, cam.to, sceneLocalT)`（**linear**，不调 dwellEase）
- 不应用屏息漂移
- spring 仍可用，平滑入/出 scene 边界

`sceneTransitionProgress(sceneLocalT, "tracking")` 与 still 等价：10% / 80% / 10% 三段。文字 hold 段 opacity 严格 = 1。

#### Scenario: tracking scene 内相机匀速移动

- **WHEN** tracking scene 中用户均速滚动
- **THEN** 相机 world position 应在 sceneLocalT [0, 1] 内线性从 from 走到 to；不允许 dwellEase 的"快-慢-快"曲线

#### Scenario: tracking scene 文字 hold 段不透明

- **WHEN** 用户停在 tracking scene 的中间 80% 区间
- **THEN** 文字 opacity = 1（严格）；camera 仍在缓慢移动（背景 vs 文字解耦）

### Requirement: Data-hit 渲染

页面 SHALL 提供 `<SceneDataHit>` 渲染 data-hit kind：

- 大字号居中显示 `number`（视觉感为 80–120px，仪表读数风格）
- 下方 caption 居中或左对齐，caption 字号 / mono 字体 / 不透明度 0.7
- 如果有 paragraphs，下方按 progressive reveal 展开（每段错峰 fade）

视觉风格继承 Studio Lamp 设计 token（warm light / cream foreground）。

#### Scenario: data-hit 仅 number + caption

- **WHEN** data-hit scene 没 paragraphs
- **THEN** 只渲染 number + caption，scene total svh = single paragraph svh（caption 算 1 段）

#### Scenario: data-hit 多 paragraph

- **WHEN** data-hit scene 有 3 个 paragraph
- **THEN** 走 progressive reveal，scene total svh = caption + Σ paragraphs svh

### Requirement: Progressive reveal in body-section

`<SceneBodySection>` SHALL 按 sceneLocalT 把 paragraphs 数组**等分切片**，每段在自己的 slice 内独立 enter/hold/exit（10/80/10）：

```
paragraph i ∈ [0, N) 的 slice = [i/N, (i+1)/N]
slice-local t = (sceneLocalT − i/N) / (1/N)
paragraph_opacity = stillTransitionProgress(slice-local t).hold
```

slice 之间默认无 overlap（前一段完全 fade out 后下一段才 fade in）。

#### Scenario: body-section 单 paragraph

- **WHEN** body-section 只有 1 个 paragraph
- **THEN** N=1，slice = [0, 1]，行为与 cinema-scroll-pacing 之前完全等价

#### Scenario: body-section 3 paragraph

- **WHEN** body-section 有 3 个 paragraph
- **THEN** 段 1 在 sceneLocalT [0, 1/3] 内 fade in/hold/out；段 2 在 [1/3, 2/3] 内；段 3 在 [2/3, 1] 内

#### Scenario: 滚动到段间空隙

- **WHEN** sceneLocalT 正好在 1/3（段 1 出 / 段 2 入边界）
- **THEN** 视觉上一段已 fade out 到 0，下一段刚开始 fade in（opacity ≈ 0）；用户感受到清晰的"换段"

### Requirement: Body-section svh = Σ paragraph svh

`computeBodySectionSvh(scene)` SHALL 返回 paragraphs 数组每段 svh 之和（含 caption 如果是 data-hit），不再走单 paragraph 的旧公式。多 paragraph scene 的总滚动预算 = 每段独立 dwell 加和。

#### Scenario: 多段 svh 累加

- **WHEN** body-section 3 paragraph，各 30/40/20 字，emphasis=standard
- **THEN** scene svh = secondsToSvh(30/9+0.5) + secondsToSvh(40/9+0.5) + secondsToSvh(20/9+0.5) ≈ 1140svh

### Requirement: Beat 1.1 grandfather 兼容

本 propose 实施 MUST NOT 修改 `content/case-studies/synthetic-socio-wind-tunnel.mdx` 里 Beat 1.1 现有 7 scene 的任何内容；这些 scene MUST 继续 build 成功 + 视觉无变化。

理由：Beat 1.1 内容重写交给独立的 `beat-1-1-storyboard` propose；本 propose 只装好工具。

#### Scenario: 现有 MDX build 通过

- **WHEN** 实施本 propose 后，跑 `pnpm typecheck && pnpm content:lint && pnpm build`
- **THEN** 全绿（content-lint 仍可有 warnings，但无 errors）；浏览器视觉与本 propose 之前一致

## MODIFIED Requirements

### Requirement: 6 维度 per-scene 设计框架

每个 scene 的设计 SHALL 通过回答 7 个标准问题确立，外加 mapState 作为可选的第 8 维设计扩展（由 `cinema-content-language-foundations` 引入）：

1. **Camera** — 该 scene 期间相机做什么（位置 / 推拉 / 节奏）；若 rhythm = still，from === to；若 rhythm = tracking，from ≠ to
2. **Text-form** — 文字以什么形式出现（位置 / 字号 / 整段还是分句）
3. **Transition** — 文字怎么进退场（淡入 / 滑入 / 拍击 / 等）
4. **Interaction** — 用户能做什么（默认只滚动）
5. **Duration** — scroll 预算，由 `emphasis` 字段（CPS 4 档）+ paragraphs 数组反推；多段时 = Σ per-paragraph svh
6. **Junction** — 与前后 scene 的交接关系（包括 mapState 跨 scene 插值）
7. **Rhythm** — `motion / still / tracking / bridge`，决定该 scene 滚动节奏类型
8. **MapState** *(optional, this propose)* — `mode / dim / overlay / highlight`，决定地图本体怎么"配合"内容

未回答 7 题的 scene MUST NOT 进入实施。MapState 不填默认 matte / dim=1 / no overlay。Requirement 名称保留为 "6 维度" 以维持 spec 历史可追溯。

#### Scenario: 实施时跳过框架

- **WHEN** 实施 propose 试图实现某 scene 但 design.md 里该 scene 缺 7 维度中任意一项
- **THEN** 该 scene 实施 SHALL 被退回，要求先补齐设计

#### Scenario: tracking 但 from === to

- **WHEN** scene `rhythm: tracking` 但 `camera.from === camera.to`
- **THEN** Zod refine 报错（tracking 必须有 visible motion）

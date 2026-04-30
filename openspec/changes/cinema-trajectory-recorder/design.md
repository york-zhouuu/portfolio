## Context

### 输入

- `lib/cinema/score.sswt.ts` / mdx scene structure —— 输出格式必须与 mdx scene schema 一致才能直接粘
- `@react-three/drei` 10.7.7 已安装 —— 用 OrbitControls 实现自由飞行
- `lib/cinema/scene-types.ts` —— `SceneCamera`, `MapState`, `EmphasisKind`, `RhythmKind`
- `components/cinema/SandTable.tsx` / overlays —— 复用真实 3D 场景

### 不再讨论的事

- mdx schema 不变（dev 工具仅生成符合 schema 的 YAML 片段）
- runtime CameraRig 逻辑不变（dev 工具完全独立路径）
- score.sswt.ts 不变

## Goals / Non-Goals

**Goals**:
- `/dev/trajectory` 路由独立工作，复用真实 cinema 资产
- OrbitControls 风格自由飞行（左键 orbit / 右键 pan / 滚轮 dolly / WASD optional）
- 实时显示当前 `position / lookAt` 数值（小窗 readout）
- 录 / 编辑 / 删除 / 重排 waypoints
- mapState mode / dim / overlay 实时切换（影响 SandTable 渲染）
- per-waypoint duration（输入框）
- 6 个预设模板（一键填入起始 waypoints）
- 导出 YAML 片段到 clipboard（与 mdx scene[] 兼容）

**Non-Goals**:
- ❌ 不做 spline 插值预览（v1 仅 linear lerp，后续可加）
- ❌ 不自动推断 narrative kind（title / lead / body-section …）—— 作者在 mdx 里自己填
- ❌ 不持久化（页面刷新清空，作者粘到 mdx 才落地）
- ❌ 不集成到 prod build chunk —— 可见但 robots-disallow + dev-only 标识
- ❌ 不做 multi-slug 切换 UI（只支持 query 参数 `?slug=...`）

## Decisions

### D1 — 路由 + 文件结构

```
app/dev/trajectory/
  page.tsx               # SSR / 服务端读 slug + 加载 case study + geometry
  TrajectoryClient.tsx   # client component, 接收 frontmatter + geometry, 渲染 canvas + RecorderPanel

components/dev/
  FreeFlyCamera.tsx      # OrbitControls 包装 + 实时 readout 钩子
  RecorderPanel.tsx      # 浮动 UI：waypoints / mapState / templates / export
  MapStateControls.tsx   # mode dropdown / dim slider / overlay dropdown

lib/cinema/
  trajectoryTemplates.ts # 6 个预设
  trajectoryExport.ts    # waypoint[] → YAML
```

### D2 — Waypoint 数据结构

```typescript
type Waypoint = {
  id: string;            // uuid
  position: [number, number, number];
  lookAt: [number, number, number];
  mapState: {
    mode: "matte" | "blueprint";
    dim: number;          // 0..1
    overlay: "none" | "agents_trajectories" | "digital_silos_heatmap";
  };
  durationToNext: number; // seconds; 0 if last
  label?: string;         // optional human label
};
```

state 在 client 组件 `useState<Waypoint[]>([])` 里管。

### D3 — FreeFlyCamera

用 drei 的 `<OrbitControls>` ：
- `enablePan`, `enableZoom`, `enableRotate` 全开
- `target` = 当前 lookAt（可被 RecorderPanel 控制 reset）
- `onChange` 回调 → throttle 30Hz 更新 lookAt readout

实时坐标读取：每帧 `useFrame` 取 `camera.position` + `controlsRef.current.target` → 写入 ref / signal，UI 显示。

### D4 — 录制流

1. UI 按 "Add waypoint" or 键盘 R
2. 读当前 camera position / OrbitControls.target / 当前 mapState slider 值
3. push 到 waypoints[]，自动生成 id
4. UI 列表渲染新 waypoint，可编辑（inline 改 position / lookAt / mapState / duration）

### D5 — mapState 实时切换

`<MapStateControls>` 是 controlled UI：mode select / overlay select / dim slider。当前选中值通过 React Context（`MapStateContext`）传给 `<SandTable>` + `<MapOverlay>` 等组件。

dev 工具的 SandTable / Overlay **不再**消费 score-derived mapState（那是 prod path），而是直接读 dev context。

### D6 — Templates

`lib/cinema/trajectoryTemplates.ts`：

```typescript
export type TrajectoryTemplate = {
  id: string;
  name: string;
  description: string;
  waypoints: Omit<Waypoint, "id">[];
};

export const TEMPLATES: TrajectoryTemplate[] = [
  {
    id: "ground-hold",
    name: "街道平视 hold",
    description: "Y=0.05 贴地静止 5s",
    waypoints: [
      { position: [0, 0.05, 4], lookAt: [0, 0.05, 0],
        mapState: { mode: "matte", dim: 0.5, overlay: "none" }, durationToNext: 5 },
    ],
  },
  {
    id: "ground-dolly",
    name: "街道前推",
    description: "Y=0.05 Z 4→2 forward dolly 4s",
    waypoints: [
      { position: [0, 0.05, 4], lookAt: [0, 0.05, 0],
        mapState: { mode: "matte", dim: 0.5, overlay: "none" }, durationToNext: 4 },
      { position: [0, 0.05, 2], lookAt: [0, 0.05, 0],
        mapState: { mode: "matte", dim: 0.5, overlay: "none" }, durationToNext: 0 },
    ],
  },
  {
    id: "lift-to-god",
    name: "抬升至 god view",
    description: "any → [0, 12, 12] 6s",
    waypoints: [
      { position: [0, 0.05, 2], lookAt: [0, 0, 0],
        mapState: { mode: "blueprint", dim: 0.5, overlay: "agents_trajectories" }, durationToNext: 6 },
      { position: [0, 12, 12], lookAt: [0, 0, 0],
        mapState: { mode: "blueprint", dim: 0.5, overlay: "agents_trajectories" }, durationToNext: 0 },
    ],
  },
  {
    id: "orbit",
    name: "高空环绕",
    description: "Y=8 around origin 8s",
    waypoints: [
      { position: [8, 8, 0], lookAt: [0, 0, 0],
        mapState: { mode: "blueprint", dim: 0.6, overlay: "agents_trajectories" }, durationToNext: 4 },
      { position: [0, 8, 8], lookAt: [0, 0, 0],
        mapState: { mode: "blueprint", dim: 0.6, overlay: "agents_trajectories" }, durationToNext: 4 },
      { position: [-8, 8, 0], lookAt: [0, 0, 0],
        mapState: { mode: "blueprint", dim: 0.6, overlay: "agents_trajectories" }, durationToNext: 0 },
    ],
  },
  {
    id: "push-in",
    name: "主体推近",
    description: "Z 远→近 push-in 3s",
    waypoints: [
      { position: [0, 4, 8], lookAt: [0, 0, 0],
        mapState: { mode: "matte", dim: 0.7, overlay: "none" }, durationToNext: 3 },
      { position: [0, 2, 3], lookAt: [0, 0, 0],
        mapState: { mode: "matte", dim: 0.7, overlay: "none" }, durationToNext: 0 },
    ],
  },
  {
    id: "bird-eye",
    name: "俯瞰揭示",
    description: "高空俯视 hold 4s",
    waypoints: [
      { position: [0, 14, 0.001], lookAt: [0, 0, 0],
        mapState: { mode: "blueprint", dim: 0.8, overlay: "digital_silos_heatmap" }, durationToNext: 4 },
    ],
  },
];
```

`durationToNext: 0` 表示最后一个 waypoint。

### D7 — 导出 YAML

`trajectoryExport.ts`：把 waypoints 转成 N-1 个 scene blocks（每相邻 waypoint 对 = 1 scene）：

```yaml
- id: scene-X-Y-PLACEHOLDER  # ⚠️ rename
  kind: ???   # ⚠️ author fills
  rhythm: still   # auto: from===to → still, else tracking
  emphasis: standard  # ⚠️ author tunes (currently no auto-derive)
  camera:
    from: [0, 0.05, 4]
    to: [0, 0.05, 2]
    lookAt: [0, 0.05, 0]
  enter: fade
  exit: fade
  mapState:
    mode: matte
    dim: 0.5
    overlay: agents_trajectories  # 省略如果 none
```

如果 mapState 在 waypoint i 与 i+1 之间变化（mode 或 overlay 不同），导出时使用 waypoint i 的值（scene 起点），并在注释 hint：mapState resolver 会自动 cross-fade 至下一 scene 的 mapState。

复制全文到 clipboard，作者粘到 mdx scenes[] 数组对应位置。

### D8 — 键盘快捷键

- `R` —— add waypoint
- `Space` —— preview play / pause
- `Backspace` —— delete selected waypoint
- `E` —— export to clipboard
- `T` —— toggle templates panel
- `H` —— toggle help overlay

### D9 — UI 布局

```
┌──────────────────────────────────────────────────────┐
│ Cinema Canvas (full screen)                          │
│                                                      │
│   [ Camera readout: pos x.xx y.yy z.zz / lookAt … ]  │  (top-left tiny)
│                                                      │
│                              ┌────────────────────┐  │
│                              │ RecorderPanel      │  │
│                              │ ─ Templates ▾      │  │  (right side, ~360px wide)
│                              │ ─ MapState         │  │
│                              │   mode [matte ▾]   │  │
│                              │   dim  [▭━━] 0.5   │  │
│                              │   overlay [▾]      │  │
│                              │ ─ Waypoints (3)    │  │
│                              │   [1] x,y,z ⏱ 5s   │  │
│                              │   [2] x,y,z ⏱ 4s   │  │
│                              │   [3] x,y,z ⏱ —    │  │
│                              │ [+ Add (R)]        │  │
│                              │ [▶ Preview (Space)]│  │
│                              │ [⎘ Export (E)]     │  │
│                              └────────────────────┘  │
│                                                      │
│  [Help bar: R add / Space preview / E export ...]    │  (bottom)
└──────────────────────────────────────────────────────┘
```

### D10 — 预览 (preview play)

按 Space 进入预览模式：
- waypoints[0..N-1] 之间用 `lerp(p_i, p_{i+1}, t)` linear 插值
- 总时长 = sum of durationToNext
- 实时驱动 camera position + target
- Space 再按 = 暂停 / 退出

不接 spring smoothing —— 预览需要严格匹配输出 YAML 的 linear 行为（与 CameraRig tracking rhythm 一致）。

## Risks / Trade-offs

- **[OrbitControls 与 SandTable 旋转坐标系兼容]** SandTable rotateX(-π/2)。OrbitControls 用 world-space target。当前 mdx 用世界坐标 (x, y_up, z) 表达 camera —— OrbitControls 直接读出的也是同坐标系，**应该兼容**。如果实测 lookAt 镜像，加 sign flip
- **[Y up convention]** Three.js 默认 Y up，与项目一致
- **[导出 YAML 缩进]** 需匹配 mdx 中 `scenes:` 数组下的缩进（4 spaces 数组项 + 2 spaces 字段）—— 用 `js-yaml` 已在项目里
- **[模板覆盖 vs 追加]** 选模板默认 **替换** 当前 waypoints[]（避免污染），UI 加确认 dialog
- **[路由暴露生产]** dev 路由会被 Next.js 静态生成。本 propose 加 `noindex` meta + 顶部 banner 标 dev-only。**不**做 auth gate

## Migration Plan

1. **Phase 1** — 模板 + 工具数据结构 (lib only, 无 UI)
2. **Phase 2** — 路由 + canvas 复用 + free-fly camera
3. **Phase 3** — RecorderPanel UI（waypoint 列表 + add/delete + duration 编辑）
4. **Phase 4** — MapState 实时控制（dropdown / slider）+ 影响 SandTable 渲染
5. **Phase 5** — Templates 选择器 + 一键加载
6. **Phase 6** — Export YAML to clipboard
7. **Phase 7** — Preview play / pause
8. **Phase 8** — 键盘快捷键
9. **Phase 9** — typecheck / build / 文档

回滚：删除 `app/dev/` + `components/dev/` + `lib/cinema/trajectory*.ts`，restore noindex robots。

## Open Questions

1. **Q1 — Help overlay 内容**：键盘表 + 快速指南，是否进 propose？倾向 yes
2. **Q2 — preview 期间是否要 spring smoothing**？v1 默认 linear lerp（与 tracking rhythm 输出一致）。如果作者想感受 prod spring，加 toggle
3. **Q3 — export 是否要支持 import**？粘 YAML 反向解码回 waypoints？v1 不做，后续 sub-propose
4. **Q4 — 持久化** localStorage 自动保存草稿？v1 不做，刷新清空

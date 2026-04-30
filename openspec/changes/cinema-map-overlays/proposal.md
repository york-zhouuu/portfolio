## Why

`cinema-content-language-foundations` 落了 overlay 接口（`OVERLAY_REGISTRY` + `<MapOverlay>`），只注册了 `none`。Beat 1.1 v2 脚本明确需要：

- **agents_trajectories**（scene 1.2）：发光人车点沿路径运动，光轨像电路般亮起——证明个体之间互不交汇
- **digital_silos_heatmap**（scene 1.5）：每个 agent 头上一根红色信息茧房光柱——证明数字屏幕隔离了现实空间

这两 overlay 都依赖一个共享前置：从沙盘 road 网络采样得出 N 个 agent 位置 / 路径。本 propose 落地这个共享采样器 + 两个 overlay。

## What Changes

- **`<MapOverlay>` 接口拓展** — 当前签名 `{ progress: number }`，加 `sandTable: NormalizedSandTable | null`（也是 R3F children，可访问 R3F context）。R3F context-aware 使用 useThree 即可避免 props 飞溅，但显式 prop 更易测试。倾向显式 prop。
- **新工具 `lib/cinema/agentSampling.ts`** — 给定 `(NormalizedSandTable, count, seed)` 返回 `Agent[]`：每个 agent 含起点（沿 road polygon 周长采样）+ 路径段（连续若干路口）+ 速度。Deterministic（同 seed 同结果），便于 SSG 静态缓存。
- **新组件 `<AgentsTrajectoriesOverlay>`** — InstancedMesh 渲染 ~80 个发光球；useFrame 推进每个 agent 沿其路径的 t；progress prop 控制整体 opacity（淡入淡出）。
- **新组件 `<DigitalSilosOverlay>`** — InstancedMesh 渲染 ~80 个红色发光垂直 cylinder（高 0.5），每个 cylinder 底部锁在某个 agent 位置（共享同一采样器但不动）；progress 控制 opacity + pulse。
- **注册到 OVERLAY_REGISTRY** — `agents_trajectories: AgentsTrajectoriesOverlay` / `digital_silos_heatmap: DigitalSilosOverlay`。
- **lint 注册** — `KNOWN_OVERLAYS` 加这两个名字。
- **CinemaCanvas 在 `<MapOverlay>` 处传入 sandTable** — 接通管道。

## Capabilities

### Modified Capabilities

- `cinematic-case-study-page` —— overlay 接口拓展（多一个 sandTable prop）+ 两个具体 overlay component 注册 + lint KNOWN_OVERLAYS 扩展。

### New Capabilities

_None — overlay registry 接口已在 foundations 建立，本 propose 只注册新条目 + 共享采样 helper。_

## Impact

- **代码**：
  - `lib/cinema/agentSampling.ts`（新）
  - `components/cinema/overlays/AgentsTrajectoriesOverlay.tsx`（新）
  - `components/cinema/overlays/DigitalSilosOverlay.tsx`（新）
  - `components/cinema/overlays/registry.ts`（注册新条目 + props 类型扩展）
  - `components/cinema/overlays/MapOverlay.tsx`（传 sandTable prop）
  - `components/cinema/CinemaCanvas.tsx`（向 MapOverlay 传 sandTable）
  - `scripts/content-lint.ts`（KNOWN_OVERLAYS 加两个名字）
- **作者侧**：写 `mapState.overlay: "agents_trajectories"` / `"digital_silos_heatmap"` 即可启用。
- **Beat 1.1 grandfather**：现 7 scene 没 mapState 字段，不受影响。
- **性能**：80 agents × InstancedMesh = 单 draw call，对现代 GPU 无压力。Cinema 已有 ~50k 三角面级几何，加 80 个球微不足道。
- **风险**：路径采样质量决定视觉真实度。如果采样到 road 边缘 / 不连续段，agent 会"跳"。需要在 sampling 内部保证路径平滑（采样 polygon 内部顺序点）。

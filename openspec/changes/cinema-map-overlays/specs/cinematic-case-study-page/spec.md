## ADDED Requirements

### Requirement: MapOverlay 接口加 sandTable prop

`MapOverlayProps` SHALL 扩展为 `{ progress: number; sandTable: NormalizedSandTable | null }`。CinemaCanvas MUST 把当前 sandTable 实例传给 `<MapOverlay>`。Overlay 组件可自行决定是否使用——`none` 忽略；具体 overlay 用它做几何采样。

#### Scenario: sandTable 为 null

- **WHEN** sandTable 还未加载或 geometry 缺失
- **THEN** overlay 应能 graceful 降级（采样返回空数组 / instancedMesh count=0）；不应抛错

### Requirement: 共享 agent 采样工具

`lib/cinema/agentSampling.ts` SHALL 导出 `sampleAgents(table: NormalizedSandTable, count: number, seed: number): Agent[]`：

- 使用 deterministic PRNG（mulberry32 from seed）
- 从 `table.roads` 中按面积加权随机选 count 个 polygon
- 每个 polygon 内取连续顶点子序列作为 path（≥4 点）
- 计算 path 累计长度
- 每个 agent 的 phase ∈ [0, 1) 与 speed ∈ [0.4, 0.8] 由 PRNG 决定

输出 deterministic：同 (table, count, seed) 总返回同样的 agent 列表。

#### Scenario: 同 seed 同结果

- **WHEN** 两次调用 `sampleAgents(table, 80, 42)`
- **THEN** 两次返回的 Agent[] 数组元素严格相同（用于跨 overlay 共享 agent 位置）

#### Scenario: sandTable 为 null

- **WHEN** sampleAgents 收到 null
- **THEN** 返回空数组

### Requirement: agents_trajectories overlay 注册

`OVERLAY_REGISTRY` SHALL 注册 `agents_trajectories` 条目，组件实现：

- 从 `sampleAgents(table, 80, 42)` 取 agent 列表
- InstancedMesh 渲染 80 个发光球（半径 0.025，meshBasicMaterial 白色）
- useFrame 内每个 agent 沿其 path 以 (speed/length) 速率推进 t（mod 1）；setMatrixAt 更新 instance 位置
- 整体 opacity = `progress` prop（fade in/out）
- 高度 y = 0.04（道路层之上）

#### Scenario: scene mapState.overlay = "agents_trajectories"

- **WHEN** scene 配置 `mapState.overlay: "agents_trajectories"`
- **THEN** 沙盘上出现 80 个白色发光球，沿不同 road segment 缓慢运动

#### Scenario: agents_trajectories fade

- **WHEN** scene 进入 enter 区间，overlayProgress 从 0→1
- **THEN** 球体 opacity 从 0 平滑增长到 1（progress 即 opacity）

### Requirement: digital_silos_heatmap overlay 注册

`OVERLAY_REGISTRY` SHALL 注册 `digital_silos_heatmap` 条目，组件实现：

- 从 `sampleAgents(table, 80, 42)` 取 agent 列表（同 seed → 与 agents_trajectories 共享位置）
- InstancedMesh 渲染 80 个红色 cylinder（半径 0.018-0.022 锥形，高 0.5）
- 位置锁在每个 agent 的 path[0]（不动）；中心 y=0.25 → 底贴地、顶 0.5
- 颜色 `#ff3366`，meshBasicMaterial double-side
- Subtle pulse：opacity 在 `progress * 0.6` 与 `progress * 1.0` 之间正弦振荡（频率 1.5Hz）

#### Scenario: scene mapState.overlay = "digital_silos_heatmap"

- **WHEN** scene 配置 `mapState.overlay: "digital_silos_heatmap"`
- **THEN** 沙盘上长出 80 根红色光柱，每根高 0.5 单位，呈轻微 pulse

#### Scenario: 与 agents_trajectories 位置共享

- **WHEN** 同一案例某 scene 用 agents_trajectories（agent 在动），紧后某 scene 用 digital_silos_heatmap（光柱静止）
- **THEN** 80 根光柱出现的位置应该是 agents 路径起点（path[0]），即"动→停"语义连续——读者感知"同一群人"

### Requirement: lint KNOWN_OVERLAYS 拓展

`content-lint` 的 `KNOWN_OVERLAYS` 集合 SHALL 包含 `"agents_trajectories"` 与 `"digital_silos_heatmap"`。作者使用这两个 name 不再触发 unknown-overlay warning。

#### Scenario: scene 写已注册 overlay

- **WHEN** scene `mapState.overlay = "agents_trajectories"`
- **THEN** content-lint 不报 unknown-overlay warning

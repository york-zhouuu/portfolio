## Context

cinema-content-language-foundations 的 overlay 注册表只接 `{ progress }`。要实现"动态 agent 在沙盘上"，overlay 需要：
1. 沙盘几何引用（采样 agent 路径需要 road 数据）
2. 全帧驱动（useFrame 内 advance agent positions）
3. 实例化绘制（80+ agents 单 draw call）

本 propose 针对 Beat 1.1 v2 的两个具体场景设计实现：

- **agents_trajectories** (scene 1.2 / matte / tracking) — 灯光亮起，发光人车在街道上穿梭
- **digital_silos_heatmap** (scene 1.5 / blueprint / tracking) — god view 下每个 agent 头上长出红光柱

## Goals / Non-Goals

**Goals:**
- 注册两个具体 overlay；接口最小化扩展（加 sandTable prop）
- 共享 agent 采样逻辑：deterministic，给定 seed 同结果；可被两个 overlay 复用而结果可能"对得上"（同样的 80 个位置）
- 性能：单 draw call 渲染 ~80 实例；useFrame 内更新 instance matrices 避免重 alloc
- progress prop 驱动 fade in/out（与现 mapState resolver 一致）

**Non-Goals:**
- ❌ 不实现真实仿真（multi-agent 互动 / 实际路径规划）—— 视觉够用即可
- ❌ 不做 LOD / culling —— 80 个 instance 不需要
- ❌ 不实现额外 overlay（heatmap colormap / labels / fog gradient）—— 留给未来
- ❌ 不动 SandTable / CameraRig 核心逻辑

## Decisions

### D1 — MapOverlay 加 `sandTable` prop

```ts
// 修改前
type MapOverlayProps = { progress: number };

// 修改后
type MapOverlayProps = {
  progress: number;
  sandTable: NormalizedSandTable | null;
};
```

CinemaCanvas 已有 `sandTable` 在作用域里，传给 `<MapOverlay>` 即可。注册的 overlay 自由选择是否使用——`none` 忽略；具体 overlay 用它。

**理由**：显式 prop 比 useThree context 更易测试 + 更明确依赖关系。

**替代方案**：用 React context Provider 包 sandTable。会让 overlay 隐式依赖 provider，难以独立 unit test。否决。

### D2 — Deterministic agent sampling

```ts
type Agent = {
  /** Path waypoints in world coords (x,z plane), 4-12 points each. */
  path: Array<{ x: number; z: number }>;
  /** Total path length (for constant-speed traversal). */
  length: number;
  /** Seed-derived initial t [0,1) so agents are out of phase. */
  phase: number;
  /** Agent's preferred speed (world units / second). */
  speed: number;
};

function sampleAgents(table: NormalizedSandTable, count: number, seed: number): Agent[];
```

实现：
1. PRNG（mulberry32 from seed）保证 deterministic
2. 从 `table.roads` 中按面积加权随机选 `count` 个 polygon
3. 每个 polygon 内：取若干顺序顶点串成 path（≥4 点），保证 path 是连续片段而非跳跃
4. 计算 `length` = 累计 segment 长度
5. `phase` = PRNG 随机
6. `speed` = 0.4 + PRNG × 0.4（每秒 0.4-0.8 世界单位 ≈ 缓慢漫步）

**理由**：
- Deterministic 让 SSG/CSR 之间一致；调试时刷新页面 agent 不变
- 沿 polygon 顶点采样 = 沿"道路中线"近似行进，不需要 GIS-level 路径规划
- 速度区间在世界尺度上对应"步行速度"——缓慢但可见

### D3 — `<AgentsTrajectoriesOverlay>` 渲染

```tsx
function AgentsTrajectoriesOverlay({ progress, sandTable }: MapOverlayProps) {
  const agents = useMemo(() => sampleAgents(sandTable, 80, 42), [sandTable]);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matrix = useMemo(() => new THREE.Matrix4(), []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const time = performance.now() / 1000;
    agents.forEach((agent, i) => {
      const t = ((time * agent.speed / agent.length) + agent.phase) % 1;
      const { x, z } = positionAlongPath(agent.path, t);
      matrix.setPosition(x, 0.04, z);
      meshRef.current!.setMatrixAt(i, matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const opacity = progress;
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, agents.length]}>
      <sphereGeometry args={[0.025, 8, 8]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={opacity} />
    </instancedMesh>
  );
}
```

视觉：
- 球半径 0.025 ≈ 沙盘世界中"汽车 / 行人"等比例（1m vs 1km² → 0.025 单位 ≈ 25cm 视觉，足够亮）
- 白色 base color + meshBasicMaterial（不受光，永远亮）
- 高度 y=0.04（贴在 road 0.002 之上 + walkway 0.001）

**Pulse / 残影**：第一版不做。如果视觉觉得"太死"再加 pulsing 或 trail。

### D4 — `<DigitalSilosOverlay>` 渲染

```tsx
function DigitalSilosOverlay({ progress, sandTable }: MapOverlayProps) {
  const agents = useMemo(() => sampleAgents(sandTable, 80, 42), [sandTable]);
  // 同 seed 42 → 与 AgentsTrajectoriesOverlay 共享 agent 集合
  // 但 silos 用静态位置（path[0]），不动；只有"光柱"渲染
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matrix = useMemo(() => new THREE.Matrix4(), []);

  useEffect(() => {
    if (!meshRef.current) return;
    agents.forEach((agent, i) => {
      const { x, z } = agent.path[0];
      // Position: agent at ground; cylinder rises 0.5 unit up
      matrix.makeTranslation(x, 0.25, z); // 中心在 0.25 → 顶 0.5 / 底 0
      meshRef.current!.setMatrixAt(i, matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [agents]);

  // Subtle pulsing
  useFrame((_) => {
    if (!meshRef.current) return;
    const time = performance.now() / 1000;
    const pulse = 0.6 + 0.4 * Math.sin(time * 1.5);
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = progress * pulse;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, agents.length]}>
      <cylinderGeometry args={[0.018, 0.022, 0.5, 8, 1, true]} />
      <meshBasicMaterial
        color="#ff3366"
        transparent
        opacity={progress}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}
```

视觉：
- Cylinder 高 0.5（沙盘 building 顶部最高 ~0.6，silos 接近 building 高度）
- 上下半径不同（0.018 顶 / 0.022 底）= 隐微锥形，更"光柱感"
- 红色 #ff3366 与 blueprint 冷蓝形成强对比
- Pulse: opacity 在 [0.6×progress, 1.0×progress] 之间正弦变化（频率 1.5Hz）

### D5 — Seed 共享意图

两个 overlay 都用 seed=42。意图：**agent 集合在视觉上一致**——scene 1.2 看到的发光点位置 ≈ scene 1.5 看到的红光柱位置。即使 scene 1.2 的 agent 在动 / scene 1.5 静止，其底层"哪 80 个位置"是同一组。给读者一种"这是同一群居民"的暗示。

如果未来想要 scene 间 agent 集合不一样，可改 seed。

### D6 — Lint KNOWN_OVERLAYS 拓展

```ts
const KNOWN_OVERLAYS = new Set(["none", "agents_trajectories", "digital_silos_heatmap"]);
```

## Risks / Trade-offs

- **[采样质量]** road polygon 顶点未必按"道路走向"顺序排列；可能采样出 zig-zag 路径。
  → 缓解：取 polygon 凸壳的相邻顶点子序列，或用 polygon 周长上的等距点。先用顶点子序列尝试，效果差再改。

- **[80 agents 在小沙盘里挤]** 沙盘 ±8，80 agents 平均密度高。
  → 缓解：第一版试 80；如果太密改 50；如果太稀加到 120。试参。

- **[seed=42 共享导致两 overlay 严重耦合]** agents_trajectories 改了 sample 算法 → digital_silos 必须同步。
  → 缓解：本 propose 内一致；未来 propose 改 sampling 时同步两个 overlay 的视觉。

- **[useFrame 在 overlay 里增加每帧成本]** instance matrix 更新 80 次 / 帧。
  → 缓解：80 ops × 60fps = 4800 op/s，可忽略。matrix 只更新 setPosition，不分配新对象。

- **[InstancedMesh 不接受 undefined args]** R3F 类型定义要求 `args: [geometry, material, count]`，给 undefined 可能 typecheck 失败。
  → 缓解：实施时调整为 explicit args（`args={[undefined as any, undefined as any, count]}`）或让 children geometry/material 自动绑定。R3F 实践中 InstancedMesh 的 children 会替代 args 中的前两位。验证。

## Migration Plan

1. **Phase 1** — 接口拓展：`MapOverlayProps` 加 sandTable；MapOverlay 转发；CinemaCanvas 注入 sandTable。
2. **Phase 2** — `agentSampling.ts` 工具：mulberry32 PRNG + sampleAgents。Unit-testable（即使没测试框架）。
3. **Phase 3** — `<AgentsTrajectoriesOverlay>` 实现。
4. **Phase 4** — `<DigitalSilosOverlay>` 实现。
5. **Phase 5** — registry 注册 + lint KNOWN_OVERLAYS 扩展。
6. **Phase 6** — 验证：build + grandfather 兼容。

## Open Questions

1. **Q1 — 80 agents 是否合适数量？** 实测调。可能 50 / 80 / 120 都有理由。
2. **Q2 — silos pulse 频率 1.5Hz 是否过激？** 实测调；如果"焦虑感"过强可降到 0.5Hz。
3. **Q3 — 当 sandTable 为 null（geometry 还没加载）时，overlay 应该怎么办？** 当前设计：sampleAgents 收 null 返空数组，instancedMesh count=0 不渲染任何东西。安全 fallback。
4. **Q4 — agents 是否应该有"轨迹尾巴"（trail）效果？** 第一版无；如果"互不交汇"的隐喻不够强可加。

## Context

### Foundations 提供了什么

`cinema-content-language-foundations` 给沙盘材质提供了：
- `MATERIAL_REGISTRY: Record<string, MaterialFactory>`
- `MaterialFactory = (theme) => MaterialSet`（按 layer 给 surface spec）
- SandTable 接受 `mode / modePrev / modeFade / dim` props，cross-fade 由两次 mesh 树叠加实现

不足：MaterialSet 只表达"surface"。蓝图视觉需要"surface + edges"两层。

### 设计意图

Beat 1.1 v2 scene-1-4 注释：
> "材质从泥土突变为几何蓝图，隐喻抛开物理表象，看透社会实质。"

这指向工程图 / X-ray 的视觉语言：
- 半透明体（看穿）
- 强化边线（几何信息）
- 冷蓝调（理性 / 仪表盘）
- 与 matte 的"奶油暖色 + 不透明"形成强对比

## Goals / Non-Goals

**Goals:**
- 注册 `blueprint` material mode（仅 1 个，不动其他注册项）
- 在 MaterialSet 上扩展 `edges?` 字段，向后兼容（matte 不填则不渲染边线）
- SandTable 支持 edges 渲染 + cross-fade 一致
- 视觉对比强烈：matte → blueprint 的过渡观感"剥皮"

**Non-Goals:**
- ❌ 不改 mapState resolver / overlay registry / progressive reveal / CameraRig
- ❌ 不实现其他 mode（watercolor / topo / heatmap-only 等留给未来）
- ❌ 不动 Beat 1.1 现有 7 scene（grandfather 兼容）
- ❌ 不实现 trajectory recorder（独立 future propose，已记 memory）

## Decisions

### D1 — MaterialSpec 加可选 `edges` 字段

```ts
type EdgeSpec = {
  color: string;
  opacity: number;
  /** EdgesGeometry threshold angle (默认 15°). */
  threshold?: number;
};

type MaterialSpec = {
  // 既有
  color: string;
  roughness: number;
  metalness: number;
  opacity: number;
  flatShading?: boolean;
  // 新增
  edges?: EdgeSpec;
};
```

**理由**：edges 是 surface 的视觉补充，每 layer 独立；blueprint 给 buildings + roads 边线，给 waterway 不给。matte 一概不填 → 当前行为不变。

### D2 — Blueprint material 视觉规格

```ts
blueprintMaterialFactory: (theme) => ({
  ground:    { color: "#0a1830", roughness: 1, metalness: 0, opacity: 0.95 },
  walkway:   { color: "#5cd0ff", roughness: 0.9, metalness: 0, opacity: 0.10 },
  road:      { color: "#5cd0ff", roughness: 0.9, metalness: 0, opacity: 0.18,
               edges: { color: "#9ae6ff", opacity: 0.45 } },
  waterway:  { color: "#3b9ad8", roughness: 0.8, metalness: 0.05, opacity: 0.45 },
  water:     { color: "#3b9ad8", roughness: 0.8, metalness: 0.05, opacity: 0.50 },
  park:      { color: "#264a6b", roughness: 0.95, metalness: 0, opacity: 0.18 },
  building:  { color: "#7eb8e8", roughness: 0.7, metalness: 0, opacity: 0.16,
               flatShading: true,
               edges: { color: "#a8d4ff", opacity: 0.85, threshold: 12 } },
})
```

**色彩计算**：基于 theme（保持暗背景），蓝图配色与 cinema theme 共生——不另起 palette；冷蓝光柱与暖灯光形成"工厂 / 实验室照明"对比。

### D3 — SandTable 渲染 edges

```tsx
{spec.edges ? (
  <lineSegments>
    <edgesGeometry args={[meshGeometry, spec.edges.threshold ?? 15]} />
    <lineBasicMaterial
      color={spec.edges.color}
      transparent
      opacity={spec.edges.opacity * alphaScale}
    />
  </lineSegments>
) : null}
```

每个有 edges 的 layer 在原 mesh 旁挂一条 `<lineSegments>`：
- `EdgesGeometry` 自动检测尖角生成边线（threshold 控制保留几何度，越小边越多）
- `lineBasicMaterial` 不受光照影响，保留蓝图"图纸感"
- Cross-fade 期间 edges opacity 同 alphaScale 一起插值

**性能**：
- buildings：~3000 footprints × ~6-12 edges 每个 → ~30000 line segments
- roads：~4500 footprints × 4 edges → ~18000
- 总计 ~50000 segments —— 现代 GPU 单 draw call 可承受
- Edges 仅在 blueprint 激活时构建（lazy memo）

**替代方案**：
- 用 wireframe material（meshBasicMaterial.wireframe = true）：会在三角化的内部画线，丑且密。否决。
- 自定义 shader：开发成本高，本 propose 想小。否决。

### D4 — Cross-fade with edges

SandTable 已有 modePrev cross-fade 逻辑：每 layer 同 geometry 用两个 material 叠加。edges 一并同步：

```tsx
{layers}      // 含 edges (cur)
{layersPrev}  // 含 edges (prev)
```

modeFade 控制每层 alphaScale。matte → blueprint 切换时：
- matte 原本 surface opacity 100% → 0%
- blueprint surface 0% → 16%
- blueprint edges 0% → 85%

视觉效果：泥土"溶解"，蓝图线"显形"。

### D5 — Lint 注册新 mode

`scripts/content-lint.ts` 的 `KNOWN_MODES` 集合中加 `blueprint`。作者写 `mapState.mode: "blueprint"` 不再 warning。

## Risks / Trade-offs

- **[Edges geometry 性能开销]** 50k segments 是单 draw call 但仍有 vertex 总量。
  → 缓解：lazy build（只在 mode 激活或即将激活时构建）；threshold 调大减少边数；如需进一步可按距离 culling。

- **[blueprint 配色与 theme 不协调]** 当前 theme 是 cream + warm。冷蓝可能突兀。
  → 缓解：theme.background 是深蓝黑底，blueprint 冷蓝直接叠上去和谐；cream 区域只在 matte 出现。视觉上 blueprint 是一种"图纸 mode"——天然与暖光氛围对比，正是叙事意图。

- **[modeFade cross-fade 200ms 太短]** 当前 mapState resolver 用 5% sceneLocalT 窗，对 svh=600 的 scene 大约对应 30svh ≈ 0.3s。
  → 缓解：实测后调。本 propose 不动 resolver；如果 cross-fade 觉得仓促，下一个 propose 加可调参数。

- **[blueprint mode 下 lighting 似乎无意义]** Surface 透明 + edges 是 line material（不受光），blueprint 时整个 lighting 系统形同虚设。
  → 缓解：这是预期——蓝图就是 flat / 仪表盘风格。matte 时 lighting 仍然驱动暖光氛围。两者各自承担。

## Migration Plan

1. **Phase 1** — 类型扩展：`MaterialSpec.edges?` + `EdgeSpec`；matte factory 不动（不加 edges 字段）。
2. **Phase 2** — Blueprint factory：写 `lib/cinema/materials/blueprint.ts`，注册到 registry。
3. **Phase 3** — SandTable edges 渲染：检测 `spec.edges` 存在则挂 lineSegments；EdgesGeometry per mesh memoized。
4. **Phase 4** — Cross-fade 适配：edges 跟 surface 同 alphaScale。
5. **Phase 5** — Lint KNOWN_MODES 加 blueprint。
6. **Phase 6** — 验证：现状（无 mapState）build 不变；测试 mdx 加 mode=blueprint 的 scene 看 cross-fade。

## Open Questions

1. **Q1 — edges threshold = 15° 是否合适？** buildings 可能 edge 过多。实施后实测，需要的话调到 25°。
2. **Q2 — 蓝图配色是固定的，还是基于 theme 派生？** 当前是固定（不绑 theme），保持配色一致性。如果未来加暖蓝图 theme variant，再 parameterize。
3. **Q3 — 切换 matte ↔ blueprint 时 ground plane 也变色（cream → 深蓝），会不会"地皮抽走"？** 当前 ground spec 是 0.95 opacity，blueprint 也是 0.95 → 视觉上是 ground "重新着色"而非"消失"，应该顺滑。实测确认。

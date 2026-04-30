## ADDED Requirements

### Requirement: MaterialSpec 支持 optional edges

`MaterialSpec` SHALL 增加可选 `edges?: EdgeSpec` 字段：

```ts
type EdgeSpec = {
  color: string;        // CSS color
  opacity: number;      // 0..1
  threshold?: number;   // EdgesGeometry 角度阈值，默认 15
};
```

带 `edges` 的 layer，SandTable MUST 在该 layer 的 mesh 旁额外渲染一条 `<lineSegments>`，使用 `EdgesGeometry` + `lineBasicMaterial`。无 `edges` 字段的 layer（如 matte）行为不变。

#### Scenario: matte mode 下 layers 无 edges

- **WHEN** mode=matte 渲染
- **THEN** 不渲染任何 lineSegments；与 cinema-content-language-foundations 之前完全等价

#### Scenario: 含 edges 的 layer 渲染

- **WHEN** spec.edges 存在
- **THEN** mesh 树同时包含 `<mesh>`（surface）+ `<lineSegments>`（edges）；两者共享同一 geometry

### Requirement: Blueprint material mode 注册

`MATERIAL_REGISTRY` SHALL 新增 `blueprint` factory：

- 整体配色冷蓝偏暗（参见 design.md D2）
- buildings 和 roads layer 带 edges（buildings cyan threshold 12°，roads light-cyan）
- waterway / water 半透明深蓝
- ground 替换为深蓝底色（保留 0.95 opacity 保证不"消失"）

注册后任何 scene 写 `mapState.mode: "blueprint"` 都自动应用。

#### Scenario: blueprint scene 渲染

- **WHEN** scene `mapState.mode = "blueprint"`
- **THEN** SandTable 用 blueprint factory 的 MaterialSet；buildings 与 roads 出现冷光边线；surface 半透明可见后景

#### Scenario: matte → blueprint cross-fade

- **WHEN** 相邻两 scene mode 不同（matte → blueprint），用户滚到 boundary
- **THEN** 两 MaterialSet 同时挂载，opacity 互补（modeFade 0→1）；包含 edges 的 layer 也跟随 alphaScale 一起 fade in/out

### Requirement: Lint KNOWN_MODES 包含 blueprint

`content-lint` 的 `KNOWN_MODES` 集合 SHALL 包含 `blueprint`。作者写 `mapState.mode: "blueprint"` 不再触发 unknown-mode warning。

#### Scenario: scene 写 blueprint mode

- **WHEN** scene `mapState.mode = "blueprint"`
- **THEN** content-lint 不输出 unknown-mode warning（前提：blueprint 已注册）

#### Scenario: scene 写 watercolor mode（仍未注册）

- **WHEN** scene `mapState.mode = "watercolor"`
- **THEN** content-lint 仍输出 unknown-mode warning（fallback 到 matte）

## Why

`cinema-content-language-foundations` 落地了 `MATERIAL_REGISTRY` 接口，但只注册了 `matte`。Beat 1.1 v2 脚本（scene-1-3 / 1-4 / 1-5）需要 `blueprint` 模式——把沙盘从泥土质感切到 X-ray 几何线框，对应"看穿表象"的叙事意图。

注册一种新 material mode 就解锁所有 propose 之后写文案的人——任何 scene 写 `mapState.mode: "blueprint"` 就自动 cross-fade 到这个新视觉。

## What Changes

- **拓展 MaterialFactory 接口** — 当前返回 `MaterialSet`（每 layer 一份 surface spec）。新增可选 `edges` 字段：每 layer 的 edge color / opacity，开启则该 layer 额外绘制 EdgesGeometry。
- **注册 `blueprint` material mode** — 蓝图视觉：surface 极低不透明度（buildings ~0.18 / roads ~0.40 / waterway ~0.55）+ 冷蓝偏移；buildings + roads 上叠 cyan/blue 边线（edges layer）。视觉收敛到"工程图 / X-ray"，与 matte 形成强对比。
- **SandTable 渲染 edges 支持** — 检测 `MaterialSet[layer].edges`，存在则给 mesh 加一条 `<lineSegments>` 子节点；cross-fade 期间 edges opacity 与 surface 同步缩放。
- **cinema-content-language-foundations 的 KNOWN_MODES lint** — `blueprint` 加入注册名单，作者写 `mode: blueprint` 不再 fallback warning。

## Capabilities

### Modified Capabilities

- `cinematic-case-study-page` —— SandTable 渲染层增加 edges 渲染分支；MaterialFactory 接口扩展。
- `case-study-content-schema` —— 无 schema 字段改动；只是 lint warning 名单扩展。

### New Capabilities

_None — registry 接口已在 foundations 建立，本 propose 仅注册新条目。_

## Impact

- **代码**：`lib/cinema/materials/registry.ts` 加 blueprint factory；`lib/cinema/materials/blueprint.ts` 新文件；`components/cinema/SandTable.tsx` 加 EdgesGeometry 渲染；`scripts/content-lint.ts` KNOWN_MODES 扩展。
- **作者侧**：现在可以写 `mapState.mode: "blueprint"` 而无 lint warning。
- **Beat 1.1**：grandfather 7 scene 没有 mapState 字段，不受影响。
- **后续**：`cinema-map-overlays` 是平行 propose；二者互不依赖。
- **风险**：edges geometry 会增加 ~50-100k 个 LineSegments（buildings 多边形多）。性能需评估；如果太重，blueprint mode 可只对 buildings 加 edges、roads/walkways 保留 surface only。

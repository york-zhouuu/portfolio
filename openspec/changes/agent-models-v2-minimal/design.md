## Context

### 灵感参考

- **Architecture scale figures**（archisoup, SketchUp 3DWarehouse 等架构图常用人物素材）：单色剪影、瘦长比例、faceless / armless、冷漠的"标尺"形态。建筑师在场景图里要的是"有人在场"的暗示，不是角色叙事。
- **Polestar / Tesla low-poly renders**（Sketchfab Electric Revolution Pack、Lionsharp Studios Tesla Realtime Models）：长低 sedan 比例、sloped roofline、wheel arch 内嵌、单色或双色（车身 + 玻璃 strip）。
- **MUJI / 北欧极简色板**：高明度、低饱和、warm 中性（非纯灰）。Morandi 进一步去掉了暗调；性冷淡再去掉色相，只保留 hue temperature（暖白 vs 冷灰）。

### 之前 v1 的问题

- 人 = 4 件配色（skin / shirt / pants / wheels-style 暗）+ 6 个部位 → 视觉信息密度过高，破坏极简
- 车 = 两个 box 叠起 → 比例粗、缺少线条
- Icosahedron 头 → 游戏 NPC 感

## Goals / Non-Goals

**Goals:**
- 单 figure / 单 color（最多两个色调）→ 极简
- 7-8 head heights → 修长
- ExtrudeGeometry 拉伸 sedan 侧面 → 真车感
- 与 Morandi → 性冷淡的色板进一步收
- Three.js core API 不引入新 import 风险

**Non-Goals:**
- ❌ 不动路径采样 / 速度 / 节奏 / 文字呈现（这些已在前面 propose 完成）
- ❌ 不补面部 / 头发 / 背包等"角色"细节（极简的反面）
- ❌ 不做 per-instance 颜色变化（25 辆车不同色 — 留给未来 propose 如果需要）
- ❌ 不动 InstancedMesh / vertex colors 机制（mesh registry 接口稳定）

## Decisions

### D1 — Person geometry: tall, armless, two-tone

```
                       ●            head: SphereGeometry r=0.020, 8×6
                       │
                      ║║║          torso: tapered cylinder, 6 segs
                      ║║║                 top r=0.024, bottom r=0.020 (轻微 taper)
                      ║║║                 height 0.105
                      ║║║                 (4× head height)
                      ║║║
                       │ │         legs: 2 cylinders r=0.013, 5 segs
                       │ │              height 0.150 (5× head)
                       │ │              x-offset 0.012
                    ────────       y=0
                    
                    head/total = 1/7.5 ratio
                    total height ≈ 0.30
```

**手臂去除**：架构 figure 的核心识别是 "head + torso + legs" 三段剪影。手臂会让剪影变复杂、像具体人物。omit arms = 更"标尺"感、更极简。

**两个色调**：
- 上半身（head + torso）：`#dcd5c8`（warm bone — 温暖灰白）
- 下半身（legs）：`#a8a39a`（cool greige — 略冷略深）

色相差极小（都在 hue 30-50 暖灰区间），通过明度差区分。"性冷淡"的核心是"hue 几乎相等，靠 brightness 拉层次"。

**理由**：
- 移除 skin tone 让 figure 不"有人种"，纯抽象 → 适配各种叙事场景
- legs 比 torso 略深符合"裤子 vs 衫"的色调常识，但弱到几乎察觉不到 → 极简而非平面化

### D2 — Car geometry: ExtrudeGeometry side profile + wheels

```
   side profile (xy plane, then extruded along z):
   
        (-0.06, 0.040)  cabin top back
              ┌────────────┐ (0.020, 0.040) cabin top front
              │            │
              │            │  (0.040, 0.025) windshield top
              │           ╱
   ┌──────────┘          ╱──┐ (0.080, 0.022) bonnet front
   │                        │
   │                        │ (0.090, 0.012) front bumper
   └────────────────────────┘ (-0.090, 0.000) rear bumper
                              (0.090, 0.000) bottom-front
   
   extrude depth = 0.060 (car width)
   total length = 0.180
   total height = 0.040
   length/height ratio = 4.5 ✓
```

**Profile 8 个 anchor points** 描出 sedan 轮廓：bonnet → windshield → roof → rear → trunk。THREE.Shape + ExtrudeGeometry 拉伸出 3D 车身。

**Wheels**：4 个 cylinder（r=0.014, height=0.012），rotateZ(π/2) 让轴沿 x。位置：x=±0.060, z=±0.034, y=0.014（中心）。

```ts
// 车身 — 单色 dusty 米
const carBody = "#cfc6b8"
// 玻璃 strip（cabin top 段单独 paint）— 深 charcoal
const carGlass = "#3a3833"  
// 轮 — 暖深炭
const carWheel = "#252320"
```

只在 cabin profile 段（roof 区域顶面）paint glass。其余 body 全 dusty 米。

**理由**：
- ExtrudeGeometry 是 three.js core（`THREE.ExtrudeGeometry`），不依赖 examples/jsm
- 侧面 profile 一气呵成 → 流线感 vs 双 box 的方块感
- 轮包内嵌（wheels y=0.014，部分埋入车身 y∈[0,0.022] 的 bumper 区）→ Polestar 风格

### D3 — Material tuning

去 metalness（性冷淡不闪），稍增 roughness（matte 哑光感强）：

```ts
// Person
{ vertexColors, roughness: 0.85, metalness: 0, flatShading, transparent }
// Car
{ vertexColors, roughness: 0.75, metalness: 0.05, flatShading, transparent }
```

**理由**：metalness 制造高光反射，与"建筑模型"哑光蒙皮感冲突。完全消除（人）或留 0.05（车，suggests painted metal but barely）。

### D4 — 字体识别测试 (back of envelope)

人 0.30 高、camera 距 4 wu（scene 1.2 末位）→ 角度尺寸 ≈ 4.3°。约屏幕 60–80 px 高，看得见结构（头/躯干/腿三段分明）。

god view（Y=15）→ 顶视角，footprint = leg 间距 0.024 + 衣身 0.048 ≈ 0.05 wu。屏幕投影 ~1.5%（很小但可见为亮点）。

车 0.18 长 × 0.04 高 × 0.06 宽。street view ≈ 6° 角度尺寸；god view ≈ 0.18×0.06 footprint ≈ 5×3 px。两个尺度都过得去。

## Risks / Trade-offs

- **[Armless figure 远景看像柱子]** scene 1.5 god view 下手臂本就看不见，所以 armless 没差。street view 下"无臂剪影"是建筑师 figure 的一部分，可读为"匿名行人"。如果实测觉得太呆，下一版再补"短臂"。

- **[ExtrudeGeometry profile points 写错车型扁]** 第一版 8 个 anchor points 是 sedan typical proportions。如果跑出来像 SUV / 卡车，调 profile 数值即可。提供常量 export，便于未来调。

- **[Glass strip 通过 vertex colors 不可能]** ExtrudeGeometry 输出的 buffer 顶点不直接对应"profile 顶部"——需要识别哪些顶点属于 cabin top。
  → 缓解：ExtrudeGeometry 输出的 vertices 顺序固定（先 front face，再 back face，再 sides）。我们可以判断每个 vertex 的 (x, y) 是否属于 cabin top 段（y > 0.030），是则 paint glass color。这是简单空间判定，不是顶点序号 hack。

- **[Single color 整个 figure 太平]** 实测如果觉得"白雾雾一片不分明"，加 0.5px 暗化 outline shader（OutlinePass）—— 但这要 postprocessing，本 propose 不做。先看实测。

- **[Wheel cylinder 6 段 vs 8 段]** 6 段五边形 wheel 看起来像齿轮——不平滑。8 段六边形 wheel 视觉接近圆。先用 8 段。

## Migration Plan

1. **Phase 1**：rewrite `buildPersonGeometry` + `buildCarGeometry` per D1/D2
2. **Phase 2**：tune material per D3
3. **Phase 3**：实测 / 调 profile points / 调色板
4. **Phase 4**：作者 sign-off + archive

回滚：单 commit 替换 `lib/cinema/agentMeshes.ts` + 一处 material 改动。git revert 即可。

## Open Questions

1. **Q1 — 是否补"短臂"剪影？** 第一版 armless，看效果。如果远景下"棒槌感"明显再说。
2. **Q2 — 玻璃 strip 通过 vertex y > 0.030 判定还是另开 mesh？** 顶点判定更省 1 个 instance；另开 mesh 更精确。先用顶点判定。
3. **Q3 — 车朝向是否需要随路径方向？** 现在所有车都朝 +x 方向，沿路径走时方向不变（所以转弯时车身是斜的）。如果实测觉得违和，需 yaw rotation per agent — 增加 useFrame 开销。先用静态朝向。
4. **Q4 — Person 是否需要 yaw 朝向？** 同上，但人转身比车更允许"瞬间方向变"。第一版静态 yaw，实测后再说。

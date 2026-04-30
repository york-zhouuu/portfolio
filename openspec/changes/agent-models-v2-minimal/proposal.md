## Why

`cinema-map-overlays` 落了第一版人/车 geometry：栈两个 box 的车 + 四件套（头/躯干/腿/臂）的人。Morandi 调色板让色彩好了，但**形态还是丑**：

- **人比例不对**：现 ~5 head heights，看着像粗壮 NPC。架构师在 SketchUp 用的 scale figure 是 7-8 heads，修长。
- **人细节过多**：4 种颜色（皮 / 衫 / 裤 + 鞋暗示）+ 6 件部位 → 视觉信息过载，与极简哲学冲突。
- **车形状粗陋**：chassis + cabin 两 box 叠起 → 巴士感。Polestar / Tesla 需要侧面 profile 流线连贯。
- **车比例偏方**：3.3:1 长高，sedan 应 4.5–5:1。

作者要的是**性冷淡 / 北欧极简 + 真正 Low Poly**——不是"卡通游戏 NPC"，而是**建筑模型里的 scale figure**：单色剪影、修长比例、克制造型；车则像 Polestar 概念图的低多边形版——长低流畅。

## What Changes

- **Person 重新设计**：架构 scale-figure 比例
  - 总高 0.22 → **0.30**（+35%），瘦长
  - 7.5 head heights（head r=0.020, total/head = 7.5）
  - 比例：legs 50%, torso 35%, neck/head 15%
  - **省略手臂**——架构 scale figure 通常不画手臂，剪影感更强
  - 单色 + 单暗色（上半身/下半身二分），其余皆同
  - 几何：head SphereGeometry 8×6（不再 icosahedron — 太"游戏"）
- **Car 重新设计**：ExtrudeGeometry 侧面 profile
  - 替换"chassis box + cabin box"为**单个侧面 profile 拉伸**
  - Profile points 描出真车侧脸：bonnet 渐升 → 风挡 → 车顶 → 后窗 → 尾箱
  - 总长 0.15 → **0.20**（+33%），长高比 3.3 → 5
  - 4 个 wheel cylinder 内嵌进 wheel arch（不再外挂方块）
  - 单色 + 一条 darker window strip（挡风玻璃）
- **色板再收缩**：Morandi → 性冷淡纯净版
  - Person：单色 dusty bone（一个色）+ 鞋区稍深
  - Car：单色 dusty body + 深 charcoal window
  - 移除饱和度任何痕迹（之前 dusty teal / terracotta 还有 hue，新版往 neutral 收）
- **保留**：mesh registry / 路径采样 / 速度 / progressive reveal 不动
- **不破坏现有 mdx**：geometry 是渲染层产出，mdx Beat 1.1 完全不动

## Capabilities

### Modified Capabilities

- `cinematic-case-study-page` — `<AgentsTrajectoriesOverlay>` 的两个几何 factory 重写；rendering 风格切换。

### New Capabilities

_None — 形态迭代，不引入新 capability。_

## Impact

- **代码**：
  - `lib/cinema/agentMeshes.ts`（重写两个函数）
  - `components/cinema/overlays/AgentsTrajectoriesOverlay.tsx`（material tuning）
- **视觉**：人/车形态 + 配色全面更换。整体观感从"卡通"→"建筑师工作模型"。
- **性能**：车 ExtrudeGeometry 单段几何 < 双 box，无新开销。人省略手臂 → 几何精简。
- **不影响**：sand table / camera / mapState / overlay 接口 / 文字 / 路径 / 速度
- **风险**：
  - ExtrudeGeometry 在 Next.js bundler 下可能与 BufferGeometryUtils 一样有 import 问题——但 ExtrudeGeometry 是 three.js core 不是 examples/jsm，不存在路径问题
  - 移除手臂可能让某些远视角下人物剪影像"棒槌"——实测后再决定要不要补回来

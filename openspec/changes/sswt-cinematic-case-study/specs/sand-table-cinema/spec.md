## ADDED Requirements

### Requirement: 单实例 R3F canvas

整个案例研究页面 SHALL 仅实例化一个 `react-three-fiber` Canvas；所有沙盘几何、agent、干预层、后处理通道 MUST 共享该 canvas。

#### Scenario: DOM 中检查 canvas 数量

- **WHEN** 页面完整加载并滚动至任意 beat
- **THEN** 文档中 `canvas[data-r3f]` 选择器匹配数量为 1

### Requirement: Lane Cove 沙盘几何

沙盘 SHALL 从 `public/case-studies/sswt/map-geometry.json` 加载真实 Lane Cove 几何（建筑 footprint + 高度 + 街道 + POI 标签）；建筑材质 SHALL 为 matte clay 风格（`#E8E4DC` 至 `#C8C2B6`，roughness 0.85，metalness 0）；街道 SHALL 为浅灰平面 `#D6D2C9` 无贴图。

#### Scenario: map-geometry.json 缺失

- **WHEN** 页面加载时 `map-geometry.json` 不可用
- **THEN** 自动降级到 storyboard 路由；console 输出明确错误（不静默失败）

#### Scenario: 建筑 LOD

- **WHEN** 相机距离建筑 > 200m（沙盘坐标）
- **THEN** 建筑使用 InstancedMesh 简化六面体渲染；< 200m 切换到带细节 mesh

### Requirement: Tilt-shift 后处理

Sand-table cinema SHALL 在 cinema canvas 上叠加 tilt-shift（移轴模糊）后处理通道；该通道 SHALL 在 Act 1.3 沙盘召唤镜头中从强度 0 ramp 到目标值；该通道 MUST 在 GPU tier ≤ 1 的设备上走简化高斯近似路径。

#### Scenario: 桌面端高 tier GPU

- **WHEN** `detect-gpu` 报告 tier ≥ 2
- **THEN** tilt-shift 走分离式两通道（垂直 + 水平），呈现完整移轴模糊效果

#### Scenario: 中端移动设备

- **WHEN** `detect-gpu` 报告 tier ≤ 1
- **THEN** tilt-shift 走单通道高斯近似；视觉强度近似但 fragment shader cost 减半

### Requirement: Camera score 数据结构与插值

Camera score SHALL 是一份 TypeScript 类型 + Zod 校验的数据 artifact，存储为 `lib/cinema/score.sswt.ts`；score 中每个 Beat MUST 声明 `range: [number, number]`、`shot: Shot`、`hud: Hud`、`fallbackFigure: string`；score 总长度 MUST 为 1.0；相机参数 SHALL 通过 spring + maath 在关键帧间插值。

#### Scenario: Score 校验失败

- **WHEN** score JSON 中有 beat 的 `range` 与相邻 beat 不连续（存在 gap 或 overlap）
- **THEN** Zod 校验失败，build 报错指出具体的 progress 区间

#### Scenario: 用户滚动到 progress = 0.5

- **WHEN** scroll progress = 0.5
- **THEN** `shotAt(t=0.5)` 返回 Act 2 中对应 beat 的相机参数（已插值），sand-table 在该参数下渲染

### Requirement: Act 1 真实世界 → 沙盘召唤过渡

Act 1.1 与 1.2 SHALL 渲染真实世界视频/图像层（位于 cinema canvas 上层 fixed-position video）；Act 1.3 启动时 SHALL 执行 cross-fade（持续 ~0.3s）从 video 层到 sand-table 层；过渡期间相机位置 / 朝向 / 焦距 MUST 保持完全连续；建筑 extrusion 动画 SHALL 在该 cross-fade 中从 0 高度 ramp 到目标高度（约 1.5s）。

#### Scenario: 滚动到 progress 0.22

- **WHEN** scroll progress 跨过 0.22
- **THEN** video 层 opacity 开始降至 0；sand-table 建筑挤出动画启动；tilt-shift 强度从 0 开始增加；过程总长 ~1.5s（按滚动速度自适应）

#### Scenario: 用户在过渡中段停下

- **WHEN** 用户停在 progress = 0.23
- **THEN** spring 缓冲到最近稳定锚点（即 progress = 0.22 或下一个锚点），不停在视觉中段

### Requirement: 干预层（hyperlocal push 可视化）

Act 2 Beat 4 时段（progress 0.68–0.78），sand-table SHALL 渲染 feed pulse（青色 `oklch(0.78 0.14 215)` 半透明球面波）、attention 半径环、agent 路径偏转的高亮覆盖；该层在其它 beat 时段 MUST 不可见。

#### Scenario: 进入 Act 2.4

- **WHEN** scroll progress 跨过 0.68
- **THEN** 选中 agent 上方浮起 feed item 卡片 HUD；agent 位置发出青色球面波；attention 半径环出现；agent 沿新轨迹（青色高亮）移动

#### Scenario: 离开 Act 2.4

- **WHEN** scroll progress 超过 0.78
- **THEN** 干预层视觉元素 fade-out，sand-table 回到基础白模 + 街道渲染

### Requirement: A' 镜像反演（Act 3.2）

Act 3 Beat 2 时段（progress 0.88–0.96），sand-table SHALL 执行视觉反演：底色 cross-fade 到深紫 `oklch(0.18 0.06 300)`、干预层从青色切换到洋红、agent 路径回退至灰色基线；相机位置 / 朝向 MUST NOT 改变。

#### Scenario: 进入 Act 3.2

- **WHEN** scroll progress 跨过 0.88
- **THEN** sand-table 底色开始 cross-fade（持续 ~0.5s）；干预层 cyan→magenta；构图与 Act 2.4 干预镜头几何重合

#### Scenario: 用户在 Act 3.2 启用 mirror-toggle

- **WHEN** 用户点击 hud-panel 的 A vs A' toggle
- **THEN** 沙盘视觉在两种状态间切换，不影响相机位置；toggle 状态独立于 scroll progress

### Requirement: Agent 轨迹回放

Sand-table SHALL 从 `public/case-studies/sswt/trajectories.json` 加载 smoke run 真实轨迹；agent 数量 MUST 为从 sampled-agents.json 加载的真实采样集合；MUST NOT 使用任何 mock persona。

#### Scenario: 加载 trajectories

- **WHEN** sand-table 初始化完成
- **THEN** agents 在 Act 2.3 时段按真实 smoke run 时间序列在沙盘上移动；播放速度由 camera score 控制（默认 4× 加速）

#### Scenario: 选中单个 agent（Act 2.2）

- **WHEN** 进入 Act 2.2 push-in 镜头
- **THEN** 单个 agent 被选中（发光描边），其它 agent DoF 模糊；HUD 显示该 agent 的 personality 八维 / 当日 plan / 模型 tier

### Requirement: 性能预算

Sand-table cinema SHALL 满足以下预算：cinema canvas 首帧 < 1.0s（相对 Act 1.3 启动）；总 JS payload (gzip 首屏) < 380KB；中端移动设备 ≥ 80% 帧率维持 60fps；内存峰值 < 350MB。

#### Scenario: Lighthouse 性能审计

- **WHEN** 在 throttled Fast 3G 环境运行 Lighthouse mobile audit
- **THEN** Hero / Act 1.1 LCP < 2.5s；TBT 在合理范围（< 200ms）

#### Scenario: 页面进入后台

- **WHEN** 标签页 visibility 变为 hidden
- **THEN** rAF 循环暂停，cinema score t 状态保留；返回前台时从保留状态恢复

### Requirement: 调试与开发期工具

开发模式 SHALL 暴露 leva GUI 用于调整 camera score 参数；prod build SHALL 自动 tree-shake leva；camera score 一旦确认 SHALL 通过 `scripts/snapshot-cinema-score.ts` 一键导出 JSON 落入 git。

#### Scenario: 开发模式启动

- **WHEN** `pnpm dev` 启动且 `NODE_ENV=development`
- **THEN** 浏览器右上角出现 leva 面板，可实时调整 camera FOV / 关键帧位置 / tilt-shift 强度

#### Scenario: 生产 build

- **WHEN** `pnpm build` 运行
- **THEN** 输出 bundle 中不包含 leva 代码；`grep "leva"` 在 `.next/static/` 下零结果

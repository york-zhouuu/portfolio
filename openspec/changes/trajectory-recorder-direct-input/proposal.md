## Why

`cinema-trajectory-recorder` v1 已上线，但作者实测反馈：**纯靠 OrbitControls 鼠标飞镜头到精确坐标"折磨"**。例如要从 [0, 0.05, 4] 微调到 [0, 0.08, 4.2] —— 鼠标拖根本到不了精度。

需要：
1. **直接输入坐标**——任何 waypoint 的 position / lookAt 可以直接键盘敲数字
2. **键盘移动**——WASD/QE 分轴 nudge 当前 camera，配合数字微调
3. **回到 waypoint**——点 waypoint 项相机飞到该坐标

## What Changes

### A. Waypoint 编辑器加 6 个数字输入

每个 waypoint 选中后展开的编辑区，加：
- position [X] [Y] [Z] —— 三个 number input
- lookAt [X] [Y] [Z] —— 三个 number input

输入即时更新 waypoint 状态。**不**自动移动相机（避免输入过程中相机抽搐）。

### B. "Go to" 按钮

每个 waypoint 卡片右侧加 ▶ 按钮（或双击）→ 相机飞到该 waypoint 的 position + lookAt。复用既有 `cameraSeed` 通路。

### C. 键盘 WASD / QE / 方向键 nudge

| 键 | 动作 |
|---|---|
| W / S | 沿 camera forward 投影到 XZ 平面 ± 前后（不抬高）|
| A / D | strafe 左右（cross 世界 up）|
| Q / E | 世界 Y 轴 ± 上下 |
| ↑ / ↓ / ← / → | 移动 lookAt（target）方向 |
| Shift + 任一 | 5× 步长 |
| Alt + 任一 | 0.1× 步长（精修） |

基础步长 0.2 wu。按住键 = 持续移动（每帧 step × dt × 6）。

实现：TrajectoryClient 维护 `pressedKeys: Set<string>`，DevCameraDriver 每帧读 ref 应用 delta。

### D. Live readout 直接输入

左上 readout 从纯显示改为 6 个 inline number input：
- position [X] [Y] [Z]
- lookAt [X] [Y] [Z]

输入并 Enter / blur 后，相机跳到该坐标（用 `cameraSeed` 触发 snap）。

### E. 保持兼容

- v1 既有 R / Space / E / Backspace / 鼠标 OrbitControls / 模板 / 导出 全部不变
- 不动 schema / 不动 trajectoryExport
- 不动 prod cinema 路径

## Capabilities

### Modified Capabilities

- `cinema-dev-tools` — trajectory recorder 加直接输入与键盘 nudge 操作

### New Capabilities

_None — v1.1 增量改进。_

## Impact

- **改动文件**：
  - `app/dev/trajectory/RecorderPanel.tsx` —— waypoint 编辑器加 6 个 number input + Go to 按钮
  - `app/dev/trajectory/TrajectoryClient.tsx` —— pressedKeys 状态 + 编辑 readout + 把 nudge 通过 ref 传给 canvas
  - `app/dev/trajectory/DevCinemaCanvas.tsx` —— DevCameraDriver 每帧消费 nudge ref + apply WASDQE/方向键 delta
- **不动**：lib/cinema/* / schema / mdx / prod 路径

- **依赖**：cinema-trajectory-recorder ✓（v1 已上线）

- **风险**：
  - input focus 期间空格 / R 等快捷键被 input 吞？已有保护（TrajectoryClient onKey skip if input/textarea focused），number input 同理
  - WASD 持续移动可能与 OrbitControls 冲突？OrbitControls drag 时不发 keydown，互不打扰

- **build 体积**：估 +2-3kB（一些 UI + 键盘逻辑）

## MODIFIED Requirements

### Requirement: Waypoint 卡片支持直接编辑 position / lookAt

每个 waypoint 选中后展开的编辑区 SHALL 提供 6 个 number input：position 的 X / Y / Z 与 lookAt 的 X / Y / Z。每个 input change 立即更新该 waypoint 状态（onUpdate patch）。

#### Scenario: 修改 position.X

- **WHEN** 用户在 waypoint #2 的 position X input 输入 1.5
- **THEN** waypoint #2 的 position[0] 变为 1.5
- **AND** waypoint 卡片的 position 显示行同步更新

#### Scenario: 输入空字符串

- **WHEN** 用户清空 input
- **THEN** 视为 0（或保留原值，由实施决定，不报错）

### Requirement: Waypoint 卡片提供 "Go to" 按钮

每个 waypoint 卡片 SHALL 提供 ▶（Go to）按钮。点击后：

1. 当前 mapState 切换到该 waypoint 的 mapState
2. 相机飞到该 waypoint 的 position
3. OrbitControls.target 设为 lookAt

#### Scenario: 点击 Go to

- **WHEN** 用户点 waypoint #3 的 ▶
- **THEN** 相机 position = waypoint[3].position
- **AND** OrbitControls.target = waypoint[3].lookAt
- **AND** mapState UI 显示 waypoint[3].mapState

### Requirement: 全局键盘 nudge

页面 SHALL 监听全局 keydown / keyup 维护当前按下键集合。每帧根据按下键修改相机 position / target：

| 键 | 动作 |
|---|---|
| KeyW | 相机 + target 沿 camera forward (XZ 投影) 前进 |
| KeyS | 相机 + target 沿 camera forward (XZ 投影) 后退 |
| KeyA / KeyD | 相机 + target 沿世界 right 方向 strafe |
| KeyQ / KeyE | 相机 + target 沿世界 Y ± |
| ArrowUp / Down / Left / Right | 仅 target 沿 forward / right 移动（视角旋转效果）|
| ShiftLeft / ShiftRight | 步长 × 5 |
| AltLeft / AltRight | 步长 × 0.1 |

基础步长 0.2 wu。input / textarea / contentEditable focused 时跳过键盘 nudge。

#### Scenario: 按 W

- **WHEN** 用户按住 W 键 1 秒
- **THEN** 相机沿 forward 方向移动约 0.2 × 60 × 1 = 12 wu（实际受帧率与 clamp 影响）
- **AND** OrbitControls.target 同步移动等量 → 视角方向不变

#### Scenario: Shift + W

- **WHEN** 用户按住 Shift + W 1 秒
- **THEN** 相机以 5× 速度前进

#### Scenario: input focused

- **WHEN** 用户在 number input 中输入数字
- **THEN** WASD / arrow 键等输入字符不触发相机移动

### Requirement: Live readout 可直接编辑

左上方 live readout SHALL 提供 6 个 inline number input（position X/Y/Z + lookAt X/Y/Z）。Enter 或 blur 后相机 snap 到输入坐标。

#### Scenario: 输入 position.X = 5

- **WHEN** 用户改 readout position X 为 5 并 Enter
- **THEN** 相机 position.x = 5（其他分量保持）

#### Scenario: 编辑过程中

- **WHEN** 用户正在输入数字（未 Enter / 未 blur）
- **THEN** 相机不移动（避免 jitter）


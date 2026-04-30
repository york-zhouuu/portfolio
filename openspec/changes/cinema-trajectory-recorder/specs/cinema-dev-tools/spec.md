## ADDED Requirements

### Requirement: Trajectory Recorder 路由可访问

`/dev/trajectory?slug=<case-study-slug>` 路由 SHALL 渲染一个独立调试页面，复用既有 cinema canvas / SandTable / overlays，但替换 CameraRig 为 FreeFlyCamera。

#### Scenario: slug 参数缺失

- **WHEN** 访问 `/dev/trajectory` 无 slug 参数
- **THEN** 渲染默认 slug 即 `synthetic-socio-wind-tunnel`，或显示 slug picker

#### Scenario: 不合法 slug

- **WHEN** slug 在 case studies 中不存在
- **THEN** notFound 404

### Requirement: Free-fly camera 可自由飞行

页面 SHALL 用 OrbitControls（`@react-three/drei`）允许鼠标 / 键盘自由控制相机：左键拖 = orbit / 右键拖 = pan / 滚轮 = dolly。

#### Scenario: 鼠标拖动

- **WHEN** 用户左键拖动 canvas
- **THEN** 相机围绕当前 lookAt target orbit

#### Scenario: 滚轮缩放

- **WHEN** 用户滚动鼠标滚轮
- **THEN** 相机沿视线方向 dolly in / out

### Requirement: 实时显示相机坐标

页面 SHALL 在 viewport 一角显示当前 `camera.position` 与 `OrbitControls.target` 的 [x, y, z] 数值，每帧更新（throttle ≤ 30Hz）。

#### Scenario: 相机移动后

- **WHEN** 用户拖动调整相机
- **THEN** readout 数值实时（≤ 100ms 延迟）反映新位置

### Requirement: Waypoint 录制 / 编辑 / 删除

UI SHALL 提供：

- "Add waypoint" 按钮（或键盘 R）抓取当前 camera position / lookAt / mapState 作为新 waypoint
- waypoints 列表展示，每项可 inline 编辑 position / lookAt / mapState / duration
- 删除按钮（或键盘 Backspace 选中项）

#### Scenario: 添加 waypoint

- **WHEN** 按 R 或点 "Add waypoint"
- **THEN** 列表新增一项，包含当前 position / lookAt / 当前选中的 mapState / 默认 durationToNext = 3s

#### Scenario: 编辑 duration

- **WHEN** 改 waypoint i 的 duration 输入框
- **THEN** 状态更新；下次 export 反映新值

#### Scenario: 删除 waypoint

- **WHEN** 按 Backspace 在选中 waypoint i
- **THEN** 列表移除该项，后续 waypoint 重排

### Requirement: mapState 实时切换

页面 SHALL 提供 mapState 控制 UI（mode dropdown / dim slider / overlay dropdown），切换立即影响 SandTable 渲染。

#### Scenario: 切换 mode

- **WHEN** 用户从 mode dropdown 选 "blueprint"
- **THEN** SandTable 立即切到 blueprint 材质

#### Scenario: 切换 overlay

- **WHEN** 用户从 overlay dropdown 选 "agents_trajectories"
- **THEN** AgentsTrajectoriesOverlay 渲染

### Requirement: 6 个预设运镜模板

`lib/cinema/trajectoryTemplates.ts` SHALL 导出至少 6 个预设模板：`ground-hold` / `ground-dolly` / `lift-to-god` / `orbit` / `push-in` / `bird-eye`。

UI 提供模板选择器，选中后 **替换** 当前 waypoints[] 为模板的 waypoints。

#### Scenario: 应用模板

- **WHEN** 用户从模板下拉选 "lift-to-god"
- **THEN** waypoints[] 替换为该模板的 2 个 waypoint
- **AND** 相机移动到第一个 waypoint 的位置

### Requirement: 导出 YAML 到 clipboard

页面 SHALL 提供 "Export" 按钮（或键盘 E）将 waypoints[] 序列化为符合 mdx scene[] schema 的 YAML 片段并写入剪贴板。

每相邻 waypoint 对 = 一个 scene block：
- `camera.from` = waypoint i.position
- `camera.to` = waypoint i+1.position
- `camera.lookAt` = waypoint i.lookAt
- `mapState` = waypoint i.mapState (omit `overlay` if "none")
- `rhythm`：from===to → "still"，否则 "tracking"
- `id`, `kind`, `emphasis`, `enter`, `exit` 留 placeholder（作者粘后填）

#### Scenario: 导出 3 waypoints

- **WHEN** 用户按 E
- **THEN** clipboard 含 2 个 scene block YAML
- **AND** UI 显示 toast "Copied N scenes"

#### Scenario: from === to 情况

- **WHEN** waypoint i.position === waypoint i+1.position
- **THEN** 输出的 scene rhythm = "still"

### Requirement: 预览播放

按 Space SHALL 在 waypoints 之间按 durationToNext 时长 linear 插值播放相机轨迹。再次按 Space 暂停。

#### Scenario: 进入预览

- **WHEN** 用户按 Space 且至少有 2 个 waypoints
- **THEN** 相机从 waypoints[0] 开始按 lerp 移动到 [1] 再到 [2] ...
- **AND** 总时长 = Σ durationToNext

#### Scenario: 暂停

- **WHEN** 预览中再按 Space
- **THEN** 相机停在当前插值位置

### Requirement: dev-only 路由不做 auth 但 noindex

`/dev/trajectory` 路由 SHALL：

- 顶部显示 "DEV TOOL — not for production" banner
- HTML head 包含 `<meta name="robots" content="noindex,nofollow">`

不做 auth gate（场景非敏感、本地开发优先）。

#### Scenario: 生产构建

- **WHEN** `pnpm build` 后访问 `/dev/trajectory`
- **THEN** 页面可访问但 banner 显示，搜索引擎不索引

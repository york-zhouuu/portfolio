## 1. Phase 1 — Waypoint 编辑器加 position / lookAt input + Go to

- [x] 1.1 `RecorderPanel.tsx` `WaypointEditor` 加 6 个 number input：position.x/y/z + lookAt.x/y/z
- [x] 1.2 编辑 input 立即派发 onUpdate patch
- [x] 1.3 waypoint 卡片头部加 ▶ Go to 按钮（与 × 删除并列）
- [x] 1.4 onGoTo 回调：setMapState + setCameraTargetSeed
- [x] 1.5 RecorderPanel props 加 `onGoToWaypoint(id)`

## 2. Phase 2 — pressedKeys 全局监听

- [x] 2.1 `TrajectoryClient.tsx` 加 `pressedKeysRef = useRef<Set<string>>(new Set())`
- [x] 2.2 keydown/keyup 监听（input focus skip）
- [x] 2.3 ref 通过 prop 传给 `DevCinemaCanvas`

## 3. Phase 3 — DevCameraDriver 消费 nudge

- [x] 3.1 接收 `pressedKeysRef` prop
- [x] 3.2 useFrame 内每帧计算 step + 修饰键倍率
- [x] 3.3 实现 WASD（forward / strafe）+ QE（vertical）+ 同步 target
- [x] 3.4 实现 Arrow 仅 target 移动
- [x] 3.5 controls.update() 同步内部状态
- [x] 3.6 帧率独立 clamp `step * min(delta * 6, 1)`

## 4. Phase 4 — Live readout editable

- [x] 4.1 readout 6 数字改为 `<input type="number">`
- [x] 4.2 local editing state 避免 jitter
- [x] 4.3 Enter / blur 派发 cameraTargetSeed 更新

## 5. Phase 5 — Help bar 更新

- [x] 5.1 底部帮助文字加：`WASD move · QE up/down · arrows look · Shift 5x · Alt 0.1x`

## 6. Phase 6 — 验证

- [x] 6.1 typecheck 通过
- [x] 6.2 build 通过
- [ ] 6.3 _(needs author)_ pnpm dev → /dev/trajectory：
  - 编辑 waypoint 坐标 → waypoint 数据更新（不动相机）
  - 点 Go to → 相机飞到 waypoint
  - WASD 持续移动 OK
  - Shift / Alt 修饰 OK
  - Arrow 仅 target 移动 OK
  - readout 编辑 → Enter / blur snap OK
  - input focused 时键盘不影响相机

## 7. 收尾

- [ ] 7.1 sign-off
- [ ] 7.2 archive

## Context

### 输入

- `cinema-trajectory-recorder` v1（已 done）—— Waypoint 数据结构 / DevCameraDriver / OrbitControls / RecorderPanel UI
- 作者反馈：鼠标飞达不到精确坐标，需要键盘 / 数字直接输入

### 不再讨论的事

- v1 整体架构（路由 / canvas / 录制 / mapState 控制 / 模板 / 导出）
- mdx schema / prod 路径

## Goals / Non-Goals

**Goals**:
- waypoint 卡片选中后可直接编辑 position / lookAt 各分量数字
- 每 waypoint 卡片提供 "Go to" 按钮飞至该坐标
- 全局 WASD / QE / 方向键 nudge（持续按住 = 持续移动）
- Shift = 5× / Alt = 0.1× 步长修饰键
- live readout 6 数字可编辑 + Enter / blur 后 snap 相机
- 与现有 OrbitControls / R 录制 / Preview 不冲突

**Non-Goals**:
- ❌ 不重设 OrbitControls 行为
- ❌ 不引入 spline / spring 平滑预览
- ❌ 不持久化输入历史
- ❌ 不做 axis lock toggle（v2 候选）

## Decisions

### D1 — Waypoint inline 编辑器扩展

`WaypointEditor` 组件加 6 个 number input，每个分量独立 input，blur / change 立即派发 `onUpdate(id, { position: [...]})` patch。

数字精度：`step="0.01"`，min/max 不强制。空字符串视为保留旧值。

### D2 — "Go to" 按钮

waypoint 卡片头部右侧加 ▶ 按钮（与 × 删除并列）。点击：
1. `setMapState({ ...waypoint.mapState })`
2. `setCameraTargetSeed({ position: [...], lookAt: [...] })`

复用既有 cameraSeed 通路（DevCameraDriver useEffect 已侦听 seed 变化）。

### D3 — 键盘 nudge 实现

`TrajectoryClient` 维护 `pressedKeysRef = useRef<Set<string>>(new Set())`：

```ts
useEffect(() => {
  const onKeyDown = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    pressedKeysRef.current.add(e.code); // use e.code for layout-independent
  };
  const onKeyUp = (e: KeyboardEvent) => {
    pressedKeysRef.current.delete(e.code);
  };
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  return () => { ... };
}, []);
```

把 ref 传给 DevCinemaCanvas → DevCameraDriver 每帧读：

```ts
useFrame((_, delta) => {
  const keys = pressedKeysRef.current;
  if (keys.size === 0) { /* skip nudge */ } else {
    const stepMul = keys.has("ShiftLeft") || keys.has("ShiftRight") ? 5 : keys.has("AltLeft") || keys.has("AltRight") ? 0.1 : 1;
    const step = 0.2 * stepMul * Math.min(delta * 6, 1); // clamp delta surge

    // forward direction (XZ plane)
    const fwd = new Vector3();
    camera.getWorldDirection(fwd);
    fwd.y = 0;
    fwd.normalize();
    if (fwd.lengthSq() < 0.001) { /* skip if camera straight up/down */ }
    const right = new Vector3().crossVectors(fwd, new Vector3(0, 1, 0)).normalize();

    let dx = 0, dy = 0, dz = 0;
    if (keys.has("KeyW")) { dx += fwd.x * step; dz += fwd.z * step; }
    if (keys.has("KeyS")) { dx -= fwd.x * step; dz -= fwd.z * step; }
    if (keys.has("KeyD")) { dx += right.x * step; dz += right.z * step; }
    if (keys.has("KeyA")) { dx -= right.x * step; dz -= right.z * step; }
    if (keys.has("KeyQ")) { dy += step; }
    if (keys.has("KeyE")) { dy -= step; }

    if (dx !== 0 || dy !== 0 || dz !== 0) {
      camera.position.x += dx; camera.position.y += dy; camera.position.z += dz;
      if (controlsRef.current) {
        controlsRef.current.target.x += dx;
        controlsRef.current.target.y += dy;
        controlsRef.current.target.z += dz;
      }
    }

    // Arrow keys nudge target only (rotate effect when paired with WASD)
    let tx = 0, ty = 0, tz = 0;
    const tstep = step;
    if (keys.has("ArrowUp"))    { tx += fwd.x * tstep; tz += fwd.z * tstep; }
    if (keys.has("ArrowDown"))  { tx -= fwd.x * tstep; tz -= fwd.z * tstep; }
    if (keys.has("ArrowRight")) { tx += right.x * tstep; tz += right.z * tstep; }
    if (keys.has("ArrowLeft"))  { tx -= right.x * tstep; tz -= right.z * tstep; }
    if (controlsRef.current && (tx !== 0 || tz !== 0)) {
      controlsRef.current.target.x += tx;
      controlsRef.current.target.z += tz;
      controlsRef.current.update();
    }
  }
});
```

`e.code` (KeyW / ArrowUp) 而非 `e.key`，避免输入法 / 大小写不一致。

WASD 同步 camera + target 等量平移 → 视角不变只 strafe。
Arrow 仅移 target → 视角旋转效果。

### D4 — Live readout 编辑

readout 从纯显示 div 改为 inline `<input type="number">` × 6。focus / 输入 / blur 时不立即应用，按 Enter 或 blur 才调用 `setCameraTargetSeed({ position, lookAt })` 触发 snap。

避免重渲染 jitter：用 local state 持有正在编辑的值，blur/Enter 才提交到上层。

### D5 — 步长 / 速度 commit

- 基础步长 BASE = 0.2 wu
- Shift = × 5（快移）
- Alt = × 0.1（精修）
- 帧率独立：`step * min(delta * 6, 1)` ≈ 60Hz baseline

实测后可调（design.md Q1）。

### D6 — UI 中提示新快捷键

底部 help bar 加：

```
WASD move · QE up/down · arrows look · Shift 5x · Alt 0.1x
```

## Risks / Trade-offs

- **[键盘 conflict]** input 聚焦时 keydown 不触发 nudge（已有 skip）。但 RecorderPanel 内 input 多——浏览器可能 still propagate? 已 verify v1 R 键 skip 工作。同套防护
- **[step 帧率敏感]** clamp 防大 delta 跳跃
- **[OrbitControls update]** target 改后需手动 `controlsRef.current.update()` 才同步内部状态；nudge 时显式调用
- **[input 状态同步]** waypoint 编辑时 input value 来自 prop；外部更新（如 nudge 后 R 录新值）不应踩到正在编辑的 input。controlled input 受 React 控制，外部更新会覆盖，但用户编辑后立即派发 onUpdate 写回，循环 OK

## Migration Plan

1. **Phase 1** — RecorderPanel WaypointEditor 加 6 个 position/lookAt input + Go to 按钮
2. **Phase 2** — TrajectoryClient pressedKeysRef + 全局 keydown/keyup 监听 + 把 ref 传给 canvas
3. **Phase 3** — DevCameraDriver useFrame 消费 nudge ref + WASDQE/Arrow 实现
4. **Phase 4** — Live readout 改 inline editable
5. **Phase 5** — Help bar 文字更新
6. **Phase 6** — typecheck / build

回滚：单 commit revert 即可（仅文件级改动）。

## Open Questions

1. **Q1 — step 速度** 0.2 wu 基础合适吗？实测后调
2. **Q2 — 是否要 PageUp/PageDown 抬升相机** 多余（QE 已覆盖），不做
3. **Q3 — Mouse middle drag 是否要 strafe** OrbitControls 默认行为，不动
4. **Q4 — Axis lock toggle** "lock Y" 让 WASD 不影响 Y。v2 加

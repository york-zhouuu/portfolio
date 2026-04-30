## Why

镜头坐标全程靠"作者口述 → AI 推导 → 来回 6 次微调" 现在已经痛点严重。Beat 1 的 4 个 scene 已经反复调了多轮 Y / Z / lookAt 还没 nail 死。每个未来 beat / scene 都会遇到同样的 "I know it when I see it" 循环。

**根因**：作者脑子里的镜头是视觉的，YAML 是数字的，两者之间没有直接接口。

**本 propose 输出**：一个 dev-only 调试平台，让作者**直接在 3D 场景里飞镜头、按一下"录"键就把当前 camera + lookAt + mapState 抓成 waypoint**。多个 waypoints + 时间 + 模板 → 自动生成可粘到 mdx 的 scene YAML 片段。

## What Changes

### 新增 dev tool 路由

`/dev/trajectory?slug=synthetic-socio-wind-tunnel` —— 复用既有 cinema canvas（实际 SandTable / agents / overlays），但替换 CameraRig 为 **FreeFlyCamera**（自由飞行相机，drei 提供 OrbitControls）+ 浮动 **RecorderPanel** UI。

### 核心交互

1. **自由飞行**：左键拖 = orbit / 右键拖 = pan / 滚轮 = dolly / WASD = move
2. **录 waypoint**：按 `R` 或点 UI 按钮 → 抓取当前 `position / lookAt / mapState (mode / dim / overlay)` 作为新 waypoint
3. **mapState 切换**：UI 面板下拉框可以换 mode / overlay / dim slider，立即生效场景视觉
4. **每段时间**：waypoint i → waypoint i+1 之间有可调 duration（秒）
5. **模板**：右上角下拉，挑预设轨迹（"街道平视 hold" / "ground dolly forward" / "lift to god view" / "orbit at altitude" / "push-in close" / "bird-eye reveal"），一键填入 waypoints 起点
6. **预览**：按 Space 播放 waypoints 序列，相机按 spline / linear 在 waypoints 间插值
7. **导出**：按 E / 点 Copy → clipboard 写入 YAML scene[] 片段（可直接粘到 mdx）

### 输出 YAML 格式

每段（waypoint i → i+1）= 一个 scene 的 from/to。kind / rhythm / emphasis 由作者粘到 mdx 后自己填（dev 工具不假设 narrative kind）：

```yaml
- id: scene-X-Y-PLACEHOLDER
  kind: title  # ⚠️ TODO 作者填
  rhythm: ???  # auto: still if from===to, tracking otherwise
  emphasis: ??? # auto: 由 duration 反推 CPS tier
  camera:
    from: [0, 0.05, 4]
    to: [0, 0.05, 4]
    lookAt: [0, 0.05, 0]
  enter: fade
  exit: fade
  mapState:
    mode: matte
    dim: 0.5
    overlay: agents_trajectories
```

### 不影响

- 不改 CameraRig 既有逻辑（dev 工具用独立 free-fly camera 组件，runtime 路径不变）
- 不动 mdx schema
- 不动 cinema-score / 渲染管线
- prod 构建不打包 dev 路由（next.js dev 路由可控）

## Capabilities

### Modified Capabilities

_None — 完全独立 dev 工具，不动 prod 路径。_

### New Capabilities

- `cinema-dev-tools` — 新增能力域，承载所有 dev-only 调试与作者工作流工具。本 propose 是该能力域的第一个工具。

## Impact

- **新增文件**：
  - `app/dev/trajectory/page.tsx` —— 路由入口
  - `app/dev/trajectory/TrajectoryClient.tsx` —— client 组件，承载 canvas + 录制 UI
  - `components/dev/FreeFlyCamera.tsx` —— OrbitControls 包装 + 实时坐标 readout
  - `components/dev/RecorderPanel.tsx` —— waypoint 列表 / mapState 切换 / 时间 / 模板 / 导出 UI
  - `lib/cinema/trajectoryTemplates.ts` —— 6 个预设运镜模板
  - `lib/cinema/trajectoryExport.ts` —— waypoints → YAML 序列化
- **不动文件**：CameraRig / scene-types / 既有 cinema 组件 / mdx
- **依赖**：`@react-three/drei` (10.7.7 已安装) 提供 OrbitControls
- **风险**：
  - 路由 `/dev/*` 在生产构建是否暴露？Next.js 默认会包含——本 propose 加 robots disallow + 页面顶部 dev-only 提示，不做 auth gate（场景非敏感）
  - 自由飞行参数（速度 / 灵敏度）需要实测 tune
- **build 体积**：dev 路由代码独立 chunk，不进 /work/[slug] 主 bundle

## Workflow（实施后作者使用流程）

```
1. 起 pnpm dev
2. 访问 /dev/trajectory?slug=synthetic-socio-wind-tunnel
3. 飞镜头到 scene-X-1 的起始位置
4. 按 R 录 waypoint 1
5. 飞到 scene-X-1 的结束位置（同时调 mapState mode / dim / overlay）
6. 按 R 录 waypoint 2
7. 设 waypoint 1→2 的 duration（如 5s）
8. 重复 3-7 录入 scene-X-2 / X-3 / …
9. 按 E 导出 YAML 片段 → 粘到 mdx
```

## Templates（preset 列表）

| id | 名 | 描述 | 起点 → 终点（典型）|
|---|---|---|---|
| ground-hold | 街道平视 hold | 贴地静止 | `[0, 0.05, 4]` 自身 |
| ground-dolly | 街道前推 | 贴地 Z 推进 | `[0, 0.05, 4] → [0, 0.05, 2]` |
| lift-to-god | 抬升至 god view | 任意起点拉到 12 高 | `[from] → [0, 12, 12]` |
| orbit | 高空环绕 | 固定 Y 绕原点 | `[8, 8, 0] → [0, 8, 8]` |
| push-in | 主体推近 | Z 拉近至 lookAt | `[0, 4, 8] → [0, 2, 3]` |
| bird-eye | 俯瞰揭示 | 高 Y look down | `[0, 14, 0] → [0, 14, 0]` lookAt origin |

每个模板填充 from / to / lookAt 的初值，作者再调整。

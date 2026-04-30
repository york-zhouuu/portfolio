## 1. Phase 1 — 数据结构 + 模板

- [x] 1.1 `lib/cinema/trajectoryTypes.ts`：导出 `Waypoint` / `TrajectoryTemplate` types
- [x] 1.2 `lib/cinema/trajectoryTemplates.ts`：6 个预设模板（design.md D6）
- [x] 1.3 `lib/cinema/trajectoryExport.ts`：`exportToYaml(waypoints): string` 函数

## 2. Phase 2 — 路由 + canvas + free-fly camera

- [x] 2.1 `app/dev/trajectory/page.tsx`：server 组件，读 slug + frontmatter + geometry
- [x] 2.2 `app/dev/trajectory/TrajectoryClient.tsx`：client 组件，挂载 cinema canvas
- [x] 2.3 `components/dev/FreeFlyCamera.tsx`：包装 `<OrbitControls>`，暴露 `onChange` + 实时 readout
- [x] 2.4 顶部 dev-only banner + `<meta robots noindex,nofollow>`

## 3. Phase 3 — Recorder UI 主框架

- [x] 3.1 `components/dev/RecorderPanel.tsx`：浮动右侧面板，flex column 布局
- [x] 3.2 Camera readout 小窗（左上 / 右上）显示实时 position / lookAt
- [x] 3.3 Waypoint 列表：每项展示 idx / position / lookAt / duration
- [x] 3.4 "Add waypoint" 按钮，键盘 R 同效

## 4. Phase 4 — mapState 实时控制

- [x] 4.1 `components/dev/MapStateControls.tsx`：mode dropdown + dim slider + overlay dropdown
- [x] 4.2 `MapStateContext` (React Context)：dev-mode mapState 来源
- [x] 4.3 SandTable / overlay 组件兼容：dev mode 优先 context，非 dev mode 走 score-derived（既有逻辑）

## 5. Phase 5 — Templates

- [x] 5.1 RecorderPanel 顶部 "Templates" 下拉
- [x] 5.2 选模板 → confirm dialog → 替换当前 waypoints[]
- [x] 5.3 应用后相机自动飞到 waypoints[0]

## 6. Phase 6 — Export YAML

- [x] 6.1 "Export" 按钮调用 `exportToYaml` + `navigator.clipboard.writeText`
- [x] 6.2 Toast 提示 "Copied N scenes"
- [x] 6.3 键盘 E 同效

## 7. Phase 7 — 预览播放

- [x] 7.1 "Preview" 按钮 / Space 键启停
- [x] 7.2 useFrame 钩子按 elapsed 计算当前 segment + lerp t
- [x] 7.3 暂停时相机停在当前插值位置

## 8. Phase 8 — Inline 编辑 + 键盘

- [x] 8.1 Waypoint 行可点击展开编辑（position / lookAt / mapState / duration）
- [x] 8.2 删除按钮 / Backspace
- [x] 8.3 H 键显示 / 隐藏帮助 overlay
- [ ] 8.4 拖拽重排 waypoints（drag handle）⚠️ deferred — not in v1

## 9. Phase 9 — 验证

- [x] 9.1 typecheck 通过
- [x] 9.2 build 通过 / dev 路由独立 chunk
- [x] 9.3 _(needs author)_ pnpm dev → /dev/trajectory？slug=synthetic-socio-wind-tunnel：
  - 自由飞行 OK
  - readout 实时
  - 录 / 删 / 编辑 OK
  - mapState 切换 OK
  - 模板加载 OK
  - 导出 YAML 粘到 mdx 兼容
  - Preview 播放 OK

## 10. 收尾

- [x] 10.1 作者 sign-off
- [x] 10.2 archive：`openspec archive cinema-trajectory-recorder --yes`
- [x] 10.3 后续工具开新 propose（如 import YAML / spline preview / 持久化）

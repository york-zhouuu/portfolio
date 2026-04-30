## 1. Phase 0 — 撤销已加的 hack

- [x] 1.1 移除 `app/globals.css` 中的 `html { scroll-snap-type: y mandatory }` 与 `prefers-reduced-motion` 相关 snap 兜底
- [x] 1.2 移除 `app/work/[slug]/page.tsx` 内每个 scene marker 上的 `scrollSnapAlign` / `scrollSnapStop` 行内样式
- [x] 1.3 验证：`pnpm typecheck` + `pnpm content:lint` 干净
- [ ] 1.4 视觉验证：浏览器飞滚不再"啪啪停"，回归 free scroll 手感 _(needs author)_

## 2. Phase 1 — Schema 增加 rhythm 字段

- [x] 2.1 在 `lib/cinema/scene-types.ts` 的 `SceneBase` 中加 `rhythm: RhythmKind`；定义 `type RhythmKind = "motion" | "still" | "bridge"`
- [x] 2.2 在 `lib/content/case-study-schema.ts` 的 SceneSchema 加 `rhythm: z.enum(["motion","still","bridge"])`
- [x] 2.3 加 schema-level refine：`rhythm === "still"` 时 `camera.from` 与 `camera.to` 元素严格相等（superRefine 实现）
- [x] 2.4 节奏序列检查放在 content-lint.ts（warning），Phase 5 task 6.1 切到 fail()——schema refine 留给真正切 error 时一并迁移
- [x] 2.5 在 `content/case-studies/synthetic-socio-wind-tunnel.mdx` 的 Beat 1.1 七个 scene 各补 `rhythm: still`
- [x] 2.6 Beat 1.1 内 4 个原本 from→to 的 scene（lead/section-01/02/03）camera.to 折叠到 camera.from——**真实修复留给 beat-1-1-storyboard 单独迭代**
- [x] 2.7 节奏 lint 当前为 warning（content-lint.ts console.warn）——Beat 1.1 全 still 触发 warning 但不阻 build

## 3. Phase 2 — Sticky text 架构

- [x] 3.1 新建 `components/cinema/SceneAnchor.tsx`：sticky 容器 + 自身 rAF 循环计算 sceneLocalT（getBoundingClientRect 父 section）
- [x] 3.2 改写 `app/work/[slug]/page.tsx` 的 article：每个 scene `<section>` 内嵌 `<SceneAnchor scene={s}/>`，marker 高度 `computeSvh(scene)`
- [x] 3.3 删除原 `components/cinema/SceneLayer.tsx`
- [x] 3.4 z-index 层叠图（cinema-floor=0 / sticky=10 / hud=20 / grain=30）写入 globals.css 注释 + `.sticky-scene` class 定义
- [x] 3.5 sticky 容器 height: 100vh fallback + 100svh override（svh 解决 iOS 地址栏跳动）
- [x] 3.6 sticky 容器 `pointer-events: none`（CSS class 内）
- [ ] 3.7 视觉验证：飞滚通过 still scene 时，文字视觉位置不变只 fade in/out _(needs author)_

## 4. Phase 3 — CameraRig still 短路 + fade band 10/80/10

- [x] 4.1 CameraRig：still 分支直接锁 `scene.camera.from`，不调 dwellEase
- [x] 4.2 spring：新增 `SPRING_PROFILE_HOLD`（stiffness=400, ω=20 → settling 200ms）+ `SPRING_PROFILE_DEFAULT`；CameraRig 用 HOLD profile
- [ ] 4.3 视觉验证：进 still scene 时相机 spring 刹车，停在 cam.from；之后无任何位移 _(needs author)_
- [ ] 4.4 视觉验证：motion scene 仍走 dwellEase 内插（保留原行为）_(needs author)_
- [x] 4.5 修改 `lib/cinema/scrollCinema.ts` 中的 `sceneTransitionProgress`：把 18% / 64% / 18% 改为 **10% / 80% / 10%**；hold 段（中间 80%）opacity 强制 = 1
- [ ] 4.6 验证：still scene 在 hold 段内文字 opacity 严格 = 1（开 devtools 取样）；enter 与 exit 各 10% 内是平滑 fade _(needs author)_
- [x] 4.7 motion / bridge 的 fade 比例改用 30/40/30——在 sceneTransitionProgress 加 rhythm 参数

## 5. Phase 4 — Emphasis 字段 + CPS-based DURATION

- [x] 5.1 在 `lib/cinema/scene-types.ts` 定义 `EmphasisKind` + 常量 `CPS_ZH` / `EMPHASIS_FACTOR` / `REACTION_S` / `SCROLL_PX_PER_S_BASELINE` / `VIEWPORT_PX_BASELINE` / `MIN_DWELL_S` / `MAX_DWELL_S`
- [x] 5.2 实现 `computeStillSvh(scene)`：char 数中英分别算 dwell 取 max + clamp [1.5s, 6.5s]
- [x] 5.3 实现 `computeMotionSvh(scene)`：`max(100, motionGeometryToSvh × EMPHASIS_FACTOR)`
- [x] 5.4 实现 `computeBridgeSvh(scene)`：`120 × EMPHASIS_FACTOR`
- [x] 5.5 实现 `motionGeometryToSvh(camera)`：欧氏距离 × 8（lookAtDelta 当前 schema 无 from/to lookAt 故为 0）
- [x] 5.6 实现辅助 `countCharsZh(scene)` 与 `countCharsEn(scene)`，含 paragraphs + KV + heading + twinColumns，不含 sectionNumber
- [x] 5.7 实现 `computeSvh(scene): number` 顶层调度
- [x] 5.8 在 schema 加 `emphasis: z.enum(...).default("standard")`
- [x] 5.9 移除 `DURATION_SVH` 常量；`DurationKind` 类型保留（仍被 schema optional 字段引用，下个 cleanup propose 再删）；schema 中 `duration` 改为 optional
- [x] 5.10 替换所有 `DURATION_SVH[scene.duration]` 调用为 `computeSvh(scene)`
- [x] 5.11 移除 mdx 中的 `duration: "short" | "mid" | "long"` 字段（7 处全清）
- [x] 5.12 svh 对比：Beat 1.1 老 1320svh → 新 4050svh（6 个 scene 触发 6.5s cap，露出 split 需求；beat-1-1-storyboard propose 拆完后回归）

## 6. Phase 5 — 三类 lint 切 error 与可视化

- [ ] 6.1 schema refine 的节奏规则（连续 still ≤ 2、连续 motion ≤ 1）从 warning 切到 error _(blocked by Beat 1.1 storyboard)_
- [x] 6.2 添加单 still scene 字数上限 lint（warning）：报当前字数、当前 emphasis 上限、降级建议
- [x] 6.3 添加 emphasis 分布 warning：linger > 15% / brief > 40% / standard < 40%
- [x] 6.4 节奏 + emphasis 摘要输出（每 beat 一行 `rhythm=[SSSSSSS] emphasis=[standard=6 dwell=1]`）
- [x] 6.5 节奏接近上限（连续 2 still）时输出 warning（不阻 build，与 6.2 一并实现）
- [ ] 6.6 跑 `pnpm content:lint` 全文件干净 _(blocked by Beat 1.1 storyboard)_

## 7. Phase 6 — Reduced motion 兜底（占位实现）

- [x] 7.1 globals.css 加 `@media (prefers-reduced-motion: reduce)` 块：sticky 改 static、子元素 transition/animation ≤ 100ms
- [x] 7.2 CameraRig：reducedMotion ref + useEffect 检测；与 still 同走 hold 路径
- [ ] 7.3 手动 QA：macOS 减少动效开启 → 验证页面可滚到底，相机不连续位移 _(needs author)_
- [x] 7.4 翻页器 / 键盘导航 NOT IN SCOPE —— 留独立 propose `cinema-reduced-motion-paging`

## 8. 验证与上线

- [x] 8.1 全量回归：typecheck / content:lint / build 全绿（HudLayer 残留两个 unused-import warning 与本 propose 无关）
- [ ] 8.2 视觉对照表（截图前后）：飞滚 / 慢滚 / 减少动效 三种条件下的 Beat 1.1 行为 _(needs author)_
- [ ] 8.3 作者亲测 sign-off："文字不再飞过去" 作为 acceptance criteria _(needs author)_
- [ ] 8.4 OpenSpec archive：`openspec archive cinema-scroll-pacing --yes` _(after author sign-off)_

## 9. Open questions 闭环（实施过程中回填）

- [ ] 9.1 Q1 — sticky height: 100svh vs 100dvh 实测结论（task 3.5 完成后回填到 design.md）
- [ ] 9.2 Q3 — CPS 公式中英 max 取 dwell 是否够保守，跨案例验证（5.2 完成后回填）
- [ ] 9.3 Q4 — bridge 在 9 个 beat storyboard 推完后的真实使用率（独立 follow-up，不阻本 propose archive）
- [ ] 9.4 SCROLL_PX_PER_S_BASELINE 与 VIEWPORT_PX_BASELINE 假设值 1000/1000 是否需要按真实设备分布调整（移动端可能 viewport=850px，需要按比例缩放 svh）

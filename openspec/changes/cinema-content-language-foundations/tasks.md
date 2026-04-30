## 1. Phase 0 — Schema 拓展（无渲染改动）

- [x] 1.1 `lib/cinema/scene-types.ts`：扩展 `RhythmKind` 为 `"motion" | "still" | "tracking" | "bridge"`
- [x] 1.2 `lib/cinema/scene-types.ts`：定义 `MapMode`、`MapOverlayName`、`MapState` + `MAP_STATE_DEFAULT`
- [x] 1.3 `lib/cinema/scene-types.ts`：在 `SceneBase` 加 `mapState?: MapState`
- [x] 1.4 `lib/cinema/scene-types.ts`：定义新 SceneKind `SceneDataHit`，加入 `Scene` discriminated union
- [x] 1.5 `lib/content/case-study-schema.ts`：扩展 `RhythmKindEnum` 加 tracking
- [x] 1.6 `lib/content/case-study-schema.ts`：定义 `MapStateSchema`（dim 限 0..1）；加入 BaseSceneFields
- [x] 1.7 `lib/content/case-study-schema.ts`：在 SceneSchema discriminated union 加 `data-hit` 成员
- [x] 1.8 `lib/content/case-study-schema.ts`：tracking refine—`rhythm: tracking` 时 `camera.from !== camera.to`
- [x] 1.9 验证：typecheck + lint 通过；Beat 1.1 MDX 不动跑过（含 `sceneTransitionProgress` 签名扩展 + computeSvh 加 tracking 路径作为副产物）

## 2. Phase 1 — useResolvedMapState resolver

- [x] 2.1 新建 `lib/cinema/mapState.ts`：定义 `ResolvedMapState` 类型
- [x] 2.2 实现 `resolveMapStateAt(score, acts, t)`：dim 双段平滑 lerp、mode 5% 窗 cross-fade、overlay 10/80/10 fade
- [ ] 2.3 unit test — _deferred_：项目暂无 test 框架（jest/vitest 未配置）；视觉验证替代
- [x] 2.4 `useResolvedMapState(score, acts)` hook：rAF + scrollY → t → resolveMapStateAt + 浅 diff 优化
- [x] 2.5 ResolvedMapState 公约：modePrev=null 表示不在 cross-fade；overlayProgress=0 即 overlay==="none" 或正在 fade 完毕

## 3. Phase 2 — Material registry + sandtable mode prop

- [x] 3.1 新建 `lib/cinema/materials/registry.ts`：`MATERIAL_REGISTRY` + `getMaterialSet` + `registerMaterialMode`；只注册 `matte`
- [x] 3.2 提取材质为 `matteMaterialFactory(theme)` → MaterialSet（每个 layer 一份 spec）
- [x] 3.3 `<SandTable>` 接受 `mode / modePrev / modeFade / dim` props
- [x] 3.4 `<SandTable>` 内 cross-fade：modePrev 非空时同 geometry 双材质并挂，opacity 互补
- [x] 3.5 `<CinemaCanvas>` 通过 useResolvedMapState 把这 4 个值传给 SandTable
- [ ] 3.6 视觉验证：现状 build 不变 _(needs author)_

## 4. Phase 3 — Overlay registry + 接口

- [x] 4.1 新建 `components/cinema/overlays/registry.ts`：`OVERLAY_REGISTRY` + `getOverlay` + `registerOverlay`；初始仅注册 `none: () => null`
- [x] 4.2 新建 `<MapOverlay name={...} progress={...}/>` 组件：查表 fallback null
- [x] 4.3 `<CinemaCanvas>` 接入 MapOverlay（使用 resolvedMap.overlay + overlayProgress）
- [x] 4.4 跳过临时 _test_pulse overlay：lint 已能 surface 未注册 overlay；不需要冗余调试组件
- [x] 4.5 验证：typecheck 通过；未注册 overlay 渲染 null 不报错（warning 留在 Phase 7 lint 升级里）

## 5. Phase 4 — Tracking rhythm

- [x] 5.1 CameraRig：tracking 分支 linear lerp from→to（不走 dwellEase，不应用屏息漂移）
- [x] 5.2 sceneTransitionProgress：tracking 与 still 共用 10/80/10 readingFirst 分支
- [x] 5.3 computeSvh：tracking → computeStillSvh（CPS-based）
- [ ] 5.4 视觉验证：手动加 tracking scene 到 mdx _(needs author)_

## 6. Phase 5 — Data-hit kind 渲染

- [x] 6.1 新建 `components/cinema/scenes/SceneDataHit.tsx`：number 大字 + caption + paragraphs（progressive reveal 在 Phase 6 扩展）
- [x] 6.2 Studio Lamp token：number `[font-size:clamp(96px,16vw,180px)]` + caption font-mono uppercase tracking
- [x] 6.3 SceneAnchor SceneRenderer 加 `case "data-hit"` 路由
- [x] 6.4 countCharsZh/En 扩展 data-hit：caption + paragraphs 计入，number 不计
- [ ] 6.5 视觉验证：mdx 加 data-hit scene 看大数字风格 _(needs author)_

## 7. Phase 6 — Progressive reveal in body-section（核心）

- [x] 7.1 SceneBodySection：paragraphs.map → ProgressiveParagraph，slice = [i/N, (i+1)/N]，10/80/10 in slice
- [x] 7.2 SceneDataHit：DataHitParagraph 同样 progressive reveal（caption 也算一段）
- [x] 7.3 / 7.4 computeStillSvh 分发：body-section/data-hit 多 paragraph 时调 computeProgressiveSvh 累加 per-paragraph dwell；其他 kind 走单段 CPS 公式
- [x] 7.5 N=1 时 ProgressiveParagraph 跳过自己 fade（scene 外层 wrapper 已 fade）→ 视觉等价于旧单段
- [ ] 7.6 视觉验证：mdx 加测试多段 body-section，看错峰 fade _(needs author)_

## 8. Phase 7 — Lint 升级

- [x] 8.1 char-cap 改 per-paragraph：body-section / data-hit 走 .paragraphs[]，单字段 scene（title / lead / pull-quote）视为 1 paragraph；信息含 paragraph index
- [x] 8.2 rhythm 交替规则加 `tracking ≤ 1`
- [x] 8.3 unknown mapState.mode / overlay → warning + 注明 propose
- [x] 8.4 motion + 多 paragraph / 长文 + emphasis≠brief → warning 建议改 tracking
- [x] 8.5 Lint summary 输出 `mapState=[modes: …; overlays: …]` 当 scene 有 mapState 时

## 9. Phase 8 — 验证 Beat 1.1 grandfather 不变

- [x] 9.1 Beat 1.1 7 scene 无 mapState 字段；schema 接受、lint 通过
- [ ] 9.2 浏览器对比：Beat 1.1 视觉行为与 apply 前一致 _(needs author)_
- [x] 9.3 全量回归：typecheck + content:lint + build 全绿（HudLayer 残留 unused-import warning 与本 propose 无关）
- [ ] 9.4 浏览器实测确认无视觉退化 _(needs author)_

## 10. Phase 9 — 文档同步与 archive 准备

- [x] 10.1 `docs/cinema-design-language.md` §11.8 列表已加状态列：foundations done, map-modes/overlays/storyboard/recorder pending
- [x] 10.2 §13 Q3 标 "DECIDED — foundations done"
- [x] 10.3 memory `project_camera_trajectory_recorder.md` 加 "Update 2026-04-27" 备忘
- [ ] 10.4 archive _(after author sign-off)_

## 11. Open questions 闭环

- [ ] 11.1 Q1 — mode cross-fade 实测：当前用 5% sceneLocalT 窗（不是 200ms 时间维），实测后回填 design.md _(needs author after blueprint mode lands)_
- [ ] 11.2 Q2 — Progressive reveal slice 间 overlap：当前无 overlap，待实测体感后决定是否加 _(needs author)_
- [ ] 11.3 Q4 — tracking 速度（linear，速度 = scene-svh / from-to-distance）：实测后回填 _(needs author after first tracking scene authored)_
- [x] 11.4 Q5 / Q6 已在 design 中决定，无需回填

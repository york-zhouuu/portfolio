## 1. 归档与基线

- [ ] 1.1 在 `sswt-narrative-case-study` 与 `frontend-polish-pass` 的 proposal.md 顶部添加 `> SUPERSEDED BY sswt-cinematic-case-study` 标记
- [ ] 1.2 打 git tag `v0.1-narrative-baseline` 锁定旧版基线
- [ ] 1.3 创建 feature branch `feat/cinematic-case-study`
- [ ] 1.4 把当前 `HANDOFF.md` 中关于旧版的诊断流程归档到 `docs/archive/handoff-narrative-v0.md`

## 2. 依赖与项目骨架

- [ ] 2.1 `pnpm add leva maath`（dev: leva）
- [ ] 2.2 评估并决定是否引入 `postprocessing`（如不引则 2.5 自定 GLSL）
- [ ] 2.3 `pnpm add detect-gpu`
- [ ] 2.4 `pnpm remove culori`（如分镜版不再依赖）
- [ ] 2.5 `next.config.ts` 确认 `.glsl` loader 仍在；新增 `lib/cinema/` 与 `components/cinema/` 目录

## 3. 类型与 schema

- [ ] 3.1 在 `lib/content/case-study-schema.ts` 中重写：替换 `sections` 为 `acts: Act[]`；新增 `Beat` / `Shot`（discriminated union）/ `Hud`（discriminated union）/ `Fallback` 类型
- [ ] 3.2 新增 `lib/cinema/types.ts`：导出 `CameraScore` / `Vec3` / `Easing` 等共享类型
- [ ] 3.3 `lib/content/case-study-schema.ts` 与 `lib/cinema/types.ts` 共享 Shot/Hud 定义（单一真相）
- [ ] 3.4 写 Zod schema 校验 `acts` 数量 = 3、每 Beat 五项必填、shotRef 命中

## 4. Camera score artifact

- [ ] 4.1 新建 `lib/cinema/score.sswt.ts`：编写 SSWT 三幕 8 节拍的 camera score 第一稿（参照 design.md D6 表）
- [ ] 4.2 score 中每个 beat 的 `range` 严格连续覆盖 [0, 1]，无 gap / overlap；Zod 校验通过
- [ ] 4.3 写 `lib/cinema/scroll-cinema.ts`：scroll progress → score t 的非线性映射 + spring 缓冲 + 稳定锚点检测
- [ ] 4.4 写 `lib/cinema/shotAt.ts`：根据 t 计算当前相机参数（position / lookAt / fov / focalDistance）
- [ ] 4.5 `lib/cinema/hudAt.ts`：根据 t 计算当前激活的 HUD 形态与 fade-in/out 强度

## 5. 沙盘 R3F 实现

- [ ] 5.1 重写 `components/chamber/CloudChamberCanvas.tsx`，迁入 `components/cinema/CinemaCanvas.tsx`：单实例 R3F canvas，`position: fixed; inset: 0; z-index: -1`
- [ ] 5.2 写 `components/cinema/SandTable.tsx`：从 `map-geometry.json` 加载建筑/街道/POI，按 LOD 三档渲染
- [ ] 5.3 建筑材质：matte clay（`#E8E4DC`–`#C8C2B6`，roughness 0.85）；ambient occlusion baked
- [ ] 5.4 街道平面：浅灰 `#D6D2C9`；细描边
- [ ] 5.5 POI 标签：2D billboard 文字，距离 fade
- [ ] 5.6 写 `components/cinema/Agents.tsx`：从 `sampled-agents.json` + `trajectories.json` 加载真实 agent；低多边形人形（~50 tris）
- [ ] 5.7 选中 agent 发光描边 + 其它 DoF 模糊（Act 2.2）
- [ ] 5.8 网络叠加层（Act 2.3）：弱连接细线 / 偶遇火花 / third-place 高亮

## 6. 后处理通道

- [ ] 6.1 写 `lib/cinema/shaders/tilt-shift.glsl`：分离式两通道（高 tier）+ 单通道高斯近似（低 tier）
- [ ] 6.2 写 `lib/cinema/shaders/grain.glsl`：体积颗粒，强度从 score 读取
- [ ] 6.3 写 `lib/cinema/shaders/fog.glsl`：体积雾，Act 1.3 召唤镜头消散
- [ ] 6.4 vignette 通道（轻度），全程开启
- [ ] 6.5 用 `detect-gpu` 在 mount 时决定 quality flag，注入 shader uniforms

## 7. 干预可视化（hyperlocal push）

- [ ] 7.1 写 `components/cinema/InterventionLayer.tsx`：feed pulse 球面波（青色 `oklch(0.78 0.14 215)`）
- [ ] 7.2 attention 半径环 shader（虚线圈，跟 agent 位置）
- [ ] 7.3 agent 路径偏转动画：原灰色路径 + 新青色高亮覆盖
- [ ] 7.4 HUD feed item 卡片（hud-panel slot=feed-item）
- [ ] 7.5 三段链路图组件：algorithmic-input → attention-MAIN → spatial-output

## 8. 镜像反演（A' Global Distraction）

- [ ] 8.1 写 `components/cinema/MirrorMode.tsx`：底色 cross-fade 到深紫 `oklch(0.18 0.06 300)`
- [ ] 8.2 干预层颜色 swap：cyan → magenta
- [ ] 8.3 agent 路径回退到灰色基线
- [ ] 8.4 HUD mirror-toggle：A vs A' 用户可控切换；状态独立于 scroll progress
- [ ] 8.5 letterbox 字幕："The lever is symmetric."

## 9. Act 1 真实世界开场

- [ ] 9.1 选 / 拍 三段素材：手机屏幕反光、街景行走、数据文字层（Open Question Q1，先 stock）
- [ ] 9.2 写 `components/cinema/RealWorldLayer.tsx`：fixed-position video，autoplay muted loop，`mix-blend-mode: screen` 叠加
- [ ] 9.3 progress 0.10–0.22：500m 盲区圆形 mask 跟随中心人物，渐变擦灰
- [ ] 9.4 progress 0.22 起：video opacity → 0；sand-table 建筑挤出从 0 → 目标高度（1.5s）；tilt-shift 0 → 满
- [ ] 9.5 cross-fade 期间 video 与 canvas 共存 ~0.3s，确保相机参数完全连续

## 10. HUD 信息层

- [ ] 10.1 写 `components/cinema/Hud.tsx`：根据 hudAt(t) 渲染对应形态
- [ ] 10.2 cue-card：fade-in 在稳定锚点；DOM 元素，可选中
- [ ] 10.3 letterbox：上下黑带 + 居中字幕；不阻止 sand-table 渲染
- [ ] 10.4 in-world-label：3D billboard 跟随沙盘锚点
- [ ] 10.5 hud-panel slots：stats / feed-item / beta-rigor / mirror-toggle，每个独立组件
- [ ] 10.6 所有 HUD 文本节点 ARIA 标签 + 键盘可达 + 屏幕阅读器朗读测试

## 11. 内容（MDX 重写）

- [ ] 11.1 重写 `content/case-studies/synthetic-socio-wind-tunnel.mdx`：frontmatter 改为 `acts` 结构（三幕 8 beat）
- [ ] 11.2 每个 beat 五项必填：`id` / `claim` / `shotRef` / `hud` / `fallbackFigure`；至少一条 `sources`
- [ ] 11.3 文案 review：与源项目 `00-thesis.md` / `13-research-design.md` 对齐；术语表（hyperlocal / Attention-Induced Nearby Blindness 等）一致
- [ ] 11.4 Act 3 内容采用 "contest in progress" 姿态：smoke 86 pp + 比赛规则 + 待揭晓清单

## 12. Lint 与术语表

- [ ] 12.1 `docs/glossary.json`：初始术语表（design.md / spec 中已列）
- [ ] 12.2 `scripts/content-lint.ts` 升级：(a) acts 数量 = 3 (b) beat 五项必填 (c) shotRef 命中 (d) sources 至少一条 (e) 术语表锁定 (f) 禁用 mock persona
- [ ] 12.3 `pnpm content:lint` 在 CI / 本地 build 前都跑

## 13. 静态分镜兜底

- [ ] 13.1 新增路由 `/work/[slug]/storyboard/page.tsx`
- [ ] 13.2 写 `components/storyboard/StoryboardSheet.tsx`：纵向滚动分镜长卷
- [ ] 13.3 每格 `aspect-ratio: 16/9`：fallbackFigure SVG + claim 散文 + HUD 文本
- [ ] 13.4 print stylesheet：每 beat break-after page；SVG 矢量打印不像素化
- [ ] 13.5 主入口 detect：`prefers-reduced-motion: reduce` 或 WebGL 不可用 → 跳转 storyboard + banner
- [ ] 13.6 footer 全局"切换分镜版"按钮（可在动画版任意时刻切换）

## 14. 兜底图素材

- [ ] 14.1 设计 / 绘制 8 张分镜图（每 beat 一张）：基于真实 Lane Cove 几何，矢量 SVG，命名 `figures/act{1,2,3}-{beat-id}.svg`
- [ ] 14.2 act1-open / act1-blindspot / act1-summon
- [ ] 14.3 act2-map / act2-agent / act2-network / act2-intervention
- [ ] 14.4 act3-contest / act3-mirror / act3-outro
- [ ] 14.5 OG 图：分镜长卷三幕全景一帧 + 镜头轨迹 ghost line（用于社交分享）

## 15. 资产管线

- [ ] 15.1 `scripts/export-sswt-assets.ts`：确认仍能从源仓库导出 `map-geometry.json` / `sampled-agents.json` / `trajectories.json` / `signal-summary.json` / `manifest.json`
- [ ] 15.2 `manifest.json` 新增 `cinemaScoreVersion` 字段（手动 bump）
- [ ] 15.3 `scripts/snapshot-cinema-score.ts`：从 `lib/cinema/score.sswt.ts` 导出当前 score JSON 落入 `public/case-studies/sswt/cinema-score.json`，并在 hash 变化但 cinemaScoreVersion 未 bump 时报错
- [ ] 15.4 footer 显示 `generatedAt` / `sourceSha` / `cinemaScoreVersion`

## 16. 滚动驱动整合

- [ ] 16.1 `app/work/[slug]/page.tsx`：去掉旧 sections 渲染；改为顶层挂 `CinemaCanvas` + `RealWorldLayer` + `Hud`
- [ ] 16.2 用 framer-motion `useScroll` 提供根 progress（0..1）
- [ ] 16.3 把 progress 传入 `scroll-cinema.ts`，输出当前 t、相机参数、HUD 状态
- [ ] 16.4 sand-table / agents / intervention layer / mirror mode 全部读取同一份 t
- [ ] 16.5 SectionHashNavigator 升级：根据 `?at=2.4` URL 参数滚动到对应 progress；分享深链支持

## 17. 性能 / 可访问性

- [ ] 17.1 性能预算实测：Hero LCP / 总 JS gzip / 移动端帧率（throttled Fast 3G + mid-tier device emulation）
- [ ] 17.2 `detect-gpu` 集成 + tier ≤ 1 走简化路径
- [ ] 17.3 visibility hidden → rAF 暂停；保留 score t 状态
- [ ] 17.4 所有 HUD 可键盘 Tab；focus ring 可见
- [ ] 17.5 屏幕阅读器朗读测试（VoiceOver / NVDA）：8 个 beat 全部内容可达
- [ ] 17.6 `?cinema=on` query 强制启用动画版（覆盖 reduced-motion 检测）

## 18. 调试工具

- [ ] 18.1 dev-only leva 面板：暴露 camera FOV / 关键帧位置 / tilt-shift 强度 / fog 密度 / 相机进度跳转
- [ ] 18.2 prod build 验证：bundle 中无 `leva` 字符串（`grep` 在 `.next/static/` 下零结果）

## 19. 测试

- [ ] 19.1 vitest 单测：`shotAt(t)` / `hudAt(t)` / Zod schema 校验
- [ ] 19.2 Playwright e2e：`/work/synthetic-socio-wind-tunnel` 滚动到 0.5 → 截屏 → diff
- [ ] 19.3 Playwright：`/work/synthetic-socio-wind-tunnel/storyboard` 加载 → 8 格全部存在 → 截屏 diff
- [ ] 19.4 Playwright：`prefers-reduced-motion` 模拟 → 自动跳转 storyboard + banner
- [ ] 19.5 visual-regression：每 beat 在固定 progress 锚点截屏；CI 红线校验

## 20. 文档与 handoff

- [ ] 20.1 重写 `HANDOFF.md`：去掉旧版诊断流程；新增 cinematic 路径的开发指南、score 调参流程、新增案例的步骤
- [ ] 20.2 `docs/cinema-score-authoring.md`：写给作者的 score 编排教程
- [ ] 20.3 `docs/case-study-authoring.md`：写给作者的 frontmatter / fallbackFigure / 术语表使用指南
- [ ] 20.4 `README.md` 更新：项目状态从"narrative case study v1"改为"cinematic case study v1"

## 21. 发布前 review

- [ ] 21.1 跨设备真机测试：iPhone 13 / Android mid-tier / iPad / 桌面 Chrome / Safari / Firefox
- [ ] 21.2 5 人内部 walk-through review：是否在 60s 内理解 Act 1 论证；是否在 Act 2.4 看到干预具体如何工作；是否在 Act 3 接受 "contest in progress" 姿态
- [ ] 21.3 跟源项目作者对齐 final 文案与术语
- [ ] 21.4 OG 图与社交分享卡片真机测试（Twitter / Slack / WeChat）
- [ ] 21.5 archive 旧 changes：`openspec archive sswt-narrative-case-study` / `openspec archive frontend-polish-pass`

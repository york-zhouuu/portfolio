## Why

上一版 `sswt-narrative-case-study` 把 SSWT 案例研究铺成了 10 段滚动叙事 + R3F 显影画面 + 五种内嵌交互；信息密度高，但**形式没有跟内容同构**——它仍是「一篇有图的文章」，只不过图是 3D 的。

源项目 2026-04-21 收敛后的核心论证有它自己的形状：**注意力边界（现象）→ 风洞仪器（检测+干预）→ 探索结论（contest in progress）**。这是一个三幕叙事，不是十段陈述。十段结构稀释了三幕本来该有的戏剧动作——**沙盘从黑暗中被召唤出来回答 Act 1 提出的问题**——这是整篇作品最重要的一个镜头，旧结构里它被等同于普通的 hero。

同时，"沙盘 + 不停切换视角镜头"是 user 锁定的视觉气质方向。把它落到工程上，最强的一个表达不是"每段切换一组动画"，而是 **一镜到底（one continuous take）**：观众进入页面到离开，相机从未硬切；它在一个连续的 3D 沙盘世界里平滑推、拉、入、出。**design / content / form 在这个选择里同时收紧到一个根本约束上**：内容的三幕 = 镜头的三段长 take = 页面的三个视觉段落，三者完全等价、不可分离。

这次 propose 不是"再加一些 polish"，而是**换一根脊柱**：把页面从"装着 sections 的容器"重写为"一段可滚动的连续镜头"，把内容三幕、形式（一镜到底沙盘）、信息层级（前景文字 / 中景仪器 / 背景沙盘）绑在一起做一次架构级的重定义。受众仍是 AI 产品经理 + agent 研究者；呈现仍走 UX 设计师群体的做工——但**作品集本身的形式参与论证**，不只是装载论证。

## What Changes

- **替换站点的中心叙事结构**：从 10 段（`hero·at-a-glance·thesis·instrument·experimental-design·signal·symmetry·limits·rashomon·resources`）改为**三幕 8 节拍**：
  - **Act 1 — 注意力边界**：`open-real-world` · `blindspot-reveal` · `instrument-summon`
  - **Act 2 — 产品本体（检测+干预）**：`map` · `agent` · `network` · `intervention`
  - **Act 3 — 探索的结论**：`contest-in-progress` · `mirror` · `outro`
- **以"一镜到底沙盘运镜"作为页面的根本视觉契约**：滚动进度 = 相机沿单条预编排轨道在同一个连续 3D 世界中的位置；**禁止任何硬切**；段与段的边界以镜头语言（push-in / pull-back / match-dissolve / focus rack）实现，而非 DOM 段落级别的视觉隔断。
- **重新定义 Act 1 的开场**：不再以沙盘开场。Act 1 用真实世界视觉素材开场（手机屏幕、街景、统计文字），中段把"500m 注意力盲区"在画面上具象化，**末尾沙盘从黑暗中被召唤出来作为对 Act 1 提问的回答**。沙盘的"诞生"是一镜到底里第一次大幅度推景。
- **Act 2 的 4 节拍按"风洞解剖"组织**：地图（test section / 实验室地板）→ agent（test models / 被测物）→ network（flow visualization / 流场）→ **intervention（control panel / 控制台 — 这是新增的第四节拍，让仪器从"会动的沙盘"升级为"风洞"）**。Hyperlocal Push（超在地性 / Variant A）在 intervention 节拍具体落地：feed item → 500m geo filter → agent attention 响应。
- **Act 3 在原始项目数据未完成的现实下采取 "contest-in-progress" 姿态**：交付内容 = β-rigor 比赛规则 + smoke demo 已有证据（86 pp）+ 镜像 A' 设计就位 + 即将揭晓的清单。**不假装做完，把"研究在进行中"当作作品的姿态而不是缺陷**。
- **把"design / content / form 同构"写入 spec 作为硬约束**：每个节拍必须同时定义 (1) 内容主张 (2) 镜头动作 (3) 字幕/HUD 形态 (4) 沙盘上的视觉变化 (5) 静态兜底渲染。任何一项缺失即未完成；不允许"先做镜头，文案后补"。
- **把 reduced-motion / no-WebGL 兜底升级为"分镜版静态长卷"**：而不是逐段 SVG 拼贴。整页变成一张三幕分镜稿（storyboard sheet），保留全部内容主张，仅去掉运镜——这样兜底版本本身也是合格的内容载体。
- **删除上一版 `sswt-narrative-case-study` 的以下结构**（被三幕脊柱取代）：
  - 10 段 1:1 顺序
  - 「显影液浮出照片」隐喻（被一镜到底取代）
  - 段间硬切的 scroll-coupled camera 阶跃
  - 五种独立内嵌交互单元的多实例并列（rival hypothesis 表 / 14 天时间轴 / Rashomon 切换等保留为镜头中的 HUD overlay，不再作为页面组件并列存在）
- **保留并继续利用**：资产导出管线（`scripts/export-sswt-assets.ts`）、`map-geometry.json` / `sampled-agents.json` / `signal-summary.json` schema、`manifest.json` 新鲜度戳、单实例 R3F canvas 原则、内容 schema (`case-study-schema.ts` 中 frontmatter 校验)。
- **修订 frontmatter schema**：`sections` 字段改为 `acts: Act[]` + `act.beats: Beat[]`，每个 beat 必须声明 `shot`（镜头类型）、`hud`（前景信息层）、`fallbackFigure`（静态兜底 SVG 引用）三个字段以强制 design/content/form 三位一体。
- **新增 `lib/cinema/` 模块**：camera score（关键帧时间轴）、shot 语法（push-in / pull-back / orbit / dolly / match-dissolve）、tilt-shift post-processing 通道、grain & fog 体积参数。这是新的工程子系统，与 `lib/theme/scroll-theme.ts` 合并升级为 `lib/cinema/scroll-cinema.ts`：滚动进度同时驱动相机位、灯光、雾、色调，但不再驱动十段 OKLCH 阶跃。

## Capabilities

### New Capabilities

- `cinematic-case-study-page`：一镜到底案例研究页面模板——三幕脊柱、连续镜头驱动滚动、前景 HUD/字幕层、中景仪器细节层、背景连续沙盘世界、镜头边界用 cinema language 实现而非 DOM 隔断、frontmatter 三幕 schema、reduced-motion 分镜兜底、共享 chrome（nav / footer / 资产新鲜度）。**取代旧 `case-study-page` capability**——后者是"长文模板"，前者是"连续镜头模板"，二者不兼容。
- `sand-table-cinema`：SSWT 沙盘电影系统——单实例 R3F canvas、Lane Cove 2.5D 沙盘几何（带 tilt-shift / fog / grain post-processing）、camera score（关键帧 + spring 插值 + scroll-driven progress）、shot 语法库（push-in / pull-back / orbit / dolly-in / match-dissolve / focus rack）、HUD 文字层（letterbox / cue-card / in-world label 三种模式）、Act 1 真实世界 → 沙盘召唤的开场过渡、Act 2 干预节拍的可视化（feed pulse / agent rerouting / network ripple）、Act 3 镜像段的视觉反演（A' Global Distraction）。**取代旧 `sswt-scene-system` capability**。
- `case-study-content-schema`：三幕内容 schema 与作者侧约束——`Act` / `Beat` / `Shot` / `Hud` / `Fallback` Zod 类型、frontmatter 校验、`content-lint` 升级（强制每个 beat 五项齐备，强制 hyperlocal 等专有名词的术语表锁定）。

### Modified Capabilities

_None — 旧 `case-study-page` 与 `sswt-scene-system` 由本次 propose 直接取代，不走 delta 修订路径，因为两者从根结构（10 段 vs 三幕、scroll-coupled stepwise camera vs 一镜到底）上不可调和。归档前一版 propose 的 specs 即可。_

## Impact

- **路由结构不变**：仍是 `/work/[slug]` + `/work/synthetic-socio-wind-tunnel`；但 `[slug]/page.tsx` 内部装配从渲染 sections 列表改为渲染 acts × beats 矩阵 + 单一 cinema canvas。
- **依赖增删**：
  - **新增**：`leva`（开发期 camera score 调参）、`maath`（spring 数学）、可选 `postprocessing`（tilt-shift / DoF / vignette / grain 后处理通道）。如不引 `postprocessing`，则用自定 GLSL（已有 `next.config.ts` 的 GLSL loader）实现 tilt-shift。
  - **保留**：`three`、`@react-three/fiber`、`@react-three/drei`、`framer-motion`、`next-mdx-remote`、`gray-matter`、`zod`、`clsx`、`@radix-ui/react-toggle-group`。
  - **可移除**：`culori`（旧色彩弧改为 cinema 体积色彩，不再需要 OKLCH 转换工具）。
- **内容文件**：`content/case-studies/synthetic-socio-wind-tunnel.mdx` 由 10 段重写为三幕 × 节拍结构；frontmatter 由 `sections` 改为 `acts`。
- **资产管线**：`scripts/export-sswt-assets.ts` 不变；新增 `scripts/export-cinema-storyboard.ts` 用于把 camera score + 兜底 SVG 长卷导出为静态分镜图（同时供 OG 图、移动端低性能 fallback、文档插图复用）。
- **代码移除/重写**：
  - `components/scenes/sswt/` 下 15 个 framer-motion 二维场景文件大部分作废——它们的内容主张被吸收进沙盘镜头 + HUD overlay。保留 `mapDrawing.ts` 与 `_shared.ts` 类型作为数据接口；保留 `cinemaShared.tsx` 命名（升级为 `lib/cinema/` 入口）。
  - `lib/theme/scroll-theme.ts` 升级为 `lib/cinema/scroll-cinema.ts`，OKLCH 10 段弧降级为 fallback-only（仅在 reduced-motion 静态长卷里使用）。
  - `components/chamber/CloudChamberCanvas.tsx`（当前 returns null）+ `ChamberScene.tsx`（占位）实质性实现，迁入 `components/cinema/` 命名空间。
- **性能预算修订**：
  - 单实例 R3F canvas 原则保留。
  - 一镜到底意味着相机始终在动，因此 idle 降帧策略改为 visibility-based（页面 hidden 暂停），不能 off-screen 整段 suspend。
  - Hero / Act 1 开场段 LCP < 2.5s（throttled Fast 3G）保留。
  - 总 JS payload（不含字体）目标 < 380KB gzip 首屏（比旧版 +30KB 余量留给 cinema score 与后处理通道）。
  - tilt-shift / DoF 在中端移动设备走 fragment shader 简化路径（高斯近似而非分离式两通道），低端设备直接 fallback 至静态分镜版。
- **可访问性**：
  - reduced-motion 兜底升级为分镜长卷（一张完整可滚动的静态版作品），不再是逐段 SVG 拼贴。
  - 一镜到底相机不可能"键盘 step 跳"，因此键盘用户进入时直接呈现分镜长卷版（与 reduced-motion 同源），并提供 `?cinema=on` 强制启用查询参数。
  - HUD 字幕、cue card、in-world label 全部要求文本可选中、可被 screen reader 朗读。
- **SEO / 分享**：OG 图换为分镜长卷的三幕全景一帧（沙盘 + 镜头轨迹 ghost line 叠加），呈现整体形式而非单一 hero 帧。
- **资产治理**：页脚 `manifest.json` 新鲜度戳保留；新增 `cinemaScoreVersion` 字段，作品集 build 时锁定 camera score 版本以避免相机改动导致内容描述错位。
- **未来解锁**：`cinematic-case-study-page` 模板稳定后，未来其它案例研究的作者只需写一份三幕 MDX + 选配自定 sand-table 几何与 camera score，即可获得同等水平的视觉作品。模板与 SSWT 解耦。

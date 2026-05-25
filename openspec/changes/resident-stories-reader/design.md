## Context

portfolio 当前 chrome 仅有 case-study 页内 footer，无全局 surface。Cinema 是 R3F canvas + scroll-driven progress + HUD chrome 的三层结构（z=0 / z=10 sticky / z=20 HUD / z=30 grain）。

本 propose 引入两个新 surface（reader sheet + global nav）和一处 overlay 拓展（agent pickup），同时引入第一个**全局 React Context**（ReaderContext）。三者必须协同：

- nav 与 overlay 是 reader 的两个入口；reader 是它们的共同目的地
- reader 打开期间 cinema 镜头**继续运行**，但视觉被压暗 → 不是 modal-style 暂停
- 资源（人物 HTML）来自 SSWT 仓库 `docs/case_studies/_published/`，必须通过同步脚本搬到 portfolio `public/` —— 两个仓库之间无运行时依赖

约束：
- 不破坏 zero-cut 美学（无路由跳转、无硬切）
- 不耦合到尚未落地的 i18n 基础（`cinema-content-language-foundations` 仍在 in-progress）
- mary 资源 3.7MB —— iframe 必须容忍可观的加载延迟

## Goals / Non-Goals

**Goals:**

- 一个能立刻接 hannah/mary/a0290 的 in-page reader（无需等 i18n 落地）
- 一个 portfolio 第一版全局 nav（覆盖 Home / Case Studies / Resident Stories / About）
- 拓展 AgentsTrajectoriesOverlay 让特定 agent 可点击触发 reader（电影化入口）
- 三者通过 `ReaderContext` 解耦，未来加新 story 仅改 frontmatter

**Non-Goals:**

- 翻译 portfolio 页面级文本（i18n 走独立 change）
- 实装 Act 3 实验结果 dissolve / letterbox（user 还在润色，单独 change）
- 修改 cinema score / camera rig / scroll pacing
- iframe-to-host 通信（reader 不需要回写状态到 portfolio）
- 把 Resident HTML 重排成 MDX（保持自包含 HTML 是有意决策——见下）

## Decisions

### D1: 用 iframe 承载 Resident HTML，不重排为 MDX

**选 iframe** vs MDX 重排 / shadow DOM 注入 / div 注入。

- **iframe**：✓ 零样式污染（HTML 自带 Georgia/Songti SC + #FBF6EE 暖底，与 portfolio 暗调互不影响）；✓ 与"独立窗口感"的隐喻天然契合；✓ 资源自包含（grep 验证无外部依赖），sandbox 属性即可锁防越权；✗ mary 3.7MB 首次加载延迟可见
- **MDX 重排**：✗ 6 个 HTML 总计 11MB，转 MDX 是巨量工作；✗ 内嵌 base64 图需另存为 public 资源；✗ 失去 SSWT 仓库作为 source of truth 的能力——以后每次 SSWT 更新就要重新转
- **shadow DOM 注入**：✓ 样式隔离 ✗ 与 HTML 自带 `<html>/<head>` 结构不兼容（需剥离），且 shadow DOM SSR 复杂
- **div 注入 + scoped CSS**：✗ HTML 用了 `*` 选择器（box-sizing reset），会污染或被污染

**iframe 的代价**：加载延迟通过 skeleton + onLoad 切换吸收（用户体验上是"sheet 在加载"，不是"网站卡了"）。sandbox 属性 `allow-same-origin allow-scripts` 允许内部交互（如锚点滚动），禁 `allow-top-navigation` 防越权。

### D2: ReaderContext 而非 Zustand / Redux

portfolio 当前无全局状态管理。本 propose 不引入新依赖——`React.createContext` 配 `useState` 足够：

- 状态结构小（`{ currentSlug, currentLang, openReader, closeReader, preferredLang, setPreferredLang }`）
- 跨组件订阅者就两个（GlobalNav 的下拉、AgentsTrajectoriesOverlay 的 click handler）
- Context 在 case study route layer 挂载（不在 root layout）——因为 stories 是 per-case-study 的概念

**例外**：nav 在 root layout，case study route 下才有 Provider。Nav 用 `useReaderContext()` 时若 context 为 null，链接行为降级为 query-param 路由跳转（在 case-study spec scenario 已覆盖）。

### D3: Sheet 动画用 CSS transition 而非 Framer Motion

portfolio 已用 Framer Motion 做 HUD 动画。但 reader sheet 是简单的"从下方滑入 + 淡出"，纯 CSS `transition: transform 320ms cubic-bezier(0.2, 0.6, 0.2, 1)` 即可，符合 `theme.transitionTimingFunction.chamber`。

不用 Framer 的理由：
- 包体积已经够大
- sheet 不需要复杂手势 / 拖拽关闭（暂时）；后续若加 swipe-to-dismiss 再换 Framer

dim backdrop 同样用 `transition: opacity 200ms`。

### D4: Agent pickup 用 invisible hitbox 解决小球难点击

球体半径 0.025（已有）+ 高亮 ring 半径 0.06-0.08 视觉够大但 raycasting 命中区仍是球体本身。

方案：在 `intensity > 0` 时为该 agent 渲染 invisible `sphereGeometry(0.12)` mesh，`visible={false}` 但仍接收 raycast。R3F 中 `visible={false}` 会跳过渲染但 raycaster 默认仍命中（除非显式 `raycast={null}`）—— 验证后采用。

替代方案考虑过：
- Three.js Raycaster 全局监听 + 距离阈值检查：实现复杂、与 R3F 哲学不符
- 高亮 ring 本身可点（半径变 0.08）：视觉与命中耦合，限制后续 ring 风格调整

### D5: 资源同步是手动 + 单向

`scripts/sync-resident-stories.ts` 接收 SSWT 仓库本地路径作为 CLI arg：

```bash
pnpm sync:resident-stories ~/Documents/GitHub/-Synthetic-Socio-Wind-Tunnel-
```

脚本：扫 `docs/case_studies/_published/*.html` → 复制到 `portfolio/public/case-studies/sswt/people/` → 打印同步日志。**不写 CI 集成**——portfolio build 必须能在 SSWT 仓库不可用时跑通（资源已 checked into portfolio repo）。

理由：
- SSWT 是隔壁仓库的研究产物，更新节奏与 portfolio 部署节奏不同步
- 6 HTML 体积虽大（~11MB）但变化不频繁，commit 到 portfolio repo 比 build-time 拉取更可靠
- 未来若 SSWT 持续输出新人物，可以再加 CI 触发；当前手动即可

### D6: 滚动可见性——nav 永远可见，不做 hide-on-scroll

电影流页面很长（cinema 多 scene 累计可能 800-1200svh），用户进入中段时若 nav 隐藏，逃生通道丢失。

权衡：
- 永远可见 → 占 56px 视觉空间，case study hero 区需 64px 顶 padding 补偿
- hide-on-scroll-down → 节省空间但破坏 user agency

选永远可见。视觉上 hero 区透明（不竞争）；离开 hero 后 backdrop 出现（强调可达性）。

### D7: 语言切换器先本地，未来转 i18n context

当前 nav 的中/EN 切换只影响 `ReaderContext.preferredLang`：

- localStorage 持久化 key: `portfolio.preferredLang`
- 默认值：`navigator.language` 启发式
- **不**翻译 nav 自身文本（暂只英文 + 极少量中文 brand 字）

未来 `cinema-content-language-foundations` 落地时：
- 该切换器改为 dispatch page-level locale action
- ReaderContext 的 `preferredLang` 改为派生自 page locale
- 本 propose 的 storage key 沿用，无 breaking change

## Risks / Trade-offs

- **[mary 3.7MB iframe 加载延迟]** → sheet 内 skeleton 200-400ms 覆盖；iframe `loading="lazy"` 不适用（lazy 是 viewport-based，sheet 弹出时不在 viewport 历史中）。可以预加载第一个 chunk：`<link rel="prefetch" href="/case-studies/.../mary.html">` 在 case study page 头部声明。
- **[iframe 内焦点逃逸/ESC 不冒泡]** → 接受折中：用户在 iframe 内时 ESC 不触发关闭；nav 与 ✕ 按钮永远可见即逃生通道。
- **[移动端 reader 适配]** → sheet 在 ≤768px 全屏覆盖（占 100vh），桌面端 90vh 留 dim backdrop 露白。iframe 内嵌 HTML 已用 `max-width: 760px; margin: 0 auto`，移动端自适应。
- **[sandbox agent pickup 干扰 trajectory 动画]** → invisible hitbox 仅在 `pickup.intensity > 0` 时挂载；hold 段移除以减少 raycast 开销。InstancedMesh 不能 per-instance 加 mesh——pickup mesh 是单独 sibling node，参考 cinema-map-overlays 的 sibling 模式。
- **[Resident Stories 下拉在首页聚合所有 case study 的 stories]** → 未来 case study 多了可能需要分组。当前仅 sswt 一个，扁平列表即可。
- **[资源同步分歧]** → 同步脚本日志记录 source mtime；如果 portfolio 内文件 mtime ≥ SSWT 源 mtime，提示 "Skipping <file>: portfolio newer"；用户可显式 `--force`。
- **[Iframe 中文字体 fallback]** → 内嵌 HTML 用 `'Georgia', 'Songti SC', serif`。Songti SC 是 macOS 原生字体；Windows/Linux 用户得不到中文衬线视觉。可接受——HTML 自带的设计语言遵循 SSWT 仓库决策，portfolio 不重塑。

## Migration Plan

无现有用户/数据需迁移。增量发布：

1. **阶段 A（reader + nav 静态）**：先做 reader 组件 + 全局 nav，靠 nav 下拉作为唯一入口。可独立部署、独立验收。
2. **阶段 B（agent pickup）**：在 A 稳定后加 overlay pickup 拓展。即使 pickup 有 bug，nav 入口仍可用。
3. **阶段 C（i18n 接管）**：等 `cinema-content-language-foundations` 落地后，把 nav 语言切换器和 ReaderContext.preferredLang 改读 page locale。

回滚：每个阶段独立 commit；reader 组件可通过 unmount provider 完全关闭；nav 可设 feature flag（暂不引入 flag 框架——简单 build-time const 即可）。

## Open Questions

1. **Resident Stories 在 case study 页内的入口图标**：nav 下拉是一个入口。是否还要在 case study `<article>` 内某个 beat 旁加一个"读人物故事"小按钮？提议**不加**——agent pickup + nav 下拉已经两个入口够了，再加破坏 cinema flow。但等 act 2 重写时可能重审。

2. **mary 3.7MB 是否真的需要那么大**：内嵌图是否有压缩空间？由 SSWT 仓库决定，本 propose 不优化。

3. **首页 Resident Stories 下拉的视觉**：聚合多 case study 时是否要展示 case study 归属？暂列扁平。若 portfolio 扩展到多 case study 再加分组。

4. **About 页存在吗**：当前 portfolio 无 `/about` 路由。nav 项先渲染但点击 404？还是先 disable？决定：**渲染但点击 404 是不可接受**——nav 上的 About 链接暂时改为 `mailto:` 或 GitHub 链接，等 About 页落地再换。或在本 change 内顺手起个最小 About。建议**最小 About 占位**纳入本 change tasks。

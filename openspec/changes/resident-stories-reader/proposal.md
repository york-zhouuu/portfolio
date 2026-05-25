## Why

SSWT 项目今天（2026-05-24）刚发布了三个 capstone 级人物长读：`hannah.html` / `mary.html` / `a0290.html`（各含中英两版，共 6 个文件，~650KB-3.7MB，完全自包含）。它们承载了**微观尺度**的实验证据——同一个虚拟居民在 baseline / hp / gd / pf 四个宇宙的 14 天日常分歧，是海报 3 个宏观 insight 之外唯一的"人称叙事"。

portfolio 目前没有任何 surface 能曝光它们：

- **无全局 navigation**：仅 footer chrome，无法让访客从任意位置进入人物故事
- **沙盘上的 agent 是装饰**：`AgentsTrajectoriesOverlay` 只画发光球，无任何交互
- **没有 in-page reader 模式**：长文目前只能要么内嵌 MDX（破坏一镜到底）、要么外链跳转（违反 zero-cut 原则）

本 propose 一次性建立"接入人物长读"所需的三层基础设施，让 hannah/mary/a0290（以及未来追加的人物）能以"独立窗口感"在不破坏电影流的前提下被阅读。

## What Changes

- **新建 `<ResidentStoryReader>` overlay 组件** — fixed sheet 浮起，加载自包含 HTML（`iframe src="/case-studies/sswt/people/<slug>_<lang>.html"`）。开启时背景沙盘 `darken + 轻微 blur`，**镜头继续呼吸不暂停**；关闭通过 X 按钮或 ESC 键，sheet 滑下 + 沙盘 fade 回原位。Reader 内部头部含 中/EN toggle（基于资源可用性 disable 未生产语言）。
- **新建 `<GlobalNavChrome>` 顶悬浮 surface** — 含 Home / Case Studies / **Resident Stories（下拉）** / About / 语言切换。Resident Stories 下拉枚举 hannah / mary / a0290，点击 dispatch reader 打开事件。滚动行为：进入 hero 区透明，离开后获得轻 backdrop。**这是 portfolio 第一个全局 surface**——当前 ChromeFooter 是 case study 页内局部 chrome。
- **拓展 `<AgentsTrajectoriesOverlay>` 加 pickup 能力** — 当 cinema 镜头 dwell 在某 agent 时（基于 `useResolvedMapState` + 新增 `pickup.targetAgentId` 字段），该 agent 获得高亮 ring + cursor: pointer + click handler，dispatch 同一个 reader 打开事件。三个人物对应固定的 sandbox agent id（在内容层声明）。
- **资源迁移** — 把 SSWT 仓库 `docs/case_studies/_published/` 下 6 个 HTML 复制到 `portfolio/public/case-studies/sswt/people/`，并加一个 `scripts/sync-resident-stories.ts` 单向同步脚本（手动触发，源是 SSWT 仓库本地路径）。
- **新建 `ReaderContext` provider** — 全局 `{ openReader(slug, lang?), closeReader, currentSlug, currentLang }`。GlobalNav 与 AgentsTrajectoriesOverlay 都通过 context dispatch，不直接耦合到 Reader 组件。
- **内容 schema 扩展** — case study `frontmatter` 加 `residentStories?: ResidentStoryEntry[]`，每条声明 `{ slug, agentId, languages: ('zh'|'en')[], displayName, role }`，作为 reader / nav dropdown / overlay pickup 共享的 source of truth。
- **content-lint 扩展** — 校验声明的 HTML 资源真实存在、声明的 agentId 在 sandbox 采样范围内。

## Capabilities

### New Capabilities

- `resident-story-reader` —— 全局 in-page reader overlay：sheet 生命周期 / 资源加载 / 语言 toggle / 背景沙盘衔接 / 键盘可访问性。
- `global-navigation-chrome` —— portfolio 顶悬浮全局 nav：导航条目 / Resident Stories 下拉 / 语言切换 / 滚动可见性 / 与 case study 页电影流的视觉协调。

### Modified Capabilities

- `cinematic-case-study-page`（在 `sswt-cinematic-case-study` 下定义）—— 增加：`ReaderContext` provider 挂载位置、frontmatter `residentStories` 字段声明、`AgentsTrajectoriesOverlay` 接入 pickup 能力（新增可选 `pickup` prop + cinema scene 通过 `mapState.pickup` 激活）。

## Impact

- **代码新增**：
  - `components/reader/ResidentStoryReader.tsx`（sheet UI + iframe + 语言 toggle + 键盘 a11y）
  - `components/reader/ReaderContext.tsx`（provider + hook）
  - `components/chrome/GlobalNavChrome.tsx`（顶悬浮 nav）
  - `scripts/sync-resident-stories.ts`（从 SSWT 仓库本地路径同步 6 HTML）
  - `public/case-studies/sswt/people/{hannah,mary,a0290}{,_en}.html`（资源）
- **代码改动**：
  - `components/cinema/overlays/AgentsTrajectoriesOverlay.tsx`（接 pickup prop + raycasting）
  - `components/cinema/overlays/registry.ts`（pickup prop type 透传）
  - `lib/cinema/types.ts`（`mapState.pickup?: { targetAgentId?: string }` 字段）
  - `lib/cinema/scoreResolver.ts`（resolveMapState 增加 pickup 字段）
  - `lib/cinema/contentSchema.ts`（frontmatter `residentStories?` Zod schema）
  - `app/layout.tsx`（mount GlobalNavChrome + ReaderProvider）
  - `app/work/[slug]/page.tsx`（从 frontmatter 读 residentStories 注入 ReaderProvider scope）
  - `scripts/content-lint.ts`（KNOWN_RESIDENT_LANGS + 资源存在性 + agentId 范围）
- **资源体积**：6 HTML 合计约 11MB（mary 中英版各 3.7MB 占大头）。`public/` 静态托管，按需 fetch，不影响首屏。
- **不影响**：cinema 渲染管道、CameraRig、scroll pacing、现有 overlay 全部不变。reader sheet 是 portal 渲染到 `document.body`，不挤压 R3F canvas。
- **依赖关系**：
  - **独立于** `cinema-content-language-foundations`（i18n 基础）。reader 与 nav 内部目前各自带 lang state；当 i18n 基础落地，两者改读 page-level locale。本 propose 不阻塞、不被阻塞。
  - **独立于** 实验结果叙事（Act 3 内容润色）。reader 是叙事容器，与"放什么内容"解耦。
- **风险**：
  - **iframe 跨上下文样式**：HTML 自包含（inline CSS + inline images，已 grep 验证），无外部依赖。iframe `sandbox` 属性需谨慎——完全沙箱会禁用内部锚点跳转，需启用 `allow-same-origin allow-scripts` 但禁用 `allow-top-navigation`。
  - **mary 3.7MB iframe 首次加载延迟**：用户点击后到 sheet 内容可见可能有 200-400ms 空白。需 sheet 内部加 skeleton + onLoad 切换。
  - **agent pickup 命中精度**：InstancedMesh raycasting 在小球（半径 ~0.05）上对触屏不友好。需提供 enlarged invisible hitbox 或 nav 入口作为永久兜底（已在范围内）。
  - **资源同步发散**：SSWT 仓库的 HTML 后续会更新（英文版仍在润色），同步脚本必须手动触发——避免 portfolio build 隐式依赖隔壁仓库可用性。

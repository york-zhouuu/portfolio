## ADDED Requirements

### Requirement: 全局 nav 是顶悬浮 fixed chrome

`<GlobalNavChrome>` SHALL 渲染为 `position: fixed; top: 0; left: 0; right: 0; z-index: 40` 的全局 surface：

- 挂载位置：`app/layout.tsx`，包裹 children 前
- 高度：56px（桌面）/ 48px（≤768px 移动端）
- 与 case study `<article>` 第一节有重叠——hero 段需考虑 64px 顶 padding 让标题不被遮
- z=40 介于 HUD（z=20）与 reader dim backdrop（z=45）之间

#### Scenario: 跨页面持续可见

- **WHEN** 用户在 `/`、`/work/[slug]`、`/about` 任意路由
- **THEN** GlobalNavChrome 都渲染；reader 打开时 nav **保持在 dim backdrop 之下**（被遮 + 不可点）

### Requirement: 导航条目结构

Nav SHALL 按以下从左到右顺序渲染：

1. **品牌区**（左）：作者名 / portfolio mark，链接到 `/`
2. **主导航**（中或左对齐）：`Home` · `Case Studies` · `Resident Stories ▾` · `About`
3. **语言切换**（右）：`中 / EN` 二选一

`Resident Stories` 为下拉菜单（其余为简单链接）。

#### Scenario: 非 case study 页面的 Resident Stories

- **WHEN** 用户在 `/`（首页，无当前 case study scope）
- **THEN** Resident Stories 下拉默认展示全站所有已发布故事（聚合自所有 case study frontmatter `residentStories`）

#### Scenario: case study 页面的 Resident Stories

- **WHEN** 用户在 `/work/synthetic-socio-wind-tunnel`
- **THEN** Resident Stories 下拉仅展示该 case study frontmatter 声明的 stories

### Requirement: Resident Stories 下拉触发 reader

下拉中每个 story 条目 SHALL 渲染为按钮（非链接），点击调用 `ReaderContext.openReader(slug)`：

- 条目内容：`<displayName>` + 一行 `<role>` 副文（如 "36 岁咖啡店老板娘"）
- 点击后下拉自动收起 + reader sheet 滑入
- 当前页未挂载 `ReaderContext`（如 `/about`）时，下拉条目链接到 `/work/<study-slug>?open=<story-slug>`（路由跳转 + query 参数触发自动打开）

#### Scenario: 在 case study 页内点开

- **WHEN** 用户在 `/work/synthetic-socio-wind-tunnel` 点击下拉中的 "Hannah"
- **THEN** 不路由跳转；reader sheet 浮起，加载 hannah 资源

#### Scenario: 跨页面打开

- **WHEN** 用户在 `/about` 点击下拉中的 "Hannah"（hannah 属于 sswt case study）
- **THEN** 路由到 `/work/synthetic-socio-wind-tunnel?open=hannah`，page mount 后自动 `openReader('hannah')`

### Requirement: 语言切换器

Nav 右侧 SHALL 渲染 `中 / EN` 切换器（二选一 segmented control）：

- 当前态：本地 React state（与 i18n 基础无关）
- 默认值：根据浏览器 `navigator.language`（`zh*` → 中，其余 → EN）；localStorage 持久化
- 切换效果：**当前阶段**仅同步到 `ReaderContext.preferredLang`（reader 打开时取此值作 lang 初始值）；**不**翻译页面其他文本
- 未来 `cinema-content-language-foundations` 落地后，此切换器改为驱动 page-level locale 上下文

#### Scenario: 默认中文用户打开 reader

- **WHEN** 用户浏览器 `navigator.language = 'zh-CN'` 未手动切换，点击 nav 中 "Hannah"
- **THEN** reader 打开时 iframe src 加载 `hannah.html`（中文版），sheet header 中文按钮高亮

#### Scenario: 切换语言后再次打开

- **WHEN** 用户先把 nav 切到 EN，再点击 "Hannah"
- **THEN** reader 打开时加载 `hannah_en.html`，sheet header EN 按钮高亮

### Requirement: 滚动可见性

Nav 视觉状态 SHALL 随页面滚动变化：

- 页面顶部 hero 区（scrollY < 100px）：背景完全透明，文字使用 `oklch(var(--fg) / 0.8)`
- 离开 hero（scrollY ≥ 100px）：背景获得 `oklch(var(--bg) / 0.7) + backdrop-filter: blur(12px)`，过渡 200ms ease
- 不隐藏（始终可见，不做 hide-on-scroll-down）—— 全局导航在长滚动电影流中是用户的"逃生通道"，必须随时可达

#### Scenario: 用户在电影流中段

- **WHEN** 用户滚动到 `/work/synthetic-socio-wind-tunnel` Act 2 中间
- **THEN** nav 始终可见 + 有 backdrop，不被 cinema HUD 视觉打架（HUD 在 z=20、nav 在 z=40，nav 必然在上）

### Requirement: 与 cinema 视觉协调

GlobalNavChrome SHALL 使用与 cinema 同一套设计 token（不引入新色 / 字 / spacing）：

- 字体：`var(--font-sans)`
- 文字色：`oklch(var(--fg))`
- 链接 hover：下划线 `oklch(var(--accent))`，无背景色
- 当前路由项：使用 `var(--glow)` 暖琥珀强调，不用 underline
- 不使用 capstone 海报的粉/黄手绘签名（保留给 case study 内部的视觉引用点）

#### Scenario: 视觉一致性

- **WHEN** 用户从首页滚动到 case study 页
- **THEN** nav 看起来是同一个 nav，无任何风格切换（不会突然变成另一种调色）

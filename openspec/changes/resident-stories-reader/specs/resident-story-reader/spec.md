## ADDED Requirements

### Requirement: Reader 是 portal-rendered overlay sheet

`<ResidentStoryReader>` SHALL 通过 `createPortal` 渲染到 `document.body`，独立于 cinema R3F canvas 与 case study `<article>` 树。

- 容器位置：`position: fixed; inset: 0`
- z-index：高于 cinema HUD（HUD z=20，grain z=30，reader sheet z=50，dim backdrop z=45）
- 渲染由全局 `ReaderContext.currentSlug` 驱动；`currentSlug === null` 时不挂载 DOM 节点

#### Scenario: 与 cinema canvas 不相互挤压

- **WHEN** reader 打开
- **THEN** R3F canvas 仍 `pointer-events: none` 不可见但仍在 useFrame 渲染（镜头继续呼吸），sheet 自身可点击滚动、不阻挡 ESC 监听

#### Scenario: 卸载后无残留

- **WHEN** `closeReader()` 调用并完成关闭动画
- **THEN** sheet DOM 与 dim backdrop 从 body 移除；R3F canvas / HUD 恢复全交互

### Requirement: Reader 通过 iframe 加载自包含 HTML

Reader content frame SHALL 用 `<iframe>` 加载资源：

- src 形如 `/case-studies/<study-slug>/people/<story-slug>_<lang>.html`（中文版省略 `_zh` 后缀，等价于 `<story-slug>.html`）
- iframe `sandbox="allow-same-origin allow-scripts"`（禁 `allow-top-navigation`，防止内部锚点跳出 portfolio）
- iframe `title` 属性必须设置（a11y），值由 `ReaderContext.currentStory.displayName` 决定
- iframe 100% 占满 sheet 内容区，自身可滚动

#### Scenario: 资源 404

- **WHEN** iframe 加载失败（src 返回 404）
- **THEN** iframe `onError` 触发，sheet 内容区显示 fallback 文案 + 关闭按钮；不崩溃整个 reader

#### Scenario: 加载中

- **WHEN** iframe 已挂载但 `onLoad` 未触发
- **THEN** sheet 内容区显示 skeleton（暗背景上的浅色 shimmer 行），覆盖 iframe；`onLoad` 后 skeleton 淡出 200ms

### Requirement: 关闭控件

Reader SHALL 提供三种关闭方式：

1. Sheet header 右上角 `✕` 按钮
2. 全局 `Escape` 键按下（document-level keydown listener）
3. 点击 dim backdrop（sheet 之外的暗区）

每种方式都调用 `ReaderContext.closeReader()`。

#### Scenario: ESC 关闭

- **WHEN** reader 打开且用户按下 Escape 键
- **THEN** sheet 滑下退场，dim backdrop 淡出，焦点回到触发打开的 DOM 元素（nav 链接 / agent 拾取点）

#### Scenario: 内层 iframe 输入框中按 ESC

- **WHEN** 用户焦点在 iframe 内某输入框（如内嵌搜索）并按 Escape
- **THEN** 由于 iframe 跨 frame 的 keydown 不冒泡到 host document，reader 不会被意外关闭（接受这个折中）

### Requirement: 语言 toggle

Reader sheet header SHALL 含 `中 / EN` 二选一切换器：

- 默认语言由 `openReader(slug, lang?)` 调用方传入；未指定时取 `'zh'`
- 切换时改变 iframe src 而不卸载 sheet（保留打开状态 + 关闭按钮焦点）
- 仅渲染 `ReaderContext.currentStory.languages` 中存在的选项；缺失语言的按钮 disabled + tooltip "Coming soon"

#### Scenario: 切换语言

- **WHEN** reader 打开 hannah 中文版，用户点击 EN
- **THEN** iframe src 从 `hannah.html` 改为 `hannah_en.html`；sheet 不关闭；新文档加载期间显示 skeleton

#### Scenario: 仅一种语言可用

- **WHEN** 某 story 的 `languages` 仅含 `['zh']`
- **THEN** EN 按钮渲染但 disabled，aria-disabled="true"，hover 提示 "English version coming soon"

### Requirement: 背景沙盘视觉衔接

Reader 打开期间，cinema canvas 的视觉表达 SHALL 被 dim + blur：

- Dim backdrop 元素覆盖整个 viewport，背景色 `oklch(var(--bg) / 0.6)`
- backdrop-filter `blur(8px)`（不支持的浏览器降级为更深的 dim `oklch(var(--bg) / 0.85)`）
- 进入：200ms ease-out 淡入；退出：300ms ease-in 淡出
- **R3F useFrame 不暂停**——镜头继续按 scroll progress 推进，关闭后视觉无缝衔接

#### Scenario: 关闭后镜头位置

- **WHEN** reader 打开 30 秒后关闭
- **THEN** sandbox 镜头处于"假如 reader 从未打开"的同一位置（与 scrollY 当前值一致），不出现 jump cut

### Requirement: 键盘焦点管理

Reader sheet 打开时 SHALL 实现 focus trap：

- 打开瞬间焦点移到 sheet 内第一个可聚焦元素（关闭按钮）
- Tab / Shift+Tab 在 sheet 内循环（关闭按钮 + 语言 toggle + iframe）
- 关闭时焦点恢复到打开它的触发元素（`document.activeElement` 在打开前的快照）

#### Scenario: Tab 不逃出 sheet

- **WHEN** 焦点在语言 toggle 上并按 Tab
- **THEN** 焦点进入 iframe（iframe 内部焦点行为由内嵌 HTML 决定）；再 Tab 出 iframe 时回到关闭按钮，不跳到 sheet 之外

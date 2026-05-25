## 1. 资源迁移与基础设施

- [x] 1.1 写 `scripts/sync-resident-stories.ts`：CLI 接收 SSWT 仓库本地路径，复制 `docs/case_studies/_published/*.html` 到 `public/case-studies/sswt/people/`，打印 source/dest mtime + 大小日志
- [x] 1.2 在 `package.json` 加 script：`"sync:resident-stories": "tsx scripts/sync-resident-stories.ts"`
- [x] 1.3 首次执行同步，把 6 个 HTML（hannah / mary / a0290 × zh/en）落地到 `public/case-studies/sswt/people/`，commit 进 portfolio repo
- [ ] 1.4 验证：`curl localhost:3000/case-studies/sswt/people/hannah.html` 返回 200 + 完整 HTML 内容（defer 到 group 6 dev-server 检查）

## 2. Reader 组件与 Context

- [x] 2.1 新建 `components/reader/ReaderContext.tsx`：`createContext` + `ReaderProvider` 接收 `stories: ResidentStoryEntry[]`，state 含 `currentSlug | null` / `currentLang: 'zh'|'en'`；导出 `useReaderContext()` hook（context 为 null 时返回 null，由调用方降级处理）
- [x] 2.2 实现 `openReader(slug, lang?)` / `closeReader()`：openReader 校验 slug 在 stories 内、取 lang 优先级（传参 > useLocale > 'zh'）；closeReader 把 currentSlug 设 null
- [x] 2.3 ReaderProvider mount 时读 URL `?open=<slug>` 参数：若匹配 stories 则 `openReader(slug)` + `router.replace` 清除参数
- [x] 2.4 新建 `components/reader/ResidentStoryReader.tsx`：从 `useReaderContext()` 读 currentSlug；用 `createPortal` 渲染到 `document.body`
- [x] 2.5 Sheet DOM 结构：dim backdrop（z=45，onclick=closeReader）+ sheet（z=50，bottom-anchored，92vh）；sheet 内含 header（含 ✕ 按钮 + displayName + 语言 toggle）+ iframe content
- [x] 2.6 Iframe：`src` 由 `/case-studies/<studySlug>/people/<slug>{,_<lang>}.html` 组装；`sandbox="allow-same-origin allow-scripts"`；`title={displayName}`；onLoad 切换 skeleton；onError 显示 fallback
- [x] 2.7 关闭交互：✕ 按钮 click + ESC keydown listener（document-level，仅 sheet 打开时绑定）+ backdrop click + body scroll lock
- [x] 2.8 Sheet 动画：CSS transition `translate-y` 320ms ease-chamber；backdrop opacity 200ms ease-out
- [x] 2.9 焦点管理：打开时记录 `document.activeElement` → 焦点移到 ✕ 按钮；关闭时恢复焦点
- [~] 2.10 焦点循环：依赖 iframe 与 ✕ 按钮 / 语言 toggle 的天然 tab 顺序；未加 sentinel sandbox（iframe 内焦点行为由 SSWT HTML 自身决定，user-agent 默认 tab order 已可用——若后续投诉再加 trap）
- [x] 2.11 语言 toggle：渲染 `中 / EN` 二按钮，仅 `story.languages` 内的选项 enabled；切换时改 iframe src（不卸载 sheet）
- [x] 2.12 Skeleton：iframe 加载期间叠盖 6 条 pulse bar，onLoad 后 200ms 淡出
- [ ] 2.13 验证（手动）：依次点开 hannah / mary / a0290 中英版（defer 到 group 6 dev-server 验证）

## 3. 内容 Schema 与 lint

- [x] 3.1 `lib/content/case-study-schema.ts`（实际路径，非提案里的 cinema/contentSchema.ts）加 `ResidentStoryEntrySchema` + frontmatter `residentStories?: array`
- [x] 3.2 更新 `content/case-studies/synthetic-socio-wind-tunnel.mdx` frontmatter，声明三人 entries（hannah / mary / a0290 × zh,en）；顺手 bump cinemaScoreVersion 0.1.6 → 0.2.0 修复 pre-existing 不一致
- [x] 3.3 `scripts/content-lint.ts` 加规则：`residentStories[].slug × languages` 对应的 HTML 必须存在于 `public/case-studies/<study-slug>/people/`；同时把 sync 脚本目的地改为 slug-based 路径
- [x] 3.4 验证：`pnpm content:lint` 现在 1 file(s) clean（移动 6 HTML 到 slug-based 路径后通过）

## 4. 全局 Navigation Chrome

实装偏离：`SiteNav` 已存在（非新建 `GlobalNavChrome`），且已用 `LocaleProvider`/`LocaleSwitcher` 做了 i18n 基础——直接扩展 SiteNav 比新建组件干净。`ReaderProvider` 上移到 layout（不在 case study page），覆盖所有路由；stories 通过 `listResidentStories()` 在 build/SSR 时聚合所有 MDX。

- [x] 4.1-4.2 扩展 `components/chrome/SiteNav.tsx`：z-40，Home / Resident Stories ▾ / About + LocaleSwitcher（"Case Studies" 暂不渲染，无 listing 页避免 404）
- [x] 4.3 Resident Stories 下拉：`useReaderContext()` 读 stories；点击 entry 在当前是 case study 页则 `openReader(slug)`，否则 `router.push("/work/<studySlug>?open=<slug>")`
- [x] 4.4 跨页面入口：通过 `router.push(...?open=...)` 实现；ReaderProvider mount 时检测 query 自动打开
- [x] 4.5 语言：直接复用现有 `useLocale()`（已 localStorage 持久化 `portfolio-locale`），不另设 preferredLang（避免双 source of truth）
- [x] 4.6 滚动可见性：scrollY < 100 透明 + gradient overlay；≥ 100 加 `bg/70 + backdrop-blur-md`；transition 200ms
- [x] 4.7 视觉 token：沿用 `font-mono text-caption uppercase tracking-[0.18em]`，当前路由用 text-fg 强调
- [x] 4.8 挂载位置：`app/layout.tsx` 内 SiteNav 早已挂载——本次扩展即可，无需 mount 改动
- [x] 4.9 `app/layout.tsx` 加 `<ReaderProvider stories={listResidentStories()}>` 包裹 + `<ResidentStoryReader />` 全局渲染。Case study page 不再独立挂载 Provider
- [~] 4.10 hero 顶 padding：暂不调（hero 区已有 fade-to-transparent gradient，nav 文字与 hero 不冲突；如未来 hero 直接撞 nav 再补）
- [x] 4.11 最小 About 占位：`app/about/page.tsx` 一行简介 + GitHub 链接
- [ ] 4.12 验证（手动）：defer 到 group 6 dev-server

## 5. Agent Pickup 拓展

- [x] 5.1 `lib/cinema/scene-types.ts`（实际路径，非 types.ts）：加 `MapStatePickup` 类型 + `pickup?` to `MapState`；`MAP_STATE_DEFAULT` 类型重构为 `MapStateBaseline`（omit pickup）
- [x] 5.2 `lib/cinema/mapState.ts` 的 `resolveMapStateAt` 加 pickup 解析：scene 内 10/80/10 fade band，邻 scene 在 edge band 同时输出（最多 2 pickup 同帧 cross-fade）；新增 `ResolvedPickup` 类型
- [x] 5.3 `lib/content/case-study-schema.ts`：`MapStatePickupSchema` + `MapStateSchema` 加 `pickup?` 字段
- [x] 5.4 `AgentsTrajectoriesOverlay`：加 `pickups` prop（来自 MapOverlayProps）；filter `intensity > 0.05` + `targetAgentIndex` 在 sampled 范围；每个 pickup 渲染独立 `<PickupMarker>` sibling
- [x] 5.5 PickupMarker 高亮：扁平 `ringGeometry(0.07 * intensity, 0.095 * intensity, 32)` 平放地面（rotate -π/2 on x），meshBasicMaterial #f4c674 暖琥珀色 + 呼吸 pulse 0.85-1.0
- [x] 5.6 Invisible hitbox：`sphereGeometry(0.15)` `<mesh visible={false}>`，pointer events ✓；onClick 调 `useReaderContext().openReader(pickup.storySlug)`；onPointerOver 设 cursor: pointer
- [x] 5.7 `registry.ts` + `MapOverlay.tsx`：`MapOverlayProps` 加 `pickups?: ResolvedPickup[]`；MapOverlay 透传
- [x] 5.8 `CinemaCanvas.tsx`：`<MapOverlay pickups={resolvedMap.pickups} />`；`useResolvedMapState` 也加 pickups 到 INITIAL + diff
- [x] 5.9 内容编排：scene-1-3-attention-displacement（Act 1，已用 agents_trajectories overlay）加 `mapState.pickup: { storySlug: hannah, targetAgentIndex: 12 }`。Act 2/3 scenes 不在本 change 范围（user 在润色 Act 3），未来 follow-up 再绑定 mary/a0290 到 Act 2 系统反思 scenes
- [x] 5.10 frontmatter 三人 entries 加 `agentId`（hannah:12 / mary:42 / a0290:88）作为后续 pickup 编排的 reference
- [x] 5.11 content-lint 加规则：`mapState.pickup.storySlug` 必须在 frontmatter `residentStories[].slug`；`targetAgentIndex` 在 `[0, PEOPLE_SAMPLE_COUNT=200)` 范围（mirror AgentsTrajectoriesOverlay 实际 count）
- [ ] 5.12 验证（手动）：defer 到 group 6 dev-server

## 6. 整体验证 + 文档

- [x] 6.1 `pnpm typecheck` 全绿 / `pnpm lint` 仅 pre-existing 警告（4 处，均与本 change 无关）/ `pnpm content:lint` 1 file(s) clean
- [x] 6.2 `pnpm build` 成功（7 routes: /, /about, /work/synthetic-socio-wind-tunnel, /_not-found, /dev/trajectory）；6 HTML 已落在 `public/case-studies/synthetic-socio-wind-tunnel/people/`（slug-based 路径）
- [x] 6.3 `pnpm dev` 实测 HTTP 验证：home / about / case study 全 200；6 HTML 资源全 200（hannah 640KB、mary_en 3.7MB 等）；ghost.html → 404；`?open=hannah` 路由正常；SSR'd HTML 包含 "Resident Stories" 与 "York Zhou" 字样。完整浏览器手动 journey（点 agent、切语言、ESC 关闭）defer 给 user
- [x] 6.4 README 更新："Resident stories" 新章节 + `pnpm sync:resident-stories` 进脚本表
- [x] 6.5 `openspec status --change resident-stories-reader` → 4/4 artifacts complete; ready for `/opsx:archive` after final user review

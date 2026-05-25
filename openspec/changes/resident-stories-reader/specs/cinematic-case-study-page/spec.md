## ADDED Requirements

### Requirement: Frontmatter residentStories 字段

Case study MDX frontmatter SHALL 接受可选字段 `residentStories`：

```ts
residentStories?: Array<{
  slug: string;            // 唯一标识，对应 public 路径片段
  displayName: string;     // nav 下拉与 reader header 显示
  role: string;            // 一行副文，如 "36 岁咖啡店老板娘"
  languages: ('zh' | 'en')[];   // 已生产的语言版本
  agentId?: string;        // 可选——绑定 sandbox 内特定 agent（用于 pickup 入口）
}>
```

Zod schema 在 `lib/cinema/contentSchema.ts` 内：required slug + displayName + languages（≥1）；agentId 可选。

#### Scenario: SSWT case study 声明三人

- **WHEN** `content/synthetic-socio-wind-tunnel.mdx` frontmatter 含 `residentStories: [{slug:'hannah',...}, {slug:'mary',...}, {slug:'a0290',...}]`
- **THEN** 该字段被 Zod 校验通过，case study page 把它注入 `ReaderProvider`；GlobalNavChrome 的 Resident Stories 下拉看到三条目

#### Scenario: 无 residentStories 字段

- **WHEN** 某 case study frontmatter 不含此字段
- **THEN** Zod 解析成功（字段可选），case study page 仍正常渲染；Resident Stories 下拉对该页显示为空（或 disabled）

### Requirement: ReaderProvider 挂载

Case study page (`app/work/[slug]/page.tsx`) SHALL 用 `<ReaderProvider stories={frontmatter.residentStories ?? []}>` 包裹整页内容：

- Provider scope = case study 路由层；root layout 不挂 provider（因为 stories 是 case-study-local 概念）
- 全局 nav 通过 `useReaderContext()` 读取当前 provider；context 为 null 时 nav 链接走 query 参数路由跳转
- Provider 内部实现 `currentSlug` / `currentLang` state + `openReader(slug, lang?)` / `closeReader()` 方法
- 监听 URL `?open=<slug>` 参数：mount 时若有该参数，自动 `openReader(slug)` 并清除 URL 参数

#### Scenario: 从外部 URL 进入并自动打开

- **WHEN** 用户访问 `/work/synthetic-socio-wind-tunnel?open=hannah`
- **THEN** case study page mount → ReaderProvider mount → 检测到 query 参数 → 自动 `openReader('hannah')`；URL 通过 `router.replace` 清除参数为 `/work/synthetic-socio-wind-tunnel`

#### Scenario: 不存在的 slug

- **WHEN** URL `?open=nonexistent`
- **THEN** Provider 检查 stories 列表，未匹配则忽略，reader 不打开，URL 参数仍被清除

### Requirement: AgentsTrajectoriesOverlay pickup 拓展

`AgentsTrajectoriesOverlay` SHALL 接受新可选 prop `pickup`：

```ts
pickup?: {
  targetAgentIndex: number;       // 在 sampled agents 数组中的 index（确定性）
  storySlug: string;              // 关联的 resident story
  intensity: number;              // 0-1，由 scoreResolver 平滑插值
}
```

行为：

- `intensity > 0` 时，对应 index 的 agent 渲染**强化样式**：球体半径放大到 0.05、外圈半透明 ring（mesh：`ringGeometry(0.06, 0.08, 32)`，emissive `oklch(var(--glow))`）、cursor 在该球体上变 `pointer`
- 点击该 agent 触发 `useReaderContext().openReader(pickup.storySlug)`
- 命中区域：在原球体外加 invisible `sphereGeometry(0.12)` mesh 作为 raycast hitbox（解决小球难点中的问题）
- `intensity = 0` 时 overlay 行为不变（pickup 关闭）

#### Scenario: scene mapState 激活 pickup

- **WHEN** 某 scene `mapState.pickup = { targetAgentIndex: 12, storySlug: 'mary' }`，镜头在该 scene 范围内
- **THEN** resolver 输出 `pickup.intensity` 在 scene enter/exit fade band 内 0→1→0；AgentsTrajectoriesOverlay 在 intensity>0.1 时高亮 index=12 的 agent 并启用点击

#### Scenario: 多 pickup scene 不冲突

- **WHEN** 不同 scene 指向不同 agent（如 scene A → mary, scene B → hannah）
- **THEN** resolver 在 scene 间过渡时同时插值两个 pickup 的 intensity（前者衰减、后者上升）；overlay 同时高亮两个 agent 是允许态

#### Scenario: 移动端触屏

- **WHEN** 用户在触屏设备上点击高亮 agent
- **THEN** invisible hitbox（半径 0.12）确保命中成功；reader 浮起

### Requirement: mapState.pickup 字段流转

`scoreResolver` SHALL 把 scene 级 `mapState.pickup` 解析并平滑插值：

- 输入：scene array + current scroll t
- 输出：当前帧合成的 `mapState.pickup`（含 intensity 插值后的值）
- 插值规则：scene enter fade band（10% scene 长度）线性 0→1；hold 段保持 1；exit fade band 线性 1→0
- 跨 scene 边界时若两侧都有 pickup，两个 pickup 同时输出（数组形式），overlay 同时处理

#### Scenario: 解析无 pickup 的 scene

- **WHEN** scene 不含 `mapState.pickup`
- **THEN** 该 scene 范围内 resolver 输出 `pickup: null`；overlay 行为回退到无 pickup 默认态

### Requirement: content-lint 校验

`scripts/content-lint.ts` SHALL 增加以下规则：

1. frontmatter `residentStories[].slug` + `languages` 组合声明的 HTML 资源文件必须存在于 `public/case-studies/<study-slug>/people/`（如 `hannah.html`、`hannah_en.html`）
2. frontmatter `residentStories[].agentId` 若声明，必须能映射到 sampled agents 范围（基于 `sampleAgents` 的 seed + count）
3. scene `mapState.pickup.storySlug` 必须出现在 frontmatter `residentStories[].slug` 列表中
4. scene `mapState.pickup.targetAgentIndex` 必须在 `[0, sampleCount)` 范围

#### Scenario: 声明的资源缺失

- **WHEN** frontmatter 声明 `{slug:'foo', languages:['zh','en']}` 但 `public/case-studies/sswt/people/foo_en.html` 不存在
- **THEN** content-lint 报错：`Missing resident story asset: foo_en.html`，CI 失败

#### Scenario: pickup 指向未声明的 story

- **WHEN** scene `mapState.pickup.storySlug = 'ghost'` 但 frontmatter `residentStories` 不含 ghost
- **THEN** content-lint 报错：`Scene pickup references undeclared story: ghost`

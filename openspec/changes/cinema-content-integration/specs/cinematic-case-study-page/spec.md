## ADDED Requirements

### Requirement: Scene 是最小设计单元

每个 beat 的内容 SHALL 由若干**显式定义的 scene** 组成，而非单一 markdown 串。每个 scene MUST 是 (camera 状态 / text-form / transition / interaction / duration / junction) 这 6 个维度的原子组合。

#### Scenario: Beat body 仅有未拆分的 markdown

- **WHEN** 一个 beat 的 frontmatter 把 body 写成单一长 markdown 字符串
- **THEN** content-lint SHOULD 提示该 beat 应被拆为 scene 列表（每节小标题对应一个 scene）

#### Scenario: Scene 缺少必需的设计维度

- **WHEN** 某 scene 没有定义 camera / text-form / transition 中任意一项
- **THEN** content-lint SHOULD 阻断 build；6 维度全部填齐才算合法 scene

### Requirement: 6 维度 per-scene 设计框架

每个 scene 的设计 SHALL 通过回答 6 个标准问题确立：

1. **Camera** — 该 scene 期间相机做什么（位置 / 推拉 / 节奏）
2. **Text-form** — 文字以什么形式出现（位置 / 字号 / 整段还是分句）
3. **Transition** — 文字怎么进退场（淡入 / 滑入 / 拍击 / 等）
4. **Interaction** — 用户能做什么（默认只滚动）
5. **Duration** — scroll 预算（short / mid / long 或精确 svh 值）
6. **Junction** — 与前后 scene 的交接关系

未回答这 6 题的 scene MUST NOT 进入实施。框架完整记录在 `openspec/changes/cinema-content-integration/design.md` D2 节。

#### Scenario: 实施时跳过框架

- **WHEN** 实施 propose 试图实现某 scene 但 design.md 里该 scene 缺 6 维度中任意一项
- **THEN** 该 scene 实施 SHALL 被退回，要求先补齐设计

### Requirement: Storyboard 路由删除

`/work/[slug]/storyboard` 路由 MUST 不再存在。整个 web 上案例研究只有一种渲染方式：cinema 一镜到底。任何关于 reduced-motion / 印刷版的兜底需求 SHALL 在实施 propose 中独立解决（如通过 cinema 内的 `prefers-reduced-motion` 降级行为，而不是另开路由）。

#### Scenario: 用户访问 /storyboard

- **WHEN** 用户访问 `/work/[slug]/storyboard`
- **THEN** 应得到 404（路由已删除）

#### Scenario: 文档引用 storyboard

- **WHEN** 任何文档（README / docs / spec）仍提及 storyboard 作为独立路由
- **THEN** 应在后续 housekeeping 中清除（不阻塞当前实施）

## MODIFIED Requirements

### Requirement: Reduced-motion 与 no-WebGL 兜底

当 `prefers-reduced-motion: reduce` 或 WebGL 不可用时，cinema 页 SHALL 在同一路由内降级渲染——保留 scene 切换的内容文本，停止相机动画 + 后处理特效，让 sand table 以静态视图呈现。MUST NOT 跳转到独立路由。

#### Scenario: 用户设置 reduced-motion

- **WHEN** 浏览器报告 `prefers-reduced-motion: reduce`
- **THEN** 当前页保留显示，camera 不动 / scene 文本仍按 scroll 切换 / 后处理 disable；不跳转其它路由

#### Scenario: WebGL 不可用

- **WHEN** WebGL context 创建失败
- **THEN** 当前页降级显示静态文字 scene + sand table 的 fallback 图层（如 css-rendered 占位轮廓）；仍不跳转

## REMOVED Requirements

### Requirement: 静态分镜长卷路由

**Reason**: 整个站重定义为"一镜到底唯一"——cinema 页本身承载 reading + cinematic experience；不再需要独立的 storyboard 阅读路径。

**Migration**: storyboard 路由文件 (`app/work/[slug]/storyboard/page.tsx`) 已删除；所有指向它的文档与代码引用应在后续 housekeeping 中清除；reduced-motion 兜底改为 cinema 页内降级（见上面 MODIFIED 项）。

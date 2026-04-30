## ADDED Requirements

### Requirement: 三幕脊柱结构

案例研究页面 SHALL 由且仅由三幕（Act 1 注意力边界 / Act 2 产品本体 / Act 3 探索的结论）组成；每幕由若干 beat 组成；不允许在三幕之外存在内容段落。

#### Scenario: 路由首屏加载

- **WHEN** 用户首次访问 `/work/synthetic-socio-wind-tunnel`
- **THEN** 页面在 viewport 内只呈现 Act 1 Beat 1（`open-real-world`）的内容与镜头初始状态，且 DOM 中按文档顺序存在三幕全部 beat 的语义节点（用于 SEO 与无 JS fallback）

#### Scenario: 在三幕外尝试新增段落

- **WHEN** 作者在 frontmatter 添加一个不属于任何 act 的顶级 section
- **THEN** `pnpm content:lint` 报错并阻断 build，错误指明仅允许 `acts: Act[]` 顶级结构

### Requirement: 一镜到底视觉契约

页面整个滚动过程中相机 MUST NOT 出现硬切；段间转场 MUST 使用镜头语言（push-in / pull-back / dolly-arc / match-dissolve / focus-rack）实现；段落级 fade-to-black、scroll-snap、全屏 section 模式 MUST NOT 被使用。

#### Scenario: 滚动从 Act 1 到 Act 2

- **WHEN** 用户连续滚动跨越 Act 1 末与 Act 2 始（progress 0.33–0.37）
- **THEN** 相机沿 camera score 中预定义的连续轨道平滑过渡，无任何 opacity 0→1 的全屏 fade 或视觉断点

#### Scenario: 滚动跨越 Act 2 末与 Act 3 始

- **WHEN** 用户连续滚动跨越 Act 2 末与 Act 3 始（progress 0.76–0.80）
- **THEN** 相机执行 pull-back，沙盘视图从 Act 2.4 的近景拉回到 Act 3.1 的全景，过程中 sand-table 渲染从未中断

### Requirement: 滚动进度驱动 camera score

页面 SHALL 维护一个 camera score 数据结构作为相机轨迹的单一来源；scroll progress（0..1） SHALL 通过 `lib/cinema/scroll-cinema.ts` 中定义的非线性映射转换为 score 时间 t；HUD 与沙盘子系统都 SHALL 从同一份 t 派生当前应渲染状态。

#### Scenario: score 与 frontmatter 解耦

- **WHEN** camera score 中的某个 shot id 在 frontmatter 中找不到对应 `shotRef`
- **THEN** `pnpm content:lint` 报错并阻断 build

#### Scenario: 用户停止滚动在镜头中段

- **WHEN** 用户停止滚动且当前 t 不在任何 beat 的稳定锚点上
- **THEN** 相机 spring 缓冲到最近的稳定锚点；HUD 文字仅在到达稳定锚点后 fade-in

### Requirement: HUD 信息层

页面 SHALL 提供四种 HUD 形态（`cue-card` / `letterbox` / `in-world-label` / `hud-panel`）；每个 beat 必须且仅声明一种 HUD 形态；HUD 文本 MUST 可被 screen reader 朗读，MUST 可选中复制。

#### Scenario: cue-card 显示

- **WHEN** 当前 beat 的 HUD 形态为 `cue-card` 且滚动到达稳定锚点
- **THEN** cue-card 以 fade-in 出现在指定屏幕位置，文本节点存在于 DOM（不是 canvas 内绘制），可被键盘 Tab 选中并复制

#### Scenario: letterbox 字幕显示

- **WHEN** 当前 beat 的 HUD 形态为 `letterbox`
- **THEN** 上下黑带 + 居中字幕呈现，黑带遮挡 sand-table 视图但不阻止其继续渲染

### Requirement: Reduced-motion 与 no-WebGL 兜底

当 `prefers-reduced-motion: reduce` 或 WebGL 不可用时，主页面 SHALL NOT 静默降级；系统 SHALL 显示 banner 通知并提供切换到 `/work/[slug]/storyboard` 分镜版的入口。

#### Scenario: 用户设置 reduced-motion

- **WHEN** 浏览器报告 `prefers-reduced-motion: reduce`
- **THEN** 页面顶部显示 banner「为减少运动，已切换到分镜版」并附"返回动画版"按钮；当前 URL 跳转到 `/work/[slug]/storyboard`

#### Scenario: WebGL 不可用

- **WHEN** WebGL context 创建失败
- **THEN** 自动跳转到 storyboard 路由；不显示空白 canvas 或错误提示

### Requirement: 静态分镜长卷路由

`/work/[slug]/storyboard` 路由 SHALL 渲染当前案例的纵向分镜长卷；每个 beat 对应一格，每格包含 `claim` 散文 / HUD 文本内容 / `fallbackFigure` SVG；该页面 MUST 完全可读、MUST 不依赖 WebGL、MUST 在 print stylesheet 下分页友好。

#### Scenario: 直接访问 storyboard

- **WHEN** 用户直接访问 `/work/synthetic-socio-wind-tunnel/storyboard`
- **THEN** 页面以纵向滚动渲染所有三幕 × beats 的分镜格，每格 `aspect-ratio: 16/9`，无任何 R3F canvas 实例化

#### Scenario: 浏览器打印 storyboard

- **WHEN** 用户使用浏览器打印功能
- **THEN** 每个 beat 占据一页，break-after 正确，SVG 矢量渲染不像素化

### Requirement: 一镜到底页面与 storyboard 共享 frontmatter

主页面与 storyboard 路由 SHALL 从同一份 MDX frontmatter 派生内容；不允许两条路径存在内容偏差。

#### Scenario: 修改一处文案

- **WHEN** 作者修改 frontmatter 中某 beat 的 `claim`
- **THEN** 主页面 cue-card / letterbox 文本与 storyboard 该格散文同步更新；CI visual-regression 在两个路径都验证

### Requirement: SEO 与社交分享

页面 SHALL 生成结构化数据（`CreativeWork`），SHALL 提供分镜长卷的三幕全景作为 OG 图，SHALL 在 head 写入 frontmatter 派生的 title / description / canonical。

#### Scenario: 分享到社交平台

- **WHEN** 用户分享 `/work/synthetic-socio-wind-tunnel` 链接到 Twitter / Slack
- **THEN** 卡片显示分镜长卷三幕一帧的 OG 图（沙盘 + 镜头轨迹 ghost line 叠加）

### Requirement: 资产新鲜度戳

页面 footer SHALL 显示 `manifest.json` 中的 `generatedAt` / `sourceSha` / `cinemaScoreVersion` 三个字段。

#### Scenario: 资产管线运行后

- **WHEN** `pnpm export:sswt` 运行完成更新 `manifest.json`
- **THEN** 下次 build 后页面 footer 反映新的时间戳与 sha；cinemaScoreVersion 在每次 score 改动时手动 bump

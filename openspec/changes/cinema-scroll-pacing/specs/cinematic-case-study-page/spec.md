## ADDED Requirements

### Requirement: 自由滚动，不劫持滚轮速度

案例页面 SHALL 使用浏览器原生 free scroll 行为。html / body 元素 MUST NOT 设置 `scroll-snap-type: mandatory` 或任何 JS 滚轮拦截（wheel event preventDefault、scroll velocity damping 等）。用户在任何时刻 MUST 拥有完整的滚动 agency。

#### Scenario: 启用 mandatory snap

- **WHEN** `app/globals.css` 或任何样式表声明 `scroll-snap-type: y mandatory` 用于全局滚动
- **THEN** content-lint 报错；唯一允许的 snap 类型为 `proximity` 或不设置；mandatory 仅在 `prefers-reduced-motion: reduce` 路径下作为兜底

#### Scenario: JS 拦截滚轮事件

- **WHEN** 任何 component 调用 `window.addEventListener("wheel", e => e.preventDefault(), {passive: false})` 或等价做法
- **THEN** code review SHALL 拒绝；除非该 listener 仅在 autoplay 模式激活时绑定且有显式退出按键

### Requirement: 文本场景 sticky 钉视口

`rhythm === "still"` 的 scene MUST 渲染于一个 `position: sticky; top: 0` 的容器内，容器高度 MUST 占满视口（100svh，dvh 兜底）。容器外层是该 scene 的 marker `<section>`，marker 高度 = 该 scene 的 scroll 预算。用户滚动经过 marker 时，sticky 容器 MUST "钉"在视口顶部直到 marker 滑出。

`rhythm === "motion"` 与 `rhythm === "bridge"` 的 scene 不强制 sticky；通常无文字或仅极简文字，依靠 cinema floor 的 fixed canvas 承载视觉。

#### Scenario: still scene 文字飞滚下不固定

- **WHEN** 用户以高速度滚轮经过 still scene
- **THEN** 该 scene 的文字 MUST 在视觉上"钉"在视口同一位置至少 80% scene 时长，不得随 scroll 位置发生 translateY

#### Scenario: still scene 缺 sticky 容器

- **WHEN** 渲染层未把 still scene 包在 `position: sticky; top: 0` 容器中
- **THEN** 实施 propose 中的相关 task 视为未完成

### Requirement: 文本场景相机"屏息"漂移

当当前 scene 的 `rhythm === "still"` 时，CameraRig MUST NOT 调用 `dwellEase`，MUST NOT 内插到 `scene.camera.to`。相机基于 `scene.camera.from` 应用一个**自动且细微的"屏息"漂移**：从 `from` 沿 `lookAt − from` 方向缓慢推近（push-in），幅度为该向量长度的 **3%（STILL_DRIFT = 0.03）**，随 sceneLocalT 线性进展。这模拟"读者被内容吸引、轻轻探身向前"的感觉——避免画面绝对静止带来的"卡死"观感，又不破坏 still rhythm 的注意力分配。

`rhythm === "motion"` 与 `rhythm === "bridge"` 的 scene 保留现有 `dwellEase(sceneLocalT)` 内插路径。

进入 still scene 时，相机的位置过渡 SHALL 通过现有 spring（`lib/cinema/spring.ts`）柔顺收敛到 still 起点——不能硬切。

`prefers-reduced-motion: reduce` 媒体查询匹配时（D8），still 漂移强制归零（位置严格 = `cam.from`）。

#### Scenario: still scene 内相机不漂移

- **WHEN** 用户在 still scene 内停留
- **THEN** 相机 world position 应沿 `lookAt − from` 方向缓慢推近，从 `from`（sceneLocalT=0）到 `from + 0.03 × (lookAt − from)`（sceneLocalT=1）；视觉上应是几乎察觉不到的细微推近，绝不允许完全冻结

#### Scenario: still scene 漂移过大

- **WHEN** 任何实现使 still scene 的相机位移超过 cam-lookAt 距离的 5%
- **THEN** 该实现 SHALL 被拒——目的是"呼吸"不是"运镜"，超过 5% 即破坏 still rhythm 的注意力锚定

#### Scenario: reduced-motion 下漂移归零

- **WHEN** OS 启用减少动效
- **THEN** still scene 的相机 world position 严格等于 `cam.from`，0 漂移

#### Scenario: motion → still 过渡

- **WHEN** 滚动从 motion scene 进入紧邻的 still scene
- **THEN** 相机应在 200ms 以内从前一个 motion scene 的末位 spring 收敛到 still scene 起点；不允许瞬时跳变

### Requirement: 节奏交替规则

同一 beat 内 scene 的 `rhythm` 序列 MUST 满足：

- 连续 `still` scene 数量 MUST ≤ 2
- 连续 `motion` scene 数量 MUST ≤ 1
- `bridge` 不计入连续计数（可作为分隔）

#### Scenario: 三连 still

- **WHEN** beat 的 scenes 中连续出现 3 个或以上 `rhythm === "still"`
- **THEN** content-lint 报错；要求作者在中间插入 motion 或 bridge

#### Scenario: 两连 motion

- **WHEN** beat 的 scenes 中连续出现 2 个或以上 `rhythm === "motion"`
- **THEN** content-lint 报错（理由：连续运动镜头会失去强调效果）

### Requirement: 进退场窗口与 still 场景的 hold 段全不透明

`sceneTransitionProgress` 的三段窗口比例 SHALL 为 **10% / 80% / 10%**（enter / hold / exit）——把"完全不透明可读"区间从原 64% 拉到 80%，与 CPS 计算的 dwell 时间形成乘积保证。

对 `rhythm === "still"` 的 scene，hold 段（中间 80%）的文字 opacity MUST = 1（完全不透明，不允许 sub-1 opacity 逐帧调整）。enter 与 exit 段保留淡入淡出。

对 `motion` 与 `bridge`，文字（若有）opacity 曲线允许更激进的 enter/exit 比例（如 30/40/30）以匹配镜头节奏。

#### Scenario: still scene hold 段文字半透明

- **WHEN** 用户停在 still scene 的中间 80% 区间
- **THEN** 文字 opacity 应严格 = 1，不得因 cross-fade 计算溢出而出现 0.95 等中间值

#### Scenario: 仍使用 18/64/18 窗口

- **WHEN** `lib/cinema/scrollCinema.ts` 的 `sceneTransitionProgress` 仍按 18/64/18 计算
- **THEN** 实施 propose 中的对应 task 视为未完成；MUST 改为 10/80/10

### Requirement: 最短 dwell 时长保证

任何 scene 的 dwell（svh × baseline scroll px/s 折算的真实秒数）MUST ≥ 1.5 秒，即使该 scene 内容仅一个字。该约束由 schema 层 `MIN_DWELL_S = 1.5` 实现：computeStillSvh / computeMotionSvh / computeBridgeSvh 的输出经过 floor，确保 `svh ≥ 150`（在 1000px viewport + 1000px/s baseline 假设下）。

理由：字幕业实测——视觉系统从"字出现"到"理解出现"需要约 0.25–0.5s 反应时；加上读取本身，最短 1.5s 才能让眼睛"看清"。低于 1.5s 即闪屏感。

#### Scenario: scene svh < 150

- **WHEN** computeStillSvh 输入产生 < 150 的输出
- **THEN** 函数 MUST 返回 150，不得返回更小值

### Requirement: Reduced motion 兜底

当 `prefers-reduced-motion: reduce` 媒体查询匹配时，案例页面 SHALL 切到"静态翻页"模式：

- sticky 行为禁用；每个 scene 占 100svh 全屏
- 相机 hold 全部强制（即使是 motion / bridge scene 也按 still 渲染）
- HUD 提供前/后翻页按钮（独立 capability，本 propose 不实现，仅留接口）
- 文字进退场动画时长 ≤ 100ms

#### Scenario: 用户启用减少动效

- **WHEN** 操作系统侧勾选"减少动效"
- **THEN** 页面 SHALL 不显示沙盘相机的连续位移；scene 之间通过翻页按钮或键盘导航切换

## MODIFIED Requirements

### Requirement: Scene 是最小设计单元

每个 beat 的内容 SHALL 由若干**显式定义的 scene** 组成，而非单一 markdown 串。每个 scene MUST 是 (camera 状态 / text-form / transition / interaction / duration / junction / **rhythm**) 这 **7 个维度**的原子组合。第 7 维 `rhythm`（值域 `"motion" | "still" | "bridge"`）由 `cinema-scroll-pacing` 引入，决定该 scene 的滚动节奏类型。

#### Scenario: Beat body 仅有未拆分的 markdown

- **WHEN** 一个 beat 的 frontmatter 把 body 写成单一长 markdown 字符串
- **THEN** content-lint SHOULD 提示该 beat 应被拆为 scene 列表（每节小标题对应一个 scene）

#### Scenario: Scene 缺少必需的设计维度

- **WHEN** 某 scene 没有定义 camera / text-form / transition / **rhythm** 中任意一项
- **THEN** content-lint SHOULD 阻断 build；7 维度全部填齐才算合法 scene

### Requirement: 6 维度 per-scene 设计框架

每个 scene 的设计 SHALL 通过回答 7 个标准问题确立（由 `cinema-content-integration` 引入的 6 维度，本 propose 增加第 7 维 rhythm，使框架升级为 7 维度）：

1. **Camera** — 该 scene 期间相机做什么（位置 / 推拉 / 节奏）；若 rhythm = still，from === to
2. **Text-form** — 文字以什么形式出现（位置 / 字号 / 整段还是分句）
3. **Transition** — 文字怎么进退场（淡入 / 滑入 / 拍击 / 等）
4. **Interaction** — 用户能做什么（默认只滚动）
5. **Duration** — scroll 预算，由 `emphasis` 字段（CPS 4 档：brief / standard / dwell / linger）反推，详见 case-study-content-schema 增量 spec
6. **Junction** — 与前后 scene 的交接关系
7. **Rhythm** — `motion / still / bridge`，决定该 scene 滚动节奏类型

未回答这 7 题的 scene MUST NOT 进入实施。Requirement 名称保留为 "6 维度" 以维持 spec 历史可追溯。

#### Scenario: 实施时跳过框架

- **WHEN** 实施 propose 试图实现某 scene 但 design.md 里该 scene 缺 7 维度中任意一项
- **THEN** 该 scene 实施 SHALL 被退回，要求先补齐设计

### Requirement: Storyboard 路由删除

`/work/[slug]/storyboard` 路由 MUST 不再存在。整个 web 上案例研究只有一种渲染方式：cinema 一镜到底。任何关于 reduced-motion / 印刷版的兜底需求 SHALL 通过 cinema 内的 `prefers-reduced-motion` 降级处理（见上述新增 Requirement: Reduced motion 兜底），而不是另开路由。

#### Scenario: 用户访问 /storyboard

- **WHEN** 用户访问 `/work/[slug]/storyboard`
- **THEN** 应得到 404（路由已删除）

#### Scenario: 文档引用 storyboard

- **WHEN** 任何文档（README / docs / spec）仍提及 storyboard 作为独立路由
- **THEN** 应在后续 housekeeping 中清除（不阻塞当前实施）

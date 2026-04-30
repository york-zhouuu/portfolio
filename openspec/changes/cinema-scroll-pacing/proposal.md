## Why

**作者实测："滚轮一滚，文字刷刷过去——彻底解。"**

`cinema-content-integration` 把内容拆成 scene，`cinema-scene-system` 把渲染层接上，但**没有一个文档明确"用户飞滚时该如何感知一段文字"**——只有 dwellEase（让相机慢）+ scroll-snap mandatory（强制停车）。两个 hack 加起来仍然糟糕。

研究 Apple 的同类页面（MacBook Neo / Vision Pro / AirPods Pro）后发现一个**反直觉但根本**的事实：

> **Apple 不试图减慢用户的滚动速度。**

它们用 `position: sticky` 把"舞台"钉死在视口，用 scroll-linked animation 让视觉与滚动同步——飞滚时视觉播放就快，慢滚时就慢，但**永远不打架**。NN/G 的 scrolljacking 研究、苹果产品页十年实战都得出同一个结论：劫持滚轮速度 = 用户信任崩塌。

我们之所以痛，是因为本项目有 Apple 没有的**根本冲突**：

| 内容类型 | 飞滚容忍度 |
|---------|-----------|
| 镜头本身（沙盘 pan / push） | ✅ 高 — 飞滚 = 加速播放，可接受 |
| 散文段落（背景介绍 / 章节正文） | ❌ 零 — 词不读 = 没有意义 |

苹果产品页几乎没有需要"读"的长文，所以滚动速度问题被回避了。**我们必须正面解。**

需要建立一个跨所有 beat 的**镜头-文本节奏系统（cinema rhythm）**，让"飞滚"在任何 scene 上都不撕裂体验：相机段全速播放，文本段相机自动 hold + 文字 sticky 钉视口 + 时间维 fade。一处定下来，9 个 beat 全部受益。

## What Changes

- **撤销 `scroll-snap-type: y mandatory`**——回 free scroll。Apple/NN-G 已证伪。
- **建立 scene 节奏类型（rhythm kind）**：每个 scene 必须显式声明三种之一
  - `motion` — 相机运动主导（breath、过场）。文字若有也是单字 / 极简。
  - `still` — 文字阅读主导（title / lead / body-section / pull-quote）。**相机 MUST 在该 scene 内保持位置（cam.from === cam.to）**。
  - `bridge` — 节奏切换段。允许相机微动 + 提示性短文字。
- **节奏交替规则（rhythm rule）**：相邻 scene 不可同为 `motion`/`motion` 或 `still`/`still` 超过 N 个，必须交替成"动–静–动–静"。violation 由 content-lint 提示。
- **文本 sticky 钉视口**：`SceneLayer` 从 `position: fixed` 改为**每个 scene marker 内挂一个 `position: sticky` 文本容器**——飞滚时文字"钉"住而不"飞"。
- **相机 hold 由架构强制**：CameraRig 检测 `kind === "still"` 时短路，不再读 `dwellEase` 也不内插，相机绝对静止；只有 `motion`/`bridge` 走原 dwellEase。
- **引入 emphasis 字段（CPS 4 档）**：每个 scene 必填 `emphasis: "brief" | "standard" | "dwell" | "linger"`，default `standard`。这是作者控制 dwell 时长的**唯一**接口——锚定到字幕业 CPS（Characters Per Second）标准（12 / 9 / 7 / 5 字/秒）。
- **DURATION_SVH 改为 CPS 公式反推**：`short/mid/long` 三档替换为 `targetSeconds = chars / CPS + 0.5s`，clamp 在 [1.5s, 6.5s]，再折算 svh。emphasis 同时控制 motion scene 的"运动速率"（emphasis 越高，相机越慢）。
- **单 scene 字数硬上限**：CPS 6.5s cap 推导出 `54 字（zh）/ 110 字符（en）` 上限（standard 档）；超过即拆 scene——这恰好是字幕业"长句切两行"在 web 维度的体现。
- **fade hold band 由 18/64/18 改为 10/80/10**：完全不透明可读区间从 64% 拉到 80%，文字"坐稳"的时间显著拉长。
- **可选：autoplay 模式**——HUD 加按钮，自动 `window.scrollTo({ top: …, behavior: "smooth" })` 沿 score 推进；空格暂停。给"懒得滚"的访客一条被动通道。
- **可选：fade 时间维兜底**——文字 enter/exit 在飞滚下用 wall-clock 兜底，保证最少 300ms 显示窗口。**留待实施 propose 评估**，本 propose 仅记录方案。
- **本 propose 不写代码**——只产出 spec + tasks，作者批阅后开实施 propose。

## Capabilities

### Modified Capabilities

- `cinematic-case-study-page`（在 `sswt-cinematic-case-study` 下定义）—— 新增 scene rhythm kind 必填字段、节奏交替规则；移除 scroll-snap 强制；明确文本场景相机必须 hold。
- `case-study-content-schema`（在 `cinema-content-integration` 下定义）—— 每个 scene 增加 `rhythm: "motion" | "still" | "bridge"` 必填字段；DURATION_SVH 由内容密度替换；content-lint 增加节奏校验规则。

### New Capabilities

_None — 不新增 capability，把节奏维度并入已有 scene 设计框架（成为第 7 维：camera / text-form / transition / interaction / duration / junction / **rhythm**）。_

## Impact

- **架构**：`SceneLayer` 渲染策略由 fixed 全屏改为 sticky per-scene。`CameraRig` 增加 still 短路分支。`globals.css` 移除 mandatory snap。
- **内容**：当前已迁移的 Beat 1.1 七个 scene 必须各补 `rhythm` 字段；camera waypoint 需复审（凡 `still` 的 scene 必须 from === to）。
- **9 个未迁移 beat**：每个 beat 在做 storyboard propose 时，必须同时确定每个 scene 的 rhythm kind——不增加新工作量，只是把现在隐含的判断显化。
- **依赖关系**：本 propose **必须先于 beat-1-2/1-3/… 任何 storyboard propose**。否则后续 storyboard 还会按旧框架做，定下来再返工。
- **不影响**：sand table 渲染、设计 token、i18n、文字内容本身。
- **风险**：sticky 文本与 fixed 相机层叠时的 z-index 与遮挡需要架构验证；若 sticky 在 R3F Canvas 外的 DOM 层做，应该不冲突（已是当前 SceneLayer 的位置，只是改 position 模式）。设计阶段须画清楚这个层叠图。

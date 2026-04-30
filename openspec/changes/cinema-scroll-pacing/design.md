## Context

### 痛点 — 飞滚撕裂体验

`cinema-content-integration` 把每个 beat 拆成 scene；`cinema-scene-system` 实现了渲染、`dwellEase`（相机非线性慢点）、cross-fade 36% 重叠窗口。Beat 1.1 落地后作者亲测：

> "我滚轮一滚下去，文字刷刷的就滑过去了。"

后续做了两个 hack：

1. `DURATION_SVH` 从 70/110/150 → 110/180/280（每个 scene 的 scroll 预算 1.5–2×）
2. `scroll-snap-type: y mandatory` + 每个 scene 一个 marker 配 `scroll-snap-stop: always`

作者复测："体验还是比较糟糕。"

### Apple 的反例 — 不减慢、只钉视口

苹果产品页（MacBook Neo / Vision Pro / AirPods Pro）通过反复观察与社区拆解可总结为：

```
┌────────────────────────────────────────────────────────────────────┐
│  Apple 产品页滚动模型                                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   高度 8000-10000px 的页面，free scroll，无任何 snap / hijack      │
│                                                                    │
│   ┌──────────────────┐ ┌──────────────────┐                        │
│   │  Section A       │ │  Section B       │                        │
│   │ ┌──────────────┐ │ │ ┌──────────────┐ │                        │
│   │ │ position:    │ │ │ │ video        │ │                        │
│   │ │ sticky       │ │ │ │ scrub by     │ │                        │
│   │ │ stage        │ │ │ │ scroll       │ │                        │
│   │ │ (text + img) │ │ │ │              │ │                        │
│   │ └──────────────┘ │ │ └──────────────┘ │                        │
│   │  scroll wrapper  │ │  scroll wrapper  │                        │
│   │  (height ~3vh    │ │  (height ~5vh    │                        │
│   │   for camera     │ │   so camera has  │                        │
│   │   travel)        │ │   travel budget) │                        │
│   └──────────────────┘ └──────────────────┘                        │
│                                                                    │
│   关键性质：                                                       │
│   - 飞滚 = 视觉加速播放（OK，因为视觉是产品 showcase 不是散文）    │
│   - 文字段落极短 — 没有需要"读"的长文                              │
│   - sticky 让用户视线锁住舞台，不会"飞过"                          │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 我们与 Apple 的根本不同

我们项目是**研究案例**——主体是 ~3000 字论证 + 关键 KV 数据 + 沙盘镜头。Apple 是**产品 showcase**——主体是工业设计与功能画面，文字寥寥。

| | Apple 产品页 | 本项目 |
|---|---|---|
| 主体 | 视觉 | 散文 + 视觉 |
| 飞滚容忍度 | 高（视觉变成 FF） | 低（散文必须读到） |
| 阅读模式 | 浏览（browse） | 阅读 + 浏览（read + scan）|
| 解法 | sticky stage + scroll-linked | **必须显式区分 motion / still scene** |

**核心结论**：Apple 的做法不能整套照搬，但**底层原则适用**——不要劫持滚轮，让用户保有 agency；用 sticky 钉视口防止飞过；视觉与文字按"动–静"节奏交替。

### Stakeholders

- **作者**：单人作品集，所有判断由作者拍板
- **未来访客**：飞滚客（scan / 看完即走）+ 慢读客（读完每段）—— 必须**双兼**

## Goals / Non-Goals

**Goals:**

- 飞滚状态下任何 scene 都不"刷刷过"——文字段感觉像"被钉住"，相机段感觉像"快速过场"
- 慢读状态下文字段沉浸感不被破坏——相机不打扰，dwell 充足
- 9 个 beat 共用同一节奏框架——不为单个 beat 调参
- 解法**不依赖 scroll hijacking**——保留用户对滚轮的完全控制
- `prefers-reduced-motion` 与无障碍兼容——可选硬切场（discrete page），不强制
- 不增加额外状态机—当前 React + scroll progress 单值架构保留

**Non-Goals:**

- ❌ 不重写 R3F Canvas / 沙盘渲染 —— scope 仅在 scene 层 + 滚动 CSS
- ❌ 不引入 GSAP / ScrollTrigger / 其他动画库 —— 现有 dwellEase + Tailwind 够用
- ❌ 不实现 view-timeline CSS（浏览器支持仍参差）—— 用 sticky + scroll progress 替代
- ❌ 不改文字内容 —— 节奏由相机/排版承载，不靠精简文字
- ❌ 不写 autoplay 模式（列在 proposal 但延后到独立 propose）

## Decisions

### D1 — 撤销 scroll-snap mandatory；回 free scroll

**选择**：移除 `app/globals.css` 里的 `scroll-snap-type: y mandatory` 与每个 scene marker 的 `scroll-snap-align/stop`。

**理由**：
- NN/G research（"Scrolljacking 101"）：snap mandatory 在长内容上**降低任务完成率与信任**
- 作者实测亦不舒服
- Apple MacBook Neo 等当代标杆全部 free scroll
- snap 在两个 scene 间制造"卡顿—弹—卡顿—弹"的物理感，与"一镜到底"的丝滑相悖

**替代方案**：
- `scroll-snap-type: y proximity`：弱化版，但仍劫持速度，且在飞滚下基本不生效。否决。
- 保留 mandatory + 加 `prefers-reduced-motion: no-preference` 才启用：复杂且仍舍弃 free scroll 的核心好处。否决。

### D2 — 引入 scene rhythm kind（motion / still / bridge）

**选择**：每个 scene 新增必填字段：

```ts
type RhythmKind = "motion" | "still" | "bridge";

interface SceneBase {
  // …已有字段
  rhythm: RhythmKind;
}
```

| kind | camera | 文字角色 | 典型 scene kind | 飞滚行为 |
|---|---|---|---|---|
| `motion` | from → to 实际位移 | 无 / 单字提示 | breath、过场 | 视觉加速播放，OK |
| `still` | **强制 from === to** | 主体（要求阅读） | title / lead / body-section / pull-quote | 文字 sticky 钉视口，相机不动 |
| `bridge` | 微动允许 | 简短引导 | 视情况，少用 | 相机微移 + 文字短暂 fade |

**理由**：
- 把"该 scene 是给眼睛看还是给眼睛读"显式化，等于把 Apple 的"动–静"剪辑逻辑写进 schema
- 飞滚的"刷过"问题根源是**相机也在动 + 文字也在动**，注意力没法落地。强制 still scene 相机静止 = 注意力一定在文字上。
- 相机的"绝对静止"段落本身是电影语言：长镜头之中突然的 hold = 强调。Nolan / 王家卫常用。

**替代方案**：
- 通过启发式从 scene.kind 推断（title/lead = still，breath = motion）：脆弱，特殊 case 难处理（比如 body-section 配滑过镜头怎么写？）。否决。
- 单独加 `cameraHold: boolean` flag：只覆盖了相机，不涵盖文字 sticky 行为，需要的字段会越加越多。否决。

### D3 — 节奏交替规则（rhythm rule）

**选择**：content-lint 增加规则——

> 同一 beat 内连续 `still`/`still` 的 scene 数量 MUST ≤ 2；连续 `motion`/`motion` MUST ≤ 1。

**理由**：
- 三连 still = 阅读疲劳；三连 motion = 视觉过载
- 强制作者把"两段都重要的文字"之间放一个 motion / bridge——就是"换镜"，给眼睛喘息
- Beat 1.1 当前 7 scene 全是 still + lead——整段平铺不换镜，飞滚痛点的另一根源就是这里

**替代方案**：
- 不强制只警告：作者一忙就忘记，质量上限低。否决。
- 严格交替（still 必须紧跟 motion 必须紧跟 still）：把节奏锁死，丧失表达自由。否决。

### D4 — 文字 sticky 钉视口（替换 fixed SceneLayer）

**当前架构**：

```
<body>
  <CinemaCanvasMount class="cinema-floor"/>  ← position: fixed
  <HudLayer class="hud-layer"/>              ← position: fixed
  <SceneLayer class="fixed inset-0"/>        ← position: fixed inset-0
  <article>
    {scenes.map(s => <section style={{height: …svh}}/>)}
  </article>
</body>
```

`SceneLayer` 用 `useEffect + window.scrollY` 算出当前 scene + 进退场进度，整个 fixed 层根据进度渲染对应 scene。问题：飞滚时进度变化太快，fade 还没起来就跳过去。

**新架构**：

```
<body>
  <CinemaCanvasMount class="cinema-floor"/>  ← 不变
  <HudLayer class="hud-layer"/>              ← 不变
  <article>
    {scenes.map(s => (
      <section style={{height: …svh}}>
        <div style={{position: sticky; top: 0; height: 100svh}}>
          <SceneRenderer scene={s} sceneLocalT={…}/>
        </div>
      </section>
    ))}
  </article>
</body>
```

- 每个 scene 的 marker `<section>` 高度 = 该 scene 的 scroll 预算
- 内部 sticky 容器钉在视口上方
- 用户滚到某 scene 时，sticky 文字"钉住"满屏，**视觉上文字根本没移动过**——只是 scroll progress 在变；fade 由 CSS 或局部 progress 计算
- SceneLayer 全屏单点渲染→**改为分布式 per-section 渲染**

**理由**：
- 视觉上"钉住"是核心心理学技巧——人眼对**画面位置不变的物体**会自动 anchor，飞滚时文字不"飞过去"，而是"holds"
- Apple 滚动剧场的核心机制就是这个；Pudding/NYT 编辑部 scrollytelling 也都用 sticky
- 架构更接近 React 单向数据流：每个 scene 的渲染只看自己的 sceneLocalT，无需全局状态机
- 扔掉 `useEffect` rAF 循环，让浏览器原生 sticky 处理布局——性能更好

**替代方案**：
- 保留 fixed SceneLayer，靠时间维 fade（rAF 计时）：与 scroll progress 解耦后会出现"已经滚到下一段但文字还在显示前一段"的不一致。否决。
- 用 view-timeline CSS：浏览器支持率不到 80%（caniuse 2026 早期）。延后到未来 propose。

### D5 — 相机 HOLD by architecture，不靠 schema 自觉

**选择**：CameraRig 内显式短路：

```ts
if (sceneState?.scene && sceneState.scene.rhythm === "still") {
  // 相机绝对锁在 cam.from（== cam.to），不走 dwellEase 不内插
  next = {
    position: cam.from,
    lookAt: cam.lookAt,
    focalDistance: 5,
  };
} else {
  // 现有 dwellEase 路径
}
```

**理由**：
- 即使作者粗心填了 `from !== to` 在 still scene，运行时也强制 hold
- 防御性架构 > 文档约束
- spring 仍然在工作，所以从前一个 scene（motion）过渡到 still 时，相机会**柔顺地"刹车"**到 still 位置——不是硬切

**替代方案**：
- content-lint 检验 `still ⇒ from === to`，运行时不短路：第一次实施时 schema 错容易看到画面抖。还是短路稳。

### D6 — DURATION 由 CPS（Characters Per Second）反推

**选择**：替换 `short/mid/long` 三档为基于字幕业 CPS 标准的公式：

```ts
// CPS 表 — 中文字 / 秒；英文按 char × 1.5 折算到中文等价
const CPS_ZH: Record<EmphasisKind, number> = {
  brief:    12,  // "扫一眼，知道有这事"
  standard:  9,  // 默认（画面复杂场景的保守端）
  dwell:     7,  // "想一下，划重点"
  linger:    5,  // "停下来回味"
};

const REACTION_S = 0.5;             // 反应时间（字幕业通用）
const SCROLL_PX_PER_S_BASELINE = 1000; // 舒适中速假设（≈ 1 viewport / 秒）
const VIEWPORT_PX_BASELINE = 1000;
const MIN_DWELL_S = 1.5;            // 最短停留（即使一个字也得钉住）
const MAX_DWELL_S = 6.5;            // 最长停留（超过即拆 scene）

function computeStillSvh(scene: SceneStill): number {
  const charsZh = countCharsZh(scene); // 中英 max
  const cps = CPS_ZH[scene.emphasis ?? "standard"];
  const targetSeconds = clamp(charsZh / cps + REACTION_S, MIN_DWELL_S, MAX_DWELL_S);
  const px = targetSeconds * SCROLL_PX_PER_S_BASELINE;
  return (px / VIEWPORT_PX_BASELINE) * 100; // → svh
}

function computeMotionSvh(scene: SceneMotion): number {
  // 几何 base × emphasis 倍数（与 CPS 对应的倍数等价系数）
  const base = motionGeometryToSvh(scene.camera); // dist × 8 + lookAtDelta × 4
  const factor: Record<EmphasisKind, number> = {
    brief: 0.5, standard: 1.0, dwell: 1.6, linger: 2.4,
  };
  return Math.max(100, base * factor[scene.emphasis ?? "standard"]);
}

// bridge 固定 120svh × emphasis factor，不依赖内容
```

**理由**：
- **生理学锚点**：字幕业的 CPS 不是凭感觉，是 50 年影视实践对人眼-大脑处理速度的实测。直接套用比"内容密度公式拍脑袋"扎实
- **画面复杂场景应取保守端**：标准字幕给娱乐内容用 12–15 字/秒；我们是"沙盘 3D + 专业概念"叠加，行业建议 -2–3 CPS。落到 9 字/秒（standard）是有理有据的保守值
- **最大 6.5s 上限自然推导出"单 scene 字数限制"**：(6.5 - 0.5) × 9 = 54 字（zh），超过即必须拆 scene。这条 lint 规则是 CPS 数学的副产物，不是另加约束
- **emphasis 4 档对应 CPS 4 档**——作者的心智模型从"乘 1.6 是什么意思"变成"我希望读这段需要多少字/秒"，对接生理学
- **motion 用倍数而非 CPS**：motion 没有"读"概念，但"看清"的认知带宽随场景重要性变化。倍数与 still 的 CPS 档保持语义一致（emphasis 越高 = 越慢 = 越沉）

**理论数值表**（standard 默认，画面复杂下保守端）：

| emphasis | CPS_zh | 60 字段 dwell | 22 字段 dwell | 4 字标题 dwell |
|---|---|---|---|---|
| brief | 12 | 5.5s | 2.3s | 1.5s（floor） |
| standard | 9 | 6.5s（cap） | 3.0s | 1.5s（floor） |
| dwell | 7 | 6.5s（cap）| 3.6s | 1.5s（floor） |
| linger | 5 | 6.5s（cap）| 4.9s | 1.5s（floor） |

注：60 字段在 standard 下已 cap 到 6.5s——意味着该 scene 必须拆。

**替代方案**：
- 保留之前的"density 公式"`80 + words × 0.6`：拍脑袋系数；同样字数不同重点感受差很大。否决。
- emphasis 用任意 number multiplier：缺锚点，作者每段都纠结"这段算 1.3 还是 1.5"。否决。
- 不要 emphasis 字段全交内容长度决定：Hero pull-quote 字数少但要 linger，无法表达。否决。

### D7 — 跨 scene 过渡的 fade 机制（hold 10/80/10）

**选择**：每个 scene 内部有自己的 enter/hold/exit 三段 fade（基于 sceneLocalT），相邻 scene 在重叠窗口内同时可见。比例 **从 18% / 64% / 18% 改为 10% / 80% / 10%**——把"完全不透明可读"区间从 64% 拉到 80%。

`rhythm === "still"` 的 scene：hold 段（中间 80%）opacity 严格 = 1。
`rhythm === "motion"` / `bridge`：允许更激进的 30/40/30 比例（fade 时间更长，镜头节奏吻合）。

**理由**：
- 之前 18/64/18 在 280svh scene 上意味着 fade 占用 ≈ 100svh——慢滚下文字反复半透明感觉飘忽
- 改 10/80/10：280svh scene 的 fade 仅占 56svh × 2，hold 占 224svh——文字"坐稳了"的时间显著拉长
- 与 D6 的 CPS dwell 时间相互独立又互补：CPS 决定 svh 总额，fade 比例决定其中"完全可读"的占比
- 两者乘起来：standard / 22 字 / 360svh × 80% = 288svh 完全可读——正中 CPS 推荐的 ~3s 阅读窗口

**替代方案**：
- 保留 18/64/18：hold 占比不够，文字飘。否决。
- 极端 5/90/5：相邻 scene 几乎没有 cross-fade 重叠，过渡变硬切。否决。

### D9 — Emphasis 4 档作为唯一 dwell 旋钮

**选择**：每个 scene 必填 `emphasis: "brief" | "standard" | "dwell" | "linger"`，default `standard`。这是作者控制 dwell 时长的**唯一**接口——不允许直接填 svh / 秒数 / 任意倍数。

**理由**：
- **认知简化**：作者面对每段时只问"这段是不是重点"——4 档分布映射"过场 / 主体 / 重点 / hero"四种叙事意图
- **跨 beat 一致性**：相同 emphasis 在不同 beat 的体验等价（同 CPS 档），不会出现"beat 1.1 的 dwell 和 beat 2.3 的 dwell 节奏不一样"
- **lint 友好**：枚举值校验 + emphasis 序列分布可视化（"本案例 60% standard / 20% dwell / 15% brief / 5% linger" — 健康分布；如果 80% 都是 linger 就要警告作者"重点过多 = 没有重点"）

**默认值哲学**：
- still / motion / bridge 全部默认 `standard`
- 作者**主动**标 `dwell` / `linger` 给重点段；主动标 `brief` 给过场
- 与字幕业实践吻合（"普通对话 12-15 / 重点降到 9 以下"）

**替代方案**：
- 默认 `dwell`：基线就慢——总页面更长且每段都"沉重"，失去节奏对比。否决。
- 5 档（加 `glance` = CPS 16）：4 档已覆盖叙事意图全谱，5 档增加决策成本。否决。

### D10 — 单 scene 字数硬上限（CPS 公式的副产物）

**选择**：content-lint 增加规则——

> 单 still scene 内文字总数（中文字符 max 中英取大值）> **54 字（zh）/ 110 字符（en）** → ERROR，拒绝构建。要求作者拆为两个 scene。

字数计算方式：
- 中文：纯字符数（含中文标点）
- 英文：纯字符数（含空格与标点）
- 多段散文：合计字符数；KV 列表项另算（详见 spec）

**理由**：
- 数学等价：54 字 ÷ CPS 9 + 0.5 ≈ 6.5s = 最长停留阈值
- 强制作者把"长篇逻辑"切成"多个 scene 的剪辑序列"——这恰好是电影叙事的语法
- 字幕业的"长句切两行"在 web 维度对应"长段切两 scene"
- 与节奏规则（连续 still ≤ 2）天然组合：拆出来的两个 scene 中间往往可以插一个 motion bridge

**替代方案**：
- 给 warning 不阻断：作者会习惯性忽视。否决。
- 上限调到 80 字给更多余地：触发上限后 dwell 用满 6.5s 仍然飘——上限就是该卡。否决。

### D8 — Reduced motion 兜底

**选择**：

```css
@media (prefers-reduced-motion: reduce) {
  /* 不再 sticky，每个 scene 占整屏，按钮/键盘翻页 */
  /* 详见 specs/cinematic-case-study-page/spec.md Reduced Motion 节 */
}
```

**理由**：
- 一镜到底是表现层选择，不是认知必需
- 给前庭敏感用户一条平铺翻页通道，spec 而非 hack

## Risks / Trade-offs

- **[Sticky + fixed 层叠 z-index 问题]** sticky 文字与 fixed 相机面、HUD 在同一视觉栈中——sticky 元素自己的 z-index 行为有边角 case。
  → 缓解：在实施 propose 第一个 task 就画清楚层叠图（cinema-floor z=0, sticky text z=10, hud z=20, 噪点 z=30）；用 storybook 单页验证；如发现 Safari 怪状再加 transform: translateZ(0) hack。

- **[Scene 高度长，移动端滚动疲劳]** standard / 22 字段 ≈ 360svh；linger / 重点段可 ≈ 480svh——iPhone 上滚到底要划很多次。
  → 缓解：移动端断点 SCROLL_PX_PER_S_BASELINE 与 VIEWPORT_PX_BASELINE 比例可微调（小屏更紧凑）；KV 列表折叠为 disclosure。实施时评估。

- **[CPS baseline 1000px/s 的滚动速率假设是否泛用]** 用户实际滚动速率分布广（鼠标滚轮 vs 触控板 vs 移动端 swipe）。
  → 缓解：CPS 公式给的是"中速友好"的 svh 配额；快滚下 sticky 钉视口与 fade-in 兜底，慢滚下用户主动停留无所谓多 dwell——baseline 假设错偏 ±50% 仍能接受。如实测数据集中说话再调。

- **[同 beat 多 still scene 时总高度爆炸]** 即使 standard 默认，2 个 still × 360svh = 720svh / 单 beat 还要加 motion / bridge → 单 beat 可达 900-1100svh。
  → 缓解：D3 节奏规则限制连续 still ≤ 2 + D10 单 scene 字数上限 54 字（zh）—— 双约束自然把单 beat 总高度上限锁在 ~1200svh。9 beat 总高度估算 ~9000-11000svh（与 Apple 量级匹配）。

- **[作者已写好的 Beat 1.1 文案对应到 CPS 计算后会触发字数 lint]** Beat 1.1 当前 7 scene 中 section-01/02/03 字数均接近或超过 54 字阈值。
  → 缓解：Beat 1.1 storyboard propose（独立 in-progress）必须重审——按 CPS 字数上限拆 scene，把"逻辑长段"拆成"剪辑序列"；同时插 motion / bridge 满足节奏规则。这恰好让 Beat 1.1 真正变成"电影剧本"。

- **[当前 spring 在 still 短路下会有不连续]** 从 motion scene 推到 still scene，spring 目标突然锁死 = 抖动。
  → 缓解：spring 阻尼与刚度调到"在 200ms 内收敛"——肉眼是顺滑刹车而非硬切。已有 `lib/cinema/spring.ts` 可调。实施时验证。

- **[content-lint 节奏规则可能过严挫伤 Beat 1.1 已落地内容]** 现有 Beat 1.1 七 scene 全 still。
  → 缓解：lint 规则上线时给 1 周宽限期（warning 不 error），同步 Beat 1.1 storyboard propose 把节奏改完，然后切 error。OR 把 Beat 1.1 当 grandfather case，整改完再开 enforcement。

- **[autoplay 模式延后做但又被外部呼叫]** proposal 提了但本 propose 不做。
  → 缓解：spec 中预留接口（`auto-play` capability stub），实施 propose 不依赖即可。

## Migration Plan

1. **Phase 0 — 撤销 hack（立即可做）**：删 `globals.css` snap-type，删 page.tsx 内 marker 上的 `scrollSnapAlign/Stop`。Free scroll 立刻恢复。
2. **Phase 1 — 引入 rhythm 字段**：schema 加 `rhythm`；Beat 1.1 七 scene 全打标 `still`（保持现状）；content-lint 暂为 warning。
3. **Phase 2 — Sticky text 架构**：SceneLayer 拆为 `<SceneAnchor>` + `<SceneStickyText>`；page.tsx 在 article 内分布式渲染。视觉验证 Beat 1.1 在飞滚下文字"钉住"。
4. **Phase 3 — 相机 HOLD 短路**：CameraRig 加 still 分支；spring 阻尼调试。
5. **Phase 4 — CPS-based DURATION 计算器**：`computeStillSvh` / `computeMotionSvh` 替换 `DURATION_SVH` 三档；emphasis 字段加入 schema；Beat 1.1 全部 scene 标 emphasis（默认 standard，重点段标 dwell/linger）；重新算 svh。
6. **Phase 5 — 节奏 lint 规则 + 字数上限 lint 启用**：content-lint 节奏规则与单 scene 字数上限规则切 error；Beat 1.1 视情况改造（独立 storyboard propose）。
7. **Phase 6 — Reduced-motion 兜底**：CSS media query + 翻页器。

回滚：每 phase 对应一次 commit，单独可 revert。最坏情况回到 Phase 0 状态（free scroll + 老 SceneLayer），仍优于 Phase -1 的 snap mandatory。

## Open Questions

1. **Q1 — sticky 容器的 height: 100svh 还是 100vh？**
   - svh 在 iOS Safari 地址栏出现/消失时高度跳动，hold 文字会"晃"。
   - vh 在 iOS 地址栏出现时被裁剪。
   - **倾向**：100svh + `dvh` 兜底（CSS env-aware fallback）。实施时做 A/B 测。

2. **Q2 — Sticky 文字与 R3F Canvas 的 pointer-events / aria 关系？**
   - 当前 SceneLayer 是 `pointer-events-none`，文字层永远穿透。改 sticky 后是否还要保持？语言切换按钮在 HUD（fixed）层，不冲突。
   - **倾向**：保持 `pointer-events: none` 在 sticky 容器；任何交互元素从 HUD 出。

3. **Q3 — CPS 公式的 i18n 处理（中文按字、英文按字符）够准吗？**
   - 字幕业 CPS 中文 12-15 字 / 英文 20 字符 → 比例 ≈ 1.5。我们 standard 用 9 字（zh）→ 英文 ≈ 14 字符
   - SSG 构建期 locale 未知，svh 取中英 max（保守上界）
   - **倾向**：实施时按"text 中英分别算 svh，取 max" 写定，spec 明示此细节。如果某 beat 中英文长度差距悬殊（>30%），lint 给 warning 提示作者考虑文案对齐

4. **Q4 — bridge scene 是否真的需要？**
   - motion / still 二分可能够用，bridge 只是边角 case 的逃生口。
   - **倾向**：spec 里保留 bridge 但 lint 不强制使用；先看 Beat 1.2-3.3 storyboard 推进时是否真有"既要文字又要小镜头动"的边角。如果一直用不上，下一轮 propose 再去掉。

5. **Q5 — 是否在 SceneLayer 之外另设 reduced-motion 静态版？**
   - reduced-motion 路径目前是 stub。完整做法可能需要一套"翻页"或"长文阅读"的静态 layout。
   - **倾向**：本 propose 不解；记入未来 `cinema-reduced-motion` 独立 propose。

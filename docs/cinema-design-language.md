# Cinema Design Language

> 一份给外部审阅者（包括 LLM）的"设计语言"快照，**不含具体文案**，只描述系统、约束、决策。
> 用途：第二意见 / 跨视角审阅 / 新协作者 onboarding。

---

## 0. Project & Audience

- **载体**：单页 case study 风格的作品集网站（Next.js 15 / R3F / TS / MDX）
- **作品对象**：一个 AI × 城市研究的项目（多智能体仿真 / 注意力边界 / 真实地理沙盘）
- **读者**：研究 / 设计 / AI 产品同行；既有"扫一眼就走"的访客，也有"读完每段"的深读者
- **核心矛盾**：研究类内容（散文 + 数据）+ 视觉类剧场（沙盘 + 镜头）两种节奏天然冲突——必须双兼

---

## 1. Design Thesis

> **一镜到底，内容驱动镜头；电影语言托住学术内容。**

三句话拆开：

1. **One continuous take** — 整个 case study 是一段连续的相机运镜穿过一个 1km² 的 3D 沙盘（悉尼 Lane Cove）；不切场，不黑屏。读者滚动 = 镜头时间推进。
2. **Content-led, not score-led** — 镜头不是预先编排好然后让内容塞进去；每个 scene 的相机位置、地图状态、文字形式由该 scene 想表达什么共同决定。
3. **Cinematic vocabulary supports academic substance** — 不是"用电影的形式包装论文"——而是把研究案例真的用电影语法（剪辑节奏 / 蒙太奇 / hold / 推拉 / 留白）讲清楚。

---

## 2. Cinema Model

```
                                                 z (away from origin)
                                                  ↑
                                                  │
   sky / fog                                      │
                                       ┌──────────┘
   ┌─────────── camera at scene.camera.from ────┐
   │                                              │
   │   Lane Cove sand table (1km², ~real OSM)    │
   │   - filled road polygons (matte clay)       │
   │   - extruded buildings (commonsense heights)│
   │   - waterways (semi-transparent blue)       │
   │   - warm fog at horizon                     │
   │                                              │
   └────────────── lookAt usually ORIGIN ────────┘
```

- 一个 R3F `<Canvas>` 钉死在 `position: fixed` 满屏作为"舞台底"
- 文字 / HUD 漂浮在 canvas 之上，永远不挡住主体焦点
- 视觉风格：Studio Lamp / 研究室灯下——暖光、奶油色前景、深蓝黑底色、纸质噪点

### 2.5 World Coordinate System（**新协作者必读**）

整个 3D 世界经过 **normalize**：1km² 真实地理被压到 ±worldExtent（默认 8）的 X-Z 平面上。这意味着脚本里写"很远"或"很高"时**不能用真实米数**——需要用下面的世界单位等价物。

#### 坐标轴
- `x`：东西向，左 = 负，右 = 正
- `y`：上方向（仰角 / 高度）
- `z`：朝向相机为正（远离原点 = 大 z）；lookAt 通常在 `[0, 0, 0]` 沙盘中心

#### Y 轴（仰角 / camera height）
| Y 值 | 语义 |
|---|---|
| `Y < 0.5` | 街道行人 POV |
| `Y ~ 4` | 低斜角 / 桌前观察者俯身看 |
| `Y ~ 8` | 标准沙盘视高 |
| `Y ~ 12-15` | God view，沙盘成"桌上小物" |
| `Y > 20` | 极端高空俯瞰（罕用） |

#### Z 轴（推/拉距离）
| Z 值 | 语义 |
|---|---|
| `Z ~ 5` | 推近到城内（cluster 中) |
| `Z ~ 9-11` | 标准远景（城市外缘 / fog 边）|
| `Z ~ 13-15` | 退到 fog wall 外 |
| `Z > 20` | 沙盘几乎消失成黑屏 |

#### 沙盘元素的尺度
- 建筑高度：`0.05 ~ 0.6`（commonsense 启发式生成；摩天楼也只到 ~0.6）
- 道路宽度：`~0.02 ~ 0.04`
- 水面厚度：`< 0.02`
- 整体沙盘 footprint：±8（X 与 Z）

#### "非常远 / 非常高" 这类叙事意图怎么写
脚本里如果想表达"上帝视角"或"远处屏障"——**不要**写真实米数（如 z=2000、y=600）。请用世界单位的等价区间：
- "非常远的黑色屏障" → `Y ~ 0`, `Z ~ 18-22`
- "上帝视角俯瞰全景" → `Y ~ 14-18`, `Z ~ 14-18`, `lookAt = ORIGIN`
- "切入建筑群缝隙" → `Y ~ 0.3`, `Z ~ 4-6`
- "起飞抬升过渡" → `Y` 从 0.5 升到 6，`Z` 从 5 拉到 8

#### Score continuity（构图回环）
score.sswt.ts 的相机轨迹是手调的——每个 shot 的退场位置 ≈ 下个 shot 的进场位置，所以 spring smoother 只需吸收很小的跳动。**Beat 1.1 已迁移到 scene-level camera，每个 scene 自己 own from/to/lookAt**，但仍应大致遵循"一个 scene 的终点 ≈ 下一个 scene 的起点"以避免 spring 过载。

---

## 3. Scroll Model

### 3.1 Free scroll, no hijacking

- 永远不调用 `wheel preventDefault`、不设 `scroll-snap-type: mandatory`
- 用户对滚轮拥有完整 agency（NN/G + Apple 实证：劫持滚轮 = 信任崩塌）
- 飞滚 / 慢读两种模式都接住

### 3.2 Sticky-pinned scene text

```
<article>            ← page-level scroll container
  <section h={Xsvh}> ← scene marker，高度由内容/emphasis 决定
    <div sticky-scene>  ← position: sticky; top: 0; height: 100svh
      [scene 文字渲染]
    </div>
  </section>
  ...
</article>
```

- 每个 scene 的文字"钉"在视口里，hold band 内 opacity = 1
- 用户飞滚跨越一个 scene 时，文字**视觉位置不动**——只是 fade in/out——眼睛会自动 anchor
- 关键心理学：人眼对**画面位置不变**的物体会自动锁定，即使它出现-消失只有 0.3 秒

### 3.3 Piecewise scroll-to-cinema-time

```
DOM scroll ──────────────────────────────────────┐
   beat-1.1   │ beat-1.2 │ beat-2.1 │ ...        │  (DOM heights = svh budget)
              ↓ piecewise linear ↓               │
Cinema t   ───┼──────────┼──────────┼────────────┤
              0%        10%        22%          100%
                    (score-defined narrative ranges)
```

- DOM scroll 的高度分配（svh）跟 cinema 的 t 分配（score range）**解耦**
- 一个内容很长的 beat 可以占 DOM 的 80%，但仍然只占 cinema 的 10%
- 这样"读文字段"不会被错误地推着穿越镜头

---

## 4. Scene System

### 4.1 Beat / Scene 层级

```
Case Study
├─ Act (3 acts, narrative spine)
│  ├─ Beat (10 beats total, 1 narrative argument each)
│  │  └─ Scene[]  ← atomic design unit
```

### 4.2 Scene 七维设计框架

每个 scene 必须显式回答 7 个问题：

| 维度 | 含义 | Schema 字段 |
|---|---|---|
| **1. Camera** | 相机起止位置 + lookAt | `camera: { from, to, lookAt }` |
| **2. Text-form** | 文字以什么形式出现（标题/段/引文/列表） | `kind: title \| lead \| body-section \| pull-quote \| breath` |
| **3. Transition** | 文字怎么进退场 | `enter / exit: TransitionKind` |
| **4. Interaction** | 用户能做什么（默认只滚动） | （隐含） |
| **5. Duration** | scroll 预算（由 emphasis 反推） | `emphasis: brief \| standard \| dwell \| linger` |
| **6. Junction** | 与前后 scene 的交接关系 | （隐含 + rhythm） |
| **7. Rhythm** | 该 scene 滚动节奏类型 | `rhythm: motion \| still \| bridge` |

### 4.3 Scene kinds 现有 5 种 + 待加

```
现有：
  title         单一短语 / 大字 / 副标
  lead          段落 / 引言
  body-section  小节标题 + 段落 + KV 列表 / 双栏
  pull-quote    引文 / 金句
  breath        无文字（纯镜头）

考虑加（电影语法补全，无具体文案）：
  data-hit       单巨数字 + 一行注释（"1,000 ─ digital residents"）
  caption        电影字幕风（letterbox 配单行短句）
  juxtaposition  左右两块对比（独立于 body-section 的 twin-column）
  specimen       聚焦单个具体实例（沙盘里的一个 agent + 一行说明）
```

---

## 5. Rhythm System

### 5.1 四种节奏类型

| Rhythm | Camera 行为 | 文字角色 | 飞滚体验 |
|---|---|---|---|
| **`motion`** | from → to 实际位移（dwellEase 内插） | 无 / 单字 | 视觉加速播放（OK，因为视觉是图像） |
| **`still`** | 锁定 from + 极缓 push-in 漂移（3%） | 主体阅读 | 文字 sticky 钉视口，相机不动 |
| **`tracking`** | 缓慢线性位移（半速 dwellEase 或 linear） | **同时**承载阅读 + 视觉 | 文字 sticky 钉视口，背景缓慢横移 |
| **`bridge`** | 微动允许 | 简短引导 | 节奏切换 |

**`tracking` 是新加的**（cinema-content-language-foundations propose 引入）。语境：电影里的"tracking shot with voiceover"——相机沿一条轨迹缓慢推/平移，背景在变，但读者同时在听 / 在读。文字预算按 still 的 CPS 公式算，camera 走 from→to 但速度比 motion 慢一半左右，确保眼睛能在阅读和扫视背景之间自然切换。

**节奏交替规则更新**：
- 连续 `still` MUST ≤ 2
- 连续 `motion` MUST ≤ 1
- 连续 `tracking` MUST ≤ 1
- `bridge` 不计入连续计数（仍是节奏切换器）

### 5.2 Camera HOLD 纪律 + "屏息"漂移

- still scene 相机**不**走 dwellEase，**不**插值到 cam.to
- 但**不绝对静止**——沿 `lookAt − from` 方向极缓 push-in，幅度 3% × sceneLocalT
- 跨连续 still scene 时漂移**累积**（防止边界回跳）：第 N 个连续 still 内 k = 0.03 × N + 0.03 × sceneLocalT
- 对应"纪录片长镜头里隐约的呼吸"：避免冻屏，又不破坏注意力锚定

### 5.3 节奏交替规则

见 §5.1（已合并 tracking 后的最新规则）。content-lint 校验。

### 5.4 Fade band

```
                 ┌─enter─┐                ┌──exit──┐
  still:    ────┤  10%  ├────  hold 80% ──┤   10%  ├────
                                opacity = 1（强制）

                 ┌──enter──┐         ┌──exit──┐
  motion:   ────┤   30%   ├─ hold 40%─┤  30%   ├──
                                  opacity 灵活
```

still hold 段保证"完全可读"占该 scene 80% 时长；motion 更短的 hold 因为画面本身在动，文字简短。

---

## 6. Emphasis & CPS Dwell System

### 6.1 锚定到字幕业 CPS（Characters Per Second）

| Emphasis | CPS_zh | 含义 |
|---|---|---|
| `brief` | 12 字/秒 | "扫一眼，知道有这事" |
| `standard` | 9 字/秒 | 默认（画面复杂场景的保守端） |
| `dwell` | 7 字/秒 | "想一下，划重点" |
| `linger` | 5 字/秒 | "停下来回味" |

字幕业普通对话 12-15 / 信息密集 15-20。我们项目"3D 沙盘 + 专业概念"叠加，行业建议 -2~3 CPS，落到 9 字/秒（standard）有据可查。

### 6.2 Dwell 计算

```
  target_seconds  = chars / CPS + 0.5s reaction
  clamped_seconds = clamp(target_seconds, 1.5s, 6.5s)
  scene_svh       = clamped_seconds × baseline_scroll_pps / viewport_px × 100
                    (baseline assumed: 1 viewport / second)
```

### 6.3 Char-cap（CPS 副产物）

```
  max chars per scene = (MAX_DWELL − REACTION) × CPS_zh
                      = (6.5 − 0.5) × CPS_zh
                      
  emphasis = brief    → 72 字
  emphasis = standard → 54 字
  emphasis = dwell    → 42 字
  emphasis = linger   → 30 字
```

超过即 lint 报错，作者必须拆 scene 或降级 emphasis。这恰好是字幕业"长句切两行"在 web 维度的等价物。

### 6.4 Min dwell

任何 scene 的 dwell ≥ 1.5s（即使一个字标题也得钉住），对应 ≥ 150svh。理由：眼睛从"字出现"到"理解出现"需 ~0.5s 反应；低于 1.5s 即闪屏感。

### 6.5 Progressive Reveal（Apple 模式 — 长内容拆段渐显）

**问题**：写到长内容时，作者的本能是"塞到一个 scene 让 emphasis = linger 拖时间"。但 linger 的 char-cap 是 30 字，超出即 lint 报错。一段 84 字的散文被迫降级成 standard / 拆 scene。

**解法**：sprite-style **per-paragraph staggered fade** 在同一 scene 内。

```
                 sceneLocalT
   0%  ────────────────────────────────  100%
                                       
   ┌── paragraph 1 ──┐                       enter / hold / exit
                                              over its 33% slice
            ┌── paragraph 2 ──┐               same shape
                                       
                     ┌── paragraph 3 ──┐      same shape
   
                 → 一个 scene 内 3 段错峰浮现
```

- 一个 body-section 内有 N 个 paragraph → 每个 paragraph 占 1/N 的 sceneLocalT
- 每段在自己的 slice 内做 enter (10%) / hold (80%) / exit (10%) 的 fade
- 用户感受："滚到这里第一段亮起来 → 滚一点第一段淡出第二段亮起来 → ..."
- 类似 Apple Vision Pro 着陆页"sticky stage + 文字段落随滚动逐次替换"
- 相机 / mapState **保持不变**——同一 scene 共享一个画面 + 多段错峰文字

**对 CPS 的影响**：
- char-cap 改为 **per-paragraph** 而非 per-scene
- 单段散文 ≤ 54 字（standard）/ 30 字（linger）
- scene 总 svh = sum(per-paragraph svh) + 段间 overlap

**对 emphasis 的影响 — 重新定位 linger**：
- linger **不是**"长停留 = 文字多"
- linger **是**"短而重的金句留更久"（CPS 5 = 慢慢回味每个字）
- 长文不该用 linger 撑——用 progressive reveal 让 standard / dwell 段组成长 scene

**作者选择**：
- 一个相机 / 一个 mapState 下展开多段 → 用同一 scene 的多 paragraph 配 progressive reveal
- 想要每段配不同相机 / mapState → 拆成多个 scene，各自独立

实施 propose：与 cinema-content-language-foundations 一并做，作为 body-section 渲染逻辑的拓展。

---

## 7. Content-Led Camera

### 7.1 之前的错（已纠正）

`score.sswt.ts` 把整套相机轨迹**预先**编排了：cold open horizontal push-in → lift to oblique → orbit → dolly arc 到对岸 → push-in 到街头 → ... 这是"先编镜头再塞内容"。

结果：每写一段新内容，都被迫接受预定义的相机起止——形式压制了表达。

### 7.2 现在的原则

- **每个 scene 自由定义 camera.from / to / lookAt**——脱离 score 预设
- score 仍在，但只服务**未迁移到 scenes[] 的遗留 beat**
- 设计 scene 时按"内容 → 镜头"顺序问：这段想表达什么？→ 镜头应该在哪个高度看 / 看哪个角落 / 怎么动

### 7.3 Map state（设想中，未实现）

地图（沙盘）也可以"跟内容"——每个 scene 指定地图的视觉状态：

```
scene.mapState?: {
  highlight?: string[]      // 高亮某些 building / road
  mode?: "matte" | "wireframe" | "blueprint"  // 材质换台
  overlay?: "agents" | "heatmap" | "labels" | null
  dim?: number              // 非高亮区域降低亮度
}
```

例如：
- 介绍"1000 个居民"时 → mode=`agents`，地图上洒点
- 介绍"500m 半径碰面"时 → overlay=`heatmap` 显示密度
- 介绍"地理基础"时 → mode=`blueprint` 几何抽象化

这部分是新 capability，工作量较大，**暂列为 future propose**。当前 propose 不包含。

---

## 8. Stack-up & Z-index

```
  z=0    cinema-floor (R3F Canvas, fixed, pointer-events: none)
  z=10   sticky scene text (per-scene, sticky inside <article>)
  z=20   HUD layer (fixed, interactive elements)
  z=30   body::after grain overlay (fixed, paper-noise)
```

- 文字与 cinema 严格分层
- HUD 可以承载语言切换 / 进度条 / 章节标记
- Grain 给整个画面统一的"被冲洗过"质感

---

## 9. Reduced Motion

`prefers-reduced-motion: reduce` 媒体查询匹配时：
- sticky 退化为 static（每 scene 占 100svh）
- 所有 transition / animation ≤ 100ms
- still 漂移强制归零（位置严格 = cam.from）
- 镜头"motion" rhythm 与 reduced-motion 冲突——CameraRig 强制走 still 路径
- 翻页器 / 键盘导航是独立 propose，本设计不解

---

## 10. Lint & Validation

content-lint 输出每个 case study 的：

```
warn / err  · scene XYZ  · char-cap: 60 chars > 54 (emphasis=standard, CPS=9). Split scene OR …
warn        · beat ABC  · rhythm sequence: 3 consecutive still (max 2). Insert motion/bridge.
warn        · case study · emphasis distribution: linger 22% > 15%（重点过多 = 没有重点）
info        · beat ABC: rhythm=[SMSMS] emphasis=[standard=3 dwell=2]
```

设计时强制可视化节奏分布 + 字数边界——避免不知不觉写成论文。

---

## 11. System Internals（给 LLM/Reviewer 一份技术快照）

### 11.1 Stack
- **Framework**: Next.js 15 App Router (RSC + client components)
- **3D**: React Three Fiber + three.js
- **Type system**: TypeScript 5.7
- **Content**: MDX + gray-matter + Zod
- **Styling**: Tailwind 3.4
- **Build**: SSG (static export-friendly); no per-locale build (i18n at runtime)

### 11.2 Spring profiles (`lib/cinema/spring.ts`)
- Critically-damped 1D springs，X/Y/Z 各一只
- `SPRING_PROFILE_DEFAULT`: stiffness=80 → settling ~450ms（柔软）
- `SPRING_PROFILE_HOLD`: stiffness=400 → settling ~200ms（紧致）
- CameraRig 默认用 HOLD profile：motion → still 过渡时是"刹车"而非"漂"

### 11.3 Scroll-to-t pipeline
```
window.scrollY  ───────────────────────────────── (raw px)
   │
   ├─ raw = scrollY / (docHeight − viewportH)         (0..1 fraction of doc)
   │
   ├─ piecewise = mapScrollToScoreT(raw, beatLayout)  (per-beat lookup)
   │            beatLayout 映射 DOM range ↔ score range
   │
   ├─ next = scrollToT(piecewise)                     (clamp; identity for now)
   │
   └─ tRef.current = next  ──────────────────────────  CameraRig & HUD 读这里
```
- `beatLayout = buildBeatLayout(score, acts)`：每个 beat 一个 `{domStart, domEnd, scoreStart, scoreEnd}`
- `SceneAnchor` 不读 t——它通过自己父 section 的 `getBoundingClientRect` 算 sceneLocalT，独立于全局 t

### 11.4 rAF cadence
- 假设 60fps（实际 R3F 用 useFrame，自适应 monitor refresh rate）
- Spring 步进用 frame delta，所以 144Hz 屏幕也对（步长缩短，settling 时间不变）

### 11.5 i18n
- 仅 `zh` 与 `en` 两种 locale
- `LocaleProvider` 提供 `useLocale()` hook
- `<T value={I18nString}/>` 是渲染包装；CSS 动画/字体根据 locale 切
- SSG 期不知 locale → CPS svh 取中英 max（保守）

### 11.6 layer / pointer-events
- cinema-floor `pointer-events: none` —— canvas 不接交互
- sticky-scene 也 `pointer-events: none` —— 文字层穿透
- HUD `pointer-events: none` 但 `> *` 自动 auto —— 仅子节点可点
- 任何交互元素必须在 HUD 出，不能藏在 sticky 文字里

### 11.7 Lint pipeline
```
pnpm content:lint
  ├─ Zod parse frontmatter
  ├─ shotRef ↔ score 一致性
  ├─ fallbackFigure 文件存在
  ├─ 术语锁定（glossary forbidden 变体）
  ├─ 节奏交替规则（warning，等 Beat 1.1 storyboard 完成后切 error）
  ├─ 单 scene 字数上限（warning，按 emphasis 不同 30/42/54/72）
  ├─ emphasis 分布健康度
  └─ 节奏 + emphasis 摘要输出（rhythm=[SSSSSSS] emphasis=[standard=6 dwell=1]）
```

### 11.8 已建 / 待加的能力（按 propose 划分）
| Propose | 状态 | 包含 module |
|---|---|---|
| `cinema-scroll-pacing` | ✅ done | rhythm 系统 / sticky text / piecewise scroll / CPS / 屏息漂移 / fade 10/80/10 |
| `cinema-content-language-foundations` | ✅ done (foundations) | mapState schema + resolver / overlay 接口 / material registry / tracking rhythm / data-hit kind / progressive reveal 渲染 |
| `cinema-map-modes` | ✅ done | Blueprint material（冷蓝 X-ray 视觉）+ MaterialSpec.edges 字段 + SandTable edges 渲染 |
| `cinema-map-overlays` | ✅ done | agents_trajectories（80 个发光球沿路径动）+ digital_silos_heatmap（80 个红色光柱）+ 共享 sampleAgents helper |
| `beat-1-1-storyboard` | 🔜 pending | 真正写文案 + 装配上面这些能力 |
| `cinema-trajectory-recorder` (memory) | 🟡 idea | 镜头实验 / 轨迹记录工具，依赖 foundations + map-modes + map-overlays |

## 12. 整体设计哲学小结

1. **节奏比信息密度更重要**——读者抓不住节奏 → 信息再准也读不进去
2. **静与动严格交替**——眼睛要在"读字"和"看景"之间有明确切换
3. **生理学常量做锚**——CPS / 反应时 / 1.5s 最短停留 / 6.5s 最长停留：不靠美学直觉
4. **避免劫持用户控制**——不 hijack 滚轮、不 mandatory snap、不强制 autoplay
5. **形式跟内容**而不是反过来——内容驱动镜头驱动地图
6. **降级路径必须存在**——reduced-motion / sr-only landmark / SSG 兼容

---

## 13. 我们想征询第二意见的问题

> 给 Gemini / 同行的开放问题：

### Q1 — Hook 模式
当前考虑 5 种 hook 候选模式（地标卡 / 反论翻转 / 项目本体 / 地面问题 / 邀请式）。
- 在"研究感 + 不学究"光谱上，哪种最适合一份 AI × 城市研究的作品集？
- 是否有更好的第六种方向？

### Q2 — Camera 自由度
内容驱动相机的代价是失去全局连续性（每个 scene 的相机起点可能跟前一个 scene 终点不连续，由 spring 200ms 内吸收）。
- 这种"局部松一些、全局靠 spring"的取舍是否合理？
- 还是应该保留更强的全局轨迹规划，再让内容向轨迹妥协？

### Q3 — Map state ✅ DECIDED — foundations done
增加 per-scene mapState（高亮 / 材质 / overlay）的 foundations 已实施（`cinema-content-language-foundations`：schema + resolver + material/overlay registry）。当前仅 `matte` material 与 `none` overlay 注册；`blueprint` 与具体 overlay 留给后续 propose。已验证：未注册名称安全降级 + Beat 1.1 grandfather 不受影响。

### Q4 — 屏息漂移
still scene 给 3% push-in / scene 的极缓漂移，跨连续 still 累积（7 个 still 累积 21%）。
- 累积幅度是否合适？21% 够"运动"还是太多？
- push-in 方向（朝 lookAt）是普适选择，还是应该按 scene 内容"语义化"决定方向（重要段 push-in / 反思段 pull-back）？

### Q5 — Fade band 10/80/10
为了让"完全可读"占 80% 时长，把 fade 比例压到 10/80/10。
- 10% enter / exit 是否过短？跨 scene 的 cross-fade overlap 还够柔顺吗？
- 是否应该按 scene 字数动态调整 fade 时长（短标题 fade 更慢 / 长段落 fade 更快）？

### Q6 — CPS baseline
我们假定"舒适中速滚动 ≈ 1 viewport / 秒"的基准把 dwell 秒数转 svh。
- 这个假设在移动端 / 触控板 / 鼠标滚轮三种设备下分布有多大差异？
- 是否需要根据 viewport 高度或 input device 检测做适配？

### Q7 — 全 still beat 是否有其他兜底
Beat 1.1 当前所有 7 个 scene 都是 still rhythm（grandfather）。
- 整段没有"换镜"是否一定违反节奏原则？
- 还是说"全 still + 屏息累积漂移"在某些叙述类型（学术开场 / 沉思段）反而是一种合理风格？

### Q8 — 内容形式词典
我们考虑加 4 种新 scene kind（data-hit / caption / juxtaposition / specimen）来打破"全段落"的论文感。
- 这 4 种是否覆盖了"非论文化"所需的常用电影语法？
- 还有什么常用电影 / 编辑部 / scrollytelling 形式应该补全？

---

## 14. 系统化但不教条

最后一句留给设计原则：

> 上述所有数字（3% drift / 1.5s min / 6.5s max / 9 CPS / 80% hold / 等）都是**起点假设**，不是教条。
> 实测体验差时优先调数字，再调结构；调到第三轮还差再考虑改 schema。

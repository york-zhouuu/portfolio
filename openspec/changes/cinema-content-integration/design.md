## Context

回到第一原则。**一镜到底 = 内容跟随镜头娓娓道来**。

不是相机自己演自己的、文字自己演自己的、然后并置。是**内容反推镜头与排版**——案例研究里的每一段话，都伴随相机里一个特定时刻、出现在屏幕一个特定位置，以一个特定的方式进入和离开。

之前的设计偷懒成"6 种集成模式选一个"——错了。真正要做的是：**为每段内容设计它自己的 scene**——这也是这件作品最容易被误读但又是最关键的产品语言。

本文档：

1. 把"scene"作为最小设计单元
2. 编码 **6 个 per-scene 设计问题** 作为可重复的框架（之前问 Beat 1.1 的那 6 个问题就是这个）
3. 用框架走一遍 Beat 1.1 的 7 个 scene 当样本
4. 给 schema / camera score / 渲染层留下"等实施 propose"的钩子

## Goals / Non-Goals

**Goals:**

- 把"scene = 内容 × 镜头 × 排版 × 进退场"作为整个站的设计语汇。
- 每 scene 都通过 6 维度被描述。
- Beat 1.1 走一遍框架——既验证框架可用，也作为后续 9 beat 的参考样本。
- Storyboard 已删除——web 上**只有**这一镜。
- 不写代码。等作者过完 Beat 1.1 推荐再开实施 propose。

**Non-Goals:**

- 不做 frontmatter schema 重构（推迟到实施）。
- 不改 camera score（推迟到实施）。
- 不实现任何 layout primitive（subtitle / card / column 等组件留给实施）。
- 不写其它 9 beat 的 scene 设计——本次只走 Beat 1.1。

---

## D1 — Scene 是最小设计单元

```
Beat (容器)                                                  
  └─ Scene[]                                                  
       每个 scene 是一段"片刻"，由 6 个维度共同定义：       
                                                              
       1. Camera        位置 / 推拉 / 节奏                   
       2. Text-form     字号 / 排版位置 / 整段还是分句        
       3. Transition    淡入 / 滑入 / 拍击 / 缩放 / ...       
       4. Interaction   只滚动 / 点击 / hover / ...           
       5. Duration      占多少 scroll 预算                    
       6. Junction      跟前 scene 与后 scene 怎么交接        
```

**一个 beat 的 body 内容（## 01 / ## 02 / ...）每节都是一个 scene。** Title / lead / pullQuote 也是 scene。Beat 1.1 的 4 节 body + title + lead + pullQuote = 7 个 scene。

每个 scene 在框架里是一段独立的设计——它们在**风格上可以一致**（多数 beat 沿用一致的 layout primitive），但每个 scene 都**单独被设计过**，没有复制粘贴。

## D2 — Per-scene 设计框架（6 个问题）

每写一个 scene 之前必须回答：

```
Q1 · 镜头在做什么？
     - 起始 / 结束位置
     - 推 / 拉 / 弧 / 焦距 / 倾斜
     - 节奏：匀速 / 减速 / spring 反弹

Q2 · 文字以什么形式出现？
     - 位置：屏幕中心 / 偏右栏 / lower-third / 左下小条 / floating in-world
     - 字号：display / headline / subhead / body / caption
     - 颗粒：整段一次出 / 分句出 / 列表逐项出 / 数字 counter

Q3 · 文字怎么进退场？
     - 进场: fade / slide-up / slide-side / scale-in / typewriter
     - 退场: fade out / slide out / shrink to corner / persist as caption
     - 时长: 跟相机同步 / 比相机晚一拍 / 比相机早一拍

Q4 · 用户能做什么？
     - 只滚动（默认）
     - hover 触发：术语解释 / 数据 callout
     - 点击触发：展开补充信息 / 跳到 source
     - keyboard 跳 scene

Q5 · Duration（scroll 预算）
     - 短停顿：≤ 50svh — 标题、pullQuote、转场
     - 中段：50-120svh — 普通 body 段落
     - 长留白：120svh+ — 戏剧性内容、需要 dwell 的 KV 列表

Q6 · Junction（交接）
     - 跟前一个 scene 的关系：续接 / 对比 / 反转
     - 跟后一个 scene 的关系：铺垫 / 留扣 / 收束
     - 视觉上 prev scene 是淡出还是缩到角落保留为 caption
```

**未回答这 6 题的 scene 不应该被实现**——这是这个工作流的硬约束。

## D3 — Beat 1.1 的 Scene 设计推荐（作为样本）

Beat 1.1 现有内容：
- Title 项目背景 / Project Background
- Lead 构建社会干预的"风洞"——在真实城市沙盘中，推演 1000 个数字居民的附近性。
- Body 4 节：01 缘起 / 02 沙盘设定 / 03 核心实验 / 04 研究意义
- pullQuote 风洞之于翼面，世界模型之于社会干预。

相机现有约束：Beat 1.1 范围 t∈[0, 0.10]，绝对水平 POV（Y=0），从 [0, 0, 9.5] 推到 [0, 0, 5]——城市从远处浮现，camera 沿着 -Z 轴推进。

7 个 scene 推荐如下：

### Scene 1.1.0 · Title「项目背景」

```
Q1 Camera        相机持守在 [0, 0, 9.5]，绝对不动；Lane Cove 远景
                 在视野中央被薄雾覆盖，半隐半现
                 
Q2 Text-form     "项目背景" 居中 display 字号 (clamp 48-72px)
                 "Project Background" 副标 mono uppercase 16px 紧贴下方
                 字色 fg/45（低对比，跟冷雾呼应）
                 
Q3 Transition    进：第一帧已经在；视口加载就显示
                 退：当 scroll 跨过本 scene 末时，title 整体向上 +
                     缩小到屏幕顶部一行小标识，作为后续 scene 的 page
                     header 持久存在
                     
Q4 Interaction   只滚动；keyboard 可以 ↓ 进入下一 scene
                 
Q5 Duration      短停顿 ~50svh — 给读者读完标题、感受第一帧雾
                 
Q6 Junction      page entry → 这是首帧；无前 scene
                 → next: title 缩到顶端 caption；lead 接管中心位置
                    （字号下降一档，由 display 变 headline）
```

### Scene 1.1.1 · Lead「构建社会干预的'风洞'」

```
Q1 Camera        从 [0, 0, 9.5] 开始**极慢**推进（10svh 内只走 0.5 单位）；
                 城市从雾里轻微显出剪影，但仍在远景
                 
Q2 Text-form     居中，max-w 60ch
                 "构建社会干预的'风洞'..." subhead 字号 (clamp 22-28px)
                 字色 fg/72，比 title 显眼一档
                 单段一次出（不拆句）
                 
Q3 Transition    进：从屏幕下方 30px 上滑 + opacity 0→1，0.6s ease-out
                 退：跨过本 scene 末时滑出顶端，跟 title caption 合并/消失
                 
Q4 Interaction   只滚动
                 
Q5 Duration      中段 ~80svh — 读完 lead 大约 5 秒，加上滚动节奏的 dwell
                 
Q6 Junction      prev: title 已缩到顶端，作为 page header
                 → next: lead 退场；camera 开始正式推进；section 01
                    眉标"01"从右侧出现作为下一个 scene 的入口标记
```

### Scene 1.1.2 · 01 缘起：把宏大的社会问题"参数化"

```
Q1 Camera        从 [0, 0, 9] 推进到 [0, 0, 7.5]；首批建筑剪影在两侧
                 浮现；camera 继续 -Z 推进，此时观众"刚穿过雾墙"
                 
Q2 Text-form     右侧栏（max-w 40ch，距右边 8vw）
                 上：mono caption "01" + heading "缘起：把宏大的社会问题
                     '参数化'" — headline 字号 (~20-22px)
                 下：body 两段，正文 17px 行高 1.65
                 整段一次出（不分句），但段间有自然空行
                 
Q3 Transition    进：右栏整体从右侧 +40px 滑入 + opacity 0→1
                     "01" 数字先出（0.0s），heading 跟上（0.15s），
                     body 跟上（0.35s）
                 退：右栏整体淡出，下一个 scene 接管该位置（02 滑入
                     替换）
                 
Q4 Interaction   只滚动
                 hover 在 "附近性的消失" 上可弹小 tooltip 标"thesis 文档
                 行号"（defer 实施）
                 
Q5 Duration      中段 ~120svh — 2 段散文需要 dwell 时间
                 
Q6 Junction      prev: lead 退场后空一拍，相机稍 acclimatize 然后入场
                 → next: 02 沙盘设定 滑入替换；camera 进一步推进，
                    建筑更近
```

### Scene 1.1.3 · 02 沙盘设定：真实地理 × LLM 群体

```
Q1 Camera        从 [0, 0, 7.5] 推到 [0, 0, 6]；建筑两侧明显，已经
                 进入街区；camera **节奏放慢**（dwell — 这是"我们建
                 了什么"的稳定凝视）
                 
Q2 Text-form     沿用右侧栏 layout
                 上：mono "02" + heading "沙盘设定：真实地理 × LLM 群体"
                 中：1 段散文引言
                 下：4 项 key:value 列表（实验场地 / 数字居民 / 运行
                     周期 / 严谨验证）—— mono key + 正文 value
                 
Q3 Transition    进：右栏切换（01 淡出，02 滑入）；KV 4 项 stagger 进场，
                     每项延迟 0.1s
                 退：右栏淡出
                 
Q4 Interaction   hover KV 的 key 上可显图标 / 文档链接（defer）
                 
Q5 Duration      长留白 ~140svh — 4 项 KV 需要 dwell 读取
                 
Q6 Junction      prev: 01 缘起的"为什么需要仿真" → 这一节给出"我们建
                    成什么样"的具体答案
                 → next: 03 核心实验，进一步从"建了什么"到"在里面做什么"
```

### Scene 1.1.4 · 03 核心实验：最小限度的干预

```
Q1 Camera        从 [0, 0, 6] 推到 [0, 0, 5]——最深位置，城市完全
                 包围视野；camera 短暂悬停在最深处
                 
Q2 Text-form     沿用右侧栏
                 上：mono "03" + heading "核心实验：最小限度的干预"
                 中：1 段散文（含"500 米半径内的物理碰面率（自然基准
                     线为 14%）"）
                 下：2 项 KV（干预测试 / 观察目标）
                 ★ 14% 数字加粗加大（subhead 字号、色 accent）；
                   作为本 scene 的视觉锚点
                 
Q3 Transition    进：右栏切换；14% 那个数字用 counter 动画从 0→14
                     （3 秒内完成，跟 KV 项进场同步）
                 退：右栏淡出，但 14% 数字短暂留在屏幕中央作为
                     transition motif（连接到 04 节）
                 
Q4 Interaction   只滚动；14% counter 动画一次（不重复触发）
                 
Q5 Duration      中段 ~120svh
                 
Q6 Junction      prev: 02 给了"做什么的舞台"，03 给"做什么的实验"
                 → next: 04 研究意义；14% 这个数字作为视觉桥（短暂
                    悬停在屏幕中央）从 03 过渡到 04
```

### Scene 1.1.5 · 04 研究意义：跨越双领域的探索

```
Q1 Camera        camera 从 [0, 0, 5] **不再推进**——保持深处位置；
                 此时观众"在城市核心位置回望"
                 
Q2 Text-form     **layout 切换**——从右侧栏改为 **左右双栏**（仅此
                 scene 用），呼应"跨越双领域"的内容
                 上方：mono "04" + heading "研究意义：跨越双领域的探索"
                 + 1 段散文引言
                 下方：双栏，左 = 对城市研究，右 = 对 AI 研究
                 KV 风格但每项更长（带 1-2 句解释）
                 
Q3 Transition    进：上方 heading 先出（fade）；双栏从中线向两侧展开
                     （opacity 0→1 + scaleX 0.95→1，0.6s）
                 退：双栏向中央合拢消失，pullQuote 从中央浮出接管
                 
Q4 Interaction   双栏间没有 active 切换（不是 toggle，是并列）
                 
Q5 Duration      长留白 ~140svh — 双栏内容多
                 
Q6 Junction      prev: 14% 桥
                 → next: pullQuote 收束；双栏向中央合拢，露出 pullQuote
                    单一大字
```

### Scene 1.1.6 · pullQuote「风洞之于翼面，世界模型之于社会干预」

```
Q1 Camera        相机回到 [0, 0, 5] 完全静止——这是"句号"位置；
                 然后 Beat 1.2 才会从这开始 lift
                 
Q2 Text-form     居中，单句独占视野
                 字号 display+（clamp 36-56px）
                 italic + 略 letterspacing
                 字色 fg/95
                 中英两行——zh 在上（大），en 在下（小一档，opacity/72）
                 
Q3 Transition    进：从 prev 双栏合拢之后，单一大字 fade-up + 略 scale
                     从 0.95→1（0.8s）；缓 ease-out
                 退：跨过本 scene 末时整体 fade-out（不要持守为 caption
                     —— pullQuote 是 standalone moment，不应残留）
                 
Q4 Interaction   只滚动；双语两行可被选中复制
                 
Q5 Duration      短停顿 ~70svh — pullQuote 是节奏停顿，应短而重
                 
Q6 Junction      prev: 04 研究意义的双栏合拢留出空间
                 → next: Beat 1.2 开始；camera 开始 lift，pullQuote
                    完全消失，新 beat 的 title 接管
```

---

## D4 — 怎么落到 schema 与 score（推迟到实施 propose）

本 propose 不动 schema 与 score；但要给实施 propose 留下钩子：

### Schema 改动方向

```
旧：
  Beat {
    title?: I18nString
    lead?: I18nString  
    body?: I18nString  // markdown-lite
    pullQuote?: I18nString
    hud: { kind, ... }
  }

新（需求方向，等实施 propose 决定细节）：
  Beat {
    scenes: Scene[]
  }
  
  Scene = {
    id: string,
    kind: "title" | "lead" | "body-section" | "pull-quote" | "custom",
    text: I18nString,           // 内容
    cameraOverride?: ShotPath,  // 此 scene 的相机轨迹（可选；未填则
                                  beat 默认 shot 内插值）
    layout: LayoutKind,          // "centered" | "right-column" |
                                  "twin-column" | "lower-third" | etc.
    enter: Transition,           // fade / slide-up / etc.
    exit: Transition,
    duration: { kind: "short"|"mid"|"long", svh?: number },
    // 6 questions partially baked in; 部分（interaction）保持 implicit
  }
```

### Camera score 改动方向

```
旧：1 beat × 1 shot
新：1 beat × N scenes × N camera waypoints
   每个 scene 可以"完全继承 beat 默认 shot"或"override 一段轨迹"
   
   Scene-aware 的 scrollCinema 在 t 处插值时考虑 scene 边界
```

### 渲染层改动方向

```
旧：CinemaCanvas + HudLayer + sr-only article
新：CinemaCanvas + SceneLayer
    SceneLayer 渲染当前 scene 的 text-form
    每个 LayoutKind 是一个 component (centered, right-column, ...)
    每个 Transition 是一个 entrance/exit 动画规约
```

具体 component 设计、动画曲线、scene 切换的精确节奏，都留到实施 propose。

---

## Risks / Trade-offs

- **[每 scene 单独设计 → 工程量大]** → 9 个 beat × 平均 5-7 scene = 45-63 scene。**Mitigation**：layout primitive 沉淀成可重用组件（centered / right-column / twin-column / pull-quote-large 等 5-7 种），新 scene 只是组合这些 primitive，不每次重做。
- **[scene 设计可能跑偏，作者不满]** → **Mitigation**：Beat 1.1 全部设计完后**先实施一个**给作者看；确认后才批量推到其它 beat。
- **[scene 框架太死，抹杀作者灵感]** → **Mitigation**：6 个维度是必答项；但 D5 留 `kind: "custom"` 出口，允许某 scene 完全自定义 layout / transition（比如 Act 3.2 镜像反演那种特殊时刻）。
- **[scroll budget 大幅超预期]** → 9 beat × ~600svh/beat = 5400svh ≈ 50 视口。**Mitigation**：实施 PoC 后量化滚动总长，决定 trim / 加速哪些 scene。

## Open Questions

- **Q-A** · Beat 1.1 的 7 个 scene 推荐你认同吗？挑出最不对的 1-2 个让我重做。
- **Q-B** · 框架的 6 个维度够不够？要不要加 audio / accessibility / mobile-layout？
- **Q-C** · 如果 layout primitive 沉淀成 5-7 种（centered / right-column / twin-column / lower-third / pull-quote-large / ...），你想要的还有哪些没列入？
- **Q-D** · scene 之间有"留白 scene"（纯相机移动、零文字）这个概念吗？比如 Beat 1.2 lift 转场时，是否有一段无字相机动作？

回答这 4 个问题后开实施 propose。

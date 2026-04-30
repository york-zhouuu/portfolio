## Context

Cinema 已成形（一镜到底，三幕脊柱，双语，studio-lamp 设计语言）。Storyboard 已有承载长内容的版式（epigraph / body / pullQuote / references）。**唯一的空缺是内容**——10 个 beat 当前只有 1–3 句 claim 占位，没有真正的"作者标记"。

之前我交付的 Beat 1.1 散文是**议题随笔**而非案例研究——它讨论"附近性盲区"这个**现象**，但不展示作者就 SSWT 这个**项目**做了什么。本设计要解决这个错位。

源材料锁定（每个 beat 取材的池子）：

- `/Users/york_z/Desktop/IDEA地图-agent模拟/Synthetic_Socio_Wind_Tunnel/`
  - `README.md` · `CLAUDE.md`
  - `docs/research/00-thesis.md` · `13-research-design.md`
  - `docs/agent_system/11-smoke-demo-report.md` 等
  - `synthetic_socio_wind_tunnel/agent/personality.py` · `planner.py` · `policy_hack/variant_a.py` · `mirror.py`
  - `data/lanecove_atlas.json` · `tools/smoke_experiment_demo.py`
- 已导出到本站的资产：
  - `public/case-studies/sswt/{map-geometry,sampled-agents,signal-summary,trajectories,manifest}.json`

## Goals / Non-Goals

**Goals:**

- 每个 beat 在 storyboard 里产出一份**作者标记**：(1) 一个具体决策被命名、(2) 一个具体物件被引用 / 嵌入、(3) 一段连接散文把决策与项目主线缝在一起。
- 工作单元 = **单 beat**，作者每次评审一个 beat。无论 cinema 表现多炫或全篇风格多统一，**没有"作者标记"的 beat 不算完成**。
- 全篇阅读密度可控：每个 beat 的 body 不超过 350 字，pullQuote 单句，物件至多 1–2 个。**长度不是质量指标，决策密度是。**
- 双语对等：zh / en 两份必须传达同一组决策与物件，不允许某语言版本"省略一个 artifact 但散文照写"。

**Non-Goals:**

- **不**写完整篇 case study 的最终态——这一 propose 只覆盖 Act 1（3 beat）的内容到锁定为止。Act 2/3 由后续 propose 接管（基于 Act 1 评审后的反馈调整模板）。
- **不**改 cinema、score、HUD 组件、设计语言、frontmatter schema 字段。schema 已存在 `body` / `pullQuote` / `epigraph` / `references`，本次只填充。
- **不**做配图（fallback figure SVG）——artifact 引用以文本/代码/数据点优先，图配合等到 Act 1 锁定后再考虑统一画风。
- **不**改写 cinema 中的 letterbox / cue-card / hud-panel 文案——它们已与 frontmatter `claim` / `hud.subtitle` / `hud.text` 绑定，会随 body 改写自然同步。

## Decisions

### D1 — 单 beat 五件套模板

每个 beat 的 body 字段下面，作者必须写明（在草稿阶段以注释形式存在；锁定后可移到独立的辅助文档或保留为版本控制注释）：

| 字段 | 一句话 | 例子 |
|---|---|---|
| **Job** | 这个 beat 在论证里负责什么？ | "开篇钉住一个具体可量化的问题（不是哲学化的'孤独'）。" |
| **Decision** | 项目里就这一段做出过什么真实判断？ | "用 14% 自然偶遇率作为 baseline 而不是用问卷的 self-reported loneliness。" |
| **Artifact** | 一个具体物件指向决策。 | smoke demo 14%/100%/86 pp 数字，引用 `docs/agent_system/11-smoke-demo-report.md`。 |
| **Voice** | 这一 beat 的语气位。 | "钉问题时是声明态，不是抒情态。第一人称复数（我们）。" |
| **Connector body** | 200–350 字双语，把上面四件串起来 + pullQuote 单句。 | （写在 frontmatter `body` / `pullQuote` 字段） |

**Job + Decision + Artifact** 是评审检查项；**Voice + Body** 是表达层。如果一个 beat 没有 Decision 或 Artifact，它**不应该被作为案例研究的 beat 存在**——这种发现本身可能触发 cinema 结构调整。

### D2 — 工作单元的工作流

每个 beat 走 5 步：

```
1. 取材        我打开源项目，列出该 beat 候选的 Decision + Artifact 池
              （3–5 个候选项），让作者挑

2. 草稿        我按选定的 Decision + Artifact 写双语 body + pullQuote
              草稿（注释里附 Job/Voice 说明）

3. 评审        作者反馈（"这个不是我想说的" / "这个 artifact 选错了" /
              "voice 太学术" 等）

4. 修订        基于反馈重写。允许多轮（一般 1–2 轮）

5. 锁定        作者确认；该 beat 进入 frontmatter 正式 body；
              进入下一个 beat
```

**没锁定不开下一个**。这条最关键——避免我自作主张连写 10 个 beat 然后被全否。

### D3 — 顺序：Act 1 → Act 2 → Act 3，每幕内顺序

Act 1 三个 beat 优先级：

```
Beat 1.1  open-real-world         intro 的入口；钉问题 / 钉度量
Beat 1.2  blindspot-reveal         intro 的展开；把"边界"概念可操作化
Beat 1.3  instrument-summon        intro 的转折；正当化"建一台仪器"的选择
```

写作顺序与阅读顺序一致：先 1.1，后 1.2，最后 1.3。**不要并行**——后一 beat 的内容容易借用前一 beat 已锁定的措辞与物件。

Act 1 锁完之后**停下来**，跟作者过一次"全 Act 1 通读"，调整任何不连贯，再决定是否带相同模板进 Act 2。

### D5 — Scan, don't read（内容原则）

> 用户的阅读习惯是 **扫描（Scan）**，不是 **阅读（Read）**。

每段内容必须自带视觉骨架：醒目的小节编号 / 标题、关键词加粗、key:value 形式参数列表、段落短而轻、视觉结构 ≥ 散文密度。一段没有视觉层级的文字是一面墙，读者不会进。

完整原则文档落在 `docs/content-principles.md`，**所有 beat 的 body 必须遵守**。具体操作约束：

- 每个 beat 至少有 1 个 `lead`（醒目一句话）+ 1 段 body
- body 中如果信息超过 200 字，必须用 `## 编号 标题` 拆成 2–4 个小节
- 每段超过 4 句话 → 拆段
- 数据 / 参数 / 名词列表 → 用 `- key: value` 形式而不是行内逗号串
- 关键术语用 **bold** 标记（每节 2–4 处，不滥用）

这条原则推动了三个组件层面的改动（在本 propose 范围内）：

1. `Beat` schema 增加可选 `title`（小节标题）+ `lead`（醒目一句话）
2. `<Prose>` 组件支持 markdown-lite：`## ` 标题、`- key: value` 列表、`- ` 普通列表、`**bold**`
3. Storyboard 重排：title + lead 作为 beat 入口，claim 降级为"cinema 字幕"小注

### D4 — Beat 1.1 模板示范填充

下面是按 D1 五件套填的 Beat 1.1 v0 草稿，作为模板的示范——也是评审的第一件输入。

**Job**：开篇钉住一个具体可量化的问题。读者结束这个 beat 时应该带走的不是"附近性危机"这种情绪，而是"哦，这个项目要研究的是 14% 这个数字能不能被改变。"

**Decision**：项目选择把研究对象操作化为 **encounter rate at <500m**——一个可由 baseline 与 intervention 两组对照得到差值的物理可观测变量——而不是用社会调查里常见的 self-reported loneliness 或 sense-of-community 量表。

**Artifact**：
1. smoke demo 已有数字：control 组 14% / target 组 100% / 治理效应 86 pp。引用 `docs/agent_system/11-smoke-demo-report.md`。
2. Lane Cove 选址理由：高密度 + 真实坐标 + 公共数据可用（OSM / Overture / ABS），引用 `data/lanecove_atlas.json` 与项目自己的 site-choice 论证。

**Voice**：声明态 / 第一人称复数（我们）/ 短句 / 不哲学化。读完一遍像在听一个研究员讲他要做的实验，不像在听评论员讲世界怎么了。

**Connector body**（草稿，等评审）：

中：
```
这件作品要解的问题是：在高密度城市里，500 米半径内的物理"附近"还
能维持多少社会强度？

我们选 Lane Cove——悉尼北岸一公里见方、两万两千居民的高层住宅区
——作为唯一样本。在不施加任何干预的情况下，从 baseline 跑出来的
agent 群体自然偶遇率（同一时段、500 米半径内的物理碰面）落在 14%。

14% 不是这件作品的发现。这件作品要做的，是问：当我们用最小的数字
干预——把一条**真正本地**的 feed 推给一小部分 agent——这个数字
能变成什么。如果它能从 14% 涨到 100% 而其它 variant 都涨不到，
那就证明问题的瓶颈不是"现代人冷漠"，是注意力被机器吸走了。

这就是这台仪器要做的事：把"附近被擦掉"这一句修辞，转换为一个
14%、一个 100%、一个 86 个百分点的差。
```

英：
```
The question this case study takes on is operational: in a dense
city, how much social strength can the physical "nearby" within a
500-meter radius still hold?

We chose a single site — Lane Cove, a one-square-kilometer slice
of north Sydney with 22,000 residents at urban density — and let a
baseline run play out untouched. Agent natural encounter rate
(physical co-presence within 500m, same time window) lands at 14%.

14% isn't the finding. The finding is what happens when we apply
the smallest possible intervention — push one **genuinely local**
feed item to a fraction of the agents — and watch the number move.
If it climbs from 14% to 100% under that treatment but stays flat
under others, the bottleneck isn't "modern apathy." It's attention
that has been routed elsewhere.

That is what this instrument is for: turning the phrase "the nearby
has been erased" into a difference of 14%, 100%, and 86 percentage
points.
```

**pullQuote**：

中："14% 不是这件作品的发现；它是这件作品的起点。"
英："14% isn't the finding — it's the starting line."

---

如果作者看着这份示范觉得"对，这种密度才是 case study"，那 D1–D3 就直接生效，进入 task list 的 Beat 1.2 取材；如果觉得 voice 还差或选错了 artifact 或 D 有问题，反馈到 D 哪一项失败，我们改 D 不改 Beat 1.1 草稿。

## Risks / Trade-offs

- **[每 beat 评审循环慢]** → 一篇 case study 可能要 10–20 轮迭代。**Mitigation**：把"模板锁定"放在 Beat 1.1 这一关；模板对了之后后续 beat 速度会快很多。
- **[作者声音被 AI 同质化]** → 草稿出自 Claude 总有"研究员中性 + 文学化"的常见基调。**Mitigation**：D1 显式要求 Voice 字段；评审重点检查"这一 beat 听起来是不是 york 在说话"。
- **[过度依赖源项目文档]** → 案例研究若只是源项目 README 的搬运，没有"作品集层"价值。**Mitigation**：D1 的 Artifact 字段 ≠ "搬运一段源项目文字"；Artifact 应是被作者**选中并嵌入**到一段连接散文里的具体物件，体现选择动作本身。
- **[每 beat 的 Decision 可能不存在]** → 真有可能某 beat 在源项目里没真做过决策（只是论文性陈述）。**Mitigation**：D1 把"Decision 不存在"识别为信号——可能要重新设计该 beat 是否应作为 case study beat 存在，而不是硬凑一个。
- **[长度上限可能太紧]** → 某个 beat 决策足够多以至 350 字写不下。**Mitigation**：允许越界但要求作者批准；不许默认越界。

## Migration Plan

1. **删除现存 Beat 1.1 的 body 与 pullQuote**（之前的"演示用"散文），保留 claim/HUD 不动。
2. **按本设计的 D4 草稿重写 Beat 1.1**，提交评审。
3. 评审通过后**锁定 Beat 1.1**，进入 Beat 1.2。
4. Act 1 三 beat 全部锁定后，**停下来与作者过一次全篇通读**，调整任何不连贯，再决定 Act 2 是否沿用相同模板（或调整 D1）。
5. **不打 git tag**——本次是内容写作，不属于发布性变更。

## Open Questions

- **Q1 — Voice 是不是应该有更明确的"作者档案"** 比如一份单独文档列出 york 的写作偏好（"避免抒情"、"喜欢用括号注释"等）？这一稿先在 D4 用例子隐式给出，等 Beat 1.1 锁定后再看是否要显式抽出。
- **Q2 — Artifact 嵌入要不要支持视觉引用** 如配图、代码 syntax highlight、数据卡？本次先以**纯文本引用**起步（"引自 X.md"、"smoke demo: 14% control"）；视觉嵌入待 Act 1 锁定后看缺口再 propose 增量。
- **Q3 — pullQuote 是否每 beat 必填**？目前 schema optional。本设计推荐每 beat 都有，因为 pullQuote 是 voice 锚点。但允许某 beat 没有特别想凸显的句子时为空。先记下，过 Act 1 后看实际有几个 beat 能空。
- **Q4 — 完整态后 D1 的 Job/Decision/Artifact 字段是否要保留进 frontmatter** 比如以 `meta.author_notes` 形式？还是只保留为评审期的 commit 注释，锁定后丢弃？倾向后者——锁定的 body 已经体现这些；保留会让 frontmatter 变臃肿。

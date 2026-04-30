# Case Study Data Provenance

每个 case study mdx 中出现的数字 / 命名值 / 引用——其**真实出处**、**当前状态**、**待补 TODO**。

每加一处新数字，**必须**在此登记。这文档是 case study 上线前的 fact-checking 清单。

> **更新 2026-04-28**：本文档随 case-study-script-v1（v3 产品向 5 幕版）重组。原 Beat 1.1 / 1.2 表格保留在 § Legacy 区域，作为已迁移记录；主表已切到 v3 的 Act/Beat 结构。

---

## SSWT — v3 5 幕产品向（current）

### Act I — Target (Beat: disappearance-of-nearby · v4 单 beat 4 scene)

> **更新 2026-04-28**：Act I 由 act-1-v4-rewrite 落地为 v4 措辞克制的单 beat 4 scene。原 v3 outline 中的 `38k 具体数 / 36% Reddit 具体% / 三层机制链 / Synthetic Socio Wind Tunnel 命名` 等条目已转移或移除：v4 Act I 仅定性引用 ABS / Reddit 数据源，不 surface 具体数字；三层机制链移至 Act II.3 policy-engine；产品名 surface 改至 Act II 起首。

| 数字 / 命名 | 出现位置 | 类型 | 真实出处 | 状态 |
|---|---|---|---|---|
| Lane Cove | scene-1-1 ~ 1-4（隐含 + claim）| ✓ real | Sydney inner-north LGA, 2066 邮编 | final |
| Lane Cove LGA 39,438 居民 | scene-1-2 evidence (left col, kvList + paragraph) | ✓ real | [ABS 2021 census QuickStats](https://www.abs.gov.au/census/find-census-data/quickstats/2021/LGA14700) | final |
| 56.7% apartment dwellings | scene-1-2 evidence (left col) | ✓ real | 同上 ABS 2021 | final |
| ~11 km² LGA 区域面积 | scene-1-2 evidence (left col) | ✓ real | [Lane Cove Council Wikipedia / id Profile NSROC](https://profile.id.com.au/nsroc/about?WebID=130) | final |
| ~3,585 / km² 居住密度 | scene-1-2 evidence (left col) | ✓ real (derived) | 39,438 / 11 km² ≈ 3,585，取自 ABS 居民 + LGA 面积 | final |
| Deakin Photovoice (Warner & Andrews 2019) 引文 + 3 段 quote | scene-1-2 evidence (right col, paragraph + citations) | ✓ real | [The Conversation, 2019-08-05](https://theconversation.com/apartment-life-for-families-means-living-at-close-quarters-but-often-feeling-isolated-too-120983) — Photovoice 研究 City of Yarra apartment families | final |
| ~~Reddit "对邻居陌生" 切片~~ | ❌ 已移除（Reddit 不可达 + 学术 photovoice 引文严谨度更高）| — | — | **decision 2026-04-28**：放弃 Reddit 路径，用 Deakin Photovoice 替代 |
| 注意力位移 (Attention Displacement) | scene-1-3 attention-displacement | ✓ real (设计 / 学术概念) | 项目 thesis 自有定义；近 cog/urban 研究 attention economy 文献 | final（设计语）|
| 通勤习惯 + 屏幕注意力捕获 | scene-1-3 paragraph | ✓ real (设计) | mechanism architecture | final |
| 过境走廊 (transit corridors) | scene-1-3 paragraph | ✓ real (修辞 + 设计) | thesis 概念，对应 baseline runtime 的"降噪耳机走廊" | final |
| 计算社会科学沙盘 (computational social-science sandbox) | scene-1-4 sandbox-reveal | ✓ real (设计语) | 概念性命名，承接产品需求 | final |
| 算法干预 (algorithmic intervention) | scene-1-4 sandbox-reveal | ✓ real (设计) | 对应 II.3 Policy Engine 的"algorithmic input 侧 hack" | final |
| 重建附近性 (rebuild proximity) | scene-1-4 sandbox-reveal | ✓ real (设计目标) | 项目目标语 | final |

### Act II — Architecture

| 数字 / 命名 | 出现位置 | 类型 | 真实出处 | 状态 |
|---|---|---|---|---|
| `Atlas` 模块名 | II.1.1 | ⚠️ verify | 待与源项目代码模块名对齐 | **待补**（确认是否实际叫 Atlas）|
| `Ledger` 模块名 | II.1.2 | ⚠️ verify | 同上 | **待补** |
| OSM streets | II.1.1 | ✓ real | source data | final |
| Overture buildings | II.1.1 | ✓ real | source data | final |
| 288 tick/天 | II.1.2 | ✓ real | `docs/agent_system/16-metrics.md` publishable spec | final |
| 1000 节点 | II.1.2 / II.2.1 | ⚠️ aspirational | smoke 100 → 公开赛 1000 | **待**（公开赛跑完核对）|
| `~4M rows / 14d` Ledger 写入 | II.1.2 | ⚠️ approx | 估算 (1000 × 288 × 14 ≈ 4M) | OK as approximation |
| `Sonnet ×10 / mid ×200 / Haiku ×790` | II.2.2 | ✓ real | `docs/agent_system/00-thesis.md` budget table | final |
| `~$4 / run` | II.2.2 | ✓ real | 同上 | final |
| `村上春树 / 攀岩 / filter-coffee` 兴趣示例 | II.2.2 | ✓ real (示例) | narrative 示例 tag | final |
| 通勤惯性 / 兴趣标签 / 社交阈值 | II.2.2 | ✓ real (设计) | agent attribute architecture | final |
| 主边界 + 三层机制链 | II.3.2 (从 v3 I.1.3 迁移过来 per Q5)| ✓ real (设计) | thesis 自有定义 | final（设计） |
| algorithmic input layer | II.3.2 | ✓ real | system architecture (Policy Hack: Digital Lure 对应) | final |
| spatial input layer | II.3.2 | ✓ real | system architecture (Policy Hack: Spatial Unlock 对应) | final |
| perceptual input layer | II.3.2 | ✓ real | system architecture (Policy Hack: Perceptual Reshape 对应) | final |
| Synthetic Socio Wind Tunnel | Act II 首 beat 起首（迁出 v3 I.3.3）| ✓ real | 项目正式名 | final |
| `Digital Lure / Spatial Unlock / Perceptual Reshape` | II.3.2 | ✓ real (设计) | Policy Hack 3 类命名 | final |
| `300m geo-fence` (Digital Lure) | II.3.2 / III.2 | ✓ real (设计) | 作者 v3 outline 拍板 (v1 用 500m) | final |

### Act III — Runtime

| 数字 / 命名 | 出现位置 | 类型 | 真实出处 | 状态 |
|---|---|---|---|---|
| `run --variant baseline --duration 14d --seeds 30` | III.1.1 | ✓ real (CLI 风格) | 模拟命令 | final（fake terminal）|
| 共在 14% | III.1.2 | ✓ real | `docs/agent_system/11-smoke-demo-report.md:33` smoke demo control | final |
| 降噪耳机走廊 | III.1.2 | ✓ real (修辞) | thesis 概念 | final |
| `policy_engine.deploy(...)` | III.2.1 | ✓ real (CLI 风格) | 模拟命令 | final |
| Anchor A12 | III.2.2 | ✓ real (示例 ID) | narrative ID | final |
| 圆波传播 (300m) | III.2.2 | ✓ real (设计) | Variant A 参数 | final |
| 响应阈值 = personality × interest × plan slack | III.2.2 | ✓ real (设计) | agent attention model | final |
| `Δ +302m` 路径偏转 | III.3.1 | ✓ real | smoke-demo-report.md:35 | final |
| `Density +450%` HUD | III.3.2 | ⚠️ aspirational | publishable HUD telemetry | **待**（1000-agent run 后 final）|
| `New Ties: 24` HUD | III.3.2 / IV.2.2 | ⚠️ aspirational | 同上 | **待** |
| desire paths | III.3.1 | ✓ real (urbanism 术语) | architecture / behavior 标准术语 | final |
| 死胡同 (dead-end alleys) | III.3.1 | ✓ real | Lane Cove 拓扑实有 | final |

### Act IV — Analytics

| 数字 / 命名 | 出现位置 | 类型 | 真实出处 | 状态 |
|---|---|---|---|---|
| `6h` 大部分回到 baseline | IV.1.2 | ⚠️ mock | narrative placeholder | **待**（rival_hypothesis_suite 时间序列分析）|
| `12h` 80% 衰减 | IV.1.2 | ⚠️ mock | 同上 | **待** |
| `24h` 物理表面恢复 | IV.1.2 | ⚠️ mock | 同上 | **待** |
| 通勤重力 (commute gravity) | IV.1.2 | ✓ real (设计) | agent attribute baseline | final |
| `SELECT * FROM ties WHERE ...` | IV.2.1 | ✓ real (CLI 风格) | fake SQL | final |
| `24 / 24` 弱连接持久化 | IV.2.2 | ⚠️ aspirational | 设计预期 | **待**（公开赛后 final）|
| `7 天后仍激活` | IV.2.2 | ⚠️ mock | placeholder | **待** |
| Ledger 弱连接强度公式 = 共在频率 × 距离衰减 | IV.2.2 | ✓ real (设计) | network architecture | final |

### Act V — Pipeline

| 数字 / 命名 | 出现位置 | 类型 | 真实出处 | 状态 |
|---|---|---|---|---|
| `Agent 01 / Agent 02` | V.1 / V.2 | ✓ real (示例 ID) | narrative cold ID | final |
| `19:42` timestamp | V.2.1 / V.2.2 | ✓ real (示例) | narrative 示例 | final |
| Anchor A12 (复用) | V.1 / V.2 | ✓ real (示例) | 同 III.2.2 | final |
| Agent 01 日志 (zh 三段) | V.2.2 | ⚠️ mock | narrative 编写 | **待**（真跑 PerceptionPipeline 替换）|
| Agent 02 log (en 三段) | V.2.2 | ⚠️ mock | 同上 | **待** |
| PerceptionPipeline 模块名 | V.2.1 | ⚠️ verify | 待与源项目代码对齐 | **待补** |

---

## SSWT — Legacy（v1 旧 Beat 1.1 / 1.2，已迁移）

> 以下为 v1 状态记录，**已被 v3 替代**。保留作 audit trail。

### Beat 1.1 — open-real-world（v1）→ Act I.1 systemic-bug（v3）

| 数字 / 命名 | v1 status | v3 处理 |
|---|---|---|
| `1,000` 居民 | aspirational mock | v3 改用 ABS 38k Lane Cove；1000 改为 II.2.1 agent 节点数 |
| `0` 弱连接 | rhetorical | v3 移除（替换为 Reddit 36% 切片）|
| `Lane Cove` | real | v3 保留 |
| `1 km²` | approx | v3 保留 |
| `14 天` | real | v3 保留（II.1.2 / III.1.1）|
| `30 个 seed` | real | v3 保留（III.1.1）|
| `~$4 / run` | real | v3 保留（II.2.2）|

### Beat 1.2 — blindspot-reveal（v1）→ 部分迁移到 III.1.2 + 移除"咖啡馆 reading"叙事

| 数字 / 命名 | v1 status | v3 处理 |
|---|---|---|
| `14%` 自然基线 | real | ✓ 保留到 III.1.2 corridors（不再是 Beat 1.2 的数据爆点）|
| `50 control / 50 target` | real | 保留作 source 但不直接 surface 在 v3 网页|
| `7 人` 偶然走到 | real | 不在 v3 网页 surface（smoke 内部数）|
| `100% / 86 pp` | real | 不在 v3 网页 surface（替换为 Density +450% / New Ties 24）|
| `+302m` trajectory delta | real | ✓ 保留到 III.3.1 desire-paths |
| `31 enc/day median` | inconclusive | 不在 v3 网页 |
| `咖啡馆 reading` framing | v1 narrative | ❌ v3 移除（拟人化），改为 Anchor A12 + Digital Lure 产品化命名 |

### Beat 1.3 — instrument-summon（v1 grandfather）→ 移除

| 数字 / 命名 | v1 status | v3+v4 处理 |
|---|---|---|
| 整 beat (`instrument-summon`) | grandfather (claim only, no scenes) | ❌ act-1-v4-rewrite 删除整 beat；产品名 reveal 改至 Act II 起首（v4 Act I 仅 4 scene 单 beat） |

### v4 act-1-v4-rewrite 落地变化（2026-04-28）

| 旧 v3 outline 条目 | v4 实际处理 |
|---|---|
| `38k` Lane Cove 居民（具体数）| ❌ 不 surface 具体数；scene-1-2 仅引用"ABS 普查数据"作为定性 source |
| `36%` Reddit "对邻居陌生"（具体%）| ❌ 不 surface 具体数；scene-1-2 仅"持续出现 ... 发帖记录" 定性表述 |
| `1km²` Lane Cove narrative 简化 | ❌ 移除——v4 narrative 不出现 km² 数值；Atlas 真尺度 (3.6 × 4.7 km / ~17 km²) 留至 Act II.1 surface |
| 主边界 + 三层机制链（v3 I.1.3）| ➡ 迁移到 Act II.3 policy-engine（Q5=B 决定）|
| Synthetic Socio Wind Tunnel 命名（v3 I.3.3）| ➡ 迁移到 Act II 起首 |
| computational social science testbed（v3 I.2.2）| ✓ 保留；改写为 v4 scene-1-4 "计算社会科学沙盘 ... 算法干预 ... 重建附近性" |

---

## External Reference Library

不会出现在 mdx 文案里，但作为叙事 coherence 的支撑（写 portfolio 简介或 design notes 时可引用）。

| 引用 | 主张 | URL |
|---|---|---|
| Schläpfer et al. 2014 _J Roy Soc Interface_ | 城市数字联系超线性 (β ≈ 1.12) | https://royalsocietypublishing.org/doi/10.1098/rsif.2013.0789 |
| Warner & Andrews 2019 _The Conversation_ (Deakin) | Photovoice 研究 City of Yarra apartment families：物理紧邻 → 社交匿名度高 | https://theconversation.com/apartment-life-for-families-means-living-at-close-quarters-but-often-feeling-isolated-too-120983 |
| Kent / Rugel / Bower 2023 (USyd) _The Conversation_ | 城市设计如何促进或阻碍 loneliness（建成环境因素） | https://www.sydney.edu.au/news-opinion/news/2023/02/02/the-cities-we-create-lead-to-isolation-and-loneliness.html |
| APS / Swinburne 2018 Australian Loneliness Report | 1/4 澳人感到孤独（n=1,600+ 全国调查） | https://figshare.swinburne.edu.au/articles/report/Australian_loneliness_report_a_survey_exploring_the_loneliness_levels_of_Australians_and_the_impact_on_their_health_and_wellbeing/26279857 |
| AIHW 2023 Australia's welfare | Social isolation, loneliness and wellbeing 数据章节 | https://www.aihw.gov.au/reports/australias-welfare/australias-welfare-2023-data-insights/contents/social-isolation-loneliness-and-wellbeing |
| Eagle & Pentland 2006 _Pers Ubiquit Comput_ "Reality Mining" | MIT 100 phones × 9 months Bluetooth proximity；好友对日均 proximity 仅 15.7 分钟 | http://realitycommons.media.mit.edu/pdfs/realitymining.pdf |
| Crandall et al. 2010 _PNAS_ | co-occurrence → 社会联系推断 | https://www.pnas.org/doi/10.1073/pnas.1006155107 |
| 概率时间地理 (MDPI 2019) | 相遇概率 distance decay 形式化 | https://www.mdpi.com/2220-9964/8/4/177 |
| Whyte 1980 _The Social Life of Small Urban Spaces_ | 广场作为陌生人接触场所 | 书籍 |
| Jacobs 1961 _Death and Life of Great American Cities_ | 街道作为社会接触场所 | 书籍 |
| Granovetter 1973 _AJS_ "The Strength of Weak Ties" | 弱连接对信息扩散的关键作用 | https://faculty.washington.edu/matsueda/courses/590/Readings/Granovetter%20Weak%20Ties%20AJS.pdf |
| Wu, Tim 2016 _The Attention Merchants_ | 注意力作为商品的资本史观 | Knopf 书籍 |
| Lane Cove demographic profile | ABS 2021 census | https://www.abs.gov.au/census/find-census-data/quickstats/2021/LGA13800 |

---

## 状态图例

- ✓ **real** — 项目内部实测 / 官方数据 / 公认设计语，不变
- ⚠️ **mock** — 未来会替换为真实数字，目前用占位
- ⚠️ **inconclusive** — 实测过但置信度不够
- ⚠️ **rhetorical** — 非具体测量值，叙事表达
- ⚠️ **approx** — 真实但简化
- ⚠️ **aspirational** — 公开赛级数字，待真跑得出
- ⚠️ **verify** — 真实数字，但当前未对齐源（需要作者校核）

---

## 加新数字工作流

1. 写 mdx scene，**不**直接写 magic number
2. 来此 doc 登记一行（值 / 来源 / 类型 / 状态）
3. 如果是 mock / aspirational，在 `## TODO / 待补` 加一条提醒
4. case study release 前过一遍：所有 ⚠️ 都需要降级为 ✓ 或保留 explicit 标注（HUD、UI 中明示"aspirational"）

---

## TODO / 待补（v3）

### 高优先级（影响主要 narrative claims）

- [ ] ABS Lane Cove 38k 精确数（Council 2021 census quickstats 查询 → 替换 38,500 等具体值）
- [ ] Reddit / Facebook "对邻居完全陌生" 数据点（真爬 30 篇相关帖子 + 量化估算 OR 换为公开 loneliness study 引用）
- [ ] 公开 1000-agent run 跑完后核对：14% / +302m / +450% Density / 24 New Ties / 6h-12h-24h decay 序列——所有 ⚠️ aspirational / mock 改为 ✓ real

### 中优先级（产品命名校核）

- [ ] 与源项目代码核对：`Atlas` / `Ledger` / `Policy Engine` / `PerceptionPipeline` 是否为实际模块名（如不是，要么改源项目命名，要么改文档命名）

### 低优先级（mock 但影响小）

- [ ] V.2.2 Agent 01/02 19:42 双日志：等真跑 PerceptionPipeline 输出后替换 narrative 编写
- [ ] II.1.1 1km² 范围简化（当前 atlas 实为 3.6×4.7km）：决定保留简化语 or 用真实尺寸
- [ ] atAGlance.agents 是否从 "1,000" 改为 "100 (smoke) → 1,000 (contest)"——影响 release 前的 narrative honesty

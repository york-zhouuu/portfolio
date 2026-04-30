# SSWT Case Study — Full Site Script v3 (Product / 5-Act)

> **状态**：草稿 v3 · 待作者评审。基于作者 v3 outline (产品导向版)。
>
> **本文档替代 v1**：v1 的"咖啡馆 reading framing" / "Mirror beat" / "outro 不可部署收束" / "Four Doctors 拟人化" 全部 dropped。

---

## 0. 设计 Stance

**Tool Builder / 系统架构师 / 极客产品发布。Apple keynote · GitHub README · Tech Showcase 不是 Op-Ed。**

| 反 v1 anti-patterns | v3 改为 |
|---|---|
| "Four Doctors / 四位医生" | Policy Engine + 三类 Hack（Digital Lure / Spatial Unlock / Perceptual Reshape）|
| "Emma & Linda" 命名角色 | Agent 01 / Agent 02 冷 ID |
| "失明 / 冷漠 / 孤独" 修辞 | "Density +450% · New Ties: 24" telemetry |
| "盲区被发现" 社论语气 | "系统级 Bug 被定位 → 需要测试台" 工具论 |
| "Mirror / 不可部署 outro" | 移除（v3 收在 Pipeline Output 闭环）|
| "咖啡馆 + free reading" 具体场景 | "隐秘酒馆数字诱饵" 产品化 hack 名 + 控制台命令 |
| "目标边界 = 注意力位移"（修辞）| "主边界 + 三层机制链"（algorithmic / spatial / perceptual input）|

**叙述 grammar**：每个 beat 内部 = 「**问题 → 系统响应 → 数据/视觉证据**」。不是"数据 → 方法 → 论点"（论文）。是 keynote demo（"我们要解决 X. 系统这样做. 看 telemetry."）。

---

## 1. 五幕架构

| Act | id | 产品类比 | 一句话 pitch |
|---|---|---|---|
| I | target | 痛点陈述 + 产品发布 | 系统级 Bug → 沙盘需求 → SSWT 入场 |
| II | architecture | 产品说明书 | Atlas / Ledger / Agents / Policy Engine 模块解剖 |
| III | runtime | 实机演示 | baseline → inject hack → 涌现渲染 |
| IV | analytics | 数据分析仪表盘 | 物理热度衰减 + Ledger 弱连接持久化 |
| V | pipeline | 数据导出 | 节点查询 → Rashomon 多视角日志 |

### Beat ID 重映射（v1 → v3）

| 旧 (v1) | 新 (v3) | Act | 说明 |
|---|---|---|---|
| open-real-world | systemic-bug | I.1 | 重命名 + 重写（更产品） |
| blindspot-reveal | sandbox-need | I.2 | 重命名 + 重 frame（呼唤工具，不是再钉数字） |
| instrument-summon | product-intro | I.3 | 重命名 + 重写（产品发布姿态） |
| map | atlas-ledger | II.1 | 合并 + 改名 |
| agent | agents | II.2 | 改名 |
| network | (合并到 IV.2 graph-export) | — | 涌现网络 = analytics 阶段，不是 architecture |
| intervention | policy-engine | II.3 | 改名 |
| contest-in-progress | (重塑为 III runtime + IV analytics) | — | 不再是单独 beat，是整个 Act III/IV 的灵魂 |
| mirror | (移除) | — | v3 不收在伦理；收在 capability |
| outro | (移除；改 footer 简短 disclaimer) | — | 主流不可见的微小 disclaimer 仍保留 |

**新增**（Act III/IV/V 全新）：

| 新 beat | Act | 说明 |
|---|---|---|
| baseline-runtime | III.1 | 默认参数下"降噪耳机走廊" |
| inject-hack | III.2 | 控制台命令注入 |
| emergence | III.3 | 红轨迹弯折 + HUD 涌现 |
| entropy-decay | IV.1 | 通勤重力 + 热度衰减 |
| graph-export | IV.2 | Ledger 弱连接持久化 |
| query-nodes | V.1 | 锁定 2 个节点 |
| rashomon-output | V.2 | 双视角日志 |

**总计 13 个 beat**（v1 是 10 个）。

### 视觉/材质轴

| Act | 主导 mode | 主导 overlay | 镜头位 |
|---|---|---|---|
| I | matte → 暗 → blueprint | agents_trajectories / digital_silos | 远 → god → mid → 抬升至产品发布 |
| II | blueprint dim 1.0 | per-module overlay (atlas grid / agent attribute / policy console) | mid orbit → close (单 agent 解剖) → mid |
| III | blueprint dim 0.7-1.0 | digital_lure_radius / desire_paths / runtime_telemetry_hud | god → push-in to lure target → telemetry |
| IV | blueprint dim 0.6 | entropy_curve / weak_ties_graph | god view hold（时间推进可视）|
| V | blueprint dim 0.4 sparse | node_focus_dim / perception_log_panel | 极近（2 nodes）→ 文本面板 |

### 情绪曲线（v3 keynote 版）

```
Act I:  问题压迫 → 产品入场
        (沉重) → (期待)
Act II: 模块拆解 → 架构之美
        (好奇) → (敬畏)
Act III: 跑起来 → 涌现高潮
        (专注) → (惊艳)
Act IV: 衰减验证 → 持久化沉淀
        (踏实) → (信任)
Act V: 节点锁定 → Rashomon 闭环
        (深入) → (闭合)
```

不是煽情曲线，是 keynote 的"逐步揭开能力"曲线。

---

## 2. 全站镜头接续表（zero-jump 约定）

| beat | scene | from | to | lookAt | 镜头意图 |
|---|---|---|---|---|---|
| I.1 | I.1.1 thesis | [0, 0.2, 12] | [0, 0.2, 12] | [0, 0.2, 0] | 远视屏息 |
| I.1 | I.1.2 paradox | [0, 0.2, 12] | [0, 8, 4] | [0, 0, 0] | 推入沙盘 + 数据 hit |
| I.1 | I.1.3 mechanism | [0, 8, 4] | [0, 8, 4] | [0, 0, 0] | hold（机制链 reveal） |
| I.2 | I.2.1 cant-test-real | [0, 8, 4] | [4, 15, 6] | [0, 0, 0] | 抬升 god view（看尺度问题） |
| I.2 | I.2.2 sandbox-required | [4, 15, 6] | [-4, 15, 6] | [0, 0, 0] | god 横移（呼唤工具） |
| I.3 | I.3.1 lift | [-4, 15, 6] | [0, 12, 8] | [0, 0, 0] | 抬到产品视角 |
| I.3 | I.3.2 dark | [0, 12, 8] | [0, 12, 8] | [0, 0, 0] | hold（世界变暗）|
| I.3 | I.3.3 reveal | [0, 12, 8] | [0, 12, 8] | [0, 0, 0] | hold（产品标题）|
| II.1 | II.1.1 atlas | [0, 12, 8] | [3, 10, 6] | [0, 0, 0] | 起 orbit |
| II.1 | II.1.2 ledger | [3, 10, 6] | [3, 10, 6] | [0, 0, 0] | hold（kvList + ledger pulse） |
| II.2 | II.2.1 nodes | [3, 10, 6] | [1, 3, 2] | [0, 0, 0] | push-in 到一个 agent |
| II.2 | II.2.2 attributes | [1, 3, 2] | [1, 3, 2] | [0, 0, 0] | hold（attribute panel） |
| II.2 | II.2.3 example | [1, 3, 2] | [-1, 3, 2] | [0, 0, 0] | 横移到第二 agent |
| II.3 | II.3.1 console | [-1, 3, 2] | [2, 8, 4] | [0, 0, 0] | 拉回到中尺，控制台视角 |
| II.3 | II.3.2 hacks | [2, 8, 4] | [2, 8, 4] | [0, 0, 0] | hold（三类 hack 列表）|
| II.3 | II.3.3 input-side | [2, 8, 4] | [2, 8, 4] | [0, 0, 0] | hold（pull-quote） |
| III.1 | III.1.1 engine-start | [2, 8, 4] | [0, 12, 6] | [0, 0, 0] | 抬升到 demo god view |
| III.1 | III.1.2 corridors | [0, 12, 6] | [0, 12, 6] | [0, 0, 0] | hold（看 baseline 平行轨迹）|
| III.2 | III.2.1 console-cmd | [0, 12, 6] | [0, 12, 6] | [0, 0, 0] | hold（命令注入面板）|
| III.2 | III.2.2 propagation | [0, 12, 6] | [0, 8, 4] | [0, 0, 0] | push-in 到 hack target |
| III.3 | III.3.1 desire-paths | [0, 8, 4] | [-2, 8, 4] | [0, 0, 0] | tracking 看轨迹弯折 |
| III.3 | III.3.2 telemetry | [-2, 8, 4] | [-2, 8, 4] | [0, 0, 0] | hold + HUD |
| III.3 | III.3.3 max-flow | [-2, 8, 4] | [-2, 8, 4] | [0, 0, 0] | hold（pull-quote）|
| IV.1 | IV.1.1 keep-running | [-2, 8, 4] | [0, 15, 6] | [0, 0, 0] | 抬到 god view（时间推进）|
| IV.1 | IV.1.2 commute-gravity | [0, 15, 6] | [0, 15, 6] | [0, 0, 0] | hold（热度衰减）|
| IV.1 | IV.1.3 surface-zero | [0, 15, 6] | [0, 15, 6] | [0, 0, 0] | hold（pull-quote）|
| IV.2 | IV.2.1 ledger-open | [0, 15, 6] | [0, 12, 6] | [0, 0, 0] | 缓降 |
| IV.2 | IV.2.2 weak-ties-stay | [0, 12, 6] | [0, 12, 6] | [0, 0, 0] | hold（graph reveal）|
| IV.2 | IV.2.3 lesson | [0, 12, 6] | [0, 12, 6] | [0, 0, 0] | hold（pull-quote）|
| V.1 | V.1.1 zoom-in | [0, 12, 6] | [0.5, 1.5, 1.5] | [0.3, 0, 0.5] | 极近，锁定 Node A |
| V.1 | V.1.2 select | [0.5, 1.5, 1.5] | [0.5, 1.5, 1.5] | [0.3, 0, 0.5] | hold（Node 元数据）|
| V.2 | V.2.1 perception-pipeline | [0.5, 1.5, 1.5] | [0.5, 1.5, 1.5] | [0.3, 0, 0.5] | hold（管线启动）|
| V.2 | V.2.2 dual-log | [0.5, 1.5, 1.5] | [0.5, 1.5, 1.5] | [0.3, 0, 0.5] | hold（双 log 列出）|

**约定**：每 beat 首 scene `from` MUST 等于上 beat 末 scene `to`。Act I.1 起点 [0, 0.2, 12] 与 v1 一致。

---

## 3. 全站 mapState 接续表

| scene | mode | dim | overlay | 备注 |
|---|---|---|---|---|
| I.1.1 | matte | 0.8 | none | 黑屏障 |
| I.1.2 | matte | 0.8 | agents_trajectories | 第一次看 agents |
| I.1.3 | matte | 0.5 | agents_trajectories | 三层机制 reveal |
| I.2.1 | blueprint | 0.5 | none | 切 X-ray，问题尺度 |
| I.2.2 | blueprint | 0.5 | digital_silos_heatmap | 召唤工具的视觉 cue |
| I.3.1 | matte | 0.7 | none | 抬升过渡 |
| I.3.2 | matte | 0.3 | none | 世界变暗 |
| I.3.3 | blueprint | 1.0 | none | 仪器全亮 + 标题 |
| II.1.1 | blueprint | 1.0 | atlas_floor_grid ⚠️ TBD | Lane Cove digital twin |
| II.1.2 | blueprint | 1.0 | ledger_pulse ⚠️ TBD or DOM | 时空 DB 写入脉冲 |
| II.2.1 | blueprint | 1.0 | agents_trajectories | 1000 个 |
| II.2.2 | blueprint | 1.0 | agent_attribute_panel ⚠️ TBD-DOM | 单 agent 的 attribute 浮窗 |
| II.2.3 | blueprint | 1.0 | agent_rashomon_preview ⚠️ TBD | 暗示 V.2 的双 perception |
| II.3.1 | blueprint | 0.8 | policy_console ⚠️ TBD-DOM | 控制台 UI |
| II.3.2 | blueprint | 0.8 | policy_console ⚠️ TBD-DOM | 三类 hack 列表 |
| II.3.3 | blueprint | 0.8 | none | pull-quote |
| III.1.1 | blueprint | 1.0 | agents_trajectories | engine 启动 |
| III.1.2 | blueprint | 0.7 | agents_trajectories | "降噪耳机走廊" |
| III.2.1 | blueprint | 0.7 | policy_console ⚠️ TBD | 命令窗口 |
| III.2.2 | blueprint | 0.7 | digital_lure_radius ⚠️ TBD | 300m geo-fence 圆波 |
| III.3.1 | blueprint | 0.7 | desire_paths_heatmap ⚠️ TBD | 红轨迹弯折 |
| III.3.2 | blueprint | 0.8 | runtime_telemetry_hud ⚠️ TBD-DOM | "Density +450%" / "New Ties 24" |
| III.3.3 | blueprint | 0.8 | desire_paths_heatmap ⚠️ TBD | pull-quote 上 |
| IV.1.1 | blueprint | 0.6 | desire_paths_heatmap (fading) | 热度开始衰减 |
| IV.1.2 | blueprint | 0.6 | entropy_curve ⚠️ TBD-DOM | 时间序列曲线 |
| IV.1.3 | blueprint | 0.6 | none | pull-quote |
| IV.2.1 | blueprint | 0.6 | ledger_open ⚠️ TBD-DOM | 后台 ledger panel |
| IV.2.2 | blueprint | 0.6 | weak_ties_graph ⚠️ TBD | 持久化弱连接图 |
| IV.2.3 | blueprint | 0.6 | weak_ties_graph ⚠️ TBD | pull-quote 上 |
| V.1.1 | blueprint | 0.4 | node_focus_dim ⚠️ TBD | 大部分 agent 暗，2 个亮 |
| V.1.2 | blueprint | 0.4 | node_focus_dim + node_metadata ⚠️ TBD-DOM | 元数据 panel |
| V.2.1 | blueprint | 0.4 | perception_log_panel ⚠️ TBD-DOM | 单 log 出 |
| V.2.2 | blueprint | 0.4 | perception_log_panel (twin) ⚠️ TBD-DOM | 双 log 并列 |

**TBD overlay capability 列表**（每个一个独立 propose）：

R3F 3D 类（6 个）：
1. `atlas_floor_grid` — Lane Cove 数字孪生网格
2. `digital_lure_radius` — 300m 圆波 + boundary
3. `desire_paths_heatmap` — 弯折轨迹高亮
4. `weak_ties_graph` — agent 之间的边
5. `node_focus_dim` — 按 ID 控制 agent 渲染状态
6. `agent_rashomon_preview` — 两 agent 各自 perception 范围（先 stub，V.2 才完整用）

DOM-only 类（5 个，技术上只是 React 组件）：
1. `policy_console` — 控制台 UI（命令输入 + hack 列表）
2. `agent_attribute_panel` — 单 agent 浮窗
3. `runtime_telemetry_hud` — Density / New Ties 实时数字
4. `entropy_curve` — 时间序列曲线 SVG
5. `perception_log_panel` — 单/双视角文本面板

---

## 4. Beat-by-Beat 文案 v3

---

### Act I — Target （确立推演靶标）

**Pitch**：高密度城市存在系统级 Bug——「附近的消失」。不是空间问题，是注意力位移造成的 cognitive boundary。要修，需要测试台。SSWT 入场。

**Scope**：3 beat × 2-3 scene = 8 scene。

#### Beat I.1 — systemic-bug（系统级故障）

**职责**：开场直击。一句 thesis + 一组数据并置 + 一段机制链。30 秒抓住读者。

| scene | kind | rhythm | emphasis | 一句话 |
|---|---|---|---|---|
| I.1.1 thesis | title | still | dwell | 系统级 Bug 命名 |
| I.1.2 paradox | data-hit | tracking | dwell | ABS vs Reddit 数字并置 |
| I.1.3 mechanism | body-section | still | standard | 主边界 + 三层机制链 |

##### I.1.1 thesis (title)

```yaml
text:
  zh: |
    高密度城市，
    存在一个系统级 Bug。
  en: |
    Dense cities run with
    a system-level bug.
```

##### I.1.2 paradox (data-hit)

```yaml
number: "38k / 36%"
caption:
  zh: Lane Cove 居民数 (ABS 2021) ‖ Reddit 切片中报告"对邻居完全陌生"的比例
  en: Lane Cove residents (ABS 2021) ‖ Reddit slice reporting "complete stranger to neighbors"
paragraphs:
  - zh: 物理拓扑学峰值，社会拓扑学归零。
    en: Peak physical topology, zero social topology.
```

> ⚠️ ABS 38k 待 final verify (LGA Lane Cove Council 2021 census ~38,500)；Reddit 36% 是 narrative placeholder，需作者实爬或换公开 study 数字。

##### I.1.3 mechanism (body-section, right-column)

```yaml
heading:
  zh: 主边界 + 三层机制链
  en: Primary boundary, three-layer mechanism
paragraphs:
  - zh: 主边界 = 注意力位移造成的「附近性盲区」——不是看不到，是不被看到。
    en: Primary boundary — attention-displacement creates a proximity blindspot.
  - zh: 第一层 algorithmic input — 算法决定我们看见什么。
    en: Layer 1 algorithmic input — algorithms decide what we see.
  - zh: 第二层 spatial input — 空间决定我们脚下走到哪。
    en: Layer 2 spatial input — space decides where feet go.
  - zh: 第三层 perceptual input — 知觉决定我们记住什么。
    en: Layer 3 perceptual input — perception decides what is remembered.
  - zh: 三层联合制造了"高密度孤独"。
    en: Three layers jointly produce "dense loneliness."
```

**桥到 I.2**：三层都是 input。如果是 input，那就可以被改写——但不能在真街道上改。

#### Beat I.2 — sandbox-need（呼唤沙盘）

**职责**：从问题陈述过渡到工具需求。论证"为什么必须有 SSWT"。

| scene | kind | rhythm | emphasis | 一句话 |
|---|---|---|---|---|
| I.2.1 cant-test-real | lead | tracking | standard | 真街道试错成本极高 |
| I.2.2 sandbox-required | pull-quote | bridge | dwell | 需要 computational social science testbed |

##### I.2.1 cant-test-real (lead)

```yaml
text:
  zh: |
    既然 input 是算法 / 空间 / 感知层面的——
    用真街道做 A/B 试错代价极大，
    且变量不可控。
  en: |
    Since the input is algorithmic / spatial / perceptual —
    A/B testing on real streets is prohibitively expensive,
    and variables can't be isolated.
```

##### I.2.2 sandbox-required (pull-quote)

```yaml
text:
  zh: |
    我们需要一个虚拟的
    computational social science testbed。
  en: |
    We need a virtual
    computational social science testbed.
subtitle:
  zh: 一台可以反复 pull · measure · replay 的仪器
  en: an instrument to pull, measure, replay — repeatedly
```

**桥到 I.3**：testbed 不是抽象需求——它已经被造出来了。镜头抬升。

#### Beat I.3 — product-intro（系统亮相）

**职责**：产品发布姿态。Apple keynote / GitHub README 入场感。SSWT 是绝对主角。

| scene | kind | rhythm | emphasis | 一句话 |
|---|---|---|---|---|
| I.3.1 lift | lead | bridge | standard | 镜头抬升到产品视角 |
| I.3.2 dark | lead | bridge | linger | 世界变暗 |
| I.3.3 reveal | title | still | linger | "Synthetic Socio Wind Tunnel" |

##### I.3.1 lift (lead)

```yaml
text:
  zh: |
    我们造了一台。
    专为测试反向算法干预而生。
  en: |
    We built one.
    For testing reverse algorithmic intervention.
```

##### I.3.2 dark (lead)

```yaml
text:
  zh: |
    关灯——
    把 Lane Cove 1km² 全部铺一遍——
    再把它点亮。
  en: |
    Lights down —
    lay out 1km² of Lane Cove —
    bring it up as a lab.
```

##### I.3.3 reveal (title, letterbox)

```yaml
text:
  zh: Synthetic Socio Wind Tunnel
  en: Synthetic Socio Wind Tunnel
subtitle:
  zh: 多智能体推演引擎 · 反向算法干预测试台
  en: Multi-agent simulation engine · reverse-algorithm intervention testbed
```

**桥到 II.1**：Apple keynote 套路——"Now, let's open it up." 镜头开始 orbit。

---

### Act II — Architecture （系统架构解剖）

**Pitch**：把 SSWT 像 Apple 发布会 / GitHub 首页一样，模块化拆解：Atlas（空间底座）/ Ledger（行为账本）/ LLM Agents（智能体节点）/ Policy Engine（干预注入引擎）。

**Scope**：3 beat × 2-3 scene = 8 scene。

**镜头总策略**：blueprint 全亮，相机 orbit 一圈，每个模块对应一个 vantage。

#### Beat II.1 — atlas-ledger（空间底座 + 行为账本）

**职责**：地基。两个模块——Atlas（地理）+ Ledger（时空 DB）。

| scene | kind | rhythm | emphasis | 一句话 |
|---|---|---|---|---|
| II.1.1 atlas | lead | tracking | standard | Lane Cove 1km² digital twin |
| II.1.2 ledger | body-section + kvList | still | standard | 高频时空 DB |

##### II.1.1 atlas (lead)

```yaml
text:
  zh: |
    Atlas — 空间底座。
    Lane Cove 1km² 真坐标，
    OSM streets + Overture buildings 实数据。
  en: |
    Atlas — the spatial substrate.
    1 km² of Lane Cove on real coordinates,
    real data: OSM streets + Overture buildings.
```
overlay：⚠️ TBD `atlas_floor_grid`（地形网格 / 边界 / 分区）

##### II.1.2 ledger (body-section, kvList)

```yaml
heading:
  zh: Ledger — 行为账本
  en: Ledger — the behavioral ledger
kvList:
  - { key: 性质, value: 时空数据库 (spatiotemporal DB) }
  - { key: 写入频率, value: 288 tick/天 × 1000 节点 }
  - { key: 记录, value: 位置 / 拓扑关系 / interaction events }
  - { key: 用途, value: 复盘 / 涌现网络导出 / Rashomon 输入 }
  - { key: 数据规模, value: ~4M rows / 14d run ⚠️ approx }
```
en kvList: { Type / Write rate / Records / Use / Scale }

**桥到 II.2**：Atlas 是"哪里"，Ledger 是"什么时候做了什么"——但还需要"谁在做"。

#### Beat II.2 — agents（智能体节点）

**职责**：解剖单个 agent。不是粒子，是节点。

| scene | kind | rhythm | emphasis | 一句话 |
|---|---|---|---|---|
| II.2.1 nodes | data-hit | tracking | dwell | 1000 节点 |
| II.2.2 attributes | body-section | still | standard | 属性栈 |
| II.2.3 example | pull-quote | bridge | dwell | 罗生门 preview |

##### II.2.1 nodes (data-hit)

```yaml
number: "1,000"
caption:
  zh: LLM 驱动的 agent 节点 ⚠️ smoke 100 → 公开赛目标 1000
  en: LLM-driven agent nodes ⚠️ 100 in smoke → 1,000 in publishable run
paragraphs:
  - zh: 不是 NPC——每节点有 attribute / memory / daily plan / LLM-driven decision。
    en: Not NPCs — each has attributes, memory, daily plan, LLM decisions.
```

##### II.2.2 attributes (body-section, right-column)

```yaml
heading:
  zh: 一个 Agent Node 的内部
  en: Inside one agent node
paragraphs:
  - zh: 通勤惯性——home / work 锚点 + scripted 路径，构成 baseline 引力。
    en: Commute inertia — home/work anchors + scripted paths form baseline gravity.
  - zh: 兴趣标签——"村上春树" / "攀岩" / "filter-coffee"，决定对 feed item 的响应。
    en: Interest tags — "Murakami" / "climbing" / "filter coffee", driving feed response.
  - zh: 社交阈值——多近 / 多熟 / 多频率，触发交互的边界。
    en: Social thresholds — proximity, familiarity, frequency that trigger interaction.
  - zh: 三层模型预算——Sonnet ×10 + mid ×200 + Haiku ×790，单跑 ~$4。
    en: 3-tier model budget — Sonnet ×10, mid ×200, Haiku ×790, ~$4 per run.
```
overlay：⚠️ TBD-DOM `agent_attribute_panel`（浮窗显示 attribute）

##### II.2.3 example (pull-quote)

```yaml
text:
  zh: |
    同一座沙盘——
    每个节点感知到的世界都不同。
  en: |
    Same sand table —
    a different perceived city per node.
subtitle:
  zh: Rashomon perception — 在 Act V 闭环
  en: Rashomon perception — closes the loop in Act V
```

**桥到 II.3**：节点都是被动的。系统的"主动"在哪里——Policy Engine。

#### Beat II.3 — policy-engine（干预注入引擎）

**职责**：控制台。三类 hack。强调"algorithmic input 侧的微调"，不是"推倒"。

| scene | kind | rhythm | emphasis | 一句话 |
|---|---|---|---|---|
| II.3.1 console | lead | tracking | standard | 控制台 setup |
| II.3.2 hacks | body-section + kvList | still | standard | 三类 Policy Hack |
| II.3.3 input-side | pull-quote | bridge | dwell | 注入 input，不动建筑 |

##### II.3.1 console (lead)

```yaml
text:
  zh: |
    Atlas + Ledger + Agents 就位。
    打开控制台 — Policy Engine。
    精密变量控制台。
  en: |
    Atlas + Ledger + Agents are in place.
    Open the console — Policy Engine.
    Surgical variable control.
```
overlay：⚠️ TBD-DOM `policy_console`（命令输入框 UI）

##### II.3.2 hacks (body-section, kvList)

```yaml
heading:
  zh: 三类 Policy Hack
  en: Three classes of policy hack
kvList:
  - { key: Digital Lure, value: 300m 地理围栏广播 (针对 algorithmic input) }
  - { key: Spatial Unlock, value: 局部进入权限微调 (针对 spatial input) }
  - { key: Perceptual Reshape, value: 知觉显著性重写 (针对 perceptual input) }
```
en kvList: { Digital Lure / Spatial Unlock / Perceptual Reshape — same value text in en }
overlay：同上 policy_console

##### II.3.3 input-side (pull-quote)

```yaml
text:
  zh: |
    我们不推倒大楼。
    我们调整 input 层的几个参数。
  en: |
    We don't tear down buildings.
    We adjust a few parameters at the input layer.
```

**桥到 III.1**：理论结束。开始跑。

---

### Act III — Runtime （推演运行 / 实机演示）

**Pitch**：Live demo。三步：baseline 跑 → 命令注入 → 涌现渲染（视觉高潮）。

**Scope**：3 beat × 2-3 scene = 8 scene。

**镜头总策略**：god view 看全局 → push-in 到 hack 目标 → tracking 看路径。

#### Beat III.1 — baseline-runtime（基线运行）

**职责**：跑空白对照。"降噪耳机走廊"——平行直线，冷漠。

| scene | kind | rhythm | emphasis | 一句话 |
|---|---|---|---|---|
| III.1.1 engine-start | lead | tracking | standard | 引擎启动 |
| III.1.2 corridors | body-section | still | standard | 平行轨迹的空旷 |

##### III.1.1 engine-start (lead)

```yaml
text:
  zh: |
    `run --variant baseline --duration 14d --seeds 30`
    引擎启动。
    1000 节点开始活动。
  en: |
    `run --variant baseline --duration 14d --seeds 30`
    Engine starts.
    1,000 nodes begin to move.
```
overlay：agents_trajectories 全数显示

##### III.1.2 corridors (body-section)

```yaml
heading:
  zh: 降噪耳机走廊
  en: Noise-cancellation corridors
paragraphs:
  - zh: 看到了什么——平行轨迹，互不相交。
    en: What you see — parallel paths, never crossing.
  - zh: 通勤引力主导：home → work → home，路径几乎复制粘贴。
    en: Commute gravity dominates — home/work/home, copy-pasted paths.
  - zh: 共在的 14% — 只有少数偶然在同一时段同一节点出现。
    en: Co-presence at 14% — few overlap by chance.
  - zh: 这是默认参数下，城市的"声学减噪"形态。
    en: This is the city's "acoustic-damped" form by default.
```

**桥到 III.2**：默认有问题。打开控制台。

#### Beat III.2 — inject-hack（变量注入）

**职责**：在控制台输入命令。Digital Lure 例。

| scene | kind | rhythm | emphasis | 一句话 |
|---|---|---|---|---|
| III.2.1 console-cmd | data-hit | still | dwell | 命令输入面板 |
| III.2.2 propagation | body-section | still | standard | 圆波扩散 + agent 响应 |

##### III.2.1 console-cmd (data-hit, console UI)

```yaml
number: "$ deploy"
caption:
  zh: policy_engine.deploy(hack=DigitalLure, anchor=A12, radius=300m, payload="hidden bar")
  en: policy_engine.deploy(hack=DigitalLure, anchor=A12, radius=300m, payload="hidden bar")
paragraphs:
  - zh: 一行命令，注入一条 feed item 到 300m 半径内的所有 agent attention。
    en: One command — inject one feed item into all agent attention within 300m.
```
overlay：⚠️ TBD-DOM `policy_console`（实际显示 fake terminal）

##### III.2.2 propagation (body-section)

```yaml
heading:
  zh: 圆波传播
  en: Wave propagation
paragraphs:
  - zh: 锚点 A12 释放——300m geo-fence 触发。
    en: Anchor A12 releases — 300m geo-fence triggers.
  - zh: 圆内 agent 收到 feed item，触发 attention 响应。
    en: Inside the radius, agents receive the feed and trigger attention.
  - zh: 响应阈值 = personality × interest tag × 当前 plan 余裕。
    en: Threshold = personality × interest tag × plan slack.
  - zh: 响应的 agent 重新规划当前 plan——"绕一段路看看"。
    en: Responding agents replan — "detour to check it out."
```
overlay：⚠️ TBD `digital_lure_radius`（300m 圆波 + boundary）

**桥到 III.3**：响应不是噪声。响应是——可视的轨迹偏转。

#### Beat III.3 — emergence（涌现渲染 / 视觉高潮）

**职责**：作品的 visual peak。红色轨迹弯折，集合到死胡同。HUD 实时数字。

| scene | kind | rhythm | emphasis | 一句话 |
|---|---|---|---|---|
| III.3.1 desire-paths | data-hit | tracking | dwell | 轨迹弯折 (visual hit) |
| III.3.2 telemetry | data-hit | still | dwell | HUD: Density / New Ties |
| III.3.3 max-flow | pull-quote | bridge | dwell | 最小阻力路径 |

##### III.3.1 desire-paths (data-hit)

```yaml
number: "Δ +302m"
caption:
  zh: 受 Lure 影响的 agent 平均路径偏转 ✓ real (smoke demo)
  en: avg trajectory delta among Lure-affected agents ✓ real (smoke demo)
paragraphs:
  - zh: 红色轨迹弯折——像受到磁场干扰，集体偏向锚点。
    en: Red paths bend — as if magnetized, gathering toward the anchor.
  - zh: 在原本的"死角"（dead-end alleys）形成 desire paths。
    en: Forming desire paths in former dead-ends.
```
overlay：⚠️ TBD `desire_paths_heatmap`（弯折轨迹高亮）

##### III.3.2 telemetry (data-hit, HUD)

```yaml
number: "+450% / 24"
caption:
  zh: Density (锚点附近 5min 内 co-presence) / New Ties (新弱连接计数)
  en: Density (5-min co-presence near anchor) / New Ties (new weak-tie count)
paragraphs:
  - zh: ⚠️ 数字为 aspirational HUD（公开赛 1000-agent 实测后 final）
    en: ⚠️ Aspirational HUD telemetry — finalized after publishable 1000-agent run.
```
overlay：⚠️ TBD-DOM `runtime_telemetry_hud`

##### III.3.3 max-flow (pull-quote)

```yaml
text:
  zh: |
    系统找到了
    打破冷漠的
    最小阻力路径。
  en: |
    The system found
    the minimum-resistance path
    out of indifference.
```

**桥到 IV.1**：但高潮不是结束。继续看时间。

---

### Act IV — Analytics （推演分析 / 衰减与沉淀）

**Pitch**：分析 dashboard。两个发现：物理热度衰减（半衰期），但 Ledger 中的弱连接持久化。

**Scope**：2 beat × 3 scene = 6 scene。

#### Beat IV.1 — entropy-decay（追踪半衰期）

**职责**：科学诚实。杠杆有半衰期。

| scene | kind | rhythm | emphasis | 一句话 |
|---|---|---|---|---|
| IV.1.1 keep-running | lead | tracking | standard | 时间继续走 |
| IV.1.2 commute-gravity | body-section | still | standard | 通勤重力捕获 |
| IV.1.3 surface-zero | pull-quote | bridge | dwell | 表面归零 |

##### IV.1.1 keep-running (lead)

```yaml
text:
  zh: |
    Lure 释放结束——
    引擎不停。
    我们继续观察。
  en: |
    Lure ends —
    engine keeps running.
    We keep watching.
```

##### IV.1.2 commute-gravity (body-section)

```yaml
heading:
  zh: 通勤重力重新捕获
  en: Commute gravity recaptures
paragraphs:
  - zh: 6 小时内，受影响的 agent 大部分回到 baseline plan。
    en: Within 6 hours, most affected agents return to baseline plan.
  - zh: 12 小时内，desire path 热度衰减 80%。
    en: Within 12 hours, desire-path heat decays 80%.
  - zh: 24 小时内，物理表面恢复"降噪耳机走廊"形态。
    en: Within 24 hours, the surface returns to noise-cancellation form.
  - zh: 杠杆有半衰期——这不是 bug，是现实。
    en: The lever has a half-life — not a bug, just reality.
```
overlay：⚠️ TBD-DOM `entropy_curve`（24h 时间序列曲线）

> ⚠️ 6h / 80% / 24h 数字为 narrative placeholder——publishable run 后 final（rival_hypothesis_suite 时间序列分析）

##### IV.1.3 surface-zero (pull-quote)

```yaml
text:
  zh: |
    表面，
    归零。
  en: |
    On the surface —
    back to zero.
subtitle:
  zh: 但表面不是全部
  en: But the surface isn't the whole story
```

**桥到 IV.2**：表面不是全部。打开 Ledger。

#### Beat IV.2 — graph-export（关系图谱导出）

**职责**：揭示 Ledger 后台。物理归零，社会图谱已被改写。

| scene | kind | rhythm | emphasis | 一句话 |
|---|---|---|---|---|
| IV.2.1 ledger-open | lead | tracking | standard | 打开后台 |
| IV.2.2 weak-ties-stay | data-hit | still | dwell | 24 weak ties 持续存在 |
| IV.2.3 lesson | pull-quote | bridge | dwell | 物理归零，图谱已改写 |

##### IV.2.1 ledger-open (lead)

```yaml
text:
  zh: |
    打开 Ledger ——
    时空数据库的 query interface。
    SELECT * FROM ties WHERE created_after = '2026-04-15'
  en: |
    Open the Ledger —
    spatiotemporal DB query interface.
    SELECT * FROM ties WHERE created_after = '2026-04-15'
```
overlay：⚠️ TBD-DOM `ledger_open`（fake DB query terminal）

##### IV.2.2 weak-ties-stay (data-hit)

```yaml
number: "24 / 24"
caption:
  zh: Lure 期间产生的 24 条新弱连接 ‖ 7 天后仍激活的 24 条 ⚠️ aspirational
  en: 24 new weak ties from Lure ‖ 24 still active 7d later ⚠️ aspirational
paragraphs:
  - zh: 一次 Lure 创造的连接，在物理热度归零后，依然在 Ledger 中存在。
    en: Ties created by one Lure persist in the Ledger after physical heat dies.
  - zh: 这是干预的真正 ROI——不是当下偏转，是结构性写入。
    en: This is the true ROI — not present-moment deflection, but structural rewrite.
```
overlay：⚠️ TBD `weak_ties_graph`（弱连接图谱可视化）

##### IV.2.3 lesson (pull-quote)

```yaml
text:
  zh: |
    物理空间归零，
    社会图谱已被改写。
  en: |
    Physical space resets.
    The social graph remembers.
```

**桥到 V.1**：图谱是宏观的。能不能放大到节点？

---

### Act V — Pipeline （感知管线 / 日志输出）

**Pitch**：从宏观降维到 2 个具体节点。PerceptionPipeline 把冷数据反编译为 Rashomon 多视角日志。系统闭环：物理干预 → 轨迹 → 心理学定性。

**Scope**：2 beat × 2 scene = 4 scene。

#### Beat V.1 — query-nodes（查询交互节点）

**职责**：从 god view 极速降维到 2 个 specific node。

| scene | kind | rhythm | emphasis | 一句话 |
|---|---|---|---|---|
| V.1.1 zoom-in | lead | tracking | standard | 极近降维 |
| V.1.2 select | body-section + kvList | still | standard | 节点元数据 |

##### V.1.1 zoom-in (lead)

```yaml
text:
  zh: |
    选两个节点——
    Lure 期间在锚点 A12 偶遇过的 Agent 01 / Agent 02。
    点击 export。
  en: |
    Pick two nodes —
    Agent 01 / Agent 02, who crossed at anchor A12 during the Lure.
    Click export.
```
overlay：⚠️ TBD `node_focus_dim`（其余 agent 暗化，2 个高亮）

##### V.1.2 select (body-section, kvList - twin columns)

```yaml
heading:
  zh: 节点元数据
  en: Node metadata
twinColumns:
  left:
    heading: { zh: Agent 01, en: Agent 01 }
    items:
      - { key: 兴趣, value: "村上春树 · filter-coffee" }
      - { key: 通勤, value: home → CBD → home }
      - { key: 当日 plan, value: 'work → home (默认)' }
  right:
    heading: { zh: Agent 02, en: Agent 02 }
    items:
      - { key: 兴趣, value: "live music · craft beer" }
      - { key: 通勤, value: home → Chatswood → home }
      - { key: 当日 plan, value: 'work → home (默认)' }
```
overlay：node_focus_dim + ⚠️ TBD-DOM `node_metadata` (DOM kvList 即可)

**桥到 V.2**：元数据是冷的。接下来——管线把冷数据转译。

#### Beat V.2 — rashomon-output（罗生门定性输出）

**职责**：作品最后一击。同一事件，两个独立日志。系统闭环。

| scene | kind | rhythm | emphasis | 一句话 |
|---|---|---|---|---|
| V.2.1 perception-pipeline | lead | still | standard | 管线启动 |
| V.2.2 dual-log | body-section twinColumns | still | linger | 双视角日志 |

##### V.2.1 perception-pipeline (lead)

```yaml
text:
  zh: |
    PerceptionPipeline 启动——
    输入：Ledger 里 A12 锚点 19:42 的两条记录。
    输出：两份独立的微观日志。
  en: |
    PerceptionPipeline starts —
    input: two records at anchor A12, 19:42, from the Ledger.
    output: two independent micro-logs.
```

##### V.2.2 dual-log (body-section, twinColumns)

```yaml
heading:
  zh: 同一场偶遇，两份独立日志
  en: One encounter, two independent logs
twinColumns:
  left:
    heading: { zh: Agent 01 · 19:42, en: Agent 01 · 19:42 }
    items:
      - { key: |, value: "走过转角，闻到咖啡。本来想直接回家。" }
      - { key: |, value: "招牌很小。门口三个人，看起来熟络。" }
      - { key: |, value: "走过去了。明天可能会再来。" }
  right:
    heading: { zh: Agent 02 · 19:42, en: Agent 02 · 19:42 }
    items:
      - { key: |, value: "Found the place. Smaller than the photo." }
      - { key: |, value: "Counter occupied — someone in a Murakami tote stopped at the door." }
      - { key: |, value: "Stayed for one. Walked home through the alley." }
```
overlay：⚠️ TBD-DOM `perception_log_panel`（双 column 文本面板）

> 闭环：Act III 的 +302m / +450% / 24 ties 是宏观涌现 → Act IV 的衰减 / 持久化是中观 → Act V 这两份独立日志是微观。一个 lever，三个尺度都被仪器化。

**收束**：系统闭环。屏幕停留几秒，pageEnd hook → footer 简短 disclaimer (research apparatus, not deployable).

---

## 5. 风险 / 待补 / 开放问题

### 数据 mock 状态（v3）

| 数字 / 命名值 | 出现位置 | 状态 | 备注 |
|---|---|---|---|
| 38k Lane Cove 居民 | I.1.2 | ⚠️ verify | LGA Council 2021 census；待精确校核 |
| 36% Reddit "邻居陌生" | I.1.2 | ⚠️ mock | 待真爬或换公开 study |
| 主边界 + 三层机制链 | I.1.3 | ✓ real (设计) | algorithmic / spatial / perceptual input |
| Atlas 1km² | II.1.1 | ✓ real | OSM + Overture |
| Ledger 4M rows / 14d | II.1.2 | ⚠️ approx | 估算 |
| 1000 agents | II.2.1 | ⚠️ aspirational | smoke 100 → 公开赛 1000 |
| 三类 Hack | II.3.2 | ✓ real (设计) | Digital Lure / Spatial Unlock / Perceptual Reshape |
| 300m geo-fence | II.3.2 / III.2 | ⚠️ design | 之前 v1 用 500m，v3 改 300m（作者拍板）|
| 共在 14% | III.1.2 | ✓ real | smoke demo control |
| Δ +302m | III.3.1 | ✓ real | smoke demo |
| Density +450% | III.3.2 | ⚠️ aspirational | publishable HUD telemetry |
| New Ties: 24 | III.3.2 / IV.2.2 | ⚠️ aspirational | publishable run 后 final |
| 6h / 80% / 24h decay | IV.1.2 | ⚠️ mock | 待 rival_hypothesis_suite 真测 |
| Agent 01/02 双日志 | V.2.2 | ⚠️ mock | 待真跑 PerceptionPipeline |

### 需新增 capability

R3F 3D overlay（6 个，每个独立 propose）：
1. `atlas_floor_grid`
2. `digital_lure_radius`
3. `desire_paths_heatmap`
4. `weak_ties_graph`
5. `node_focus_dim`
6. `agent_rashomon_preview`（preview-only stub，V.2 完整使用）

DOM-only HUD/UI 组件（5 个，纯 React，不 R3F）：
1. `policy_console`
2. `agent_attribute_panel`
3. `runtime_telemetry_hud`
4. `entropy_curve`
5. `perception_log_panel`

### 开放问题（需作者拍板）

1. **Q1 — ABS 38k / Reddit 36% 数字源** — ABS 数字精确化（去 Council 网页查）+ Reddit 数据是否真爬（合规 + 时间）
2. **Q2 — Decay 数据** — 6h/80%/24h 是 placeholder，是否要等 rival_hypothesis_suite 跑完 publishable 再 ship？还是允许标 ⚠️ 上线
3. **Q3 — 第 V 幕双日志** — Agent 01/02 的 19:42 日志是 narrative 编写还是真跑 PerceptionPipeline 输出？影响 voice 一致性
4. **Q4 — Outro/disclaimer** — v3 收在 V.2.2 闭环。是否需要 footer 一行 "exploratory research, not deployable"？还是完全不显示？
5. **Q5 — 新 capability 优先级** — 11 个 (6 R3F + 5 DOM)。哪些 must（不能降级）？哪些 nice-to-have（可用 DOM 替代）？影响 release timeline
6. **Q6 — Beat ID 重命名** — 现有 mdx grandfather beats 的 ID（open-real-world / blindspot-reveal / instrument-summon / map / agent / network / intervention / contest-in-progress / mirror / outro）将全部重写。是否接受 ID 重命名？还是保留 ID + 替换 scenes？(影响 URL fragment / score reference)
7. **Q7 — atAGlance 数据** — `agents: "1,000"` 是否改为 `agents: "100 (smoke) → 1,000 (contest)"`？
8. **Q8 — 整体 voice/tone 把控** — v3 zh 是简体技术中文；en 是 dev-facing 英文。是否合适？

### 实施 roadmap（v3 alignment 通过后）

```
Step 1: mdx-skeleton-v3       — top-level acts[] / beats[] 重组（10→13 beat），claim 改写，无 scenes
Step 2: act-1-script-impl     — Act I 三 beat 落 8 scene + provenance 同步
Step 3: act-2-capabilities    — atlas_floor_grid + policy_console + agent_attribute_panel capability propose
Step 4: act-2-script-impl     — Act II 三 beat 落 8 scene
Step 5: act-3-capabilities    — digital_lure_radius + desire_paths_heatmap + runtime_telemetry_hud
Step 6: act-3-script-impl     — Act III 三 beat 落 8 scene（视觉高潮）
Step 7: act-4-capabilities    — entropy_curve + weak_ties_graph
Step 8: act-4-script-impl     — Act IV 两 beat 落 6 scene
Step 9: act-5-capabilities    — node_focus_dim + perception_log_panel
Step 10: act-5-script-impl    — Act V 两 beat 落 4 scene
Step 11: provenance-final-pass — release 前过一遍所有数字
Step 12: end-to-end QA        — 全站滚动一次，校接续 / 性能 / 文案
```

每 step 一个独立 propose，输入是本 script 对应章节，不再二次发明叙事。

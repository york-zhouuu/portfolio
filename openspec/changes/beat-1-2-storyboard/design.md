## Context

### 输入

- `proposal.md` — 本 propose 的 why / what / scope
- `docs/case-study-data-provenance.md` — 14% / 50 control / 7 偶遇 / 100% / 86 pp 的真实出处（SSWT smoke demo report）
- `docs/agent_system/11-smoke-demo-report.md:33` — 14% 的源头（control 7/50 自然到达 target_location）
- 已 done 的 4 个 propose 的能力（rhythm / emphasis / mapState / overlays / blueprint↔matte / data-hit / progressive reveal）
- Beat 1.1 storyboard 的最终 mdx 状态（5 个 v2 scene 已 live；Beat 1.1 末位 camera = `to: [-4, 15, 6] lookAt: [0, 0, 0]`，mapState = blueprint dim 0.5 + digital_silos_heatmap）

### 不再讨论的事

`docs/cinema-design-language.md` + Beat 1.1 storyboard design.md 已经把语言系统化。本 propose 只负责"3 scene 紧凑版 Beat 1.2 翻译成 mdx-ready YAML 并落地"。任何系统级问题（CPS / fade band / spring profile）不在范围。

## Goals / Non-Goals

**Goals:**
- proposal 的 3 scene 完整落到 mdx
- Beat 1.2 现有 grandfather（legacy `title/lead/body/pullQuote/hud` 字段）完全替换为 `scenes[]`
- Camera 从 Beat 1.1 末位 [-4, 15, 6] 接续，1.2.3 收束到 [0, 8, 4] 作为 Beat 1.3 起点占位
- 14% 数字爆点用 data-hit kind 呈现
- mode cross-fade（blueprint→matte）在 1.2.3 完成，为 Beat 1.3 "实物沙盘"做铺垫
- Build / typecheck / content:lint 全绿
- 不动 Beat 1.1 / Act 2 / Act 3

**Non-Goals:**
- ❌ 不写 Beat 1.3+ 内容
- ❌ 不动其他 9 beat
- ❌ 不调系统参数（如果实测后需要调，独立 propose）
- ❌ 不重新评估 14% 数据（provenance 已锁，未来 publishable run 时单独 PR 修订）
- ❌ 不写 fallbackFigure SVG（pre-existing missing，不阻塞）

## Decisions

### D1 — 3 个 scene 完整 frontmatter

| 字段 | scene-1-2-1-data-hit | scene-1-2-2-mechanism | scene-1-2-3-lever |
|---|---|---|---|
| id | `scene-1-2-1-data-hit` | `scene-1-2-2-mechanism` | `scene-1-2-3-lever` |
| kind | `data-hit` | `body-section` | `pull-quote` |
| rhythm | `tracking` | `still` | `bridge` |
| emphasis | `dwell` | `standard` | `dwell` |
| layout | — | `right-column` | — |
| camera.from | `[-4, 15, 6]` | `[0, 8, 4]` | `[0, 8, 4]` |
| camera.to | `[0, 8, 4]` | `[0, 8, 4]` | `[0, 8, 4]` |
| camera.lookAt | `[0, 0, 0]` | `[0, 0, 0]` | `[0, 0, 0]` |
| enter / exit | `fade / fade` | `slide-side / fade` | `scale-in / fade` |
| mapState.mode | `blueprint` | `blueprint` | `matte` |
| mapState.dim | `0.6` | `0.5` | `0.7` |
| mapState.overlay | `agents_trajectories` | `agents_trajectories` | （未设，默认 none）|

**说明：**

- **camera continuity**：1.2.1 from 接 Beat 1.1 末位（[-4, 15, 6] god view tracking arc 的最终值），从远视 god view 拉近到 [0, 8, 4]（中尺度俯瞰，14% 数字爆点的镜头位）。1.2.2 / 1.2.3 hold 在 [0, 8, 4]——「凝视一个数字 + 解释 + 杠杆」单一镜头位完成，符合"紧凑 3 scene"语义。1.2.3 的 to=[0,8,4] 是 Beat 1.3 起点占位（待 Beat 1.3 storyboard 接管覆盖）。
- **mode cross-fade（blueprint→matte）**：发生在 1.2.2→1.2.3 边界（mapState resolver 自动按相邻 scene 的 mode 差插值）。语义：blueprint 模式下钉数字、解释机制 → matte 模式下抛金句"注意力可以被拨"，材质回归"实物沙盘"，为 Beat 1.3 "instrument summon"做视觉接续（Beat 1.3 起点 SHOULD 也是 matte，零跳变）。
- **overlay 接力**：1.2.1 / 1.2.2 都开 agents_trajectories（看到 200 walkers + 80 cars 在 OSM 路径上）；1.2.3 关闭 overlay，让金句独占视觉。
- **schema 注意**：MapState 仅含 `mode / dim / overlay / highlight`——不存在 `modeTransitionTo` 字段，模式过渡由 mapState resolver 在 scene 边界自动插值，不需要显式声明。

### D2 — Enter/Exit transition 默认值

按 kind 选默认（与 Beat 1.1 一致）：

- `data-hit` → `enter: fade, exit: fade`
- `body-section` → `enter: slide-side, exit: fade`
- `pull-quote` → `enter: scale-in, exit: fade`

### D3 — 文案（zh + en placeholder）

#### scene-1-2-1-data-hit

`SceneDataHit` 仅有 `number / caption / paragraphs[]` 字段；"50 中 7 人"作为 caption 的一部分（一行内说清）。

```yaml
number: "14%"
caption:
  zh: control 组自然到达 target — 50 人中只有 7 人
  en: control group reached target — 7 of 50
paragraphs:
  - zh: 这是「附近」未被任何外部信号引导时，注意力的自然剩余。
    en: The residue of attention when the nearby gets no external nudge.
```

#### scene-1-2-2-mechanism

```yaml
heading:
  zh: 14% 是怎么来的
  en: Where the 14% comes from
paragraphs:
  - zh: 50 个 control agent，14 天，无任何外部干预。
    en: 50 control agents, 14 days, no external intervention.
  - zh: 各自按 scripted plan 自由行动——通勤、跑腿、归家。
    en: Each follows its own scripted plan — commute, errands, home.
  - zh: 偶然走到同一目的地的，只有 7 个。
    en: Only 7 happen to walk into the same target location.
  - zh: 14% 不是随机噪声，是注意力没被引导时的自然剩余。
    en: 14% is not random noise — it's the natural residue of unguided attention.
```

#### scene-1-2-3-lever

`ScenePullQuote` 仅有 `text / subtitle?` 字段；"86 pp" 出处用 `subtitle` 表达。

```yaml
text:
  zh: |
    推送一条本地新闻——
    50 / 50 都到了。
    注意力可以被拨。
  en: |
    Push one local news item —
    all 50 of 50 arrive.
    Attention can be steered.
subtitle:
  zh: smoke demo · treatment effect = 86 pp
  en: smoke demo · treatment effect = 86 pp
```

#### Beat-level 字段调整

将 grandfather `title` / `lead` 删除（scenes[] 优先，不需要冗余 hook 字段）；保留：

```yaml
- id: blindspot-reveal
  claim:
    zh: |
      把"附近被擦掉"这句修辞，钉成 14% 这一个数字——
      smoke demo 控制组中，50 人 14 天，只有 7 人偶然到达 target。
      但只要推送一条本地新闻，到达率从 14% 拉到 100%——
      注意力，可以被拨。
    en: |
      Pin "the nearby has been erased" to a single number — 14%.
      In the smoke-demo control group: 50 agents, 14 days, only 7
      happen to reach the target. But push one local news item, and
      the rate jumps from 14% to 100% — attention can be steered.
  shotRef: act1.b2
  fallbackFigure: /figures/act1-blindspot.svg
  sources:
    - file: docs/agent_system/11-smoke-demo-report.md
      anchor: control-arrival-14pct
    - file: docs/case-study-data-provenance.md
      anchor: sswt-beat-1-2
    - file: synthetic_socio_wind_tunnel/orchestrator/multiday.py
  scenes:
    - id: scene-1-2-1-data-hit
      ...
```

claim 已重写以匹配新 14%-as-smoke-demo 语义（不再说 500m / 22000 人——那是旧 framing，已与 provenance 不符）。

### D4 — 数字 / 命名值 与 provenance 同步

mdx 出现的所有数字 SHALL 在 `docs/case-study-data-provenance.md` § Beat 1.2 表中已登记：14% / 50 control / 7 偶遇 / 100% / 86 pp。本 propose 不再重复 source。如果未来需要补 mdx 新数字，**先在 provenance 表登记**，再写 mdx（参见 provenance 文档的「加新数字工作流」）。

### D5 — Lint 期望状态

实施完后 `pnpm content:lint` 应输出（针对 Beat 1.2）：

```
info · synthetic-socio-wind-tunnel.mdx · beat blindspot-reveal:
       rhythm=[TSB] emphasis=[dwell=2 standard=1]
       mapState=[modes: blueprint,matte; overlays: agents_trajectories]
```

- 序列 TSB（tracking → still → bridge）合规：tracking ≤ 1, still ≤ 1, bridge 隔开
- emphasis 分布：dwell 2 / standard 1 — dwell 占 67%，超过 default 50% 阈值。**已 self-evaluate：**两个 dwell scene 内容性质不同（1.2.1 数字爆点；1.2.3 金句压轴），在 3-scene 紧凑布局下属合理 emphasis 配置；如果 lint 报 distribution warning，本 propose 接受作为已知 trade-off（Beat 1.2 紧凑版的设计选择，不算违规）。
- char-cap：所有 zh 段最长 ~26 字（远低于 standard cap 54 / dwell cap 30）；所有 en 段在对应 cap 内
- 仍允许 fallbackFigure missing warning（pre-existing）

### D6 — Camera 接续与 Beat 1.3 占位约定

Beat 1.1 末位 camera = `to: [-4, 15, 6]` lookAt `[0, 0, 0]`（god view tracking arc）。Beat 1.2:

- **1.2.1 from = [-4, 15, 6]**：完全等于 Beat 1.1 末位，零跳变
- **1.2.1 to = [0, 8, 4]**：从 god view 拉近至中尺度俯瞰，配合 tracking rhythm
- **1.2.2 / 1.2.3 hold = [0, 8, 4]**：紧凑布局下「不再换镜」
- **1.2.3 to = [0, 8, 4]**：等于 hold 值，仅 mode 切换；**未来 Beat 1.3 的 from MUST 等于 [0, 8, 4]** 才能保 0 跳变
- 如果 Beat 1.3 storyboard 决定起点不是 [0, 8, 4]，需要在那个 propose 里加一个短 bridge 调整（不动本 propose）

## Risks / Trade-offs

- **[2 个 dwell + 1 个 standard 的 emphasis 分布]** 紧凑 3-scene 的代价：感性慢 scene（数字 + 金句）压过理性快 scene（解释）。如果实测体感太慢，把 1.2.1 emphasis 降为 standard（数字仍然 hit，只是 reveal 变快）。
  → 倾向先按设计跑，实测后调。

- **[1.2.2 单镜头持续多 svh 是否单调]** 1.2.2 4 个 paragraph progressive reveal，约 4×220svh ≈ 880svh hold 在 [0, 8, 4]。镜头不动，只有文案 + agents 在动。
  → agents_trajectories overlay 持续运动（200 walkers + 80 cars）补足镜头静态；如果觉得太单调，1.2.2 加微小 push-in（[0, 8, 4]→[0, 7.5, 3.8]）。Open question 实测决定。

- **[1.2.3 mode cross-fade 时机]** mapState resolver 默认 cross-fade 占 sceneLocalT 末 5%。pull-quote 的 scale-in 是 entrance，cross-fade 在末尾，二者不冲突。
  → 实测验证。如果 cross-fade 与 pull-quote linger 视觉冲突，可在 1.2.3 加 `mapState.transitionWindow: 0.10`（resolver 已支持）。

- **[Beat 1.3 to 占位为 [0, 8, 4]]** 如果未来 Beat 1.3 storyboard 决定从远处起镜，会需要 bridge 调整。
  → 已在 D6 显式约定接续协议；下一个 propose 必读 D6。

- **[Score range 不变]** Beat 1.2 仍占 cinema-t [0.10, 0.22] 的 12%。3 scene 比之前 grandfather（1 个 long body）的 DOM 高度大致持平或略增（800+880+250 ≈ 1930svh ≈ 19 viewport）。
  → piecewise mapping 自动调整 cinema-time 分配，外层 score 不动。

## Migration Plan

1. **Phase 1** — 一次 Edit 操作：删除 grandfather Beat 1.2（line 212–309 的 `title/lead/claim/body/pullQuote/shotRef/hud/fallbackFigure/sources` 全部 legacy 字段），写入新 beat-level frontmatter（id / claim / shotRef / fallbackFigure / sources）+ 3 个 scene
2. **Phase 2** — pnpm content:lint：验证 D5 期望
3. **Phase 3** — pnpm typecheck：schema 通过（zScene / zMapState）
4. **Phase 4** — pnpm build：bundle 体积变化记录
5. **Phase 5** — pnpm dev → 浏览器实测：camera continuity / mapState cross-fade / agents overlay / progressive reveal / 数字 hit 视觉

回滚：单 commit，git revert 即回到 grandfather 状态。

## Open Questions

1. **Q1 — 1.2.2 hold 镜头是否需要微小 push-in？** 实测后决定；如果太单调，[0, 8, 4]→[0, 7.5, 3.8]
2. **Q2 — 1.2.3 mode cross-fade 与 pull-quote scale-in 是否冲突？** 实测后决定；可调 transitionWindow
3. **Q3 — emphasis 分布 dwell 2 / standard 1 在 3-scene 下是否被 lint 报警告？** 实测确认；如报，记录为已知 trade-off
4. **Q4 — Beat 1.3 storyboard 是否接受 [0, 8, 4] 作为起点？** 由 Beat 1.3 propose 评估；本 propose 已显式约定接续协议

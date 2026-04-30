## Why

之前 Beat 1.1 + 1.2 是**逐 beat 单独 storyboard 推进**的——每 beat 内部 schema-clean，串读却 confuse。本 propose 第一稿（v1，3 幕 background/instrument/findings）走得也不对——叙述偏社论，把 SSWT 当作"得出社会学结论的工具"，弱化了它作为**产品本体**的存在感。

作者拍板**正本清源**到产品导向 v3：

- **Tone**：Tool Builder / 系统架构师 / 极客产品发布。Apple keynote / GitHub README，**不是** Op-Ed。
- **主角**：SSWT 是绝对主角。整篇是「我造了一台机器，它的 architecture / runtime / analytics / pipeline」，不是"人为什么孤独的论文"。
- **反 anthropomorphization**：不出现"四位医生"拟人化、不出现 Emma/Linda 命名角色。用 Agent 01 / Agent 02 冷 ID + 产品模块名（Atlas / Ledger / Policy Engine）+ HUD telemetry（Density +450% / New Ties: 24）。
- **结构**：3 幕 → **5 幕**（Target / Architecture / Runtime / Analytics / Pipeline）。新增的 Decay 幕（衰减/沉淀）是科学诚实——杠杆有半衰期，作品不假装"撒了 Digital Lure 就一切美好"。

本 propose 不写代码、不动 schema、不动 mdx——产出**一份 v3 narrative script**，作为后续所有 beat-by-beat implementation propose 的 binding constraint。

## What Changes

产出 / 更新三份文档：

1. **`script.md`**（重写为 v3）— 5 幕产品向 narrative + 13 beat outline + ~28 scene 结构 + 镜头 / mapState 接续表 + 每 scene zh+en 文案
2. **`docs/case-study-data-provenance.md`**（更新）— 重组为 5 幕结构；登记新数据（ABS 38k / Reddit 切片 / Density +450% / New Ties 24 / 300m Digital Lure）；标记 mock vs real
3. **本 `proposal.md`**（已重写）— 反映 v3 范围

### 关键设计决定（v3）

- **Beat 重组**：v1 的 10 beat → v3 的 13 beat。保留 mdx grandfather 中能复用的（claim / shotRef / sources），其余按 v3 重命名 + 重写 scenes
- **不变**：smoke demo 数据（14% / 86 pp / +302m）保留在 `docs/agent_system/11-smoke-demo-report.md` 作为 engineering record；**website narrative 不直接 surface**——网站 surface 的是产品 runtime telemetry（Density +450% / New Ties: 24），更符合"实机演示"语义
- **新增 capability 需求**：6 个新 R3F overlay（atlas_floor_grid / digital_lure_radius / desire_paths_heatmap / weak_ties_graph / node_focus_dim / runtime_telemetry_hud）+ ~5 个 DOM-only HUD（policy_console / kvList / log panel / entropy_curve / agent_attribute_panel）。每个独立 capability propose
- **mdx top-level**：`acts[]` 数组从 3 改 5；`atAGlance` 数据更新；`description` 重写为产品向

## Capabilities

### Modified Capabilities

- `cinematic-case-study-page` — 全站内容轴 / 节奏 / 视觉接续约定，是后续每个 beat storyboard 必须遵守的 binding contract
- `case-study-content-schema` — 不动 schema 本体；本 propose 输出的 scene 结构会被翻译为 frontmatter

### New Capabilities

_None — 内容 / 节奏对齐 propose，不引能力。后续 ~10 个 overlay/UI capability 会各自独立 propose。_

## Impact

- **本 propose 直接动到的文件**：
  - `openspec/changes/case-study-script-v1/script.md`（重写为 v3）
  - `openspec/changes/case-study-script-v1/proposal.md`（重写）
  - `docs/case-study-data-provenance.md`（重写为 5 幕结构）
- **本 propose 不动**：所有 `.tsx` / `.ts` / `.mdx` / schema 文件
- **后续会动到**（实施 propose 中）：`content/case-studies/synthetic-socio-wind-tunnel.mdx` 大量改写（10 beat → 13 beat，每 beat 加 scenes[]），加 ~10 个新 overlay/UI capability
- **依赖**：beat-1-1-storyboard ✓ done / beat-1-2-storyboard ✓ done（已落地的内容会被本 propose 重写）
- **风险**：
  - 重新设计 beat 结构会让 Beat 1.1 + 1.2 已落地的内容大幅改写——可接受，因为 v1 framing 已被作者否决
  - 6 个新 R3F overlay 是 Act II/III/IV/V 的视觉骨架——release timeline 取决于这些 capability 的并行推进
  - ABS 与 Reddit 数据需要校核（现 mock）；smoke demo 实测数 100/50 与产品向 1000 之间的口径差异要内部说明清楚

## Workflow

```
本 propose v3 (script.md + provenance.md drafted)
   ↓
作者评审 (Q1–Q?, 见 script.md 末尾)
   ↓
script.md frozen as v3-final
   ↓
分裂出 implementation propose:
   1. mdx-skeleton-v3      — top-level acts[]/beats[] 改 5 幕 / 13 beat（无 scene 内容）
   2. act-1-script-impl    — 落 Act I 三 beat 的 scenes
   3. act-2-script-impl    — 落 Act II 三 beat（依赖 atlas/policy_console capability）
   4. act-3-script-impl    — 落 Act III（依赖 digital_lure_radius / desire_paths_heatmap / runtime_telemetry_hud capability）
   5. act-4-script-impl    — 落 Act IV（依赖 entropy_curve / weak_ties_graph capability）
   6. act-5-script-impl    — 落 Act V（依赖 node_focus_dim / perception_log_panel capability）
   7. provenance-final-pass — release 前过一遍所有数字
```

每 implementation propose 严格服从 v3 script，不再二次发明叙事。

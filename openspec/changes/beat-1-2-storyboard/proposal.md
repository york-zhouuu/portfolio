## Why

Beat 1.1 已落地（v2 + coordinate-fix + 真 lowpoly 资产 + 步伐 + 200/80 密度）。Act 1 第二幕 **blindspot-reveal** 仍是旧架构的 grandfather（legacy `title/lead/body/pullQuote/hud` 字段，无 scenes[]）。

Beat 1.2 的叙事任务很明确：**把 Beat 1.1 的抽象命题（"原子化地理 / 注意力位移"）→ 钉成一个具体可被测量的数字（14%）。** 这个 14% 是 SSWT 自己 smoke demo 的实测值（`docs/agent_system/11-smoke-demo-report.md:33`），不是 mock。

按 v2 紧凑版规约：**3 scene 最大**，节奏 T-S-B，使用既有所有能力（rhythm / mapState / progressive reveal / blueprint mode / agents_trajectories overlay），无需新 capability。

## What Changes

- **替换 mdx 中 `blindspot-reveal` beat**：从 grandfather title/lead/body/pullQuote/hud → 3 个 scene[]：
  - `scene-1-2-1-data-hit`：tracking + dwell + data-hit kind，14% 数字爆点
  - `scene-1-2-2-mechanism`：still + standard + body-section，4 段 progressive reveal 解释 14% 怎么来
  - `scene-1-2-3-lever`：bridge + dwell + pull-quote，金句 + mode cross-fade 接 Beat 1.3
- **保留**：beat 顶层 `claim` / `shotRef` / `fallbackFigure` / `sources`
- **保留**：score Beat 1.2 range `[0.10, 0.22]` 不动
- **camera 接续**：1.2.1 from = Beat 1.1 末位 [-4, 15, 6]，1.2.3 to = TBD（Beat 1.3 起点；先 hold 在 [0,8,4]，待 Beat 1.3 storyboard 决定）
- **不需要新 capability**——所有功能（data-hit, blueprint mode, agents_trajectories, progressive reveal, 4 rhythms, mapState fade）已在 cinema-content-language-foundations / map-modes / map-overlays 三个 propose 里就绪
- **登记数据出处**：14% / 50 control / 86 pp 等已写入 `docs/case-study-data-provenance.md`，本 propose 不重复

## Capabilities

### Modified Capabilities

- `cinematic-case-study-page` — Beat 1.2 首次完整运用 4 rhythm + blueprint↔matte mode transition + data-hit + progressive reveal 全套语法。
- `case-study-content-schema` — 验证 schema 再支撑一个 beat 的真实内容。

### New Capabilities

_None — 落地内容，不引能力。_

## Impact

- **唯一文件改动**：`content/case-studies/synthetic-socio-wind-tunnel.mdx` 中 `blindspot-reveal` beat（约 80 行 YAML 替换）
- **Beat 1.1 / Act 2 / Act 3** 不动
- **不影响**：cinema canvas / theme / camera score 顶层 / i18n / agent overlay / map state 系统
- **依赖**：cinema-content-language-foundations ✓ done, cinema-map-modes ✓ done, cinema-map-overlays ✓ done, cinema-coordinate-fix ✓ done。所有依赖已就绪。
- **风险**：
  - Beat 1.2 之前是 grandfather（legacy 字段），还在被某些代码读吗？检查 — 只是 lint / sr-only / SEO 用，不影响 cinema 渲染（cinema 看 `scenes[]`，scenes[] 优先；legacy 字段 fallback）。本 propose 删除 legacy 字段，应用 scenes[]。
  - 1.2.3 bridge to TBD 留空——Beat 1.3 storyboard 来填。
- **lint 期望**：rhythm=[TSB] emphasis=[dwell=2 standard=1] mapState=[modes: blueprint,matte; overlays: agents_trajectories]

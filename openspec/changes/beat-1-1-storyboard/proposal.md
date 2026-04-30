## Why

Beat 1.1（Act 1 开场）的所有"工具"都已就绪：

- `cinema-scroll-pacing` ✅ — rhythm / emphasis / sticky text / piecewise scroll / 屏息漂移
- `cinema-content-language-foundations` ✅ — mapState / overlay 接口 / tracking rhythm / data-hit kind / progressive reveal
- `cinema-map-modes` ✅ — blueprint material（X-ray 蓝图）
- `cinema-map-overlays` ✅ — agents_trajectories（80 个发光球沿路径动）+ digital_silos_heatmap（红光柱）

作者已写好 v2 脚本（`docs/references/beat-1-1-script-v2.json`）— 5 个 scene 完整运用了上述所有能力。**本 propose 把 v2 脚本落到 mdx**，让 Beat 1.1 真正变成"原子化地理"（The Atomized Geography）章节。

之前的 grandfather Beat 1.1（7 个全 still scene）会被替换。所有 lint warning（节奏、字数 cap）应消除。

## What Changes

- **替换 `content/case-studies/synthetic-socio-wind-tunnel.mdx` 中的 Beat 1.1**：从现 7 个 still scene → v2 脚本的 5 个 scene
  - scene-1-1-thesis（still / dwell / title）
  - scene-1-2-data-hit（tracking / dwell / **data-hit**）— 新 kind 首次使用
  - scene-1-3-evidence（still / standard / body-section + 多 paragraph 错峰）
  - scene-1-4-core-concept（bridge / linger / pull-quote）
  - scene-1-5-macro（tracking / standard / body-section + 3 段错峰）
- **Beat 1.1 frontmatter 字段**：beat.id 从 `open-real-world` 维持不变（避免 score / 其他引用断裂），但**内部 scene 全部新换**
- **mapState 全程显式**：matte → blueprint 切换 + 两种 overlay 各自激活
- **Camera 坐标对齐世界尺度**（v2 script 中已使用 ±8 范围）
- **保留**：beat.claim（sr-only），beat.shotRef，fallbackFigure
- **保留**：其他 9 个 beat 的旧字段不动（独立 storyboard propose）
- **不需要 schema 改动**：所有所需字段（rhythm tracking / data-hit kind / mapState / progressive reveal）已在依赖 propose 落地

## Capabilities

### Modified Capabilities

- `cinematic-case-study-page` — Beat 1.1 视觉首次完整运用 4 种 rhythm + 2 种 mode + 2 种 overlay + data-hit + progressive reveal 的全套语法。验证组合可行性。
- `case-study-content-schema` — Beat 1.1 frontmatter 验证 schema 在真实复杂内容下的可用性。

### New Capabilities

_None — 落地内容，不新增能力。_

## Impact

- **唯一文件改动**：`content/case-studies/synthetic-socio-wind-tunnel.mdx` 的 Beat 1.1（约 200-260 行 YAML）
- **Lint 状态变化**：
  - 之前 Beat 1.1 触发 7 个节奏 warning + 6 个字数 cap warning
  - 之后所有 warning 应消除（v2 已按节奏 + char-cap 设计）
- **总 svh 影响**：Beat 1.1 svh 从 4050 降至 ~2200-2800（v2 拆分了长 paragraph）
- **不影响**：其他 9 beat / cinema canvas / theme / camera score / i18n
- **依赖**：foundations / map-modes / map-overlays 全部已 done
- **风险**：v2 脚本里 mapState transition 的实际视觉是否如设计——需要作者实测；如果 cross-fade 过渡仓促 / blueprint 配色不和谐 / agent 数量不对，需迭代。

## Why

当前 `computeStillSvh` 对 body-section / data-hit 用 "longest paragraph × 1.3" 计算 svh 预算（block reveal 模式）。**字数线性映射 svh** —— author 写更多 body 内容时，scene 的 dwell 时间和 scroll 高度同比例增长，**镜头节奏被文本长度拖慢**。

作者 v4 Beat 1.1 反馈：scene-1-1 仅 26 字、scene-1-3 仅 133 字 —— 太短不够说事。希望写到 600-1500 字而镜头不显著变慢。

人眼实际行为：
- 在 **heading / quote / title** 上停下来读（primary read，full speed）
- 在 **paragraph 正文** 上扫读、跳读（secondary scan，~10-20× faster than primary read）

当前模型把所有文本都当成 primary read，与现实不符。本 propose 引入 **body-discount**：primary 文本全权，body 文本 1/20 权。

效果（dwell 档 CPS_zh=7，REACTION=1s）：

| heading + body chars | 旧 svh | 新 svh | 节省 |
|---|---|---|---|
| 30 + 0 | 5.3s | 5.3s | 0% |
| 30 + 200 | 12.0s | 5.7s | 53% |
| 30 + 500 | 30.2s（capped）| 8.0s | 73% |
| 30 + 1500 | 30.2s（capped）| 15.0s | 50% |

—— author 可以放心写到 1000-1500 字 body 而镜头总停留时间仍在 15s 内。

## What Changes

### Spec / 公式

```
weighted_chars = primary_chars × 1.0 + body_chars × (1/20)
dwell_seconds = weighted_chars / CPS_emphasis + REACTION_S
svh = clamp(secondsToSvh(dwell), MIN_DWELL_S × CPS, MAX_DWELL_S × CPS)
```

### Primary vs Body 分类

| kind | primary（× 1.0）| body（× 1/20）|
|---|---|---|
| body-section | heading | paragraphs[] + twinColumns paragraphs/items + kvList |
| data-hit | caption | paragraphs[] |
| title | text + subtitle | — |
| lead | text | — |
| pull-quote | text + subtitle | — |
| breath | (none) | (none) |

仅 **body-section / data-hit** 应用 body-discount——这俩本就是"标题 + 正文"二级结构。其他 kind 文本本身短，无需打折。

### 实施变化

- `lib/cinema/scene-types.ts`：
  - 新增 `countCharsByLayer(scene)` 返回 `{ primaryZh, bodyZh, primaryEn, bodyEn }`
  - 重写 `computeStillSvh` 使用加权公式
  - **删除** `computeBlockSvh`（被加权公式 subsume）
  - 现有 `countCharsZh / countCharsEn` 保留（如果有别处使用，否则一并清理）
- 新增常量 `BODY_DISCOUNT_FACTOR = 0.05`（即 1/20）

### 不动

- `CPS_ZH` 表（emphasis tier 不变）
- `MIN_DWELL_S` / `MAX_DWELL_S` clamp（保留）
- `REACTION_S` reaction 时间
- 其他 scene kind 行为不变（title / lead / pull-quote / breath）

## Capabilities

### Modified Capabilities

- `case-study-content-schema` — `computeStillSvh` 公式从"longest paragraph × 1.3 (block)"改为"primary + body × 1/20 (weighted)"

### New Capabilities

_None — 内部公式调整。_

## Impact

- **改动文件**：
  - `lib/cinema/scene-types.ts`（核心改动）
  - 已有 mdx 中所有 body-section / data-hit scene 的 svh 会变化（普遍变小，更紧凑）
- **不动**：
  - 渲染逻辑（SceneBodySection / SceneDataHit）
  - 文本计数 zod schema
  - i18n / locale
  - cinema canvas / score top-level
- **依赖**：cinema-scroll-pacing ✓ done · cinema-content-language-foundations ✓ done
- **下游 propose**：`act-1-v4-rewrite` 依赖本 propose（先合本，再做 v4 mdx 改动 + 长文本 1:1 翻译）
- **风险 / trade-offs**：
  - 已有 mdx 中现存 body-section 的 svh 会立即变小——已落地的 Beat 1.1 (5 scene) + Beat 1.2 (3 scene) cinema-t 节奏会即时调整。**可接受**因为本 propose 与 act-1-v4-rewrite 配套实施，act-1-v4-rewrite 会清空 Beat 1.1/1.2 替换 v4，旧 svh 节奏不再相关
  - 1/20 比率激进——未来如果发现某些 scene 需要更多停留（特别是 emphasis=linger 的诗意 body-section），可在 design.md Q1 追加 per-emphasis 调整
- **lint 期望**：
  - 不影响 char-cap warning（cap 仍按完整 chars 算，不打折）
  - rhythm sequence warning 不变
  - lint info 行新增 svh 摘要可选（design.md Q3 决定）

## Workflow

```
本 propose merge
   ↓
act-1-v4-rewrite 实施（依赖 BODY_DISCOUNT_FACTOR）
   ↓
作者发新版 v4 JSON（含更长 body 文本）
   ↓
1:1 翻译为 mdx
```

## MODIFIED Requirements

### Requirement: body-section / data-hit 的 svh 预算按加权公式计算

`computeStillSvh` 计算 body-section / data-hit 的 svh 预算时 SHALL 把 scene 文本分为 primary 与 body 两层，按以下加权公式：

```
weighted_chars = primary_chars × 1.0 + body_chars × BODY_DISCOUNT_FACTOR
dwell_seconds = weighted_chars / CPS_emphasis + REACTION_S
svh = secondsToSvh(clamp(dwell_seconds, MIN_DWELL_S, MAX_DWELL_S))
```

其中 `BODY_DISCOUNT_FACTOR = 0.05`（即 1/20）。

primary 与 body 分类：

| kind | primary（× 1.0）| body（× 1/20）|
|---|---|---|
| body-section | heading | paragraphs[] + twinColumns 全部子文本 + kvList |
| data-hit | caption | paragraphs[] |

其他 scene kind（title / lead / pull-quote / breath）**不应用 body-discount**——继续按原有"全文本 / CPS"公式计算。

#### Scenario: body-section heading 30 + paragraphs sum 500 chars (zh)

- **WHEN** scene.kind = "body-section", emphasis = "dwell"（CPS_zh = 7），heading.zh.length = 30, paragraphs[] 总长 500 zh chars
- **THEN** weighted_zh = 30 + 500 × 0.05 = 55；dwell = 55/7 + 1 ≈ 8.86s

#### Scenario: body-section paragraphs 2000 chars (zh) clamp 触发

- **WHEN** scene.kind = "body-section", emphasis = "standard"（CPS_zh = 9），heading 20, paragraphs 2000 chars
- **THEN** weighted_zh = 20 + 2000 × 0.05 = 120；dwell = 120/9 + 1 ≈ 14.3s（< MAX_DWELL_S，不 clamp）

#### Scenario: data-hit caption 30 + paragraphs 200 chars

- **WHEN** scene.kind = "data-hit", emphasis = "dwell"，caption 30, paragraphs sum 200
- **THEN** weighted_zh = 30 + 200 × 0.05 = 40；dwell = 40/7 + 1 ≈ 6.71s

#### Scenario: title 50 chars text only — no discount

- **WHEN** scene.kind = "title", text.zh.length = 50, no subtitle
- **THEN** body-discount 不应用，dwell = 50 / CPS_emphasis + REACTION_S（与原有行为一致）

### Requirement: countCharsByLayer 函数返回分层字数

`lib/cinema/scene-types.ts` SHALL 暴露（或私有）`countCharsByLayer(scene): { primaryZh, primaryEn, bodyZh, bodyEn }` 函数，按本 spec 的 primary/body 分类返回各层字符数。zh / en 分别计数。

#### Scenario: body-section twinColumns 含 paragraphs

- **WHEN** scene.kind = "body-section", twinColumns.left.paragraphs = [{zh:"...100字..."}], twinColumns.right.paragraphs = [{zh:"...80字..."}]
- **THEN** countCharsByLayer 返回 bodyZh ≥ 180（含 twin-column heading 也归 body）

#### Scenario: data-hit number 不计入 char count

- **WHEN** scene.kind = "data-hit", number = "1,000"
- **THEN** countCharsByLayer 返回的 primaryZh / bodyZh 都不含 "1,000" 这 5 个字符（number 是 visual element 不计文本）

### Requirement: computeBlockSvh 删除

原 `computeBlockSvh`（基于 longest paragraph × 1.3 的 block 公式）SHALL 被删除。所有原本调用它的入口（computeStillSvh body-section 多段分支 / data-hit 多 item 分支）改为统一使用 `computeStillSvh` 的加权公式。

#### Scenario: body-section 多段 paragraphs

- **WHEN** scene.kind = "body-section", paragraphs.length > 1
- **THEN** 不再分支调 computeBlockSvh，统一走加权公式

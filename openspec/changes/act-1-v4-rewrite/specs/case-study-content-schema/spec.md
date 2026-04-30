## MODIFIED Requirements

### Requirement: TwinColumns 支持长文本 paragraph

`TwinColumns.left/right` 每侧 SHALL 接受可选 `paragraphs?: I18nString[]` 字段，用于承载长叙述文本（与既有 `items: KvItem[]` 并列）。每侧 MUST 至少有 `items` 或 `paragraphs` 之一非空（zod refine 校验）。

**用途**：narrative 双栏对比（如 "物理属性 / 社会属性"）需要长 paragraph 表达，KvItem (key + value) 形态不足。

**向后兼容**：现 mdx 中所有 twinColumns 用法仅含 `items` —— 升级后行为不变。

#### Scenario: twinColumns 一侧仅含 paragraphs

- **WHEN** 一侧 twinColumns side 设 `paragraphs: [...]` 且不设 `items`
- **THEN** 该侧仅渲染 heading + paragraphs，校验通过

#### Scenario: twinColumns 一侧同时含 paragraphs 与 items

- **WHEN** 一侧 twinColumns side 同时设 `paragraphs: [...]` 与 `items: [...]`
- **THEN** 渲染顺序为 heading → paragraphs → items（kv 列表 stagger fade-in）

#### Scenario: twinColumns 一侧两者均空

- **WHEN** 一侧 twinColumns side 既无 paragraphs 也无 items
- **THEN** zod refine 报错"twinColumns side must have at least one of items[] or paragraphs[]"

### Requirement: char-cap 校验覆盖 twinColumns paragraphs

content-lint SHALL 在 body-section 分支遍历 paragraphs 时，**同时遍历** `twinColumns.left.paragraphs` 与 `twinColumns.right.paragraphs`，每段独立按 emphasis cap 校验。

#### Scenario: twinColumns paragraph 超过 emphasis cap

- **WHEN** 一段 twinColumns paragraph zh 字数 > emphasis cap_zh
- **THEN** content-lint 输出 char-cap warning，定位到 `beat <id> scene <id> twinColumns.{left|right}.paragraph[i]`

### Requirement: svh 计算覆盖 twinColumns paragraphs

`computeStillSvh` 在 body-section + twinColumns 场景中 SHALL 把 left.paragraphs / right.paragraphs / left.items / right.items 视为单一 block reveal 集合，调用 `computeBlockSvh` 取其中最长 entry 的 dwell × 1.3 作为本 scene svh 预算。

#### Scenario: twinColumns 双栏 paragraphs

- **WHEN** scene 是 body-section，twinColumns.left.paragraphs 含 2 段 + twinColumns.right.paragraphs 含 1 段
- **THEN** computeStillSvh 把这 3 段视为 block，按最长那段 × 1.3 计算 svh


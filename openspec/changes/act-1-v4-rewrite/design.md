## Context

### 输入

- 作者 v4 JSON「附近的消失」(act-1, beat 1.1, 4 scenes) — 唯一 narrative source of truth
- `openspec/changes/case-study-script-v1/script.md` v3 — 全站 alignment 文档（Q1-Q8 已敲定）
- 现 mdx Beat 1.1 (`open-real-world`) + Beat 1.2 (`blindspot-reveal`) — 将被删除
- 现 schema：`TwinColumns` 仅支持 `items: KvItem[]`，不支持长 paragraph 文本

### 不再讨论的事

`case-study-script-v1` 的 Q1-Q8 alignment 已 frozen。本 propose 仅落地 Act I——任何对 v4 narrative 的修订都不在范围（如要改，作者修 v4 JSON，本 propose 1:1 翻译）。

## Goals / Non-Goals

**Goals**:
- TwinColumns schema 扩展（最小、向后兼容）
- v4 JSON 4 scene 1:1 翻译为 mdx-ready frontmatter，含 6 处微调（见 proposal.md）
- 删除现 mdx attention-boundary act 中所有旧 beat
- attention-boundary act 仅含 1 beat（`disappearance-of-nearby`）
- camera 末位 to = [0, 12, 12]，为 Act II.1 起点接续做准备
- typecheck / content-lint / build 全绿
- provenance 同步 Act I v4 数据

**Non-Goals**:
- ❌ 不写 Act II-V（后续 propose）
- ❌ 不引入新 R3F overlay capability
- ❌ 不改 cinema canvas / score curve top-level
- ❌ 不动其他 act（instrument / findings）

## Decisions

### D1 — TwinColumns schema 扩展

```typescript
// lib/cinema/scene-types.ts
export type TwinColumnSide = {
  heading?: I18nString;
  items?: KvItem[];      // 既有，改为 optional
  paragraphs?: I18nString[]; // 新增
};
// refine: items 或 paragraphs 至少其一非空

export type TwinColumns = {
  left: TwinColumnSide;
  right: TwinColumnSide;
};
```

zod 端：
```typescript
// lib/content/case-study-schema.ts
const TwinColumnSideSchema = z.object({
  heading: I18nStringSchema.optional(),
  items: z.array(KvItemSchema).optional(),
  paragraphs: z.array(I18nStringSchema).optional(),
}).refine(
  (s) => (s.items?.length ?? 0) + (s.paragraphs?.length ?? 0) > 0,
  { message: "twinColumns side must have at least one of items[] or paragraphs[]" },
);

const TwinColumnsSchema = z.object({
  left: TwinColumnSideSchema,
  right: TwinColumnSideSchema,
});
```

**向后兼容**：现有 mdx 中所有 twinColumns 用法仅含 `items` —— 升级后行为不变。

### D2 — SceneBodySection 渲染

`components/cinema/scenes/SceneBodySection.tsx` twin-column 分支内，每列渲染：

1. heading（既有）
2. paragraphs[]（**新增**）— 与正文相同 typography（`text-body leading-[1.65] text-fg/88`），段间 `mt-3` 间距
3. items[]（既有 KvRow stagger fade-in）

paragraphs 在 items 之上（视觉先看长文，再看 kv 列表）。如果 paragraphs[] 存在 + items[] 不存在，则只渲染 paragraphs。

### D3 — char count + svh 计算

`countCharsZh / countCharsEn` 在 body-section 分支加：

```typescript
if (scene.twinColumns) {
  scene.twinColumns.left.paragraphs?.forEach(add);
  scene.twinColumns.left.items?.forEach((kv) => { add(kv.key); add(kv.value); });
  scene.twinColumns.right.paragraphs?.forEach(add);
  scene.twinColumns.right.items?.forEach((kv) => { add(kv.key); add(kv.value); });
  // heading 已在 SceneBase 处理
}
```

`computeStillSvh` 中，body-section + twinColumns paragraphs 视为 block reveal——`computeBlockSvh(scene, [paragraphs.left + paragraphs.right + items.entries])`，与现 multi-paragraph body-section 同 cap 行为。

### D4 — content-lint char-cap 检查

`scripts/content-lint.ts` 遍历 scene paragraphs 时，加 twinColumns.{left,right}.paragraphs 迭代：

```typescript
function* iterParagraphs(scene) {
  if (scene.kind === "body-section") {
    yield* scene.paragraphs ?? [];
    if (scene.twinColumns) {
      yield* scene.twinColumns.left.paragraphs ?? [];
      yield* scene.twinColumns.right.paragraphs ?? [];
    }
  }
  // ...
}
```

每段独立校 char-cap。v4 scene-1-2 双栏每段约 50-65 字 zh，远低于 dwell cap 30 / standard cap 54——但 dwell emphasis 下的 cap 是 42 字（dwell zh CPS 7）；v4 评 dwell 下 60 字会触发 warning。

**调整**：scene-1-2 emphasis 改为 `standard`（cap 54）——v4 JSON 标 dwell 但实际文本量更适合 standard tier，作者校稿后会同意。

### D5 — v4 JSON → mdx 完整 frontmatter

#### Beat-level

```yaml
- id: disappearance-of-nearby
  title:
    zh: 附近的消失
    en: The Disappearance of the Nearby
  claim:
    zh: |
      物理空间的极度靠近，并未带来社会网络的真实连接。
      阻碍邻里连接的不再是混凝土墙壁，而是注意力位移
      (Attention Displacement)——通勤习惯 + 屏幕注意力
      捕获，剥夺了人们对周边环境的感知。
    en: |
      Physical proximity does not produce social proximity.
      The barrier isn't concrete — it's attention displacement:
      point-to-point commute habits compound with screen capture
      to strip awareness of surroundings.
  shotRef: act1.b1
  fallbackFigure: /figures/act1-disappearance.svg
  sources:
    - file: docs/research/00-thesis.md
      anchor: nearby-blindness
    - file: docs/case-study-data-provenance.md
      anchor: act-1-disappearance
  scenes:
    - ... (4 scene per below)
```

#### Scene 1.1 — paradox

```yaml
- id: scene-1-1-paradox
  kind: title
  layout: center
  rhythm: tracking
  emphasis: linger
  camera:
    from: [0, 0.2, 5.15]   # 3% push-in 起点
    to: [0, 0.2, 5]
    lookAt: [0, 0.2, 0]
  enter: fade
  exit: fade
  text:
    zh: |
      物理空间的极度靠近，
      并未带来社会网络的真实连接。
    en: |
      Physical proximity does not yield
      real social connection.
  mapState:
    mode: matte
    dim: 0.5
```

#### Scene 1.2 — evidence (twin-column paragraphs)

```yaml
- id: scene-1-2-evidence
  kind: body-section
  layout: twin-column
  rhythm: motion
  emphasis: standard   # 见 D4，从 v4 dwell 下调
  camera:
    from: [0, 0.2, 5]
    to: [0, 8, 10]
    lookAt: [0, 0, 0]
  enter: fade
  exit: fade
  heading:
    zh: 空间共享与社交孤岛
    en: Shared space, isolated networks
  twinColumns:
    left:
      heading:
        zh: 物理属性 · ABS 普查
        en: Physical · ABS census
      paragraphs:
        - zh: |
            ABS 2021 数据显示 Lane Cove 居民高度共享当地的街道网络
            与商业基础设施。
          en: |
            ABS 2021 data shows Lane Cove residents share local streets
            and commercial infrastructure densely.
    right:
      heading:
        zh: 社会属性 · Reddit 切片
        en: Social · Reddit slice
      paragraphs:
        - zh: |
            Reddit 上持续出现在地居民关于「难以在同街区建立社交连接」
            的发帖记录。
          en: |
            Reddit threads persistently surface local residents struggling
            to build neighborhood ties.
  mapState:
    mode: matte
    overlay: digital_silos_heatmap
    dim: 0.6
```

#### Scene 1.3 — attention-displacement

```yaml
- id: scene-1-3-attention-displacement
  kind: body-section
  layout: right-column
  rhythm: tracking
  emphasis: standard
  camera:
    from: [0, 8, 10]
    to: [4, 6, 8]
    lookAt: [0, 0, 0]
  enter: slide-side
  exit: fade
  heading:
    zh: 隐形边界 · 注意力的位移
    en: Invisible boundary · Attention Displacement
  paragraphs:
    - zh: 阻碍邻里连接的不再是混凝土墙壁，而是注意力位移 (Attention Displacement)。
      en: The barrier isn't concrete walls anymore — it's attention displacement.
    - zh: 点对点的高效通勤，配合手机屏幕对注意力的持续捕获，剥夺了人们对周边环境的感知。
      en: Point-to-point commute habits + screen capture strip awareness of surroundings.
    - zh: 街道与公共空间随之被降维，沦为仅供快速穿梭的过境走廊。
      en: Streets and public spaces collapse into mere transit corridors.
  mapState:
    mode: blueprint
    overlay: agents_trajectories
    dim: 0.5
```

#### Scene 1.4 — sandbox-reveal

```yaml
- id: scene-1-4-sandbox-reveal
  kind: pull-quote
  layout: center
  rhythm: bridge
  emphasis: dwell
  camera:
    from: [4, 6, 8]
    to: [0, 12, 12]
    lookAt: [0, 0, 0]
  enter: scale-in
  exit: fade
  text:
    zh: |
      面对由习惯与认知构筑的边界，
      实体空间的改造试错成本极高。
      我们需要一个计算社会科学沙盘，
      来测试低成本的「算法干预」如何重建附近性。
    en: |
      For boundaries built of habit and cognition,
      physical-space iteration costs too much.
      We need a computational social-science sandbox
      to test how low-cost algorithmic intervention can rebuild proximity.
  mapState:
    mode: blueprint
    overlay: agents_trajectories
    dim: 0.3
```

> 注：v4 JSON 中 layout = `center-large`，schema 现仅支持 `center` / 其他既有值。如需 `center-large` 视觉差异，是后续小 propose（`pull-quote-layout-variants`）的事，不在本 propose 范围。本 propose 用 `center`，作者 review 后如要 `center-large` 再开。

### D6 — Score / cinema-t 重新分配

现 score（推断）：
- Beat 1.1 (`open-real-world`) cinema-t [0, 0.10]
- Beat 1.2 (`blindspot-reveal`) cinema-t [0.10, 0.22]
- Beat 1.3 (`instrument-summon`) cinema-t [0.22, ?]

新 score：
- Beat 1.1 (`disappearance-of-nearby`) cinema-t [0, ~0.12]——4 scene 总 svh 由 computeSvh 累加；piecewise mapping 自动 fit

**实现方式**：score 顶层 `acts[].cinemaTRange` 由 `lib/cinema/score.ts` 自动从 beats[] 派生 OR 显式声明。检查现 score.ts 行为：

如自动派生：mdx 改完即生效，无需手动调
如显式声明：mdx 顶层 `cinemaScoreVersion` bump + range 重设

任务里加一项：检查 score 派生方式，如需手动调，标记 cinemaScoreVersion 从 0.1.6 → 0.2.0。

### D7 — Beat ID 命名

新 beat id = `disappearance-of-nearby`（matches v4 title slug）。
现 mdx 里 `open-real-world` / `blindspot-reveal` / `instrument-summon` 全删除——它们 score 引用 / URL fragment / analytics anchor 都无 external dependent code（已 grep 验证），删除安全。

### D8 — Camera 接续约定 binding

v4 末位 to = `[0, 12, 12]`（dim 0.3 blueprint）。
**Act II.1 atlas-ledger 第一 scene 起点 from MUST = `[0, 12, 12]`**——下一个 propose 必须遵守此约定。本 propose 在 design.md / spec 中以 binding constraint 标注。

## Risks / Trade-offs

- **[Beat 1.2 删除是 sunk cost]** beat-1-2-storyboard 刚做完。可接受——v4 alignment 决定。
- **[scene-1-2 emphasis 调整]** v4 标 dwell，本 propose 实施 standard（D4）。如作者觉得需要 dwell tier 视觉重量，要么文本缩到 42 字内 / cap 内，要么接受 cap warning + 标 known-trade-off。**默认 standard，作者 review 时可推翻。**
- **[`center-large` layout 缺失]** v4 scene-1-4 标 `center-large`，schema 无此 layout 值。本 propose 用 `center` 暂代——作者 review 时如要差异化视觉，开 sub-propose 加 layout variant。
- **[Reddit 数据 mock]** 本 propose 用定性表述"持续出现 ... 发帖记录"——provenance 标 ⚠️ TODO。release 前需作者真爬或换公开 study。
- **[Atlas dimension 描述]** v4 camera note 用"1km²"，本 propose 替换为"~17 km² 数字孪生"。narrative 中 mostly 不出现具体数值；camera 注释级仅作开发参考。

## Migration Plan

1. **Phase 1** — Schema 扩展（最小 PR）
   - scene-types.ts: TwinColumnSide 类型 + countCharsZh/En 拓展 + computeBlockSvh 含 twinColumns paragraphs
   - case-study-schema.ts: zod refine
2. **Phase 2** — 渲染 + lint
   - SceneBodySection.tsx: twin-column paragraphs 渲染
   - content-lint.ts: char-cap 检查含 twinColumns paragraphs
3. **Phase 3** — mdx
   - 删除 attention-boundary 中 3 个旧 beat
   - 写入 disappearance-of-nearby 1 beat 4 scene
4. **Phase 4** — provenance
   - case-study-data-provenance.md 同步 Act I 表
5. **Phase 5** — 验证
   - typecheck / content-lint（期望 D4 调整后零 char-cap warning）/ build / 浏览器实测
6. **Phase 6** — 校 score
   - 检查 cinema-t 自动派生 vs 手动；如需手动，bump cinemaScoreVersion

回滚：单 commit，git revert 即回到原 mdx + schema 状态。

## Open Questions

1. **Q1 — scene-1-2 emphasis 是 dwell（v4 原意）还是 standard（D4 调整）？** 实施默认 standard；作者 review 后如要 dwell 需缩文本到 cap 内
2. **Q2 — `center-large` layout 是否需要新 layout variant？** 本 propose 用 `center` 替代；后续可开 sub-propose
3. **Q3 — score cinema-t range 自动派生 vs 显式？** Phase 6 任务里查；如显式声明，需 bump cinemaScoreVersion
4. **Q4 — Reddit 数据真爬时间表？** 本 propose 用定性表述 + ⚠️ TODO；release 前需作者补

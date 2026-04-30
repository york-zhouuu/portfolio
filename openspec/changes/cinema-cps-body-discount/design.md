## Context

### 输入

- 作者反馈：v4 Beat 1.1 文本量太短（26-133 字），希望写到 600-1500 字而镜头不显著变慢
- `lib/cinema/scene-types.ts` `computeStillSvh` / `computeBlockSvh` 现行公式：longest paragraph × 1.3（block reveal）
- CPS table：linger=5 / dwell=7 / standard=9 / brief=12（zh）；en = zh × 1.5
- MIN_DWELL_S / MAX_DWELL_S / REACTION_S 既有

### 不再讨论的事

- CPS table 本身（emphasis tier 字符速率）—— 不动
- block reveal 视觉行为（all paragraphs 一起 fade in）—— 不动
- progressive reveal 是否回归 —— 不动（作者已确认 block reveal 更舒服）

## Goals / Non-Goals

**Goals**:
- 加权公式 `primary × 1.0 + body × 1/20`
- 仅作用于 body-section / data-hit（其他 kind 公式不变）
- 删除 `computeBlockSvh`（被加权公式 subsume）
- 单元测试覆盖典型 svh 输入输出（避免 regress）

**Non-Goals**:
- ❌ 不改 CPS table
- ❌ 不引入 per-emphasis discount 比率（统一 1/20，由 author 实测决定是否需要分档）
- ❌ 不改 progressive reveal 视觉
- ❌ 不动其他 scene kind 公式

## Decisions

### D1 — BODY_DISCOUNT_FACTOR 常量

```typescript
// lib/cinema/scene-types.ts
const BODY_DISCOUNT_FACTOR = 0.05; // 1/20 — body chars contribute 5% to dwell
```

放在 CPS_ZH 常量同处，便于未来调参。

### D2 — countCharsByLayer 实现

```typescript
type LayerCounts = {
  primaryZh: number;
  primaryEn: number;
  bodyZh: number;
  bodyEn: number;
};

function countCharsByLayer(scene: Scene): LayerCounts {
  let primaryZh = 0, primaryEn = 0, bodyZh = 0, bodyEn = 0;
  const addPrimary = (s?: I18nString) => {
    if (s) { primaryZh += s.zh.length; primaryEn += s.en.length; }
  };
  const addBody = (s?: I18nString) => {
    if (s) { bodyZh += s.zh.length; bodyEn += s.en.length; }
  };

  if (scene.kind === "title") {
    addPrimary(scene.text);
    addPrimary(scene.subtitle);
  } else if (scene.kind === "lead") {
    addPrimary(scene.text);
  } else if (scene.kind === "pull-quote") {
    addPrimary(scene.text);
    addPrimary(scene.subtitle);
  } else if (scene.kind === "body-section") {
    addPrimary(scene.heading);
    scene.paragraphs?.forEach(addBody);
    scene.kvList?.forEach((kv) => { addBody(kv.key); addBody(kv.value); });
    if (scene.twinColumns) {
      // twin-column 的 sub-heading 也归 body（不像 scene heading 那样 demand attention）
      addBody(scene.twinColumns.left.heading);
      scene.twinColumns.left.paragraphs?.forEach(addBody);
      scene.twinColumns.left.items?.forEach((kv) => { addBody(kv.key); addBody(kv.value); });
      addBody(scene.twinColumns.right.heading);
      scene.twinColumns.right.paragraphs?.forEach(addBody);
      scene.twinColumns.right.items?.forEach((kv) => { addBody(kv.key); addBody(kv.value); });
    }
  } else if (scene.kind === "data-hit") {
    addPrimary(scene.caption);
    scene.paragraphs?.forEach(addBody);
    // scene.number 不计入（visual element，非阅读文本）
  }
  // breath: 全 0
  return { primaryZh, primaryEn, bodyZh, bodyEn };
}
```

### D3 — computeStillSvh 重写

```typescript
export function computeStillSvh(scene: Scene): number {
  const { primaryZh, primaryEn, bodyZh, bodyEn } = countCharsByLayer(scene);
  const cpsZh = CPS_ZH[scene.emphasis];
  const cpsEn = cpsZh * 1.5;

  const weightedZh = primaryZh + bodyZh * BODY_DISCOUNT_FACTOR;
  const weightedEn = primaryEn + bodyEn * BODY_DISCOUNT_FACTOR;

  const dwellZh = weightedZh / cpsZh;
  const dwellEn = weightedEn / cpsEn;
  const rawSeconds = Math.max(dwellZh, dwellEn) + REACTION_S;
  const clamped = Math.max(MIN_DWELL_S, Math.min(MAX_DWELL_S, rawSeconds));
  return secondsToSvh(clamped);
}
```

### D4 — 删除 computeBlockSvh

旧 `computeBlockSvh`（max-paragraph × 1.3）被加权公式 subsume，删除。如果有外部引用（grep 验证），同步清理。

### D5 — 旧 countCharsZh / countCharsEn 处理

如果仅在 `computeStillSvh` 内部使用，**删除**（被 `countCharsByLayer` 替代）。
如果在 `content-lint` / 别处使用（char-cap 校验），**保留**——char-cap 仍按完整字数算，不打折。

实施时 grep `countCharsZh` / `countCharsEn` 引用，按实际处理。

### D6 — 单元测试覆盖

`lib/cinema/__tests__/scene-types.test.ts`（如不存在则新建）：

```typescript
describe("computeStillSvh — body-discount", () => {
  it("body-section heading 30 + paragraphs 0 chars: full primary dwell", () => {
    // ...
  });
  it("body-section heading 30 + paragraphs 500 chars: primary + 25 chars body", () => {
    // expected ~8s pre-clamp
  });
  it("body-section heading 30 + paragraphs 2000 chars: clamped at MAX_DWELL_S", () => {
    // expected = MAX_DWELL_S
  });
  it("title 50 chars text only: no body discount applied", () => {
    // ...
  });
  it("data-hit caption 30 + paragraphs 200: primary + 10 chars body", () => {
    // ...
  });
});
```

### D7 — content-lint 影响

content-lint 使用 char-cap 检查，不依赖 svh。**不受影响**。但 lint 输出的 info 行可加 svh 摘要（"scene X svh = N"），便于 author 体感。

是否加 svh info：design.md Q3。当前默认 **不加**（保守，info 行已多）。

## Risks / Trade-offs

- **[1/20 是否激进]** body 文本贡献仅 5% dwell。可能导致 author 写过多 body 而 scene 实际太短停留不够。**应对**：MIN_DWELL_S 兜底 + 实测后调
- **[per-emphasis 不分档]** 当前 0.05 全档统一。linger 档（诗意 body-section）可能想 0.1，brief 档可能想 0.02。**应对**：现先统一，实测后如需分档加常量 `BODY_DISCOUNT_BY_EMPHASIS`
- **[已落地 mdx svh 即时变化]** 现 mdx Beat 1.1 / 1.2 svh 立即变小，scroll 节奏改变。**应对**：本 propose merge 时 act-1-v4-rewrite 同期跟进，旧 Beat 1.1/1.2 即将被替换，旧节奏不再相关。如有间隔期，cinema 行为仍正确（svh 变小不会破坏视觉，只会更紧凑）
- **[twin-column heading 归 body]** 把 col.heading 也按 body × 1/20 计。可能影响小标签的视觉重量。**应对**：col.heading 通常 ~5-10 字，body 化后影响 < 1s，可接受

## Migration Plan

1. **Phase 1** — 实现公式（scene-types.ts 改动 + 单元测试）
2. **Phase 2** — 删除 computeBlockSvh，处理 countCharsZh/En 引用清理
3. **Phase 3** — typecheck / 运行 unit test / build
4. **Phase 4** — sanity-check：浏览器开 Beat 1.1（旧 5 scene）滚一遍，看节奏是否舒服

回滚：单 commit，git revert 即回到 longest × 1.3 公式。

## Open Questions

1. **Q1 — 1/20 是否需要 per-emphasis 调整？** 实测后定。当前统一。
2. **Q2 — `countCharsZh / countCharsEn` 是否其他地方使用？** Phase 2 grep 后定保留 / 删除。
3. **Q3 — content-lint 是否加 svh info 行？** 默认不加，作者实测后如想要再开 sub-propose。
4. **Q4 — 单元测试**是否引入 vitest / jest？项目当前没有 test runner —— 加测试需带 test infra。如无测试 infra，design.md D6 改为 "tasks.md 标注待补"。

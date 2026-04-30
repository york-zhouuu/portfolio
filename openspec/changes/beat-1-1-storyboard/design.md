## Context

### 输入

- `docs/references/beat-1-1-script-v2.json` — 作者拍板的 v2 脚本（含 fixes_applied_2026_04_27 注解）
- 4 个 done propose 的能力（rhythm / emphasis / mapState / overlays / blueprint / data-hit / progressive reveal）

### 不再讨论的事

`docs/cinema-design-language.md` 已经把所有 design language 系统化。本 propose 只负责"把 v2 脚本翻译成 mdx-ready YAML 并落地"。任何系统级问题（CPS / fade band / spring profile）不在本 propose 范围。

## Goals / Non-Goals

**Goals:**
- v2 脚本 5 个 scene 完整落到 mdx
- 所有 lint warning 消除（除已知的 fallbackFigure 缺失）
- 现有 7 个 still scene 完全替换（不保留任何 grandfather）
- Build / typecheck 全绿
- Beat 1.1 在浏览器跑出 v2 脚本设计的视觉

**Non-Goals:**
- ❌ 不重写 v2 脚本——本 propose 是"实施"，作者拍板已落
- ❌ 不动其他 9 beat
- ❌ 不调任何系统参数（如果实测后需要调，独立 propose）
- ❌ 不写 fallbackFigure SVG（pre-existing missing，不阻塞）

## Decisions

### D1 — 5 个 scene 完整 frontmatter（v2 → mdx 翻译）

每个 scene 的 frontmatter 字段对应：

| v2 字段 | mdx YAML 字段 | 说明 |
|---|---|---|
| `id` | `id` | 直接复制 |
| `kind` | `kind` | 直接复制 |
| `rhythm` | `rhythm` | 直接复制 |
| `emphasis` | `emphasis` | 直接复制 |
| `camera.from / to / lookAt` | `camera: { from, to, lookAt }` | 字符串 `"[0, 0.2, 12]"` 转 YAML flow `[0, 0.2, 12]` |
| `paragraphs[]` | 因 kind 而异 | `title.text` / `lead.text` / `body-section.paragraphs[]` / `pull-quote.text` / `data-hit.caption + paragraphs[]` |
| `mapState` | `mapState` | 直接复制 |
| `note` | （丢弃） | 设计注释，不进 mdx |
| `enter / exit` | `enter / exit` | v2 没明确指定，按 kind 默认（见 D2） |

### D2 — Enter/Exit transition 默认值

v2 没显式指定 enter/exit，按 kind 选默认：

- `title` → `enter: fade, exit: slide-up`
- `lead` → `enter: fade, exit: fade`
- `body-section` → `enter: slide-side, exit: fade`
- `pull-quote` → `enter: scale-in, exit: fade`
- `data-hit` → `enter: fade, exit: fade`（视觉简洁，instrument-readout）

### D3 — i18n 文案（v2 中文 → mdx zh + en）

v2 脚本只有中文。需要为每个 paragraph / caption / heading 提供英文。**作者要校 en 文案，但本 propose 给一版 placeholder English** 让 schema 通过。

| zh | en（placeholder，作者可改）|
|---|---|
| 物理密度逼近绝对极值，社会网络却呈现彻底的原子化。 | Physical density approaches its absolute peak, while social networks have completely atomized. |
| 1,000 — 极微观半径内的常住人口 | 1,000 — residents within micro-scale radius |
| 0 — 日常发生的弱连接互动 | 0 — daily weak-tie interactions |
| 系统性的附近性抹除 | Systematic Erasure of Proximity |
| 在悉尼 Lane Cove 的高密度沙盘中…… | Inside Lane Cove's dense urban sand-table… |
| 但在社会拓扑学的观测下…… | Yet seen through social topology… |
| 真正的边界不再是混凝土，而是「注意力的位移」。 | The true boundary is no longer concrete — it is the displacement of attention. |
| 算法重塑的盲区 | The Algorithmic Blind Zone |
| 全球化信息流与手机屏幕…… | Global information flow and phone screens… |
| 数字空间抽干了本地的认知带宽…… | Digital space siphons off local cognitive bandwidth… |
| 人们对身边的物理生态彻底失明。 | People become entirely blind to nearby physical ecology. |

作者将来直接编辑 mdx 修订 en 文案。

### D4 — Beat-level frontmatter 调整

beat.id 保持 `open-real-world`（不改）— score 引用、analytics、URL fragment 都靠它。
beat.claim 保留为 v1 的 hook 句（sr-only / SEO）：

```yaml
claim:
  zh: |
    物理距离从未如此短，社会距离从未如此长。手机正在重写"附近"。
  en: |
    Physical distance has never been smaller. Social distance has
    never been greater. Phones are rewriting "the nearby."
```

beat.shotRef 保留 `act1.b1`，beat.fallbackFigure 保留 `/figures/act1-open.svg`。
score 内 Beat 1.1 的 range `[0, 0.1]` 不动——v2 内容仍在这 10% cinema-time 内运行。

### D5 — Camera 坐标值

v2 中字符串形式 `"[0, 0.2, 12]"` 转 YAML flow array `[0, 0.2, 12]`。最终 5 个 scene 的 camera：

| scene | from | to | lookAt |
|---|---|---|---|
| scene-1-1-thesis | [0, 0.2, 12] | [0, 0.2, 12] | [0, 0.2, 0] |
| scene-1-2-data-hit | [0, 0.5, 8] | [0, 0.5, 4] | [0, 0, 0] |
| scene-1-3-evidence | [2, 4, 3] | [2, 4, 3] | [0, 0, 0] |
| scene-1-4-core-concept | [2, 4, 3] | [4, 15, 6] | [0, 0, 0] |
| scene-1-5-macro | [4, 15, 6] | [-4, 15, 6] | [0, 0, 0] |

这些值都在世界尺度（±8 主体 + 偶尔到 15 god view），spring 跨边界过渡顺滑（v2 fixes_applied 已确认连续）。

### D6 — Lint 期望状态

实施完后 lint 应输出：

```
info · synthetic-socio-wind-tunnel.mdx · beat open-real-world: 
       rhythm=[STSBT] emphasis=[standard=2 dwell=2 linger=1] 
       mapState=[modes: matte,blueprint; overlays: agents_trajectories,digital_silos_heatmap]
```

无 char-cap warning（v2 已设计在 cap 内：每段最多 ~50 字 std cap 54 / linger 24 字 cap 30）；无节奏 warning（STSBT 序列：连续 still ≤ 1 / motion 0 / tracking ≤ 1，bridge 隔开）。

## Risks / Trade-offs

- **[v2 paragraphs 在 progressive reveal 下的实际节奏]** scene-1-3 两段 svh 大约 ~470svh + ~600svh = ~1100svh；scene-1-5 三段 svh 大约 1000svh。整 beat 总 svh 约 2700svh ≈ 27 viewport（之前 4050svh）。
  → 这是"读+看"的合理预算。如果实测觉得太快/慢，调 emphasis（dwell ↔ standard）。

- **[scene-1-3 两段 paragraph 的 progressive reveal 是否正常]** 当前 SceneBodySection 为 N=2 paragraph 各占 50% sceneLocalT 切片。
  → 实测验证段间无重叠 fade 是否舒适；如不行加 overlap 参数。

- **[Camera continuity 实测]** v2 fixes_applied 修了 1.4→1.5 的 jump。但 1.2→1.3（[0, 0.5, 4] → [2, 4, 3]，Δy=3.5）仍有较大 vantage 跳。
  → spring HOLD profile 200ms 收敛；视觉上是"切到斜俯角"，符合 still rhythm 进入 scene 的"换镜"语义。如果觉得突兀，1.3 from 改成 [0.5, 1.5, 3.5] 这种过渡值。

- **[en 文案是 placeholder]** 作者未来要校稿。
  → 本 propose 加 placeholder + 在 PR 描述里高亮，作者后续单独编辑。

- **[Score range 不变]** Beat 1.1 仍占 cinema-t [0, 0.1]，新内容塞同一 10%。
  → DOM scroll 高度变了（从 4050 → ~2700svh），但 piecewise mapping 自动调整，cinema-time 分配不变。

## Migration Plan

1. **Phase 1** — 删除 mdx 中 Beat 1.1 的现有 7 个 scene（保留 beat 顶层 claim / shotRef / fallbackFigure / sources）。
2. **Phase 2** — 写入 v2 的 5 个 scene（带 mapState / data-hit / paragraphs / camera）。
3. **Phase 3** — pnpm content:lint：应只剩 fallbackFigure 缺失 warning + 新的 info summary 行。
4. **Phase 4** — pnpm typecheck + build：全绿。
5. **Phase 5** — pnpm dev → 浏览器实测：相机 / mapState / overlay / progressive reveal 全部按设计运作。

回滚：单 commit 修改 mdx，git revert 即可回到 grandfather 状态。

## Open Questions

1. **Q1 — 1.2→1.3 Δy=3.5 的 vantage 跳是否需要 bridge scene 缓冲？** 实测后决定；如果突兀加一个短 bridge。
2. **Q2 — agents_trajectories 80 个数量在 1km² 沙盘视觉密度如何？** 实测后调（cinema-map-overlays 可加 prop）。
3. **Q3 — blueprint cross-fade 是否需要更长/更短的窗口？** 当前 5% sceneLocalT；实测后可调（mapState resolver 常量）。
4. **Q4 — en placeholder 文案的发布卡线**：是否需要在本 propose 内把 en 写到位？倾向"作者后续单独 PR"，本 propose 只保证 schema 通过 + zh 准确。

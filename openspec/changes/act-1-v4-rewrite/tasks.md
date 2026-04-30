## 1. Phase 1 — Schema 扩展（最小、向后兼容）

- [x] 1.1 `lib/cinema/scene-types.ts`：`TwinColumns` 改 `left/right` 为 `TwinColumnSide`，`items` 转 optional，加 `paragraphs?: I18nString[]`
- [x] 1.2 ~~`countCharsZh` / `countCharsEn` 在 body-section 分支加 twinColumns.{left,right}.paragraphs 迭代~~ — 改为 `countCharsByLayer`（cinema-cps-body-discount 引入），twinColumns paragraphs 计入 body 层（× 1/20）
- [x] 1.3 ~~`computeStillSvh` 在 body-section + twinColumns 场景调 `computeBlockSvh`~~ — `computeBlockSvh` 已在 cinema-cps-body-discount 删除；新公式 `weighted_chars = primary × 1.0 + body × 0.05` 自动覆盖 twinColumns paragraphs（视为 body）
- [x] 1.4 `lib/content/case-study-schema.ts`：`TwinColumnsSchema` 加 paragraphs 字段 + zod refine（每侧至少 items 或 paragraphs 之一）

## 2. Phase 2 — 渲染 + lint

- [x] 2.1 `components/cinema/scenes/SceneBodySection.tsx` twin-column 分支：每列渲染顺序 heading → paragraphs[] → items[]
  - paragraph 用 `text-body leading-[1.65] text-fg/88`，段间 `mt-3`
  - items[] 不变（既有 KvRow stagger fade-in）
  - 加上 paragraphs 与 items 都有时 items 用 mt-5 与 paragraphs 拉开间距
- [x] 2.2 `scripts/content-lint.ts`：char-cap 遍历加 twinColumns.{left,right}.paragraphs

## 3. Phase 3 — mdx 改动

- [x] 3.1 `content/case-studies/synthetic-socio-wind-tunnel.mdx`：删除 attention-boundary act 中 `open-real-world` / `blindspot-reveal` / `instrument-summon` 3 个旧 beat（分 3 次 Edit 顺序删除以避开多行 Edit 的 invisible-char mismatch）
- [x] 3.2 写入 `disappearance-of-nearby` beat 顶层 frontmatter（id / title / claim / shotRef / fallbackFigure / sources）
- [x] 3.3 写入 4 个 scene（实施时与 design.md D5 有微调，见 8.1/8.2）：
  - [x] 3.3.1 scene-1-1-paradox：title / **still** / linger / camera [0, 0.2, 5] hold（CameraRig 自动 3% drift）/ matte dim 0.5（_design.md D5 原稿用 tracking + from=[5.15], to=[5]，实施改 still 让 CameraRig 自动驱动 push-in，避免 TTTB 三连 tracking 违反 lint sequence rule_）
  - [x] 3.3.2 scene-1-2-evidence：body-section twin-column / motion / standard / camera [0, 0.2, 5]→[0, 8, 10] / matte dim 0.6 + digital_silos_heatmap（保留 motion 即接受 lint 的 "motion+reading-heavy" 提示作为已知 trade-off — 镜头从街道高度爬升到 god view 是叙事重点）
  - [x] 3.3.3 scene-1-3-attention-displacement：body-section right-column / tracking / standard / camera [0, 8, 10]→[4, 6, 8] / blueprint dim 0.5 + agents_trajectories
  - [x] 3.3.4 scene-1-4-sandbox-reveal：pull-quote / bridge / dwell / camera [4, 6, 8]→[0, 12, 12] / blueprint dim 0.3 + agents_trajectories

## 4. Phase 4 — Provenance 同步

- [x] 4.1 `docs/case-study-data-provenance.md` Act I 表重写：
  - 删除 v3 的 38k / 36% / 1km² 具体数（v4 不 surface 具体数字）
  - 留 ABS / Reddit 作 qualitative source 引用，Reddit 仍标 ⚠️ mock 待真爬
  - 三层机制链 + 产品名 surface 移到 Act II 表
  - 加 v4 落地变化对比表（v3→v4 各条目处理记录）
- [x] 4.2 Legacy 区加 Beat 1.3 instrument-summon 删除条目；`## TODO / 待补` 已含 Reddit 真爬条目

## 5. Phase 5 — 验证

- [x] 5.1 `pnpm typecheck` 通过
- [x] 5.2 `pnpm content:lint`：实际输出
  - `rhythm=[SMTB] emphasis=[standard=2 dwell=1 linger=1] mapState=[modes: matte,blueprint; overlays: digital_silos_heatmap,agents_trajectories]`（design.md 原 TMTB → 实施 SMTB，因 scene-1-1 改 still）
  - 零 char-cap warning（en 文案缩短到 cap 内）
  - 1 处 motion+reading-heavy info（scene-1-2，已在 3.3.2 接受为 trade-off）
  - fallbackFigure missing warning（pre-existing，所有 beat 共有）
- [x] 5.3 `pnpm build`：通过；bundle = 5.61kB（与 cinema-cps-body-discount 后状态一致）

## 6. Phase 6 — Score / cinema-t 校核

- [x] 6.1 检查 cinema score 派生方式：`lib/cinema/scene-types.ts:beatScrollSvh` 自动从 scenes[] 累计 svh budget，mdx 中**无显式 cinemaTRange**——svh 完全自动派生
- [x] 6.2 svh budget 自动派生 → mdx 改完即生效
- [x] 6.3 N/A — 无须 bump cinemaScoreVersion

### 6.4 发现并修复：score.sswt.ts beat ID 不匹配 ⚠️ critical

- [x] 6.4.1 _bug 表现_：浏览器实测 "镜头没跟上脚本"——CameraRig 用旧 shotRef `act1.b1` push-in，新 scene-level camera 完全没被用
- [x] 6.4.2 _根因_：`lib/cinema/score.sswt.ts` 还硬编码旧 act-1 三 beat (`open-real-world` / `blindspot-reveal` / `instrument-summon`)，与 mdx 新 beat id `disappearance-of-nearby` 不匹配。`scrollCinema.ts:buildBeatLayout` 按 `sb.id === fmb.id` 查找，找不到则 fmBeat = null → CameraRig 走 legacy shot fallback
- [x] 6.4.3 _修复_：`score.sswt.ts` Act I 由 3 beat 改为 1 beat：`disappearance-of-nearby` range [0, 0.35]，shotRef act1.b1 保留作 fallback（mdx scenes 优先）
- [x] 6.4.4 typecheck / content:lint 仍 ✓
- [x] 6.4.5 task 教训：所有未来「重命名 / 删除 mdx beat」的 propose **必须**同步更新 `lib/cinema/score.sswt.ts` 的 beat ID 列表 + range。后续 propose tasks.md 加固定项

### 6.6 ABS data + Deakin Photovoice 引用严谨化（作者要求 + Reddit 不可达）

- [x] 6.6.1 _Reddit 不可达_：WebFetch 对 reddit.com / old.reddit.com 均 hard-block。放弃 Reddit 路径
- [x] 6.6.2 _左栏 ABS 真数_：ABS 2021 census Lane Cove LGA QuickStats verified — 39,438 居民 / 56.7% apartment / ~11 km² / ~3,585 km⁻²
- [x] 6.6.3 _右栏 Deakin Photovoice 替代 Reddit_：The Conversation, Warner & Andrews (Deakin) 2019 Photovoice 研究 City of Yarra 公寓 families——3 段 verbatim quote + 完整 attribution
- [x] 6.6.4 _Schema 扩展_：`Citation` type + `TwinColumnSide.citations?: Citation[]`（zod refine 接受 items / paragraphs / citations 三者其一即可）
- [x] 6.6.5 _Renderer_：SceneBodySection twin-column 渲染顺序 paragraphs → items → citations（citations 用 italic + leading quote mark + 左侧细线 + attribution caption）
- [x] 6.6.6 _Char-cap body-discount_：content-lint 对 body 层 chunks（paragraphs / twinColumns paragraphs+citations / data-hit support paragraphs）应用 cap × (1/BODY_DISCOUNT_FACTOR)，与 svh 公式对齐——支持长文严谨内容不触发 cap warning
- [x] 6.6.7 _Provenance_：Act I 表加 4 行真数引用（ABS QuickStats / id.com.au / The Conversation / 用 ❌ 标记 Reddit 已弃）；External Reference Library 加 4 个 academic refs (Warner&Andrews 2019 / Kent et al 2023 / APS 2018 / AIHW 2023)
- [x] 6.6.8 typecheck / content:lint / build 全绿（5.61kB → 5.79kB，加约 180b 给富文本 + citation 渲染）

### 6.5 发现并修复：scene-1-2 motion svh 太短 ⚠️

- [x] 6.5.1 _bug 表现_：t=0.166（scene-1-2 evidence 中段，sceneLocalT≈77%）镜头位 [0, 5.1, 8.1] 与 twin-column 文本 fade-in 不同步——感觉镜头飞过去了文字才出
- [x] 6.5.2 _根因_：scene-1-2 rhythm=motion 走 `computeMotionSvh`（geometry-based, min 100 svh = 1 viewport），相机从 y=0.2 升到 y=8 (差 7.8 wu) 挤在 1 viewport，twin-column reading 根本来不及
- [x] 6.5.3 _修复_：scene-1-2 改 rhythm=tracking（reading-first, body-discount weighted svh ≈ 324 svh ≈ 3.2 viewport，相机线性平稳上升）。代价：lint 报 STT 2-连续-tracking warning，作为已知 trade-off 接受（v4 设计要求 1-2 + 1-3 都需要 tracking 配 reading）
- [x] 6.5.4 同步 bump cinemaScoreVersion 0.1.6 → 0.2.0 + `pnpm score:snapshot` 重写 cinema-score.json（hash 2b603f1e6a2f）
- [x] 6.5.5 lint 最终输出 `rhythm=[STTB]`，零 char-cap warning
- [x] 6.5.6 task 教训：rhythm=motion 不应配 reading-heavy body-section / twin-column。lint 早就提示，初次实施忽略是错误。后续 propose 避免这种组合（system 改进路径：让 motion 也走 weighted-text svh，待独立 propose）

## 7. Phase 7 — 浏览器实测 _(needs author)_

- [ ] 7.1 `pnpm dev` 起服务
- [ ] 7.2 访问 /work/synthetic-socio-wind-tunnel
- [ ] 7.3 滚到 Act I：
  - 1.1 paradox _(needs author)_：3% push-in 极缓推进 + 2 行文字 fade in
  - 1.2 evidence _(needs author)_：镜头爬升 + matte + digital_silos heatmap + 双栏对比文本（物理 / 社会）
  - 1.3 attention displacement _(needs author)_：blueprint 切换 + agents_trajectories + 3 段渐显
  - 1.4 sandbox-reveal _(needs author)_：bridge 末位 + scale-in 金句 + dim 0.3
- [ ] 7.4 _(needs author)_ 校 Act I 末位 [0, 12, 12] 视觉是 Act II.1 atlas-ledger 合理起点（暂保 hold）

## 8. Phase 8 — Open questions 闭环

- [ ] 8.1 Q1 — scene-1-2 emphasis 是 dwell（v4 原意）还是 standard（实施默认）？_(实测后作者拍板)_
- [ ] 8.2 Q2 — `center-large` layout 是否需要新 variant？_(实测后决定是否开 sub-propose)_
- [ ] 8.3 Q3 — score cinema-t 是否需要手动 bump cinemaScoreVersion？_(Phase 6 决定)_
- [ ] 8.4 Q4 — Reddit 数据真爬时间表 _(release 前作者补)_

## 9. 收尾

- [ ] 9.1 作者 sign-off Act I 整体体验
- [ ] 9.2 archive：`openspec archive act-1-v4-rewrite --yes`
- [ ] 9.3 起草 Act II propose（暂名 `act-2-v4-rewrite`）走相同流程，第一 scene from MUST = `[0, 12, 12]`

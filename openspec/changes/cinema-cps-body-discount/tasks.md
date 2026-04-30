## 1. Phase 1 — 实现 countCharsByLayer + 加权 computeStillSvh

- [x] 1.1 `lib/cinema/scene-types.ts`：新增常量 `BODY_DISCOUNT_FACTOR = 0.05`（放 CPS_ZH 同处）
- [x] 1.2 新增 `countCharsByLayer(scene): LayerCounts` 函数（design.md D2 完整实现）
- [x] 1.3 重写 `computeStillSvh` 使用加权公式（design.md D3）
- [x] 1.4 删除 `computeBlockSvh` 函数
- [x] 1.5 删除 `computeStillSvh` 内部对 `computeBlockSvh` 的两处分支调用（body-section 多段 / data-hit 多 item）

## 2. Phase 2 — countCharsZh / countCharsEn 引用清理

- [x] 2.1 `pnpm typecheck` 通过——无残留引用
- [x] 2.2 grep 全仓库 `countCharsZh|countCharsEn`——仅 `lib/cinema/scene-types.ts` 内部使用（components / scripts / lib 其他位置无引用）
- [x] 2.3 仅 scene-types.ts 内部使用——两个旧函数已与 computeBlockSvh 一并删除（被 countCharsByLayer 替代）
- [x] 2.4 N/A — 旧函数无外部使用
- [x] 2.5 N/A — 旧函数已删除，jsdoc 已写在 countCharsByLayer 头部说明 primary/body 分类

## 3. Phase 3 — 验证

- [x] 3.1 `pnpm typecheck` 通过
- [x] 3.2 `pnpm content:lint` 通过——char-cap 检查不变（仍是完整字数 cap），rhythm sequence 不变；输出与改动前一致（仅 pre-existing 警告 + 一处 char-cap on old Beat 1.1 scene-1-3 paragraph[1] 60>54，act-1-v4-rewrite 中删除该 scene 时一并消失）
- [x] 3.3 `pnpm build` 通过——bundle 5.61kB → 5.56kB，略减（删除 computeBlockSvh 的 ~13 行）

## 4. Phase 4 — Sanity check（无单元测试 infra 时）

- [x] 4.1 计算 demo case 手算验证（REACTION_S=0.5）：
  - body-section heading=20 / paragraphs=300 zh chars, emphasis=dwell (CPS=7) → weighted = 20 + 300×0.05 = 35; dwell = 35/7 + 0.5 = 5.5s ✓ 在 [MIN=1.5, MAX=6.5] 内
  - data-hit caption=15 / paragraphs=400 zh chars, emphasis=dwell → weighted = 15 + 400×0.05 = 35; dwell = 35/7 + 0.5 = 5.5s ✓
  - body-section heading=20 / paragraphs=2000 zh, emphasis=standard (CPS=9) → weighted = 20 + 100 = 120; dwell = 120/9 + 0.5 ≈ 13.8s → clamp 6.5s ✓ MAX 起作用
  - title text=40 zh, emphasis=linger (CPS=5) → primary=40, body=0; dwell = 40/5 + 0.5 = 8.5s → clamp 6.5s（无 discount，与改动前完全一致）
- [ ] 4.2 _(needs author)_ `pnpm dev` 起服务，访问 /work/synthetic-socio-wind-tunnel
- [ ] 4.3 _(needs author)_ 滚到 Beat 1.1 / Beat 1.2（旧内容仍在）：观察 scene 节奏是否更紧凑、camera 是否变快、文本 dwell 是否舒服

## 5. Phase 5 — 单元测试（如项目引入 test runner）

- [ ] 5.1 _(blocked: 当前无 vitest/jest)_ 引入 test runner（独立 propose）
- [ ] 5.2 _(blocked)_ `lib/cinema/__tests__/scene-types.test.ts` 写 5 个 case（design.md D6）

## 6. Open questions 闭环

- [ ] 6.1 Q1 — 1/20 是否要 per-emphasis 分档（实测后定）
- [ ] 6.2 Q2 — countCharsZh/En 引用清理（Phase 2 决定）
- [ ] 6.3 Q3 — content-lint 是否加 svh info 行（默认 no，作者实测后定）
- [ ] 6.4 Q4 — 单元测试 infra 是否在另一 propose 引入

## 7. 收尾

- [ ] 7.1 作者 sign-off 节奏改变体感
- [ ] 7.2 archive：`openspec archive cinema-cps-body-discount --yes`
- [ ] 7.3 触发 act-1-v4-rewrite 推进（提示作者发新长文本 v4 JSON）

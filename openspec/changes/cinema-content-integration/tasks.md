## 1. 已完成（不可逆）

- [x] 1.1 删除 `app/work/[slug]/storyboard/` 路由
- [x] 1.2 删除 `components/cinema/ContentPanel.tsx`（错误方向的产物）
- [x] 1.3 把 `app/work/[slug]/page.tsx` 恢复到 sr-only landmarks 状态（等待重新设计）

## 2. 框架确认（作者侧）

- [ ] 2.1 作者过 design.md D1（scene 是最小单元）— 同意 / 改 / 拒
- [ ] 2.2 作者过 design.md D2（6 维度框架）— Q-B：要不要加维度？
- [ ] 2.3 作者过 design.md D3（Beat 1.1 的 7 个 scene 推荐）— 哪几个不对？
- [ ] 2.4 作者答 Q-A / Q-B / Q-C / Q-D

## 3. 文档清理 housekeeping

- [ ] 3.1 README.md 去除 storyboard 段落
- [ ] 3.2 `docs/iteration-seams.md` 去除 storyboard render-target 描述
- [ ] 3.3 `docs/content-principles.md` 调整任何"storyboard 阅读"的描述
- [ ] 3.4 旧 propose（sswt-cinematic-case-study / sswt-case-study-content）打 SUPERSEDED 标
- [ ] 3.5 `lib/content/case-study-schema.ts` 与 `scripts/content-lint.ts` 注释清理

## 4. 解锁实施 propose

作者答完 Q-A → Q-D 后开新 propose（暂名 `cinema-scene-system`）：

- [ ] 4.1 起草实施 propose（schema / camera score / 渲染层 三件并行）
- [ ] 4.2 schema 重构：body → scenes[]
- [ ] 4.3 camera score 重构：1 beat × N scenes
- [ ] 4.4 渲染层：layout primitive (centered / right-column / twin-column / pull-quote-large / ...)
- [ ] 4.5 transition primitive (fade / slide-up / slide-side / scale-in / counter)
- [ ] 4.6 PoC: Beat 1.1 完整实施一遍跑给作者看
- [ ] 4.7 作者确认后 batch 推到 Beat 1.2 – 3.3

## 5. 收尾本 propose

- [ ] 5.1 实施 propose 完成且 PoC 通过后归档本 propose
- [ ] 5.2 把 6 维度框架沉淀到 `docs/scene-design-framework.md`
- [ ] 5.3 把 layout/transition primitive 列表沉淀到 `docs/iteration-seams.md`

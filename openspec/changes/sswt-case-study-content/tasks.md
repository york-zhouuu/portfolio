## 1. 清场

- [ ] 1.1 删除现存 Beat 1.1 的 `body` 与 `pullQuote`（之前的"演示用"散文），保留 claim / HUD / shotRef / fallbackFigure / sources 不动
- [ ] 1.2 删除 Act 1 现存的 epigraph 与 references（`sswt-content` 之前那一稿写的，与本次模板不完全一致），等 Beat 1.1–1.3 全锁定后再统一回填
- [ ] 1.3 验证 `pnpm content:lint` 与 `pnpm typecheck` 仍通过（schema 字段都是 optional）

## 2. Beat 1.1 — open-real-world

- [ ] 2.1 取材：从源项目读取 Decision / Artifact 候选池（3–5 项），交作者评审挑选
- [ ] 2.2 草稿：基于选定的 Decision + Artifact 写双语 body + pullQuote（≤350 字 / ~280 words）
- [ ] 2.3 评审：作者反馈
- [ ] 2.4 修订（按需，多轮）
- [ ] 2.5 锁定：写入 frontmatter；进入下一 beat

## 3. Beat 1.2 — blindspot-reveal

- [ ] 3.1 取材：候选 Decision/Artifact 池
- [ ] 3.2 草稿：双语 body + pullQuote
- [ ] 3.3 评审
- [ ] 3.4 修订
- [ ] 3.5 锁定

## 4. Beat 1.3 — instrument-summon

- [ ] 4.1 取材
- [ ] 4.2 草稿
- [ ] 4.3 评审
- [ ] 4.4 修订
- [ ] 4.5 锁定

## 5. Act 1 通读 + 模板调整

- [ ] 5.1 三 beat 全部锁定后，整页通读
- [ ] 5.2 找出连贯性问题（重复表述 / 跳跃 / voice 不齐）
- [ ] 5.3 微调 body 措辞（不重写，只磨边）
- [ ] 5.4 写 Act 1 epigraph（一句概括的引导语）
- [ ] 5.5 写 Act 1 references（基于三 beat 引用的物件汇总，加 1–3 条外部经典文献）
- [ ] 5.6 与作者过一次"是否要调整模板再进 Act 2"的决策

## 6. Act 2 / Act 3（本 propose 不交付）

- [ ] 6.1 暂缓——等 Act 1 通读完成
- [ ] 6.2 决策：是否沿用相同模板 / 调整模板 / 新建 propose

## 7. 收尾（Act 1 三 beat 锁定后）

- [ ] 7.1 `pnpm content:lint` 全通过（包括术语锁定与禁用 mock persona 检查在所有新增双语字段上）
- [ ] 7.2 `pnpm typecheck` 全通过
- [ ] 7.3 storyboard 路由肉眼通读：Act 1 三 beat 完整渲染（body + pullQuote + epigraph + references）
- [ ] 7.4 cinema 路由肉眼检查：HUD claim/letterbox 仍与原 schema 字段一致；未被本次内容工作误伤

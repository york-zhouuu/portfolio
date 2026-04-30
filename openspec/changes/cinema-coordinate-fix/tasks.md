## 1. Phase 0 — Apply sign flips

- [x] 1.1 `ribbonToPoly`: `z: p.y` → `z: -p.y`
- [x] 1.2 `roadCenterline`: `z: (a.y + b.y) / 2` → `z: -(a.y + b.y) / 2`
- [x] 1.3 Grep 搜了所有 `.y → .z` 转换：仅 agentSampling.ts 这两处。`roadWidth` 用 distance（sign-invariant），无需改
- [x] 1.4 顶部 doc comment block 已加（"DO NOT REMOVE" 标志 + SandTable rotateX 说明）

## 2. Phase 1 — Verify build pipeline

- [x] 2.1 typecheck 通过
- [x] 2.2 content:lint 通过
- [x] 2.3 build 通过（5.8kB → 5.8kB 不变）
- [x] 2.4 无新 warning

## 3. Phase 2 — Manual visual verification

- [ ] 3.1 _(needs author)_ `pnpm dev` 启动
- [ ] 3.2 _(needs author)_ 滚到 Beat 1.1 scene 1.2 (overlay = agents_trajectories)，观察车流轨迹
- [ ] 3.3 _(needs author)_ 确认车在可见的 Pacific Highway 上（最显眼的主干道），而不是镜像偏移到另一侧
- [ ] 3.4 _(needs author)_ 确认人在 walkway 上（不穿建筑、不跨水）
- [ ] 3.5 _(needs author)_ 滚到 scene 1.5 (god view + digital_silos_heatmap)，确认红光柱位置在 walkway 上

## 4. Phase 3 — Contingency: mirror in other direction

- [ ] 4.1 _(if needed)_ 如果 fix 后镜像方向变了（之前在 +y 一侧，现在在 −y 一侧），说明 rotateX 的 sign 分析反了。把 `-p.y` 再翻成 `+p.y`，验证

## 5. Phase 4 — 文档同步

- [ ] 5.1 `docs/cinema-design-language.md` §11.6 / §11.8：补一句"agent paths 与 SandTable 共用 rotateX(-π/2) 约定"
- [ ] 5.2 archive _(after author sign-off)_

## 6. Open questions

- [ ] 6.1 Q1 — `Vec2` 类型是否需要重命名 z field（low priority）
- [ ] 6.2 Q2 — silos 也用 path[0]，应该自动跟着修，验证一下
- [ ] 6.3 Q3 — mdx 镜头坐标不受影响（已确认）

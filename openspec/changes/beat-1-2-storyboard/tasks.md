## 1. Phase 1 — 替换 mdx Beat 1.2 内容

- [x] 1.1 单次 Edit 替换 `content/case-studies/synthetic-socio-wind-tunnel.mdx` 中 line 212–309 的 grandfather Beat 1.2（删除 `title/lead/body/pullQuote/hud` legacy 字段，重写 `claim`，加 `scenes:` 数组）
- [x] 1.2 写入 scene-1-2-1-data-hit：data-hit / tracking / dwell / camera [-4,15,6]→[0,8,4] / mapState blueprint dim 0.6 + agents_trajectories
- [x] 1.3 写入 scene-1-2-2-mechanism：body-section right-column / still / standard / 4-paragraph progressive reveal / camera hold [0,8,4] / mapState blueprint dim 0.5 + agents_trajectories
- [x] 1.4 写入 scene-1-2-3-lever：pull-quote / bridge / dwell / camera hold [0,8,4] / mapState matte dim 0.7（自动 cross-fade 至 Beat 1.3 matte 起点）

## 2. Phase 2 — 验证

- [x] 2.1 pnpm content:lint — 输出符合预期 `rhythm=[TSB] emphasis=[standard=1 dwell=2] mapState=[modes: blueprint,matte; overlays: agents_trajectories]`；初次 lint 报 3 处 char-cap warning（en 文案过长），已缩减至 cap 内；零 rhythm sequence warning；emphasis distribution 警告（standard 38% < 40%）是文件级累计值，非 Beat 1.2 单独触发，已在 design.md D5 标注为已知 trade-off
- [x] 2.2 pnpm typecheck 通过
- [x] 2.3 pnpm build 通过（5.8kB → 5.61kB，因删除 grandfather body 长文案 ~80 行 mdx 而略减）

## 3. Phase 3 — 浏览器实测 _(needs author)_

- [ ] 3.1 `pnpm dev` 起服务
- [ ] 3.2 访问 /work/synthetic-socio-wind-tunnel
- [ ] 3.3 滚到 Beat 1.2：
  - 1.2.1 _(needs author)_：从 god view [-4,15,6] tracking 拉近到 [0,8,4]，14% 数字 fade in，agents 持续走动
  - 1.2.2 _(needs author)_：still 镜头 hold [0,8,4]，4 段 paragraph 错峰 reveal，agents 仍在 blueprint 模式下走动
  - 1.2.3 _(needs author)_：bridge 期间 pull-quote scale-in + blueprint→matte cross-fade，金句"注意力可以被拨"压轴
- [ ] 3.4 _(needs author)_ 检查 Beat 1.1 末位 ([-4, 15, 6]) → Beat 1.2 起点 zero-jump
- [ ] 3.5 _(needs author)_ 检查 Beat 1.2 末位 ([0, 8, 4]) 视觉是 Beat 1.3 合理起点（暂 hold 在 matte mode，无 overlay）

## 4. Phase 4 — Open questions 闭环

- [ ] 4.1 Q1 — 1.2.2 hold 是否需要微小 push-in（实测后回填 design.md）
- [ ] 4.2 Q2 — 1.2.3 cross-fade 与 pull-quote scale-in 是否冲突（实测后回填）
- [ ] 4.3 Q3 — emphasis 分布 dwell 2/standard 1 是否被 lint 报警告（实测确认）
- [ ] 4.4 Q4 — Beat 1.3 storyboard 接受 [0, 8, 4] 起点？（由下一个 propose 评估）

## 5. 收尾

- [ ] 5.1 作者 sign-off Beat 1.2 整体体验
- [ ] 5.2 archive：`openspec archive beat-1-2-storyboard --yes`
- [ ] 5.3 起草 Beat 1.3 storyboard propose（暂名 `beat-1-3-storyboard`），明确读取本 design.md D6（camera 接续协议）

## 6. Open questions

- [ ] 6.1 是否要把 v2 脚本快照存到 `docs/references/beat-1-2-script-v1.json`（与 Beat 1.1 一致）？倾向「3-scene 紧凑版本结构简单，design.md D1 表已是 source of truth，不再单独存 json」——记录此决定，archive 时回填本 task。

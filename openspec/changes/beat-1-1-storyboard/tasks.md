## 1. Phase 1 — 删除 grandfather Beat 1.1 内容

- [x] 1.1 / 1.2 / 1.3 / 1.4 — 删除 7 个 grandfather scene 与 Phase 2 的写入合并到一次 Edit 操作；保留 beat-level 字段

## 2. Phase 2 — 写入 v2 五个 scene

- [x] 2.1 scene-1-1-thesis：title / still / dwell / camera [0,0.2,12] held / mapState matte dim 0.8
- [x] 2.2 scene-1-2-data-hit：data-hit / tracking / dwell / camera [0,0.5,8]→[0,0.5,4] / matte dim 0.8 + agents_trajectories
- [x] 2.3 scene-1-3-evidence：body-section / still / standard / 2-paragraph progressive reveal / matte dim 0.5 + agents_trajectories
- [x] 2.4 scene-1-4-core-concept：pull-quote / bridge / linger / camera [2,4,3]→[4,15,6] / blueprint dim 0.5
- [x] 2.5 scene-1-5-macro：body-section / tracking / standard / 3-paragraph progressive reveal / camera [4,15,6]→[-4,15,6] / blueprint + digital_silos_heatmap

## 3. Phase 3 — Lint / typecheck / build

- [x] 3.1 content:lint — 输出 `rhythm=[STSBT] emphasis=[standard=2 dwell=2 linger=1] mapState=[modes: matte,blueprint; overlays: agents_trajectories,digital_silos_heatmap]`，零 char-cap warning（en 缩短到 cap 内）；剩余唯一相关 warning 是 emphasis distribution linger 20%（5 scene 下 1 个 linger = 20%，阈值 15% 是大 N 取的；可忽略）
- [x] 3.2 typecheck 通过
- [x] 3.3 build 通过（5.8kB 不变）

## 4. Phase 4 — 浏览器实测

- [ ] 4.1 `pnpm dev` 起服务
- [ ] 4.2 访问 /work/synthetic-socio-wind-tunnel
- [ ] 4.3 滚到 Beat 1.1：
  - scene-1-1：远视 + 屏息 push-in（Z=12 → ~Z=11.7）_(needs author)_
  - scene-1-2：tracking shot 推入 + 80 个白点开始动 + 两行数据 fade in _(needs author)_
  - scene-1-3：still 斜俯角，两段 paragraph 错峰 reveal，agents 还在动 _(needs author)_
  - scene-1-4：bridge 期间相机升空 + matte→blueprint cross-fade + linger 金句 _(needs author)_
  - scene-1-5：god view tracking arc + blueprint X-ray + 80 红光柱 pulse + 三段 paragraph 错峰 _(needs author)_

## 5. Phase 5 — Open questions 闭环

- [ ] 5.1 Q1 — 1.2→1.3 Δy 跳是否需要 bridge 缓冲（实测后回填 design.md）
- [ ] 5.2 Q2 — agents 80 个密度（实测后回填）
- [ ] 5.3 Q3 — blueprint cross-fade 5% 窗口体感（实测后回填）
- [ ] 5.4 Q4 — en 文案校稿（作者后续单独 PR）

## 6. 收尾

- [ ] 6.1 作者 sign-off Beat 1.1 整体体验
- [ ] 6.2 archive：`openspec archive beat-1-1-storyboard --yes`
- [ ] 6.3 起草 Beat 1.2 storyboard propose（暂名 `beat-1-2-storyboard`）走相同流程

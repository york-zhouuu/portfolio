## 1. Phase 1 — Person geometry rewrite

- [x] 1.1 删除 `buildPersonGeometry` 内现有 6-primitive 代码（含手臂）
- [x] 1.2 重写 7.5-head architectural-figure 比例：head r=0.020 / torso h=0.105 / legs h=0.150
- [x] 1.3 单色调：上身 `#dcd5c8`、下身 `#a8a39a`
- [x] 1.4 验证总高 = 0.150 + 0.105 + 0.040 = 0.295 ≈ 0.30；head/total = 0.040/0.295 ≈ 1/7.4

## 2. Phase 2 — Car geometry rewrite (ExtrudeGeometry side profile)

- [x] 2.1 `buildCarBodyShape()` 9-point sedan profile（rear → trunk → roof rear → roof front → windshield → bonnet → front bumper → bottom edge）
- [x] 2.2 ExtrudeGeometry depth=0.060；长 0.18 高 0.04
- [x] 2.3 paintConditional：vertex.y > 0.030 → glass `#3a3833`；否则 body `#cfc6b8`
- [x] 2.4 4 wheels (cyl r=0.014, 8 segs)，rotateZ π/2，xz=±0.060/±0.034，y=0.014
- [x] 2.5 wheels `#252320`
- [x] 2.6 merge 进单一 BufferGeometry

## 3. Phase 3 — Material tuning

- [x] 3.1 person material：vertexColors / flatShading / roughness 0.85 / metalness 0
- [x] 3.2 car material：vertexColors / flatShading / roughness 0.75 / metalness 0.05
- [x] 3.3 移除所有 emissive / emissiveIntensity

## 4. Phase 4 — 验证

- [x] 4.1 typecheck 通过
- [x] 4.2 content:lint 通过（无新 warning）
- [x] 4.3 build 通过（5.8kB 不变）
- [ ] 4.4 _(needs author)_ 浏览器实测
- [ ] 4.5 _(needs author)_ sign-off：是否补回手臂 / 调 profile / 调色板

## 5. Phase 5 — 文档同步

- [ ] 5.1 `docs/cinema-design-language.md` §11.8：cinema-map-overlays 标 ✅ done; agent-models-v2-minimal 标 ✅
- [ ] 5.2 archive _(after author sign-off)_

## 6. Open questions 闭环

- [ ] 6.1 Q1 — armless 是否需要补回（实测后回填 design.md）
- [ ] 6.2 Q3/Q4 — agent yaw rotation 是否需要随路径方向（实测后回填）

## 1. Phase 1 — MapOverlay 接口拓展

- [x] 1.1 MapOverlayProps 加 sandTable: NormalizedSandTable | null
- [x] 1.2 MapOverlay forward sandTable
- [x] 1.3 CinemaCanvas 传 sandTable 到 MapOverlay
- [x] 1.4 typecheck 通过

## 2. Phase 2 — agentSampling helper

- [x] 2.1 新建 `lib/cinema/agentSampling.ts`：`Agent` type + `sampleAgents`
- [x] 2.2 mulberry32 PRNG
- [x] 2.3 sampleAgents：road polygon 面积加权 + 顶点子序列 path + length + phase/speed
- [x] 2.4 positionAlongPath（按 cumulative segment length 插值）
- [x] 2.5 null sandTable 返回空数组（graceful fallback）

## 3. Phase 3 — AgentsTrajectoriesOverlay

- [x] 3.1 新建 AgentsTrajectoriesOverlay.tsx
- [x] 3.2 useMemo 调 sampleAgents(table, 80, 42)
- [x] 3.3 InstancedMesh + sphereGeometry 0.025 + meshBasicMaterial 白色
- [x] 3.4 useFrame 推进每个 agent 沿 path 的 t，setMatrixAt 更新（y=0.04）
- [x] 3.5 opacity = progress

## 4. Phase 4 — DigitalSilosOverlay

- [x] 4.1 新建 DigitalSilosOverlay.tsx
- [x] 4.2 useMemo 调 sampleAgents(table, 80, 42) — 同 seed 共享位置
- [x] 4.3 InstancedMesh + cylinder(0.018/0.022/0.5) + meshBasicMaterial #ff3366 doubleSide
- [x] 4.4 useEffect setMatrixAt 锁 silo 在 path[0]，中心 y=0.25
- [x] 4.5 useFrame pulse：opacity = progress × (0.6 + 0.4 × sin(time × 1.5 × 2π))

## 5. Phase 5 — Registry + lint

- [x] 5.1 OVERLAY_REGISTRY 注册 agents_trajectories + digital_silos_heatmap
- [x] 5.2 KNOWN_OVERLAYS 加这两个名字
- [x] 5.3 lint 不报 unknown-overlay warning

## 6. Phase 6 — 验证

- [x] 6.1 typecheck + content:lint + build 全绿
- [x] 6.2 grandfather：Beat 1.1 build size 5.8kB（无变化）
- [ ] 6.3 测试 mdx 加 overlay scene 看球/柱出现 _(needs author)_
- [ ] 6.4 性能：80 instance 60fps _(needs author)_

## 7. Phase 7 — 文档同步

- [x] 7.1 docs/cinema-design-language.md §11.8 cinema-map-overlays 标 ✅
- [ ] 7.2 archive _(after author sign-off)_

## 8. Open questions

- [ ] 8.1 Q1 80 agents 数量是否合适
- [ ] 8.2 Q2 silos pulse 1.5Hz 是否过激
- [ ] 8.3 Q3 sandTable=null 降级路径已设计
- [ ] 8.4 Q4 agent trail 效果是否需要——观察后决定

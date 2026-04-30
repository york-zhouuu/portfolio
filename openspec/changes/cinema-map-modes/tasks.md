## 1. Phase 1 — Types

- [x] 1.1 `MaterialSpec.edges?: EdgeSpec` + `EdgeSpec = { color, opacity, threshold? }` 加到 registry
- [x] 1.2 MaterialFactory 签名不变，向后兼容

## 2. Phase 2 — Blueprint factory

- [x] 2.1 新建 `lib/cinema/materials/blueprint.ts`：blueprintMaterialFactory（不依赖 theme，固定冷蓝配色）
- [x] 2.2 `MATERIAL_REGISTRY.blueprint = blueprintMaterialFactory`
- [x] 2.3 typecheck 通过

## 3. Phase 3 — SandTable edges 渲染

- [x] 3.1 SandTable 重构：抽 `<Layer>` helper 处理 mesh + 可选 edges
- [x] 3.2 EdgesGeometry threshold 由 spec.edges.threshold ?? 15 控制；lineBasicMaterial 用 spec.edges.color + opacity*alphaScale
- [x] 3.3 EdgesGeometry useMemo 按 (geometry, spec.edges) 缓存
- [x] 3.4 cross-fade layersPrev 同样走 Layer helper，自动带 edges 支持
- [x] 3.5 typecheck + build 通过

## 4. Phase 4 — Lint 注册新 mode

- [x] 4.1 KNOWN_MODES 加 `"blueprint"`
- [x] 4.2 lint 不报 unknown-mode warning（验证：当前 Beat 1.1 无 mapState，所以无 mode warning；blueprint 一旦使用也不会触发）

## 5. Phase 5 — 验证 + grandfather 兼容

- [x] 5.1 typecheck + content:lint + build 全绿
- [x] 5.2 grandfather：Beat 1.1 7 scene 无 mapState 字段，build size 5.8kB → 5.8kB（zero diff）
- [ ] 5.3 测试用 mdx 加 blueprint scene 验证 _(needs author)_
- [ ] 5.4 测试 cross-fade matte→blueprint 丝滑 _(needs author)_

## 6. Phase 6 — 文档同步

- [x] 6.1 `docs/cinema-design-language.md` §11.8 cinema-map-modes 标 ✅
- [ ] 6.2 archive _(after author sign-off)_

## 7. Open questions

- [ ] 7.1 Q1 edges threshold 15° 是否合适——实测后回填
- [ ] 7.2 Q2 蓝图配色是否需要 theme-derived——保留观察
- [ ] 7.3 Q3 ground 切换是否"抽地皮"感——实测确认

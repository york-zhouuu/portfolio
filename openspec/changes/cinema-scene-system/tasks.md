## 1. 类型层

- [ ] 1.1 写 `lib/cinema/scene-types.ts`：SceneKind / LayoutKind / TransitionKind / DurationKind / Scene / KvItem / SceneCamera
- [ ] 1.2 写 `lib/content/case-study-schema.ts` 中的 Zod scene schemas（discriminated union）；Beat 加 scenes 字段（optional 期）
- [ ] 1.3 typecheck 通过

## 2. 内容迁移（Beat 1.1 PoC）

- [ ] 2.1 把 Beat 1.1 的 frontmatter 改写：title / lead / body / pullQuote 折叠为 7 条 scene
- [ ] 2.2 每条 scene 的 camera segments 续接（最末 to == 下一 from）
- [ ] 2.3 content-lint 通过

## 3. 渲染层

- [ ] 3.1 写 `lib/cinema/scrollCinema.ts` 的 `sceneAt(score, frontmatter, t)` — 给定全局 t 返回当前 scene + localT
- [ ] 3.2 写 `components/cinema/scenes/SceneTitle.tsx`
- [ ] 3.3 写 `components/cinema/scenes/SceneLead.tsx`
- [ ] 3.4 写 `components/cinema/scenes/SceneBodySection.tsx` — 含 right-column + twin-column 两种 layout
- [ ] 3.5 写 `components/cinema/scenes/ScenePullQuote.tsx`
- [ ] 3.6 写 `components/cinema/scenes/SceneBreath.tsx`（基本是 null + comment）
- [ ] 3.7 写 `components/cinema/SceneLayer.tsx` — 根据 kind 派发到 primitive
- [ ] 3.8 transition util：`lib/cinema/transitions.ts` 计算 enterProgress / exitProgress

## 4. Camera 协调

- [ ] 4.1 修改 `components/cinema/CameraRig.tsx` — 从 scene-level camera 算位置（scene.camera.from / to）
- [ ] 4.2 score.sswt.ts 不再用 Beat 1.1 的 shotRef（scene 自带 camera）；保留其它 9 beat 的旧 shotRef 兼容期

## 5. 页面接入

- [ ] 5.1 改 `app/work/[slug]/page.tsx`：把 HudLayer 主路径改为 SceneLayer
- [ ] 5.2 HudLayer.tsx 退化为 in-world-label only
- [ ] 5.3 page.tsx 的 article 高度计算更新（按 scene total svh，不再 totalBeats * 100）

## 6. 验收

- [ ] 6.1 `pnpm typecheck` 通过
- [ ] 6.2 `pnpm content:lint` 通过
- [ ] 6.3 `pnpm build` 通过
- [ ] 6.4 dev 实测：滚 Beat 1.1 全 7 个 scene，每个 scene 的 camera + text 同步正确
- [ ] 6.5 作者过 PoC（视觉确认后再批量推到 Beat 1.2 - 3.3）

## 7. 收尾

- [ ] 7.1 cinema-content-integration propose 标完成（决策已实施）
- [ ] 7.2 把 Scene 的 6 维度框架沉淀到 `docs/scene-design-framework.md`
- [ ] 7.3 layout / transition primitive 清单沉淀到 `docs/iteration-seams.md`

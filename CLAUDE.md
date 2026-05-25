# Portfolio — collaboration notes

Cinema作品集站，旗舰案例 Synthetic Socio Wind Tunnel。

## 核心原则（按重要性）

### 1. 被动电影呈现 > 主动点击交互

**Default：用户只滚动。**所有信息通过 cinema 自身的镜头 + 沙盘事件 + HUD 文字**播放呈现**，不要求用户 click/hover 才能看见关键内容。

不允许：
- Cinema canvas 内的 click 入口（"点这个 agent 打开"、"点这个数字看详情"）
- Hover 触发的 modal / dialog
- 必须 click 才能继续推进的 UX

允许：
- Chrome 层的 navigation click（顶 nav 的 Stories ▾ / 语言切换）
- Hover 浮出 supplementary note（**非关键信息**——只是"想多看才看"）
- 自循环动画（push moment cycle、tie timelapse）按 scroll 进 scene 时自动播

每个 scene 应该是**自播放的一段叙事**：滚到那里，事情自己发生，文字自己出现，用户只是观众。

### 2. 一镜到底（no hard cut）

镜头是 scroll 的纯函数：`scrollY → t → camera position`。所有转场只能是 push-in / pull-back / match-dissolve / focus-rack。禁硬切、禁淡黑、禁组件切换。

### 3. 沙盘是主角

Act 2 的沙盘上必须有**真实事件**发生（真实数据驱动，不是装饰）。文本退为 chrome / 字幕角色，沙盘占视觉主体。Apple-hero 风文本仍可用，但 dim 不应高到把沙盘吃掉。

### 4. 真实数据 > 程序合成

涉及 SSWT 仪器输出的可视化（agent 位置、push event、tie graph、POI hub），优先用从 SSWT 仓库 export 的真实数据。程序合成（如 sampleWalkers 200 walkers）仅用于**背景密度填充**，不承担叙事 claim。

## 技术规则

### React Three Fiber overlay 的 DOM 渲染

R3F Canvas 使用自己的 reconciler。`react-dom` 的 `createPortal` 在 R3F 树里**不能**用——会报 `<Span> is not part of the THREE namespace`。

要在 overlay 触发 DOM UI（如 push notification card），用 **window object pubsub + 外部 DOM layer** 模式：

```ts
// In R3F overlay (inside Canvas)
useFrame(() => {
  const opacity = ...
  ;(window as any).__pushCardState = { opacity, content }
})

// In separate DOM component (in layout, outside Canvas)
const ref = useRef<HTMLDivElement>(null)
useEffect(() => {
  let raf = 0
  const tick = () => {
    const s = (window as any).__pushCardState
    if (ref.current && s) ref.current.style.opacity = String(s.opacity)
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}, [])
```

避免 60fps setState（性能差）；直接改 DOM。

### 数据 export 模式

SSWT 真实数据通过 `scripts/sync-*.ts` 脚本手动 export 到 `public/case-studies/sswt/...`。Build 不依赖 SSWT 仓库可用性——数据 commit 进 portfolio repo。

Building / road IDs 在 portfolio map-geometry.json 与 SSWT atlas 完全一致——location_id 可直接跨仓库 lookup。

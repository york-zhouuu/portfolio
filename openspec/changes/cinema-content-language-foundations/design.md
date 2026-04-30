## Context

### 上一 propose 的成果与遗留

`cinema-scroll-pacing` 已落：
- ✅ 4 种 rhythm 设计**词汇**（design.md），但代码只实现 3 种（motion / still / bridge）
- ✅ Sticky text 架构 + 屏息漂移
- ✅ CPS-based emphasis dwell
- ✅ Piecewise scroll-to-t 映射
- ❌ 沙盘永远是同一份 matte 渲染
- ❌ "tracking rhythm"（设计语言文档已定义但未实现）
- ❌ 多 paragraph 错峰（progressive reveal 已 spec'd 未实现）
- ❌ data-hit kind（spec'd 未实现）

### Beat 1.1 v2 设计稿揭示的需求

`docs/references/beat-1-1-script-v2.json` 5 scene 中：
- 4 个 scene 用了 `mapState`（mode / dim / overlay 三种字段都有）
- 2 个 scene 用了 tracking rhythm
- 2 个 scene 用了 progressive reveal（多 paragraph）
- 1 个 scene 用了 data-hit kind
- 4 种 overlay / mode 类型出现：matte / blueprint / agents_trajectories / digital_silos_heatmap

**结论**：所有缺失的能力都被 Beat 1.1 同时需要。**接口必须先一并落地，具体 overlay / 材质实现可以后置**——否则 Beat 1.1 就不可行。

### Stakeholders
- **作者**：希望按 v2 脚本去写所有 beat 时，schema 接受、build 不挂
- **后续 propose**：`cinema-map-modes` 注册 blueprint material，`cinema-map-overlays` 注册各种 overlay；都依赖本 propose 的接口

## Goals / Non-Goals

**Goals:**
- mapState schema + resolver 跑通（数据流）
- overlay 接口 + 材质接口可插拔，**未注册的 name 视为 no-op**
- tracking rhythm 完整实现（schema + CameraRig + lint）
- data-hit kind 完整实现（schema + renderer）
- progressive reveal 完整实现（body-section 多 paragraph 错峰）
- 现有 Beat 1.1（grandfather 全 still）继续工作不变

**Non-Goals:**
- ❌ 不实现 blueprint 材质（留给 `cinema-map-modes`）
- ❌ 不实现 agents_trajectories 等具体 overlay（留给 `cinema-map-overlays`）
- ❌ 不重写 Beat 1.1 MDX 内容（留给 `beat-1-1-storyboard`）
- ❌ 不动 CPS 数字 / sticky 架构 / 屏息漂移（保留 cinema-scroll-pacing 决策）
- ❌ 不写 trajectory recorder 工具（独立 future propose，已记入 memory）

## Decisions

### D1 — mapState 4 字段，全 optional

```ts
type MapMode = "matte" | "blueprint" | string;  // string 兜底未来扩展
type MapOverlayName = "none" | "agents_trajectories" | "digital_silos_heatmap" | string;

interface MapState {
  mode?: MapMode;          // default "matte"
  dim?: number;            // 0..1，default 1.0（不 dim）
  overlay?: MapOverlayName;// default "none"
  highlight?: string[];    // 高亮 building / road id（未来扩展，schema 留位）
}
```

**理由**：
- 4 字段独立可空——未填任何字段的 scene 还是当前默认渲染（matte, dim=1, no overlay）
- mode 与 overlay 用 `string` 兜底——未注册的名字渲染层 fallback 到 default，**不阻塞 build**
- highlight 暂留位置（schema 接受 `string[]`）；本 propose 不实现，留给后续 propose

**替代方案**：
- 把 mode / overlay 严格枚举：会让 `blueprint` 等未实现的值在 schema 阶段就报错——违反"接口先行，能力后补"的原则。否决。

### D2 — useResolvedMapState(t, layout) hook

```ts
function useResolvedMapState(t: number, acts: CaseStudyAct[]): {
  mode: MapMode;
  dim: number;
  overlay: MapOverlayName;
  overlayProgress: number;  // 0..1，正在 fade in/out 的进度
  highlight: string[];
}
```

每帧基于当前 scene + 邻接 scene 计算：
- `dim`：lerp（连续值平滑插值）
- `mode`：scene 之间 cross-fade 区间（hardcode 200ms cross-fade window）
- `overlay`：进退场 fade（同 sceneTransitionProgress，但独立的 `overlayProgress`）

**理由**：
- 渲染层每帧拿到一份"已平滑"的 mapState 即可，不必各自重新算
- 可以独立 unit test 不依赖 R3F

### D3 — `<MapOverlay name={...} progress={...}/>` 接口

```tsx
const OVERLAY_REGISTRY: Record<string, React.FC<{ progress: number }>> = {
  none: () => null,
  // 后续 propose 注册：
  // agents_trajectories: AgentsTrajectoriesOverlay,
  // digital_silos_heatmap: DigitalSilosOverlay,
};

export function MapOverlay({ name, progress }: { name: string; progress: number }) {
  const Component = OVERLAY_REGISTRY[name] ?? OVERLAY_REGISTRY.none;
  return <Component progress={progress} />;
}
```

**理由**：
- 极简注册表模式——后续 propose 只需要 import 自己的 overlay component 加进 registry，其他文件不动
- 未注册的 name 自动 fallback no-op，不报错

### D4 — `<SandTableMaterials mode={...}/>` 接口

```tsx
const MATERIAL_REGISTRY: Record<string, MaterialFactory> = {
  matte: matteMaterial,  // 现有实现
  // blueprint: blueprintMaterial, // 留给 cinema-map-modes
};

// SandTable component 接受 currentMode + 之前 mode + cross-fade progress
// 同时挂两套材质，opacity 互补
```

**理由**：
- 同 D3，注册表模式
- mode 切换需要材质 cross-fade（不能突变）——这部分（同时挂两套材质 + opacity）的基础设施在本 propose 实现，具体材质后置

### D5 — Tracking rhythm 实现

```ts
// 在 CameraRig 中：
if (scene.rhythm === "tracking") {
  // 半速 linear（不用 dwellEase）：camera 缓慢匀速从 from 走到 to
  // 让眼睛能在阅读和扫视背景之间切换
  const t = sceneState.sceneLocalT;
  next = {
    position: [
      lerp(cam.from[0], cam.to[0], t),
      lerp(cam.from[1], cam.to[1], t),
      lerp(cam.from[2], cam.to[2], t),
    ],
    lookAt: cam.lookAt,
    focalDistance: 5,
  };
}
```

文字处理：
- sceneTransitionProgress 对 tracking 也用 still 的 10/80/10（hold band 80% = 文字"完全可读"占大头）
- 文字 sticky 钉视口同 still
- CPS dwell 用 still 公式（`computeStillSvh`）

**理由**：
- 这是 voiceover 节奏——文字阅读优先，camera 是"动态背景"
- 半速 linear（不是 dwellEase）让背景变化温和，不抢戏
- 不应用屏息漂移——camera 自己已经在动

**替代方案**：
- 用 dwellEase（fast at boundaries / slow in middle）：boundary 处 camera 跑得快不利阅读。否决。
- 设可调 speed multiplier：增加配置成本，linear 已够。否决。

### D6 — Data-hit kind

```yaml
- id: scene-1-2-data-hit
  kind: data-hit
  rhythm: tracking
  emphasis: dwell
  number: "1,000"     # 主数字（必填）
  caption:            # 单行注释（必填）
    zh: 极微观半径内的常住人口
    en: Residents within micro-scale radius
  paragraphs:         # 可选 supporting text，按 progressive reveal 错峰
    - { zh: "0 — 日常发生的弱连接互动", en: "0 — daily weak-tie interactions" }
  camera: ...
  mapState: ...
```

渲染：大字 number 居中，下方 caption（左对齐 / mono / caption 字号），再下方 paragraphs（按 progressive reveal）。

**理由**：
- 单数字"爆点"是字幕业 / 信息图常用语法（"54%"、"1,000 people"）
- 比 title kind 更结构化（强制 caption），比 body-section 更聚焦（一个数字主导）

### D7 — Progressive reveal in body-section

```
sceneLocalT
  0%  ────────────────────────────────  100%
                                       
  ┌── paragraph 1 ──┐                   slice = [0, 1/N]
            ┌── paragraph 2 ──┐         slice = [1/N, 2/N]
                       ...
                          ┌── paragraph N ──┐  slice = [(N-1)/N, 1]
```

每个 paragraph 在自己的 slice 内做 enter/hold/exit（10/80/10）。Slice 之间无 overlap——上一段 exit 完才下一段 enter。

也可以选择 overlap（前一段 exit 与下一段 enter 同时发生形成 cross-fade）。第一版 **不 overlap** 保持简单；如果体感"段间太空"可以加 overlap 参数。

**字数 cap 改为 per-paragraph**：
- 每段独立按 emphasis 算 cap（standard=54 / dwell=42 / linger=30 / brief=72）
- Scene 总 svh = `Σ computeStillSvh(paragraph_i)` 加 hold-margin

**单段也走 progressive reveal 渲染路径**：
- N=1 时，slice = [0, 1]，与原来 single-paragraph 行为等价，向后兼容

### D8 — char-cap 升级

旧 lint：scene 总字数 > emphasis cap → error
新 lint：
- body-section / data-hit 的 paragraphs 数组里，单段 > emphasis cap → error
- title / lead / pull-quote 的 text（单字段），长度 > emphasis cap → error
- 提示信息说明"per paragraph"语义

### D9 — Schema 向后兼容性

Beat 1.1 当前 MDX：
- 7 scene，全 still
- 各 scene 已有 emphasis（默认 standard）
- 各 scene **无** mapState 字段
- 各 scene 用 body-section / title / lead / pull-quote 既有 kind

本 propose 不改这些 scene。新字段 mapState 是 optional default behavior 不变。所以现有 MDX **必须继续 build pass**——本 propose 第一个 acceptance 就是"old MDX 不动也能跑"。

## Risks / Trade-offs

- **[未注册的 mode / overlay name 在 prod 出现]** 作者写了 `mode: "watercolor"` 但没人实现。
  → 缓解：渲染层 fallback `matte`；content-lint 输出 warning（"unknown mode 'watercolor', will fall back to matte"）；但**不**阻塞 build——保持"接口可扩展"原则。

- **[Progressive reveal 让 scene svh 变得很大]** 一个 scene 3 paragraph 各 50 字 → 3 × 6.5s + reaction = 20s+ → 超过 2000svh 单 scene。
  → 缓解：每 paragraph 独立 svh，但 hold band 重叠——总 svh ≈ N × 单段 svh。这是设计需要：长 reading 段需要多 svh。piecewise scroll-to-t 已经吸收过这种"DOM 长 / score 短"的不对称。

- **[Body-section single-paragraph 旧行为变化]** 现有 body-section 渲染逻辑不是 progressive reveal——一次显示。
  → 缓解：N=1 时 progressive reveal 与原来等价（slice 占满整个 sceneLocalT）。视觉上无差异。

- **[Tracking 速度和 motion 的取舍]** Tracking 是 linear，motion 是 dwellEase；如果作者把"想读但是镜头要动"标 motion 而不是 tracking，会得到 dwellEase 节奏（boundary 快、middle 慢），与"匀速扫"语义不符。
  → 缓解：lint 加 warning："motion + body-section / lead 多 paragraph + emphasis ≠ brief 时建议改 tracking"。**不阻塞**——作者可以坚持用 motion。

- **[mapState 跨 scene 插值与 sticky text 同步]** sticky text 用 sceneLocalT，mapState 用 score-t，二者来源不同；可能在 scene 边界出现"文字已切到下一段但 mapState 还没切"的不一致。
  → 缓解：useResolvedMapState 用 score-t 但同样的 piecewise mapping，所以 score-t 和 sceneLocalT 是同步的。验证时确保两者跨边界时的行为对齐。

## Migration Plan

1. **Phase 0** — Schema 拓展（添加新字段 default 值；新 kind 加入 union；不报错）。
2. **Phase 1** — useResolvedMapState resolver + MapOverlay / SandTableMaterials registries（接口 + matte registered + none registered）。SandTable 接受 mode prop，cross-fade 基础设施。
3. **Phase 2** — Tracking rhythm 在 CameraRig 实现 + sceneTransitionProgress 加 tracking 分支。
4. **Phase 3** — Data-hit renderer。
5. **Phase 4** — Progressive reveal 在 body-section 渲染 + svh 公式更新 + lint per-paragraph cap。
6. **Phase 5** — Lint warning 完善（unknown mode/overlay name / motion+长文 建议改 tracking）。
7. **Phase 6** — 验证 Beat 1.1 grandfather 仍 build 通过（关键 acceptance）。

回滚：每 phase 一次 commit。最坏回到 Phase -1（cinema-scroll-pacing 状态）仍可用。

## Open Questions

1. **Q1 — mode cross-fade 时长**：两材质同时挂多久 cross-fade？200ms 是常用值——和 spring profile HOLD 对齐。倾向 200ms 写死，未来如有需要再 expose。
2. **Q2 — Progressive reveal slice 间是否 overlap**：第一版不 overlap；如果 QA 觉得太空，加 cross-fade。倾向先无 overlap，看体感。
3. **Q3 — data-hit 的 paragraphs 是否参与 char-cap**：是。同 body-section 规则——per-paragraph cap。
4. **Q4 — tracking 速度是否可调**：第一版 linear（速度 = scene-svh / from-to-distance）；不暴露 multiplier。如果某 scene 觉得太慢/快，作者可以调 emphasis 改 svh，间接调速度。
5. **Q5 — 屏息漂移在 tracking 上是否生效**：否。tracking 自身已经在动。CameraRig 的 still 分支（drift accum）不进入 tracking。
6. **Q6 — paragraph 内的 \n 换行是 progressive reveal 一段还是两段**：一段。`\n` 是行内换行符，仍属同一 paragraph 字符串，同一 slice。

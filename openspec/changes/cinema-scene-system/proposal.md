## Why

`cinema-content-integration` 把 scene-driven 设计语汇定下来了——每段内容反推自己的 (camera × text-form × transition × interaction × duration × junction)。本 propose 把那个框架**实施成代码**：schema、render layer、layout primitive、camera 协调、Beat 1.1 PoC。

## What Changes

- **Schema**: `Beat.body / lead / pullQuote / title` 折叠为 `Beat.scenes: Scene[]`。每条 scene 有 `kind`（title / lead / body-section / pull-quote / breath）、camera 段、layout、transition、duration、内容。
- **Camera 模型**: 抛掉 `Beat.shotRef`——相机现在从 scene 序列推出。每条 scene 自带 `camera: { from, to, lookAt }`，scene 间首尾续接。
- **5 个 layout primitive**:
  - `SceneTitle`     居中 display 字号
  - `SceneLead`      居中 subhead
  - `SceneBodySection` 右栏 (heading + paragraphs + KV list / twin-column)
  - `ScenePullQuote` 居中 italic 大字
  - `SceneBreath`    无字、纯相机 dwell（留白 scene）
- **3 个 transition primitive**: fade / slide-up / slide-side。每个 scene 显式声明 enter + exit。
- **HudLayer 重新定位**: 之前的 letterbox / cue-card / hud-panel 4 种 hud kinds 折叠掉——letterbox 变成 `SceneTitle` / `ScenePullQuote` 的 layout 选项；cue-card / hud-panel 直接由 SceneBodySection 替代。HudLayer 文件保留作为 in-world-label 的容器（3D 锚点文字），不再渲染滚动文本。
- **PoC**: Beat 1.1 完整重写为 scenes[]，`/work/synthetic-socio-wind-tunnel` 跑得通。其他 9 beat 暂时保留旧 schema 字段（lint 会警告但不阻断）；批量迁移留作后续。

## Capabilities

### Modified Capabilities

- `cinematic-case-study-page` — 新行为契约：page 渲染 scene 流，camera 跟着走。letterbox / cue-card / hud-panel 这些命名彻底退场。
- `case-study-content-schema` — `body / lead / title / pullQuote` 折叠为 `scenes`；6 维度框架强制存在。
- `sand-table-cinema` — Beat-level shotRef 替换为 scene-level camera segments。

### New Capabilities

- `scene-system` — 新增 capability：定义 SceneKind / LayoutKind / Transition / Duration 枚举与 scene 渲染契约。

## Impact

- **MDX 重写**：Beat 1.1 frontmatter 改写为 scenes[]；其它 9 beat 暂保留旧字段（向后兼容期）
- **新文件**：
  - `lib/cinema/scene-types.ts`（Scene / Layout / Transition 类型）
  - `components/cinema/scenes/{SceneTitle, SceneLead, SceneBodySection, ScenePullQuote, SceneBreath}.tsx`
  - `components/cinema/SceneLayer.tsx`
- **改文件**：
  - `lib/content/case-study-schema.ts` — Zod scene schemas
  - `lib/cinema/score.sswt.ts` — Beat 1.1 改为 scene-level cameras
  - `lib/cinema/scrollCinema.ts` — `sceneAt(t)` 替代 `beatAt(t)` (或并存)
  - `app/work/[slug]/page.tsx` — 用 SceneLayer 替代 HudLayer 主路径
  - `components/hud/HudLayer.tsx` — 退化为 in-world-label only
- **不动**: SandTable / CinemaCanvas / theme / i18n / sand table 数据

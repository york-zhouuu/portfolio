## ADDED Requirements

### Requirement: Scene rhythm 字段必填

`SceneBase` SHALL 增加必填字段 `rhythm: "motion" | "still" | "bridge"`。Zod schema MUST 把该字段标记为必填枚举；缺失或值不在枚举内的 scene MUST 触发 build error。

`rhythm` 是 scene 设计 7 维度中的第 7 维（其余 6 维由 `cinema-content-integration` 定义）。

#### Scenario: scene 缺 rhythm 字段

- **WHEN** frontmatter 中某 scene 没有 `rhythm` 字段
- **THEN** Zod 解析失败，错误指出该字段必填且枚举值

#### Scenario: rhythm 值非法

- **WHEN** scene 写 `rhythm: "fast"`（非法值）
- **THEN** Zod 报错并列出合法值 `motion | still | bridge`

### Requirement: Still scene 相机 from === to 锁定

当 scene 的 `rhythm === "still"` 时，Zod schema MUST 强制 `scene.camera.from` 与 `scene.camera.to` 严格相等（数组逐元素 `===`）。该约束由 schema 兜底；运行时 CameraRig 也会短路（见 cinematic-case-study-page spec），但 schema 级先拒绝可减少调试成本。

#### Scenario: still scene 配置位移

- **WHEN** `rhythm === "still"` 的 scene 写 `camera: { from: [0,8,8], to: [10,8,8], lookAt: [0,0,0] }`
- **THEN** Zod 报错；要求 `from === to`

#### Scenario: motion scene 配置静止

- **WHEN** `rhythm === "motion"` 的 scene 写 `from === to`
- **THEN** content-lint 报 warning（不阻断 build，但提示作者：motion scene 通常应有位移；若刻意静止考虑改为 still）

### Requirement: Scene emphasis 字段必填（CPS 档）

`SceneBase` SHALL 增加必填字段 `emphasis: "brief" | "standard" | "dwell" | "linger"`，default 值由 Zod schema 提供为 `"standard"`（即作者可省略；省略时按 standard 处理）。该字段是作者控制 dwell 时长的**唯一**接口——schema MUST NOT 允许直接填 svh / 秒数 / 任意倍数。

emphasis 直接对应 CPS（Characters Per Second）档位：

| emphasis | CPS_zh（字 / 秒） | 含义 |
|---|---|---|
| `brief` | 12 | 过场提示，"扫一眼" |
| `standard` | 9 | 默认（画面复杂场景的保守端）|
| `dwell` | 7 | 重点段，"想一下" |
| `linger` | 5 | hero / pull-quote，"停下来回味" |

#### Scenario: scene 缺 emphasis 字段

- **WHEN** frontmatter 中某 scene 没有 `emphasis` 字段
- **THEN** Zod 解析将该 scene 的 emphasis 设为 default `"standard"`，build 通过

#### Scenario: emphasis 值非法

- **WHEN** scene 写 `emphasis: "fast"`（非法值）
- **THEN** Zod 报错并列出合法值 `brief | standard | dwell | linger`

#### Scenario: 作者直填 svh / 秒数

- **WHEN** scene 试图增加 `durationSvh: 250` 或 `dwellSeconds: 4` 字段
- **THEN** Zod 报错；指明 emphasis 是唯一接口，要求改用 4 档枚举

### Requirement: DURATION 由 CPS 反推（替换 short/mid/long）

`DURATION_SVH` 三档（short=110, mid=180, long=280）SHALL 被移除；`DurationKind` 类型 SHALL 被移除。所有 svh 配额由两个函数计算：

```ts
const CPS_ZH = { brief: 12, standard: 9, dwell: 7, linger: 5 };
const REACTION_S = 0.5;
const SCROLL_PX_PER_S = 1000;
const VIEWPORT_PX = 1000;
const MIN_DWELL_S = 1.5;
const MAX_DWELL_S = 6.5;

function computeStillSvh(scene: SceneStill): number {
  const charsZh = countCharsZh(scene); // 中英分别算后取 max
  const cps = CPS_ZH[scene.emphasis];
  const dwellSec = clamp(charsZh / cps + REACTION_S, MIN_DWELL_S, MAX_DWELL_S);
  return (dwellSec * SCROLL_PX_PER_S / VIEWPORT_PX) * 100;
}

function computeMotionSvh(scene: SceneMotion): number {
  const base = motionGeometryToSvh(scene.camera); // dist × 8 + lookAtDelta × 4
  const factor = { brief: 0.5, standard: 1.0, dwell: 1.6, linger: 2.4 }[scene.emphasis];
  return Math.max(100, base * factor);
}

function computeBridgeSvh(scene: SceneBridge): number {
  const factor = { brief: 0.5, standard: 1.0, dwell: 1.6, linger: 2.4 }[scene.emphasis];
  return 120 * factor;
}
```

字符计数：中文按字符数（含中文标点）、英文按字符数（含空格与标点），两种 locale 分别用对应 CPS 算 dwell，取 max（保守）。

`DURATION_SVH` 与 `DurationKind` 类型 MUST 被移除；任何引用 MUST 迁移。

#### Scenario: 仍使用 short/mid/long

- **WHEN** scene frontmatter 写 `duration: "short"`
- **THEN** Zod 报错；要求移除 duration 字段，由 emphasis + 内容自动计算

#### Scenario: 短文字段触发最小停留

- **WHEN** still scene 仅 4 字标题在 standard emphasis 下：`4/9 + 0.5 ≈ 0.94s`，低于 MIN_DWELL_S
- **THEN** dwell 取 floor 1.5s = 150svh

#### Scenario: 长文字段触发最大停留

- **WHEN** still scene 文字 70 字在 standard emphasis 下：`70/9 + 0.5 ≈ 8.3s`，高于 MAX_DWELL_S
- **THEN** dwell 取 cap 6.5s = 650svh，**且**触发字数 lint 报错（见下个 Requirement）

#### Scenario: motion scene emphasis 影响 svh

- **WHEN** motion scene `from = [0,8,8]`, `to = [20,8,8]`（dist = 20），emphasis = `linger`
- **THEN** computeMotionSvh ≈ `max(100, 160 × 2.4) = 384svh`——相机在 384svh 内走完 20 单位距离，明显放缓

### Requirement: 单 still scene 字数硬上限（CPS 副产物）

content-lint MUST 强制单 still scene 内文字字数（中英 max）≤ **54 字（中文） / 110 字符（英文）**。该上限由 CPS 公式推导（`(MAX_DWELL_S - REACTION_S) × CPS_zh = (6.5 - 0.5) × 9 = 54`）。超过即报错。

字数累计规则：
- 散文段落（paragraphs）字数累加
- KV 列表中 `key + value` 全部计入
- 子标题 / sectionNumber 不计

`emphasis` 影响该上限：
- `brief`（CPS=12）→ 上限 = (6.5-0.5)×12 = **72 字**
- `standard`（CPS=9）→ 上限 = **54 字**
- `dwell`（CPS=7）→ 上限 = **42 字**
- `linger`（CPS=5）→ 上限 = **30 字**

#### Scenario: still scene 字数超限

- **WHEN** still scene 文字 60 字 + emphasis `standard`
- **THEN** content-lint 报错，提示"超过 54 字上限，请拆为两个 scene 或改用 brief emphasis（上限 72）"

#### Scenario: linger scene 字数超限

- **WHEN** still scene 文字 35 字 + emphasis `linger`（上限 30）
- **THEN** content-lint 报错，提示作者：linger 是为短而重的金句，长段应降级到 dwell 或 standard

### Requirement: emphasis 分布健康度提示

content-lint SHALL 输出案例研究的 emphasis 分布统计（百分比），并对极端分布报 warning：

- `linger` 比例 > 15% → warning："重点过多 = 没有重点；考虑降级部分到 dwell 或 standard"
- `brief` 比例 > 40% → warning："过场比例过高，考虑哪些段实际是 standard"
- `standard` 比例 < 40% → warning："基线段过少，节奏可能失衡"

仅 warning 不阻塞 build；为提醒作者节奏分配。

#### Scenario: 作者全文标 linger

- **WHEN** 案例 90% scene 为 linger emphasis
- **THEN** lint warning 提示重点过多

### Requirement: 节奏交替规则（schema 层校验）

`case-study-schema.ts` 内的 BeatSchema `.refine()` 校验 SHALL 增加节奏序列检查：

- 同 beat 内连续 `still` 数量 > 2 → refine 失败
- 同 beat 内连续 `motion` 数量 > 1 → refine 失败
- bridge 不计入连续计数

#### Scenario: beat 内三连 still

- **WHEN** beat.scenes 序列为 `[still, still, still, motion]`
- **THEN** Zod refine 报错，错误信息指出 index 2 是第 3 个连续 still，必须改成 motion 或 bridge

#### Scenario: beat 内两连 motion

- **WHEN** beat.scenes 序列为 `[still, motion, motion, still]`
- **THEN** Zod refine 报错

#### Scenario: bridge 重置连续计数

- **WHEN** beat.scenes 序列为 `[still, still, bridge, still, still]`
- **THEN** 校验通过（bridge 切断了连续 still 计数）

### Requirement: content-lint 节奏报告

`pnpm content:lint` SHALL 在控制台输出每 beat 的节奏序列摘要，如：

```
Beat 1.1 [open-real-world]: motion(still×2)still / motion(bridge)still×2 ✓
                                   ^                         ^
                            连续两 still 边界                      bridge 切断
```

输出 SHALL 标记任何违反节奏交替规则的位置（红色），并对接近上限（连续 2 still）的位置给出 warning。

#### Scenario: lint 输出节奏视图

- **WHEN** 作者运行 `pnpm content:lint`
- **THEN** 输出 SHALL 包含每 beat 的 rhythm 序列字符串与违规标记

## MODIFIED Requirements

_本 propose 不修改既有 `case-study-content-schema` requirements；所有变化以 ADDED 形式新增。_

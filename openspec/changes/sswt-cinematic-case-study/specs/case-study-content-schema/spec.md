## ADDED Requirements

### Requirement: 三幕 frontmatter 结构

每篇案例研究 MDX 的 frontmatter SHALL 包含顶级字段 `acts: Act[]`；每个 `Act` MUST 包含 `id` / `title` / `beats: Beat[]`；不允许在 acts 之外存在内容定义字段。

#### Scenario: frontmatter 缺少 acts 字段

- **WHEN** MDX 文件 frontmatter 没有 `acts` 字段
- **THEN** `pnpm content:lint` 报错并阻断 build

#### Scenario: act 数量错误

- **WHEN** `acts` 数组长度不为 3
- **THEN** lint 报错（结构必须为三幕，与本次 propose 锁定的脊柱一致）

### Requirement: Beat 五项必填

每个 Beat 必须且仅声明以下五个字段全部齐备：`id`（kebab-case，唯一）、`claim`（内容主张散文）、`shotRef`（指向 camera score 中存在的 shot id）、`hud`（HUD 形态对象）、`fallbackFigure`（指向 `public/figures/<file>.svg` 文件，文件 MUST 存在）。每个 Beat SHALL 同时声明 `sources`（至少一条引用源项目文档行号或 commit）。任一项缺失，build MUST 失败。

#### Scenario: Beat 缺少 fallbackFigure

- **WHEN** 某 Beat frontmatter 没有 `fallbackFigure` 字段或文件不存在
- **THEN** lint 报错并阻断 build

#### Scenario: shotRef 命中失败

- **WHEN** Beat 的 `shotRef` 在 camera score 中找不到对应 shot id
- **THEN** lint 报错并指出 score 中可用的 shot id 列表

#### Scenario: 缺少 sources

- **WHEN** Beat 没有任何 source 引用
- **THEN** lint 报错；要求作者将每个内容主张钩到源项目的文档（线索可追溯）

### Requirement: Zod schema 与 TypeScript 类型

`lib/content/case-study-schema.ts` SHALL 定义以下类型：`Act` / `Beat` / `Shot`（discriminated union: establishing / push-in / pull-back / dolly-arc / match-dissolve / focus-rack）/ `Hud`（discriminated union: cue-card / letterbox / in-world-label / hud-panel）/ `Fallback`；运行期 frontmatter 解析 SHALL 通过 Zod 校验；类型 SHALL 与 camera score 共享。

#### Scenario: Shot kind 不被识别

- **WHEN** frontmatter `shotRef` 引用的 score shot 使用了未定义的 kind
- **THEN** Zod 校验失败，错误明确指出可用 kind 集合

#### Scenario: Hud kind 与 slot 错配

- **WHEN** Beat 声明 `hud.kind = 'hud-panel'` 但缺少 `slot` 字段
- **THEN** Zod 校验失败

### Requirement: 术语表锁定

`scripts/content-lint.ts` SHALL 维护术语表（`docs/glossary.json`），包含项目专有名词的允许写法；MDX 内容中出现专有名词的不允许变体 MUST 触发 lint 错误。术语表初始包含：
- `hyperlocal` / `超在地性`（不允许：hyper-local / 超本地 / 极在地）
- `Attention-Induced Nearby Blindness` / `注意力诱导的附近性盲区`
- `wind tunnel` / `风洞`（不允许：wind-tunnel / 风通道）
- `policy hack` / `政策劫持`（不允许：政策黑客 / 策略 hack）
- `sand table` / `沙盘`
- `rival hypothesis` / `rival 假说`
- 4 假说编号：`H_info` / `H_pull` / `H_meaning` / `H_structure`
- `mirror experiment` / `镜像实验` / `A' Global Distraction`

#### Scenario: 使用非允许变体

- **WHEN** MDX 内容使用 `hyper-local` 或 `极在地`
- **THEN** lint 报错指出应统一为 `hyperlocal` 或 `超在地性`

#### Scenario: 添加新术语

- **WHEN** 作者需要引入新专有名词
- **THEN** 必须先在 `docs/glossary.json` 添加条目，否则 lint 警告"未在术语表中"

### Requirement: 禁用 mock persona

Frontmatter 与 MDX 内容 MUST NOT 包含任何来自源项目早期 Map Explorer 的 mock persona 名（包括但不限于 `chen_daye` / `alex` / `mei` / `aisha`）；agent 引用 MUST 使用 `agent_id` + `personality_traits` 向量形式。

#### Scenario: MDX 出现 mock persona

- **WHEN** MDX 内容包含 `chen_daye` 字符串
- **THEN** lint 报错并阻断 build

### Requirement: cinemaScoreVersion 锁定

`manifest.json` SHALL 包含 `cinemaScoreVersion` 字段；camera score 文件每次实质改动 MUST 由作者手动 bump 该字段；frontmatter 中 act 与 beat 的 shotRef 集合 MUST 与 cinemaScoreVersion 对应版本一致；version 不一致时 build 失败。

#### Scenario: Score 改动但 version 未 bump

- **WHEN** `lib/cinema/score.sswt.ts` 修改但 manifest `cinemaScoreVersion` 不变
- **THEN** `scripts/snapshot-cinema-score.ts` 在导出 JSON 时检测 hash 变化，如 version 未变报错

#### Scenario: Frontmatter shotRef 引用旧 version

- **WHEN** frontmatter 引用的 shotRef 在当前 score version 中已 rename / removed
- **THEN** lint 报错指出哪些 shotRef 失效

### Requirement: Storyboard 路由与主页面同源

主页面与 `/work/[slug]/storyboard` 路由 SHALL 从同一份 frontmatter 派生；storyboard 渲染时仅消费 `claim` / `hud.text` / `fallbackFigure` 三个字段；不允许 storyboard 单独维护一份内容。

#### Scenario: 修改一处 claim

- **WHEN** 作者修改某 Beat 的 `claim`
- **THEN** 主页面与 storyboard 的对应内容同步更新；CI visual-regression 在两个路径都验证

### Requirement: 案例可扩展性

虽然 `acts` 必须为 3，但每个 Act 内的 `beats` 数量 MAY 变化；shot kind / hud kind 集合 MAY 通过本 spec 后续 propose 扩展；专有名词术语表 MAY 通过 propose 扩展。SSWT 案例的 cinemaScoreVersion 与材质参数 MUST 锁定为 SSWT 专属，不污染未来案例的默认值。

#### Scenario: 新案例使用模板

- **WHEN** 创建第二篇案例研究
- **THEN** 作者编写新 frontmatter（自定 beats）+ 新 cinema score；`cinematic-case-study-page` 模板 MUST 接受新 score 与新 frontmatter 而无需修改模板代码

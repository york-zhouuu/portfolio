## ADDED Requirements

### Requirement: 单 beat 工作单元

内容创作 SHALL 以单个 beat 为最小工作单元。一次提交只更新一个 beat 的 `body` / `pullQuote` 字段；同一文件中其它 beat 的 body 字段 MUST NOT 在该次提交里被改动。

#### Scenario: 一次性多 beat 提交

- **WHEN** 一次提交同时更新两个或更多 beat 的 `body` 字段
- **THEN** 评审 SHOULD 退回该提交，要求拆分为多个单 beat 提交

#### Scenario: 跨 beat 依赖

- **WHEN** 撰写中发现某 beat 的内容必须引用未锁定的另一 beat
- **THEN** 作者 SHALL 先把被依赖的 beat 锁定，再继续撰写依赖方

### Requirement: 五件套结构（Job / Decision / Artifact / Voice / Body）

每个 beat 的 body 草稿 SHALL 显式包含 Job / Decision / Artifact / Voice 四项说明（在该 beat 评审期以草稿注释、PR 描述、或临时辅助文档形式存在），加上正式的 Connector body 散文与 pullQuote。**Decision 与 Artifact 必须各至少一项**——若任一缺失，该 beat 的 cinema 必要性 MUST 被重新审视。

#### Scenario: Decision 缺失

- **WHEN** 一个 beat 在取材阶段找不到任何项目实际做过的决策
- **THEN** 评审 SHALL 触发"该 beat 是否应作为案例研究 beat 存在"的讨论；不允许以纯陈述性散文填充

#### Scenario: Artifact 缺失

- **WHEN** 一个 beat 的草稿没有引用任何具体物件（数字、代码、文档行、数据）
- **THEN** 评审 SHALL 退回，要求至少补一项物件

### Requirement: 单 beat 长度上限

正式锁定的 `body` 字段单语长度 SHOULD NOT 超过 350 字（中文）或 ~280 words（英文）。允许在作者明确批准下越界；默认不允许。

#### Scenario: 默认越界

- **WHEN** 草稿 body 超过 350 字 / 280 words 且作者未明确批准
- **THEN** 评审 SHALL 退回该草稿，要求收紧

#### Scenario: 明确越界

- **WHEN** 作者评审时明确批准本 beat 越界（理由记录在 PR / 评审注释中）
- **THEN** 锁定该 beat 并继续

### Requirement: 双语对等

`body` / `pullQuote` 的 zh / en 两个分支 MUST 传达同一组 Decision 与 Artifact——不允许某语言版本省略一个 artifact 或调整一个 decision 的指向。语言级风格差异（中文长句、英文短句、用词偏好）在允许范围内。

#### Scenario: 双语 artifact 不一致

- **WHEN** zh 版引用了 smoke demo 14% 但 en 版未提及
- **THEN** content-lint SHOULD 标记不一致；评审 SHALL 退回

#### Scenario: 风格自然差异

- **WHEN** zh 与 en 对同一句采用了不同的表达节奏（如英文用主动、中文用名词化）
- **THEN** 不视为违反——只要传达的决策与物件一致即可

### Requirement: 工作流（取材 → 草稿 → 评审 → 修订 → 锁定）

每个 beat 的工作 SHALL 经过 5 个阶段：(1) 取材清单（Decision/Artifact 候选 3–5 项）、(2) 草稿（双语 body + pullQuote）、(3) 作者评审、(4) 修订（迭代直至作者认可）、(5) 锁定（提交至 frontmatter，进入下一 beat）。**未锁定的 beat MUST NOT 阻塞下一 beat 的工作启动**——但下一 beat 的取材阶段 SHOULD 等待前一 beat 锁定，避免内容相互参考时的不稳定。

#### Scenario: 草稿先于取材清单

- **WHEN** 作者跳过取材清单直接收到 body 草稿
- **THEN** 评审 SHALL 退回；作者 SHALL 先看到候选池，再批准方向

#### Scenario: 同时跑两个 beat 的草稿

- **WHEN** 上一 beat 未锁定就启动下一 beat 的草稿
- **THEN** 系统 SHOULD 警示——但允许在作者明确同意下并行

### Requirement: Act 优先级 — Act 1 先行

写作顺序 SHALL 是 Act 1（3 beat）→ 评审通读 → Act 2（4 beat）→ Act 3（3 beat）。Act 2 / Act 3 的 beat 在 Act 1 全部锁定且通读完成前 MUST NOT 进入草稿阶段。

#### Scenario: Act 2 抢跑

- **WHEN** Act 1 仅完成 Beat 1.1，作者要求开始 Act 2 Beat 2.1
- **THEN** 系统 SHALL 警示该顺序违反 spec；只在作者明确同意（与可能的设计调整）下放行

### Requirement: Cinema / Score / 设计语言不变

本规约**仅涉及内容**。Cinema 渲染、camera score、HUD 组件代码、设计 token 文件、frontmatter schema 字段定义 MUST NOT 在本次工作流中被修改。任何此类需求 SHALL 由独立的 propose 提出。

#### Scenario: 内容工作触及 cinema 调整

- **WHEN** 撰写某 beat 时发现 cinema 镜头与新内容不再匹配
- **THEN** 该改动 SHALL NOT 直接施加在本工作流的提交中；改为独立 propose 处理 cinema 侧

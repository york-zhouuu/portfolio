## Context

这份文档同时承担两件事：
1. **web 设计 + 内容总稿**——把案例研究的内容（三幕论证）、形式（一镜到底沙盘）、视觉系统（材质 / 光 / 运镜 / HUD）写进同一份合约。
2. **架构决策记录**——回答「为什么是一镜到底而非分段切镜」「为什么是白模沙盘而非全息」「camera score 怎么数据化」等关键技术选择的依据。

读者：作品集站本身的实施者（开发 + 设计）+ 未来案例的作者（参照模板）。**不是给项目外部读者的版本——他们读到的是网站本身**。

源材料锁定（不可妥协的内容硬输入，来自源项目 2026-04-21 收敛后的研究文档）：
- **主论证**：手机注意力在高密度城市中制造"隐形附近性盲区"；超在地性（hyperlocal）反向推送能否把注意力——进而把人——带回"附近"。
- **机制链**：`algorithmic-input → attention-MAIN → spatial-output → social-downstream`，单一主边界 + 三段链位。
- **干预 4+1**：A: Hyperlocal Push（H_info）/ B: Phone Friction（H_pull）/ C: Shared Anchor（H_meaning）/ D: Catalyst Seeding（H_structure）+ A': Global Distraction（mirror / dual-use）。
- **协议**：14 天（baseline 0–3 / intervention 4–9 / post 10–13）；β-rigor 30 seed × median + IQR。
- **smoke demo 已有证据**：target 100% / control 14% / treatment effect 86 pp / median trajectory delta +302m。
- **伦理立场**：C-tier（探索性研究仪器）+ B-tier（mirror 实验）；明确拒绝 A-tier（不主张可部署）。
- **Act 3 现状**：30-seed 正式跑尚未完成，Act 3 必须以 "contest in progress" 姿态交付。

## Goals / Non-Goals

**Goals:**
- **设计 / 内容 / 形式三位一体**：不允许任何节拍只写文案不写镜头、或只画镜头不定文案。每个 beat 必须同时定义 5 项：内容主张 / 镜头动作 / HUD 形态 / 沙盘视觉变化 / 静态兜底渲染。
- **一镜到底（one continuous take）作为不可绕过的视觉契约**：观众进入页面到 Act 3 末尾，相机从未硬切；段间切换由镜头语言（push-in / pull-back / match-dissolve / focus rack）实现。**禁止段落级 fade-to-black、禁止全屏滚动 snap、禁止"换组件 = 换画面"**。
- **沙盘作为论证物，不是装饰**：每一处沙盘视觉变化必须直接对应一个内容主张；不允许"看起来酷"的镜头。装饰性运镜在 review 阶段一律剪掉。
- **Act 1 的诞生镜头是高潮之一**：沙盘从黑暗中被召唤出来作为对 Act 1 提问的回答——这是整部作品的第一个"啊哈"动作，必须为之保留充分的镜头预算（约 2–3 秒推景 + 雾消散）。
- **Hyperlocal 在 Act 2 Beat 4 完整落地**：不仅命名概念，要展示 feed item 模板 → 500m geo filter → agent attention state 响应的完整链条，并联到 smoke demo 86 pp 的具体数字。
- **Act 3 以"contest in progress"姿态交付**：交付 = 比赛规则（β-rigor）+ 已有证据（smoke）+ 镜像设计 + 待揭晓清单。**研究的诚实是作品的力度，不是作品的缺陷**。
- **静态兜底是第二件作品，不是降级**：reduced-motion / no-WebGL 用户得到的是一张三幕分镜长卷（storyboard sheet），它本身是一份完整可读的视觉作品。

**Non-Goals:**
- **不**做用户可控相机（手动 orbit / pan / zoom）——相机由 score 编排，不开放；这件作品是**电影**不是**游戏**。
- **不**做硬切镜头——即使在 reduced-motion 下，分镜版用静态分格代替镜头切换。
- **不**实时跑 1000-agent 模拟；沙盘上的 agent 行为仍是从 smoke run 导出的轨迹回放。
- **不**多语言；中英混排但单一语言版本。
- **不**保留上一版的「显影液浮出照片」隐喻——它和一镜到底的连续性矛盾（照片是静态终点，电影是连续过程）。
- **不**对 Act 3 的研究结果做"假装完成"的视觉处理——空缺要可见。

## Decisions

### D1 — 一镜到底（one continuous take）作为根本视觉契约

**选择**：观众从进入页面到 Act 3 末尾，相机走在一条单一连续轨道上（一条 NURBS 曲线 + 关键帧），永不硬切。段间转场全部以镜头语言实现：
- **push-in**：相机沿前向轴推进（用于"进入仪器内部"、"靠近一个 agent"）
- **pull-back**：相机后撤（用于"从街道层回到俯视沙盘"）
- **dolly-arc**：相机沿弧线绕物体（用于 establishing shot、Act 1 → 2 过渡）
- **match-dissolve**：当前画面构图与下一帧构图重合时混溶（用于"街道 → 信号空间"的概念跳跃，仍是连续，不是切镜）
- **focus rack**：景深焦点平移（用于把注意力从前景文字切到沙盘事件，反之亦然）

**为什么**：用户明确锁定"沙盘 + 不停切换视角镜头"的电影感。落到工程上有两种实现路径：

| 选项 | 实现 | 缺点 |
|---|---|---|
| 一镜到底 | 单条 camera score，scroll → t，关键帧插值 | 需要精心编排，灵活度低 |
| 多镜剪辑 | 段间 fade/cut，每段独立运镜 | 浏览器里 cut 永远像 bug 不像导演意图，DOM 段落 + WebGL 镜头切换很难无缝 |

**剪辑感在浏览器里是反审美的**——视觉切换会被解读为"页面坏了"或"段落硬性分隔"。**反之，连续运镜能利用滚动这一动作本身**——滚动是连续的，相机也是连续的，二者在物理层一致，浏览器里没有人比这更熟悉。

**放弃**：分段切镜、scroll-snap、全屏 section 模式、任何会让观众感到"换页"的视觉切换。

**注脚**：Act 1 → Act 2 之间有一个**例外**——沙盘从黑暗中召唤出来的瞬间，相机不动，但场景从"现实世界图像层"过渡到"沙盘 3D 世界"。技术上这是一次 cross-fade，但因为相机位置 / 朝向 / 焦距完全连续，体感上仍是一镜。这是连续性 contract 内的合法操作。

### D2 — 沙盘材质：白模为主 + 全息高光

**选择**：沙盘主体走**建筑模型白模**（matte clay / foam）质感——浅米白 / 灰白几何体、柔和环境光、轻微 ambient occlusion。**全息感**只出现在两个特定位置：(1) Act 2 Beat 4 干预可视化（feed pulse、attention 半径、信号流动用发光线 / 粒子）；(2) Act 3 镜像 A' 反演（同一段沙盘走 cyan→magenta 反相）。

**为什么**：项目名 "Synthetic Socio Wind Tunnel" 有内部张力——"synthetic" 拽向全息、"wind tunnel" 拽向白模实验室。两者全要会让画面失去可读性。**让 base material（白模）承载"实验仪器"的研究气质，让 overlay（全息）承载"synthetic"的合成数据干预层**——两层在视觉上分工清晰：物理 vs. 数字、被测物 vs. 控制信号。

| 候选 | 评估 | 选 / 弃 |
|---|---|---|
| 全白模 | 学究、可信，但缺少"AI / 合成"signal | 不够 |
| 全全息 | "synthetic" 到位，但失去"风洞"实验室质感，也容易像科幻 demo | 弃 |
| 蓝图等高线 | 极简优美，但与 agent 行为可视化不兼容（agent 是体不是线） | 弃 |
| 写实 diorama | 重，渲染成本高，无法 cinematic | 弃 |
| **白模 + 全息高光** | 双层语义，渲染成本可控，干预层视觉化时极其有力 | **选** |

**视觉规范**：
- **建筑**：从 OSM footprint 挤出，色 `#E8E4DC`（米白）→ `#C8C2B6`（中灰）按类型分；roughness 0.85，metalness 0；ambient occlusion baked。
- **街道**：浅灰平面 `#D6D2C9`，无贴图，仅几何描边。
- **agent**：白色低多边形人形（~50 tris），头部小、剪影清晰；选中 agent 加发光描边。
- **POI 标签**：在 Act 2 Beat 1 后浮现，2D billboard 文字，字号 9–11px，跟随相机距离做 fade。
- **干预层（全息）**：Act 2 Beat 4 启用——feed pulse 用青色 `oklch(0.78 0.14 215)` 半透明球面波；attention 半径用同色虚线圈；信号流动用粒子 + bloom。
- **A' 反演（Act 3）**：底色由白模米白翻为深紫 `oklch(0.18 0.06 300)`，干预层由青转洋红。

### D3 — Tilt-shift 是必带的（沙盘的视觉签名）

**选择**：摄影后处理通道里加 tilt-shift（移轴模糊），上下边缘渐进虚化，中段清晰带可由 camera score 调节。低端设备走简化的高斯近似，高端走分离式两通道（quality flag）。

**为什么**：tilt-shift 是真实城市看起来像沙盘的视觉捷径——人脑对此种景深响应直接判读为"这是微缩模型"。加 tilt-shift 之后即便几何很真实，观众仍读为沙盘；不加则相反。这件事在 craft 层面**等价于一行**——但不上的话整篇作品的"沙盘感"就立不住。

**实现**：自定 GLSL fragment shader（`next.config.ts` 已有 .glsl loader 可复用），分离式两通道（垂直 + 水平），在 Act 1 沙盘诞生镜头时通道密度从 0 ramp 到 100%，作为"沙盘从何而来"的一部分视觉语言。

### D4 — Camera score 数据结构

**选择**：camera score 是一个 JSON-friendly 数据结构（TypeScript 类型 + Zod 校验）：

```ts
type CameraScore = {
  duration: number;             // 总长度（按滚动 progress 0..1，不是秒）
  acts: Act[];
};

type Act = {
  id: 'attention-boundary' | 'instrument' | 'findings';
  range: [number, number];      // 在总 score 上占的 progress 区间
  beats: Beat[];
};

type Beat = {
  id: string;                    // 与 mdx frontmatter 的 beat id 一一对应
  range: [number, number];
  shot: Shot;                    // 镜头类型
  hud: Hud;                      // 前景信息层
  fallbackFigure: string;        // 静态兜底 SVG 引用
};

type Shot =
  | { kind: 'establishing'; orbit: { center: Vec3; radius: number; degrees: [number, number] } }
  | { kind: 'push-in'; from: Vec3; to: Vec3; ease: Easing }
  | { kind: 'pull-back'; from: Vec3; to: Vec3; ease: Easing }
  | { kind: 'dolly-arc'; path: Vec3[]; lookAt: Vec3 }
  | { kind: 'match-dissolve'; nextShotPreview: Shot }
  | { kind: 'focus-rack'; focusFrom: number; focusTo: number };

type Hud =
  | { kind: 'cue-card'; text: string; position: 'top' | 'bottom' | 'left' | 'right' }
  | { kind: 'letterbox'; subtitle: string }
  | { kind: 'in-world-label'; anchor: Vec3; text: string }
  | { kind: 'hud-panel'; slot: 'stats' | 'feed-item' | 'beta-rigor' | 'mirror-toggle' };
```

scroll progress（由 `framer-motion` 的 `useScroll` 提供）映射到 `score.t ∈ [0, 1]`，`shotAt(t)` 返回当前应渲染的相机参数（已插值）。这把"运镜"从"组件代码里散落的 motion 语句"提升为**一份单一可视化的乐谱**，便于评审 / 调参 / diff。

**放弃**：把镜头逻辑写在每个 React 组件里的方案——会重蹈旧版 15 个 scene 文件各自动画各自写的覆辙；camera score 是把它收进一个数据 artifact 的关键。

### D5 — Frontmatter schema 修订（强制三位一体）

**选择**：MDX frontmatter 的 `acts.beats[]` 中每个 beat 必须同时声明：

```yaml
acts:
  - id: attention-boundary
    title: 注意力边界
    beats:
      - id: open-real-world
        claim: |
          物理距离从未如此短，社会距离从未如此长。
        shotRef: act1.b1                 # 引用 camera score 中的 shot id
        hud:
          kind: cue-card
          text: |
            打开手机的一瞬间，附近不再被读出。
        fallbackFigure: figures/act1-open.svg
        sources:
          - file: docs/research/00-thesis.md
            anchor: nearby-blindness
```

`scripts/content-lint.ts` 升级为对每个 beat 校验**五项必填**：`claim` / `shotRef`（必须命中 score 中存在的 id）/ `hud` / `fallbackFigure`（文件必须存在）/ `sources`（至少一条引用源项目文档行号或 commit）。任何一项缺失，build 失败。

**为什么**：把"design / content / form 同构"从口号变成**编译期约束**。作者后续写新案例时，schema 强制他在写文案的同时定义镜头与兜底图——不可能"先写文章后想动画"。

### D6 — 三幕 × 节拍 × 镜头总稿（设计 / 内容 / 形式同构表）

这是本文档的**核心**——把内容主张、镜头动作、HUD、沙盘视觉变化、静态兜底**绑在同一张表里**。每一行都是一个不可拆分的设计单元。

#### Act 1 — 注意力边界（progress 0.00 → 0.35）

| Beat | 内容主张 | 镜头 | HUD / 字幕 | 沙盘视觉 | 兜底图 |
|---|---|---|---|---|---|
| **1.1 open-real-world** (0.00–0.10) | 物理距离从未如此短，社会距离从未如此长。手机正在重写"附近"。 | **缓慢推景**：从黑场推向一个**真实世界图像层**——一只手举起手机的剪影、街景的远景虚影、一行 "Lane Cove · 22,000 residents · 4.7km²" 数据文字浮起。**沙盘尚未出现**。 | letterbox 字幕（上下黑带 + 居中文字）；引用源项目 `00-thesis.md` 一句 | 黑场 + 雾粒子 + 远处微光 | `figures/act1-open.svg` 三联画：手机 / 街道 / 数据 |
| **1.2 blindspot-reveal** (0.10–0.22) | 在密度极高的物理空间里，500m 内的"附近"是被算法和注意力共同抹掉的。 | **focus rack + dolly slow**：焦点从远景拉到中景一个独自走着的人；相机贴着街道平移；他周围 500m 渐渐被擦灰——**注意力盲区在画面上有形状**。 | 浮动 cue card「注意力诱导的附近性盲区 / Attention-Induced Nearby Blindness」+ 一组数据：14% baseline encounter rate at <500m | 仍是真实世界层 + 一个"被擦灰"的圆形 mask 跟随人物 | `figures/act1-blindspot.svg` 一帧关键画 |
| **1.3 instrument-summon** (0.22–0.35) | 如果这件事真的存在，怎么才能被科学地看见？——需要一台能**检测 + 干预**的仪器。 | **关键转场**：相机不动，但视觉层从真实世界层 cross-fade 到沙盘 3D 层；**沙盘从黑暗中被召唤出来**——建筑由低到高挤出，街道描边浮现，tilt-shift 从 0 ramp 到满。雾消散露出 Lane Cove 的全貌。 | 沙盘亮起一刻字幕： **"A Synthetic Socio Wind Tunnel."**（letterbox） + 副字： "Cloud chamber for social phenomena." | 真实世界层渐隐 → 沙盘从黑暗中升起；建筑挤出动画 1.5s；最终俯视全景 | `figures/act1-summon.svg` 沙盘建立全景 |

**Act 1 节奏**：开场静（推景慢、letterbox）→ 中段冷（盲区被擦灰、最大 lonliness）→ 末尾翻盘（沙盘登场、视野打开）。这是**一段独立的小剧**，已经可以作为完整短片成立。

#### Act 2 — 产品本体（progress 0.35 → 0.78）

| Beat | 内容主张 | 镜头 | HUD / 字幕 | 沙盘视觉 | 兜底图 |
|---|---|---|---|---|---|
| **2.1 map** (0.35–0.45) | 实验室的"地板"是 Lane Cove。真实坐标，OSM + Overture 数据来源，高密度高层住宅区。**为什么是这里**：物理近社会远的悖论在这里最尖锐。 | **dolly-arc**：相机绕沙盘 30° 弧线慢速移动，建筑细节按距离 LOD 浮现；POI 标签 fade-in（Plaza、Coles、火车站、河口）。 | in-world labels：~6 个关键 POI；侧栏 hud-panel：region size、building count、data source（OSM/Overture/Geoscape） | 沙盘静止，标签浮现 | `figures/act2-map.svg` Lane Cove 平面图带标注 |
| **2.2 agent** (0.45–0.58) | 1000 个 agent 居住在这座沙盘里。每个有 personality 八维、planner（每天一次 LLM 调用生成日程）、三层模型预算（Sonnet 10 / mid 200 / Haiku 790）。**Rashomon 知觉**：同一座沙盘，每个 agent 看到不同的世界。 | **push-in**：相机从沙盘俯视推近到一个 agent 头顶，agent 周围其他建筑虚化（DoF 浅景深）；接 **focus rack** 从 agent 外形切到悬浮 in-world panel：他的 personality 八维拨盘 / 当日 plan / 三层 memory（episodic / semantic / reflective）。 | hud-panel slot=stats：8 维条形（openness 0.72 / conscientiousness 0.43 / ...）；当日 plan 时间轴；模型 tier 标签 | 选中 agent 发光描边；DoF 把背景压成柔光 | `figures/act2-agent.svg` agent 信息卡 |
| **2.3 network** (0.58–0.68) | 弱连接、偶遇、third-place 行为是社会资本的真正度量。1000 agent 在沙盘里活动 14 天会涌现什么样的网络？ | **pull-back**：相机从单 agent 拉回沙盘上空但不到全景；**慢慢加速回放轨迹** （4 倍速）；轨迹线在沙盘上随时间画出，偶遇点冒出小火花；网络图层（弱连接 = 细线、强连接 = 粗线）覆盖在沙盘上半透明叠加。 | letterbox 字幕：「1000 agents · 14 days · 288 ticks/day」；in-world：一组随机 third-place（咖啡店、邮局门口）开始亮起 | 轨迹线 + 偶遇火花 + 网络叠加层；网络图层用细描边而非粗线，以免抢沙盘 | `figures/act2-network.svg` 网络叠加全景 |
| **2.4 intervention** (0.68–0.78) ★ | **核心**：仪器不只是看，要拨。Policy Hack 4+1 是控制台。**Hyperlocal Push（超在地性 / Variant A）**：feed item 模板 → 500m geo filter → agent attention state 响应。配 H_info / H_pull / H_meaning / H_structure 四诊断假说 + A' 镜像。**用魔法打败魔法**：不改物理环境，只 hack 现有规则。 | **focus rack + zoom**：焦点切到一个新的 agent；浮起一张 feed item 卡片（"Lost cat at Park St 300m away"）；推送动画 → agent attention 半径短暂高亮 → agent 路径偏转 +302m 走向目标。**这一段镜头是整部作品的"产品力 demo"**。 | hud-panel slot=feed-item：feed 卡片 + 三段链路图 (algorithmic-input → attention-MAIN → spatial-output)；下方 4+1 诊断假说**紧凑表**（H_info/H_pull/H_meaning/H_structure + A'），可悬停展开 | feed pulse 青色球面波从 agent 位置扩散；attention 半径环；新轨迹用青色高亮覆盖原灰色路径 | `figures/act2-intervention.svg` feed item + agent 偏转路径 |

**Act 2 节奏**：从大（地图）到小（agent）再回到中（网络）再到具体动作（intervention）。这是**风洞解剖**结构：测试段 → 被测物 → 流场 → 控制台。

#### Act 3 — 探索的结论（progress 0.78 → 1.00）

| Beat | 内容主张 | 镜头 | HUD / 字幕 | 沙盘视觉 | 兜底图 |
|---|---|---|---|---|---|
| **3.1 contest-in-progress** (0.78–0.88) | 4+1 variant 的比赛规则：30 seed × 5 variant，median + IQR（非高斯，故不用 mean + SD），14 天 baseline / intervention / post 协议，5-act 报告。**已有证据**：Variant A smoke demo target 100% / control 14% / **86 pp**。**未揭晓**：B/C/D + A' 横向对比、衰减/持续。 | **pull-back to full overview**：相机退到 Act 1 沙盘登场时的同一构图（构图回环）；沙盘上五个 variant 的 ghost 轨迹叠加（A 已有完整数据 / B C D 显示骨架 / A' 显示反向回放）。 | hud-panel slot=beta-rigor：30 seed 网格、IQR box plot 占位、报告骨架 5 幕；letterbox 字幕「Contest in progress / 不假装做完」 | 5 variant ghost 轨迹叠加；A 实色，B C D 半透明骨架，A' 反相 | `figures/act3-contest.svg` 5 variant 对比矩阵 |
| **3.2 mirror** (0.88–0.96) ★ | 同样的基础设施，反向使用即把人推向更远的孤立。**A' Global Distraction** 实验在镜像位置就位——这不是事后免责，是作品的最终论点：**杠杆是对称的**。 | **match-dissolve**：当前帧（沙盘 + 青色 feed pulse）构图与下一帧（同沙盘 + 洋红 global pulse）几何重合，色彩反演；相机不动，但**沙盘从青→洋红、亮起的区域熄灭**——同一镜头同一构图反向走一遍。 | hud-panel slot=mirror-toggle：A vs A' 对照（feed source / radius / direction-of-pull）；letterbox：「The lever is symmetric. / 同一杠杆能拯救也能摧毁」 | 沙盘底色 cross-fade 到深紫；干预层 cyan→magenta；agent 路径回退至灰色基线 | `figures/act3-mirror.svg` A vs A' 反演对照 |
| **3.3 outro** (0.96–1.00) | C-tier 探索性研究 + B-tier mirror 展示双面性 + 明确拒绝 A-tier "可部署"。资源、出处、新鲜度戳。 | **slow pull-back**：相机继续拉远，沙盘缩小回到一个台面尺寸的物体；周围回归黑场；`generatedAt` / `sourceSha` / `cinemaScoreVersion` 浮起。 | letterbox：「Exploratory instrument. / Not a deployable system.」；底部 footer：资源链接 + asset freshness | 沙盘退回到 Act 1.3 召唤前的位置（构图首尾呼应） | `figures/act3-outro.svg` 沙盘缩回 + 资源面板 |

**Act 3 节奏**：拉回 → 反演 → 退场。**构图回环**（3.3 末与 1.3 始的相机位置一致）让一镜到底有了"句号"，整部作品在**视觉层面收成一个圆**。

### D7 — Act 1 真实世界开场的图像策略

**选择**：Act 1 的 1.1 / 1.2 不是 3D 场景，是**纪录片质感的图像层**——以 hero video（无声，6–8s loop）+ 静态图叠加方式实现。素材清单：
- 一段手机屏幕反光（Pexels / Unsplash 免费源）
- 一段街景行走视角（同源）
- 数据文字层（react 文本）

**为什么不用 3D**：Act 1 的论点是"现实世界的某个东西被技术抹掉了"——必须先有"现实世界"的视觉重量，才有后面"沙盘是发明的"的对比。如果开场就 3D，观众没有"现实"参照系，沙盘的诞生镜头就失去戏剧性。

**技术实现**：fixed-position video element（位于 cinema canvas 上层）；当 progress > 0.22 时 video opacity 降至 0，cinema canvas 此时已渲染好沙盘建筑挤出的开始帧，二者通过 `mix-blend-mode: screen` 在过渡瞬间共存约 0.3 秒，然后 video 完全消失，沙盘接管整个视口。

### D8 — Reduced-motion / 静态分镜长卷

**选择**：reduced-motion / no-WebGL 用户得到的是 `/work/synthetic-socio-wind-tunnel/storyboard` 路由，渲染一张**纵向滚动的三幕分镜长卷**：每个 beat 一格，每格包含 (1) `fallbackFigure` SVG（基于 Lane Cove 真实几何，不是占位） (2) `claim` 散文 (3) `hud` 文字内容。

**为什么是分镜长卷而不是逐段 SVG 拼贴**：
- 一镜到底的反义不是"一帧一段"，而是"分镜稿"——电影制作中本来就有 storyboard 这个产物，把动画版的 fallback 设计成 storyboard 是**形式与内容的对偶**，而非降级。
- 分镜长卷是一份完整的"纸上电影"——可以打印、可以分享、可以单独成立为作品。
- 同一份 frontmatter 可以同时驱动两条渲染路径（动画版 + 分镜版），DRY。

**实现**：
- 路由：`/work/[slug]/storyboard`，独立页面
- 共用同一份 MDX frontmatter；只读取 `claim` / `hud.text` / `fallbackFigure`
- CSS 排版：每格 `aspect-ratio: 16/9`，分页 `break-after: page` 友好
- 主入口在检测到 `prefers-reduced-motion: reduce` 或 WebGL 不可用时，**不**降级当前页，而是用 banner 提示「为减少运动，已切换到分镜版」并提供二者切换按钮

### D9 — 滚动 → camera score t 的映射策略

**选择**：scroll progress → score t **非线性**映射，由 score 中每个 beat 的 `range` 配合 spring 阻尼共同决定：
- 关键时刻（如 1.3 沙盘召唤、2.4 干预触发、3.2 mirror 反演）放慢——给观众"看见"的时间
- 信息密度低的过渡区放快——避免"卡住"的感觉
- 用户停止滚动时相机继续按 score 缓冲到下一个稳定锚点（不会停在镜头中段的尴尬位置）

**为什么不直接 scroll progress = t**：camera score 的关键帧密度不均匀；线性映射会让 1.3 召唤镜头一闪而过、3.3 outro 拖太长。

**实现**：`lib/cinema/scroll-cinema.ts` 内部维护 spring + 阻尼，rAF 读取 scroll position，输出当前 t 与是否处于稳定锚点的标志；HUD 文字 fade-in 与稳定锚点关联，避免在快速滚动时一闪而过。

### D10 — 引擎与依赖

**保留**：
- Next.js 15 (App Router)
- React 19
- Tailwind 3.4
- next-mdx-remote / gray-matter / zod
- three / @react-three/fiber / @react-three/drei
- framer-motion（仅用 useScroll；motion 动画下沉到 cinema score）

**新增**：
- `leva`（开发期 camera score 调参 GUI；prod build 自动 tree-shake）
- `maath`（spring 数学，camera score 插值所需）
- `postprocessing`（tilt-shift / DoF / vignette / grain，可选；能不引就用自定 GLSL）

**移除**：
- `culori`（旧 OKLCH 弧不再驱动主体配色，下沉到分镜版的 fallback 色映射；如果分镜版不需要 OKLCH 计算，culori 可以彻底移除）

### D11 — 性能预算（修订）

| 指标 | 目标 |
|---|---|
| Hero / Act 1.1 LCP | < 2.5s（throttled Fast 3G）；hero 是 video + 文字，无 WebGL 等待 |
| Cinema canvas 首帧 | < 1.0s after Act 1.3 启动；建筑 geometry 预编译为 GLB，scroll 0.18 时开始预加载 |
| 总 JS payload (gzip, 首屏) | < 380KB |
| 60fps 持续度 | desktop 100%；中端移动设备 ≥ 80%（tilt-shift 走简化路径） |
| 内存峰值 | < 350MB（含 GLB + textures + post-processing buffers） |

**降级路径**：
- 检测 GPU tier（用 `detect-gpu` 库）；tier ≤ 1 → 跳过 tilt-shift 与 DoF，仅保留 grain
- visibility hidden → 暂停 rAF，保留 score t 状态
- Long task budget：每帧 cinema score 计算 + 三层 HUD 字幕重算 < 4ms

## Risks / Trade-offs

- **[一镜到底的灵活性低]** → score 的关键帧编辑会成为高摩擦操作。**Mitigation**：用 leva 在开发期暴露 score 参数，调试模式下相机参数可以实时调节；落入 git 的 score JSON 由 `scripts/snapshot-cinema-score.ts` 一键导出。
- **[沙盘建筑量在中端移动设备爆 GPU]** → Lane Cove 全区 ~1500 栋建筑。**Mitigation**：建筑按 LOD 分三档（远景 InstancedMesh 简化六面体 / 中景标准 / 近景带细节）；非可见区域 frustum cull；GLB 用 Draco 压缩。
- **[Act 3 数据空缺被读为"未完成"]** → "contest in progress" 的姿态如果传达不清，会被误读为开发未完成。**Mitigation**：3.1 hud-panel 显式说明研究阶段；smoke demo 86 pp 数据要在 3.1 视觉上充分突出；β-rigor 协议必须看得见（不只是文字描述，要有 30 seed 网格的视觉占位）。
- **[一镜到底 + reduced-motion 难以并存]** → 不能简单"关掉动画"——一镜到底关掉就什么都没了。**Mitigation**：reduced-motion 走完全独立的分镜版（D8），两条渲染路径同源不同形。
- **[镜头编排错位则内容错位]** → 比如本该展示 attention 半径的镜头被剪短，HUD 文字"半径 500m"就失去对应。**Mitigation**：score 与 frontmatter 通过 `shotRef` 强绑定；`content-lint` 在 build 期校验对应；CI 跑 visual-regression（每个 beat 在固定 progress 锚点截屏 diff）。
- **[沙盘材质决策窄化未来其它案例]** → 白模 + 全息高光适合 SSWT，未必适合下个案例。**Mitigation**：`cinematic-case-study-page` 模板把材质 / 配色 / 后处理参数化，作者侧暴露为 `cinema.theme` 配置；本次只锁定 SSWT 的具体值。
- **[相机不开放给用户感觉"被强制"]** → 一镜到底意味着观众失去探索权。**Mitigation**：(a) score 已经设计了观众"想停留"的锚点（HUD 在锚点 fade-in，离开锚点 fade-out）；(b) 提供一个二级页面 `/work/synthetic-socio-wind-tunnel/explore`，开放一个用户可控相机的 sandbox（仅 Lane Cove 沙盘，不带 cinema 叙事），作为给好奇用户的延伸入口。**explore 页非首发**，在 `cinematic-case-study-page` 模板稳定后再做。
- **[一镜到底使长篇内容不可能容纳]** → 这种形式天然限制内容长度（连续运镜不能拖太长，否则失去张力）。**Mitigation**：把长篇技术细节下沉到 `/work/synthetic-socio-wind-tunnel/dossier`（一篇可选的散文版），主页保持紧凑。dossier 也非首发。

## Migration Plan

由于本次 propose 与上一版 `sswt-narrative-case-study` / `frontend-polish-pass` 的脊柱不兼容，采用**先归档后重写**策略：

1. **归档**：`sswt-narrative-case-study` 与 `frontend-polish-pass` 在本次实施前不再推进；两者的 specs 保留为参考资料，但不再扩展。
2. **保留物**：资产导出管线（`scripts/export-sswt-assets.ts`）、`map-geometry.json` schema、`manifest.json` 新鲜度戳、frontmatter 校验框架、单 R3F canvas 原则。
3. **重写物**：`/work/[slug]/page.tsx`、所有 `components/scenes/sswt/*`、`lib/theme/scroll-theme.ts`、`components/chamber/*`。
4. **新建物**：`lib/cinema/` 模块、`components/cinema/` 命名空间、`scripts/snapshot-cinema-score.ts`、`/work/[slug]/storyboard` 路由、Act 1 真实世界 video 素材资产。
5. **回滚预案**：本次实施前打 git tag `v0.1-narrative-baseline`；实施期间在 feature branch 推进；任意阶段可 revert 到 baseline 而无需丢失旧 specs（它们不会被删除，仅停止演进）。

## Open Questions

- **Q1 — Act 1 真实世界素材的来源**：是否使用现成的 stock footage（Pexels/Unsplash）+ 文字叠加，还是独立拍摄一组 6–8 秒 loop？前者快、合规；后者更"作品级"。**倾向**：先用 stock 跑通整条管线，待整体形式稳定再决定是否独立拍摄。
- **Q2 — 是否引入声音**：电影感离不开声音。一镜到底配氛围音轨（低频 hum + 偶尔环境音）会大幅强化"沙盘"的物质感。**反方意见**：作品集页面带声音可能让读者不适（尤其在工作环境里打开）。**倾向**：默认静音 + 角落显式的"开声"按钮 + cookie 记忆；声音设计单独立项，**不在本次首发范围**。
- **Q3 — 镜头中是否需要 "scrubbing" 反馈**：观众滚动到某个 beat 时是否需要短暂的视觉锚点提示（如 HUD 一角的"Act 2 / Beat 4"标识）？这有助于用户定位，但与"电影感"相悖（电影里没人需要章节标签）。**倾向**：默认不显示；URL 同步 `?at=2.4` 用于深链与社交分享；必要时调试模式可开启。
- **Q4 — Mirror（A'）的视觉强度**：洋红反相在 A' 段持续约 progress 0.08（屏幕滚动几秒），这个时长是否够？太短观众读不到论证，太长又破坏一镜到底的连续感。**倾向**：留 0.08 区间，但允许观众悬停在该段时**主动 toggle** A vs A'（通过 hud-panel mirror-toggle）以延长理解时间。
- **Q5 — 静态分镜版与动画版主入口的默认**：当 `prefers-reduced-motion: no-preference` 时强制走动画版，还是给所有用户选择权？**倾向**：默认动画版（这是作品的本体），但站点全局有"切换分镜版"按钮（footer 永久存在），与作品集的设计直觉一致。
- **Q6 — 在哪打 score 调试入口**：dev-only 的 leva 面板是否应延伸到 staging 环境？**倾向**：仅 dev；staging 走 prod build；score 调参全部在本地完成后 commit。

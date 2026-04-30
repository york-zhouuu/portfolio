# Content Principles

Living document. Every content unit on this site (case study body, home page,
storyboard) MUST follow these principles before being committed.

---

## 1. Scan, don't read.

> 用户的阅读习惯通常是「扫描（Scan）」而不是「阅读（Read）」。
> Web users scan; they do not read.

A wall of paragraphs is a failure mode. If a reader cannot extract the gist
of a section in **5 seconds of skimming**, the section needs visual
structure, not better prose.

### What "scan-friendly" means in practice

Every content section MUST provide at least three of the following visual
hooks:

- **Numbered sub-headings** (`## 01 Title`, `## 02 Title`)
- **Bolded key terms** in running prose (sparingly — 2-4 per section)
- **`- key: value` definition rows** for parameters / specs / numbers
- **Short paragraphs** (≤4 sentences each)
- **Pull quote** to set apart the most important claim
- **Eye-catcher lead** — one-liner before the body proper

### What "wall of text" looks like (and to avoid)

```
Lane Cove 是悉尼北岸一个一公里见方、住着两万两千人的高密度切面。火车站
到河边步行只要十二分钟。从空中看，它是建筑学家眼里"理想的偶遇容器"——
容积率高、街道短、第三场所密集。但坐在电梯里三十秒，看一遍邻居们的手
机屏幕，会发现一件直觉上意外的事：身体距离这么近的一群人，几乎没有人
在看附近...
```

— Reader bounces. No anchor for the eye, no entry point for skimming.

### What scan-friendly looks like

```
## 02 沙盘设定: 真实地理 × LLM 群体

我们搭建了一个高度严谨的社会模拟引擎:

- 实验场地: 基于 OpenStreetMap 的真实地理 (Lane Cove, 1km²)
- 数字居民: 1000 个 LLM 驱动的 agent
- 运行周期: 14 天
- 严谨验证: 每个参数 × 30 个 seed (~$4 / run)
```

— Reader can pick this up, understand the setup in 5 seconds, then dive in
if interested.

---

## 2. Visual structure precedes prose density.

When in doubt, choose **fewer words + more structure** over more words + flat
structure.

If a section needs 350 字 of prose to land, ask: can it land in 200 字 of
prose + a 4-row spec list? It almost always can.

---

## 3. Each section answers exactly one question.

A scan-friendly section has a single anchor question:

- "Why this project?"
- "What's the setup?"
- "What's the experiment?"
- "What's the significance?"

If a section is answering two questions, split it. The reader can hold one
question per heading; two becomes mush.

---

## 4. The lead earns the first 5 seconds.

Every beat (or storyboard section, or page) MUST have an
**eye-catcher** — a single line at the top that promises what the reader
will get. If a reader reads only the lead and bounces, they should still
walk away with the gist.

Examples (good leads):

- 构建社会干预的"风洞": 在真实城市沙盘中,推演 1000 个数字居民的附近性。
- A wind tunnel for social interventions — 1000 digital residents, real urban geography, 14 days.

Examples (bad leads — too philosophical, no payload):

- 物理距离从未如此短,社会距离从未如此长。
- (This is a pull quote, not a lead — keep it but don't make it the
   first thing.)

---

## 5. Bilingual structure must be parallel.

zh and en versions MUST share the same visual skeleton — same heading count,
same bullet count, same definitional shape. Differences are at the sentence
level, not at the structural level.

The Prose renderer assumes parallel structure. A heading mismatch breaks
the visual rhythm; a missing bullet breaks the parallel reading.

---

## 6. Bold sparingly, italicize never (for emphasis).

Bold is the only weight-based emphasis allowed in prose. Use it for **key
terms** the reader should remember, not for flourish.

Italic is reserved for pull quotes and titles of works. Don't italicize for
emphasis — readers' eyes get lost in italic Chinese / italic English mixed
with bold.

---

## 7. Numbers and proper nouns are anchors.

Every section that has numbers (1000 agents, 14 days, 14% baseline, 86 pp,
$4/run) — surface those numbers. Numbers are scan magnets. If you have a
number, put it in a list, not buried in a sentence.

Same for proper nouns: Lane Cove, OSM, Sora, Genie, JEPA. They earn their
own callout.

---

## When to break a principle

If a beat genuinely demands a literary register (e.g., the closing outro),
breaking some of these principles is acceptable. But the default is
scan-friendly; literary is the exception with a stated reason.

The Author Notes block (in evidence collection / draft phase) records when
a section breaks a principle and why.

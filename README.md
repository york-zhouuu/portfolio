# Portfolio Cinema (第二版)

A cinematic portfolio site whose flagship case study is **Synthetic Socio Wind
Tunnel** — a research instrument that tests whether hyperlocal digital
interventions can reverse "Attention-Induced Nearby Blindness" in
high-density cities.

The site is structured as one continuous take through a Lane Cove sand table.
Three acts:

1. **注意力边界** — background phenomenon, ending with the instrument being
   summoned out of darkness.
2. **产品本体** — map · agent · network · intervention. The wind-tunnel
   anatomy: test section, models, flow visualization, control panel.
3. **探索的结论** — contest in progress · mirror experiment · outro.

## Architecture

```
app/
  page.tsx                    home (case study list)
  work/[slug]/
    page.tsx                  cinema page — single fixed canvas + HUD
    storyboard/page.tsx       reduced-motion fallback (storyboard sheet)
components/
  cinema/                     CinemaCanvas (R3F floor) + camera rig
  hud/                        HUD layer — cue card · letterbox · panels
  prelude/                    Act 1 real-world video layer
  chrome/                     SiteNav · SiteFooter
lib/
  cinema/
    types.ts                  CameraScore · Beat · Shot · Hud
    easing.ts                 phase · lerp · blendPhases
    score.sswt.ts             SSWT camera score (skeleton)
    scrollCinema.ts           scroll → t (single global timeline)
  content/
    case-study-schema.ts      Zod for acts/beats five-tuple
    load-case-study.ts        MDX + frontmatter loader
    load-sswt-assets.ts       JSON loaders for map / agents / signals
content/
  case-studies/<slug>.mdx     three-act frontmatter (no body prose)
public/case-studies/sswt/     real Lane Cove geometry + sample data
scripts/
  export-sswt-assets.ts       one-shot export from source research repo
  content-lint.ts             schema + glossary + shotRef ↔ score check
  snapshot-cinema-score.ts    write score JSON + hash version guard
docs/
  glossary.json               terminology lockdown
openspec/changes/sswt-cinematic-case-study/   design contract
```

### Design / content / form contract

Every beat declares the **five-tuple**: `id` · `claim` · `shotRef` ·
`hud` · `fallbackFigure` · `sources`. `pnpm content:lint` enforces this.
You cannot author a beat that has copy without a shot, or a shot without
a fallback figure.

### One-shot timeline

There is exactly **one** scroll → t mapping (`lib/cinema/scrollCinema.ts`).
No per-section sticky containers, no per-scene progress hooks. The
`CinemaCanvas` is `position: fixed` and stays put; the article body
contributes scroll height only. World, camera, and HUD all read the same `t`.

## Setup

```bash
pnpm install
pnpm dev
```

## Scripts

| command                | what                                                    |
| ---------------------- | ------------------------------------------------------- |
| `pnpm dev`             | Next.js dev                                             |
| `pnpm build`           | production build                                        |
| `pnpm typecheck`       | strict TS check                                         |
| `pnpm content:lint`    | schema + glossary + score consistency                   |
| `pnpm export:sswt`     | re-export Lane Cove assets from source research repo    |
| `pnpm score:snapshot`  | write `cinema-score.json` artifact + version hash guard |

## Source project

Research code + data lives separately at
`/Users/york_z/Desktop/IDEA地图-agent模拟/Synthetic_Socio_Wind_Tunnel`.
This portfolio site has zero runtime dependency on it — assets are exported
once via `scripts/export-sswt-assets.ts` and committed.

## Status

Skeleton scaffold only. Cinema canvas is a placeholder gradient + debug HUD;
sand table geometry, camera rig, real shot authoring, and storyboard SVGs are
all upcoming. See `openspec/changes/sswt-cinematic-case-study/tasks.md` for
the implementation roadmap (21 task groups).

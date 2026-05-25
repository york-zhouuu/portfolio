import { z } from "zod";

/**
 * Case study frontmatter — three-act spine, scene-driven cinema.
 *
 * v0.3 (cinema-scene-system propose): each beat carries a `scenes: Scene[]`
 * array. Old fields (`title` / `lead` / `body` / `pullQuote` / `hud`) are
 * kept as **deprecated, optional** during the migration period so unfinished
 * beats can keep the legacy schema while Beat 1.1 PoC ships scene-driven.
 */

const I18nStringSchema = z.object({
  zh: z.string().min(1),
  en: z.string().min(1),
});

export type I18nString = z.infer<typeof I18nStringSchema>;

const ActIdEnum = z.enum(["attention-boundary", "instrument", "findings"]);

// ---- Legacy hud (deprecated; kept for unfinished beats) ----------------

const HudPanelSlotEnum = z.enum(["stats", "feed-item", "beta-rigor", "mirror-toggle"]);

const HudSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("cue-card"),
    text: I18nStringSchema,
    position: z.enum(["top", "bottom", "left", "right"]),
  }),
  z.object({
    kind: z.literal("letterbox"),
    subtitle: I18nStringSchema,
  }),
  z.object({
    kind: z.literal("in-world-label"),
    anchor: z.tuple([z.number(), z.number(), z.number()]),
    text: I18nStringSchema,
  }),
  z.object({
    kind: z.literal("hud-panel"),
    slot: HudPanelSlotEnum,
  }),
]);

// ---- Scene schemas (new) ----------------------------------------------

const Vec3Schema = z.tuple([z.number(), z.number(), z.number()]);
const SceneCameraSchema = z.object({
  from: Vec3Schema,
  to: Vec3Schema,
  lookAt: Vec3Schema,
});
const TransitionKindEnum = z.enum(["fade", "slide-up", "slide-side", "scale-in", "none"]);
const DurationKindEnum = z.enum(["short", "mid", "long"]);
const RhythmKindEnum = z.enum(["motion", "still", "tracking", "bridge"]);
const EmphasisKindEnum = z.enum(["brief", "standard", "dwell", "linger"]);

// MapState — all fields optional; unknown mode/overlay strings fall back at render.
const MapStateSpotlightSchema = z.object({
  targetAgentIndex: z.number().int().min(0),
  showInternals: z.boolean().optional(),
  dataAgentId: z.string().optional(),
});

const MapStatePickupSchema = z.object({
  storySlug: z.string().regex(/^[a-z][a-z0-9-]*$/, "pickup.storySlug must be kebab-case"),
  targetAgentIndex: z.number().int().min(0),
});

const MapStateSchema = z
  .object({
    mode: z.string().optional(),
    dim: z.number().min(0).max(1).optional(),
    overlay: z.string().optional(),
    highlight: z.array(z.string()).optional(),
    spotlights: z.array(MapStateSpotlightSchema).optional(),
    pickup: MapStatePickupSchema.optional(),
  })
  .optional();

const KvItemSchema = z.object({
  key: I18nStringSchema,
  value: I18nStringSchema,
  /** Optional supporting line — surfaces on hover for params-grid chips,
   *  otherwise unused by right-column / twin-column. Lets a number expose
   *  its provenance / "why this value" without inflating the always-visible
   *  label. Per Act 2 interactivity iteration. */
  note: I18nStringSchema.optional(),
});

const CitationSchema = z.object({
  text: I18nStringSchema,
  attribution: I18nStringSchema.optional(),
});

const TwinColumnSideSchema = z
  .object({
    heading: I18nStringSchema.optional(),
    items: z.array(KvItemSchema).optional(),
    paragraphs: z.array(I18nStringSchema).optional(),
    citations: z.array(CitationSchema).optional(),
  })
  .refine(
    (s) =>
      (s.items?.length ?? 0) +
        (s.paragraphs?.length ?? 0) +
        (s.citations?.length ?? 0) >
      0,
    {
      message:
        "twinColumns side must have at least one of items[] / paragraphs[] / citations[]",
    },
  );

const TwinColumnsSchema = z.object({
  left: TwinColumnSideSchema,
  right: TwinColumnSideSchema,
});

const BaseSceneFields = {
  id: z.string().regex(/^[a-z][a-z0-9-]*$/, "scene id must be kebab-case"),
  camera: SceneCameraSchema,
  enter: TransitionKindEnum,
  exit: TransitionKindEnum,
  /**
   * Legacy field — kept optional during migration. computeSvh() now derives
   * scroll budget from emphasis + content density via CPS, so authors no
   * longer need to set this. Will be removed in a follow-up cleanup.
   */
  duration: DurationKindEnum.optional(),
  /** Cinema-scroll-pacing D2 — controls camera HOLD + text sticky pinning. */
  rhythm: RhythmKindEnum,
  /**
   * Cinema-scroll-pacing D9 — dwell tier. Default `"standard"` (9 CPS_zh).
   * Author bumps to `"dwell"` / `"linger"` for emphasis, `"brief"` for transitions.
   */
  emphasis: EmphasisKindEnum.default("standard"),
  /** Cinema-content-language-foundations D1 — per-scene map (sand table) state. */
  mapState: MapStateSchema,
};

const SceneSchema = z
  .discriminatedUnion("kind", [
    z.object({
      kind: z.literal("title"),
      ...BaseSceneFields,
      text: I18nStringSchema,
      subtitle: I18nStringSchema.optional(),
    }),
    z.object({
      kind: z.literal("lead"),
      ...BaseSceneFields,
      text: I18nStringSchema,
      /** Optional CTA list rendered as a stack of hyperlinks below the
       *  lead text. Each entry is an action — the SceneLead handler
       *  dispatches the right event or opens the right reader. Used by
       *  Act 3 outro to surface 1 link to the full report + N links to
       *  individual resident stories.
       *
       *  Actions:
       *    open-full-report — dispatches window event for ReportSheet
       *    open-story       — calls openReader(storySlug) on ReaderContext
       *    open-stories     — opens the StoriesSheet overview
       */
      cta: z
        .array(
          z.object({
            text: I18nStringSchema,
            action: z.enum(["open-full-report", "open-story", "open-stories"]),
            storySlug: z.string().optional(),
          }),
        )
        .optional(),
    }),
    z.object({
      kind: z.literal("body-section"),
      ...BaseSceneFields,
      layout: z.enum([
        "right-column",
        "twin-column",
        "params-grid",
        "hero",
        "cinema-subtitle",
        "process-flow",
        "attention-mechanism",
        // figure-hero: dedicated visualisation moment — image takes the
        // canvas center, sandbox dims behind, accent caption + 0-2 stats
        // float as small annotation. Used for Act 3 finding "B-moments"
        // (v7 poster figures fade in beside the cinema sandbox).
        "figure-hero",
      ]),
      sectionNumber: z.string().optional(),
      heading: I18nStringSchema,
      paragraphs: z.array(I18nStringSchema).optional(),
      kvList: z.array(KvItemSchema).optional(),
      twinColumns: TwinColumnsSchema.optional(),
      // Optional figure asset for figure-hero layout. src is a public/ path;
      // alt is per-locale alt text.
      figure: z
        .object({
          src: z.string(),
          alt: I18nStringSchema.optional(),
        })
        .optional(),
    }),
    z.object({
      kind: z.literal("pull-quote"),
      ...BaseSceneFields,
      text: I18nStringSchema,
      subtitle: I18nStringSchema.optional(),
    }),
    z.object({
      kind: z.literal("breath"),
      ...BaseSceneFields,
    }),
    z.object({
      kind: z.literal("data-hit"),
      ...BaseSceneFields,
      number: z.string().min(1),
      caption: I18nStringSchema,
      paragraphs: z.array(I18nStringSchema).optional(),
    }),
  ])
  .superRefine((scene, ctx) => {
    // rhythm === "still" requires camera.from === camera.to (CameraRig also
    // short-circuits at runtime, but schema-level rejection saves debug time)
    if (scene.rhythm === "still") {
      const f = scene.camera.from;
      const t = scene.camera.to;
      if (f[0] !== t[0] || f[1] !== t[1] || f[2] !== t[2]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `still scene "${scene.id}" must have camera.from === camera.to (camera HOLD); motion scenes use from→to`,
          path: ["camera"],
        });
      }
    }
    // rhythm === "tracking" requires visible camera motion (from !== to)
    if (scene.rhythm === "tracking") {
      const f = scene.camera.from;
      const t = scene.camera.to;
      if (f[0] === t[0] && f[1] === t[1] && f[2] === t[2]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `tracking scene "${scene.id}" must have camera.from !== camera.to (visible motion); use rhythm="still" for held shots`,
          path: ["camera"],
        });
      }
    }
  });

// ---- Sources / references (unchanged) -------------------------------------

const SourceSchema = z.object({
  file: z.string().min(1),
  anchor: z.string().optional(),
  commit: z.string().optional(),
});

const ReferenceSchema = z.object({
  label: z.string().min(1),
  url: z.string().url().optional(),
  note: I18nStringSchema.optional(),
});

// ---- Beat -----------------------------------------------------------------

const BeatSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/, "beat id must be kebab-case"),
    /** Cinema/sr-only one-liner. Always required. */
    claim: I18nStringSchema,
    /** New: scene-driven content. Optional during migration. */
    scenes: z.array(SceneSchema).optional(),

    /** Deprecated legacy fields — beats migrating to scenes can drop these. */
    title: I18nStringSchema.optional(),
    lead: I18nStringSchema.optional(),
    body: I18nStringSchema.optional(),
    pullQuote: I18nStringSchema.optional(),
    hud: HudSchema.optional(),

    shotRef: z.string().min(1),
    fallbackFigure: z.string().min(1),
    sources: z.array(SourceSchema).min(1),
  })
  .refine(
    (b) =>
      Boolean(b.scenes) || Boolean(b.title || b.lead || b.body || b.pullQuote || b.hud),
    {
      message:
        "Beat must define either `scenes` (preferred) or at least one legacy field (title/lead/body/pullQuote/hud)",
    },
  );

const ActSchema = z.object({
  id: ActIdEnum,
  title: I18nStringSchema,
  epigraph: I18nStringSchema.optional(),
  references: z.array(ReferenceSchema).optional(),
  beats: z.array(BeatSchema).min(1),
});

export const LinksSchema = z
  .object({
    repo: z.string().url().optional(),
    thesis: z.string().optional(),
    fitnessReport: z.string().optional(),
    methodology: z.string().optional(),
  })
  .partial();

export const AtAGlanceSchema = z.object({
  agents: z.string().min(1),
  protocol: z.string().min(1),
  seeds: z.string().min(1),
  budget: z.string().min(1),
  site: z.string().min(1),
});

// ---- Resident stories (resident-stories-reader propose) -------------------
// Per-case-study declaration of long-read HTML stories that load in the
// global ResidentStoryReader sheet. The HTML lives in:
//   public/case-studies/<study-slug>/people/<slug>.html       (zh canonical)
//   public/case-studies/<study-slug>/people/<slug>_<lang>.html (other langs)
const LocaleEnum = z.enum(["zh", "en"]);

export const ResidentStoryEntrySchema = z.object({
  slug: z.string().regex(/^[a-z][a-z0-9-]*$/, "story slug must be kebab-case"),
  displayName: I18nStringSchema,
  role: I18nStringSchema,
  languages: z.array(LocaleEnum).min(1, "story must declare at least one language"),
  /** Optional agent identifier for sand-table pickup; cross-checked by content-lint. */
  agentId: z.string().optional(),
});

export type ResidentStoryEntry = z.infer<typeof ResidentStoryEntrySchema>;

export const CaseStudyFrontmatterSchema = z.object({
  slug: z.string().regex(/^[a-z][a-z0-9-]*$/, "slug must be kebab-case"),
  title: I18nStringSchema,
  subtitle: I18nStringSchema,
  description: I18nStringSchema.optional(),
  role: I18nStringSchema,
  year: z.number().int().min(2020).max(2100),
  stack: z.array(z.string()).min(1),
  links: LinksSchema,
  atAGlance: AtAGlanceSchema,
  cinemaScoreVersion: z.string().min(1),
  /** Long-read resident stories shown via the global ResidentStoryReader. */
  residentStories: z.array(ResidentStoryEntrySchema).optional(),
  acts: z
    .array(ActSchema)
    .length(3, "case study must have exactly three acts (注意力边界 / 产品本体 / 探索的结论)"),
});

export type CaseStudyFrontmatter = z.infer<typeof CaseStudyFrontmatterSchema>;
export type CaseStudyAct = z.infer<typeof ActSchema>;
export type CaseStudyBeat = z.infer<typeof BeatSchema>;
export type CaseStudyHud = z.infer<typeof HudSchema>;
export type CaseStudyReference = z.infer<typeof ReferenceSchema>;
export type CaseStudyScene = z.infer<typeof SceneSchema>;
export type CaseStudyKvItem = z.infer<typeof KvItemSchema>;

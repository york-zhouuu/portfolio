import { loadManifest } from "@/lib/content/load-sswt-assets";
import { sswtCinemaScore } from "@/lib/cinema/score.sswt";

export function SiteFooter() {
  const manifest = loadManifest();
  const generated = manifest?.generatedAt
    ? new Date(manifest.generatedAt).toISOString().slice(0, 10)
    : "—";
  const sha = manifest?.sourceSha?.slice(0, 7) ?? "—";

  return (
    <footer className="relative z-20 border-t border-line/40 px-6 py-10 md:px-12">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-caption uppercase tracking-[0.24em] text-muted">
            colophon
          </p>
          <p className="mt-2 max-w-[44ch] text-body text-fg/78">
            Built as a one-shot cinema. Sand-table geometry exported from a
            research repo, frozen as static JSON. Type Inter + JetBrains Mono.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 font-mono text-caption text-muted md:grid-cols-3">
          <div>
            <dt className="uppercase tracking-[0.18em] text-muted/80">© York Zhou</dt>
            <dd>2026</dd>
          </div>
          <div>
            <dt className="uppercase tracking-[0.18em] text-muted/80">assets</dt>
            <dd>
              {generated} · {sha}
            </dd>
          </div>
          <div>
            <dt className="uppercase tracking-[0.18em] text-muted/80">cinema score</dt>
            <dd>{sswtCinemaScore.version}</dd>
          </div>
        </dl>
      </div>
    </footer>
  );
}

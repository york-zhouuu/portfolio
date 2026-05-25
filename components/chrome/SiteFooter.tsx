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
          <a
            href="https://github.com/york-zhouuu/-Synthetic-Socio-Wind-Tunnel-"
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-3 inline-flex items-center gap-2 font-mono text-caption uppercase tracking-[0.22em] text-fg/72 underline decoration-fg/30 decoration-1 underline-offset-[5px] transition-all duration-200 hover:text-fg hover:decoration-fg hover:decoration-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              aria-hidden
            >
              <path
                fill="currentColor"
                d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.69-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.1 11.1 0 015.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.24 2.75.12 3.04.73.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.69.41.35.78 1.05.78 2.11 0 1.52-.01 2.75-.01 3.13 0 .31.21.68.8.56C20.21 21.4 23.5 17.09 23.5 12 23.5 5.65 18.35.5 12 .5z"
              />
            </svg>
            <span>Source on GitHub</span>
            <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </a>
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

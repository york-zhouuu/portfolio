import Link from "next/link";
import { listCaseStudySlugs, loadCaseStudy } from "@/lib/content/load-case-study";
import { T } from "@/components/i18n/T";

export default async function HomePage() {
  const slugs = listCaseStudySlugs();
  const cases = await Promise.all(
    slugs.map(async (slug) => {
      const study = await loadCaseStudy(slug);
      return study ? { slug, fm: study.frontmatter } : null;
    }),
  );
  const visible = cases.filter((c): c is NonNullable<typeof c> => c !== null);

  return (
    <div className="relative">
      {/* Hero */}
      <section className="px-6 pt-[18svh] pb-[12svh] md:px-12">
        <div className="mx-auto max-w-[1100px]">
          <p className="font-mono text-caption uppercase tracking-[0.28em] text-muted">
            York Zhou · Portfolio · 2026
          </p>
          <h1 className="mt-8 text-display font-medium leading-[1.02] tracking-[-0.045em] text-fg">
            <T
              value={{
                zh: "AI 产品、agent 系统与城市研究的电影化案例",
                en: "Cinematic case studies in AI product, agent systems, and urban research.",
              }}
            />
          </h1>
          <p className="mt-10 max-w-[52ch] text-subhead text-fg/68">
            <T
              value={{
                zh: "一座沙盘，一台相机，一镜到底。每件作品是一次潜入——滚动进入。",
                en: "One world, one camera, one continuous take. Each piece is a sand table dive — scroll to enter.",
              }}
            />
          </p>
        </div>
      </section>

      {/* Selected work */}
      <section className="px-6 pb-[18svh] md:px-12">
        <div className="mx-auto max-w-[1100px]">
          <p className="font-mono text-caption uppercase tracking-[0.28em] text-muted">
            <T value={{ zh: "精选作品", en: "Selected work" }} />
          </p>
          <ul className="mt-8 divide-y divide-line/40 border-y border-line/40">
            {visible.map(({ slug, fm }) => (
              <li key={slug}>
                <Link
                  href={`/work/${slug}`}
                  className="group flex flex-col gap-2 py-6 transition-colors hover:bg-fg/[0.02] md:flex-row md:items-baseline md:justify-between md:gap-8"
                >
                  <div className="flex-1">
                    <p className="font-mono text-caption uppercase tracking-[0.22em] text-muted">
                      {fm.year} · <T value={fm.role} />
                    </p>
                    <h2 className="mt-2 text-headline font-medium tracking-[-0.02em] text-fg">
                      <T value={fm.title} />
                    </h2>
                    <p className="mt-2 max-w-[60ch] text-body text-fg/72">
                      <T value={fm.subtitle} />
                    </p>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-small text-muted transition-colors group-hover:text-fg">
                    <T value={{ zh: "进入", en: "enter" }} />
                    <span aria-hidden>→</span>
                  </div>
                </Link>
              </li>
            ))}
            {visible.length === 0 ? (
              <li className="py-6 font-mono text-small text-muted">
                <T value={{ zh: "暂无案例。", en: "No case studies registered yet." }} />
              </li>
            ) : null}
          </ul>
        </div>
      </section>
    </div>
  );
}

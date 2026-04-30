import Link from "next/link";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";

export function SiteNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-30">
      <div className="absolute inset-0 bg-gradient-to-b from-bg/80 to-transparent" />
      <nav className="relative mx-auto flex max-w-[1280px] items-center justify-between px-6 py-5 md:px-12">
        <Link
          href="/"
          className="font-mono text-small font-medium text-fg/95 hover:text-fg"
        >
          York Zhou
        </Link>
        <div className="flex items-center gap-6">
          <span className="hidden font-mono text-caption uppercase tracking-[0.24em] text-muted sm:inline">
            portfolio
          </span>
          <span className="hidden h-4 w-px bg-line/60 sm:block" />
          <LocaleSwitcher />
        </div>
      </nav>
    </header>
  );
}

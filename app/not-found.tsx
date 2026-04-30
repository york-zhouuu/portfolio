import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-reading px-5 py-section">
      <p className="font-mono text-caption uppercase tracking-[0.22em] text-muted">404</p>
      <h1 className="mt-4 text-headline font-medium">Off-screen.</h1>
      <p className="mt-4 text-body text-fg/72">
        This route is not part of the current camera score.
      </p>
      <Link href="/" className="mt-8 inline-block font-mono text-small text-accent underline">
        ← back to home
      </Link>
    </section>
  );
}

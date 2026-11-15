import { Nav, Footer } from "@/components/Nav";
import { PrimaryLink, SecondaryLink } from "@/components/Button";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="mx-auto flex min-h-[60vh] max-w-[1200px] flex-col items-start justify-center px-6 py-24">
        <p className="font-mono text-sm text-faint">404</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em]">This page doesn&apos;t exist</h1>
        <p className="mt-3 max-w-md text-muted">The link may be old or mistyped. Start from one of these instead.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <PrimaryLink href="/check">Check a listing</PrimaryLink>
          <SecondaryLink href="/">Back to Lokvane</SecondaryLink>
        </div>
      </main>
      <Footer />
    </>
  );
}

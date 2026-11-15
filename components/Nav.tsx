import Link from "next/link";
import { Logo } from "./Logo";
import { PrimaryLink } from "./Button";

export const REPO_URL = "https://github.com/mystiquemide/openserv-2-hack";

export function Nav() {
  return (
    <div className="sticky top-0 z-50 px-4 pt-4">
      <header className="mx-auto flex h-14 max-w-[1200px] items-center justify-between rounded-2xl border border-line bg-panel/80 pl-5 pr-2 backdrop-blur-md">
        <Logo />
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/#how" className="hidden rounded-lg px-3 py-2 text-muted transition hover:text-text md:block">How it works</Link>
          <Link href="/#results" className="hidden rounded-lg px-3 py-2 text-muted transition hover:text-text md:block">Results</Link>
          <a href={REPO_URL} className="hidden rounded-lg px-3 py-2 text-muted transition hover:text-text sm:block">Source</a>
          <span className="ml-2"><PrimaryLink href="/app" arrow={false}>Check a listing</PrimaryLink></span>
        </nav>
      </header>
    </div>
  );
}

const CREDITS = [
  { name: "Yasin Onus", href: "https://unsplash.com/photos/hands-shaping-clay-on-a-pottery-wheel-MsKMSCxNWB0" },
  { name: "Guillaume de Germain", href: "https://unsplash.com/photos/table-set-with-lemons-and-crystal-f6QoaTtdyGw" },
  { name: "Frames For Your Heart", href: "https://unsplash.com/photos/person-holding-clear-glass-with-white-cream-Rj-XcS9Gl4g" },
  { name: "Seiya Maeda", href: "https://unsplash.com/photos/a-shelf-filled-with-lots-of-lit-candles-iujeijz9nwE" },
];

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <Link href="/app" className="transition hover:text-text">App</Link>
            <a href={REPO_URL} className="transition hover:text-text">Source</a>
            <a href="https://docs.openserv.ai/serv-reasoning/introduction.md" className="transition hover:text-text">SERV Reasoning</a>
            <a href="https://eval.reppo.xyz/agents.md" className="transition hover:text-text">Reppo Evaluation API</a>
          </div>
        </div>
        <p className="mt-10 text-xs leading-relaxed text-faint">
          Photography from Unsplash by{" "}
          {CREDITS.map((c, i) => (
            <span key={c.name}>
              <a href={c.href} className="underline decoration-line-2 underline-offset-2 transition hover:text-muted">{c.name}</a>
              {i < CREDITS.length - 2 ? ", " : i === CREDITS.length - 2 ? " and " : "."}
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}

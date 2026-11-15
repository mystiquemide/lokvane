import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function PrimaryLink({ href, children, arrow = true }: { href: string; children: React.ReactNode; arrow?: boolean }) {
  return (
    <Link href={href} className="group inline-flex h-10 items-center gap-2 rounded-lg bg-btn px-4 text-sm font-medium text-btn-text transition hover:bg-white">
      {children}
      {arrow && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
    </Link>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-raise px-4 text-sm font-medium text-text transition hover:border-line-2 hover:bg-[#232429]">
      {children}
    </Link>
  );
}

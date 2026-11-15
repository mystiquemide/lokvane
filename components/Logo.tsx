import Link from "next/link";

export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#f4f4f5" />
      <g transform="rotate(-8 32 32)">
        <circle cx="32" cy="32" r="19" fill="none" stroke="#08090b" strokeWidth="3.5" />
        <path d="M26 21v22h13" fill="none" stroke="#08090b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-text" aria-label="Lokvane home">
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-[-0.02em]">lokvane</span>
    </Link>
  );
}

"use client";

import { motion, useReducedMotion } from "motion/react";

type R = { round: number; listingTitle: string; baselineScore: number | null; fixScore: number | null; rulesUsed: number };

export function RoundsChart({ rounds }: { rounds: R[] }) {
  const reduce = useReducedMotion();
  const H = 220;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-medium">Reppo score per round</p>
        <div className="flex items-center gap-5 text-xs text-muted">
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-[#3f3f46]" />Etsy auto-translation</span>
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-text" />Lokvane fix</span>
        </div>
      </div>
      <div className="relative mt-8">
        <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height: H }}>
          {[100, 50, 0].map((v) => (
            <div key={v} className="absolute inset-x-0 flex items-center gap-3" style={{ top: H - (v / 100) * H - 6 }}>
              <span className="w-7 text-right font-mono text-[10px] text-faint">{v}</span>
              <span className="h-px flex-1 bg-line" />
            </div>
          ))}
        </div>
        <div className="grid gap-2 pl-10 sm:gap-6" style={{ gridTemplateColumns: `repeat(${rounds.length}, minmax(0, 1fr))` }}>
          {rounds.map((r, i) => (
            <div key={r.round} className="flex flex-col items-center">
              <div className="flex w-full items-end justify-center gap-1 sm:gap-1.5" style={{ height: H }}>
                {[
                  { v: r.baselineScore ?? 0, cls: "bg-[#3f3f46]", label: "text-faint" },
                  { v: r.fixScore ?? 0, cls: "bg-text", label: "text-text" },
                ].map((b, j) => (
                  <div key={j} className="flex h-full w-full max-w-7 flex-col items-center justify-end">
                    <span className={`mb-1.5 font-mono text-[10px] tabular-nums sm:text-[11px] ${b.label}`}>{b.v}</span>
                    <motion.div
                      className={`w-full rounded-t-[3px] ${b.cls}`}
                      initial={reduce ? false : { height: 0 }}
                      whileInView={{ height: `${(b.v / 100) * (H - 22)}px` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, delay: i * 0.06 + j * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      style={reduce ? { height: `${(b.v / 100) * (H - 22)}px` } : undefined}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-3 font-mono text-[11px] text-muted">R{r.round}</p>
              <p className="mt-0.5 text-center text-[10px] leading-tight text-faint sm:text-[11px]">{r.rulesUsed} rules</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

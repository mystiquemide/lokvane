"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Copy, Gavel, LoaderCircle, ScanSearch, BookOpen } from "lucide-react";
import { Nav } from "@/components/Nav";
import { SAMPLES } from "@/lib/samples";

type Err = { machine: string; problem: string; fix: string };
type Fix = { errors: Err[]; fixed: { title: string; description: string; tags: string[] }; rulesUsed: number; model: string };
type Verdict = { evalId: string; status: string; score: number | null; route: string | null; decision: string | null; confidence: string | null; reason: string | null };
type Rule = { id: string; text: string; sourceEvalId: string; createdAt: string };
type Round = { round: number; listingTitle: string; baselineEvalId: string; fixEvalId: string; baselineScore: number | null; fixScore: number | null; rulesUsed: number };
type Phase = "idle" | "fixing" | "reviewing" | "learning" | "done";

const EASE = [0.22, 1, 0.36, 1] as const;

const FRIENDLY: [RegExp, string][] = [
  [/Too many requests/i, "You've run a lot of checks in a short time. Give it a few minutes and try again."],
  [/longer than/i, "That listing is too long. Keep each field under 8,000 characters."],
  [/required/i, "Paste both the English listing and Etsy's German translation first."],
  [/FAILED|failed/i, "The Reppo panel couldn't finish this check. Run it again, it usually works the second time."],
  [/timed out/i, "The evaluator panel is taking longer than usual. Try again in a minute."],
];
const friendly = (m: string) => FRIENDLY.find(([re]) => re.test(m))?.[1] ?? "Lokvane couldn't finish this check. Try again in a moment.";

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? `Request failed: ${r.status}`);
  return j;
}

async function pollVerdict(evalId: string, onTick: (v: Verdict) => void): Promise<Verdict> {
  for (let i = 0; i < 150; i++) {
    const v: Verdict = await fetch(`/api/evaluate/${evalId}`).then((r) => r.json());
    onTick(v);
    if (v.status === "COMPLETED" || v.status === "FAILED") return v;
    await new Promise((r) => setTimeout(r, 4000));
  }
  throw new Error("Reppo evaluation timed out");
}

export default function LokvaneApp() {
  const reduce = useReducedMotion();
  const [sampleId, setSampleId] = useState<string>(SAMPLES[0].id);
  const [original, setOriginal] = useState<string>(SAMPLES[0].original);
  const [machine, setMachine] = useState<string>(SAMPLES[0].machine);
  const [fix, setFix] = useState<Fix | null>(null);
  const [baseline, setBaseline] = useState<Verdict | null>(null);
  const [lokvane, setLokvane] = useState<Verdict | null>(null);
  const [added, setAdded] = useState<Rule[]>([]);
  const [playbook, setPlaybook] = useState<Rule[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    fetch("/api/state?market=de").then((r) => r.json()).then((s) => { setPlaybook(s.playbook ?? []); setRounds(s.rounds ?? []); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (phase !== "reviewing") return;
    const start = Date.now();
    setElapsed(0);
    const t = setInterval(() => setElapsed(Math.round((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [phase]);

  function pickSample(id: string) {
    const s = SAMPLES.find((x) => x.id === id);
    if (!s) return;
    setSampleId(id); setOriginal(s.original); setMachine(s.machine);
    setFix(null); setBaseline(null); setLokvane(null); setAdded([]); setPhase("idle"); setError(null);
  }

  async function run() {
    setError(null); setFix(null); setBaseline(null); setLokvane(null); setAdded([]);
    try {
      setPhase("fixing");
      const f = await post<Fix>("/api/fix", { original, machine, marketKey: "de" });
      setFix(f);
      setPhase("reviewing");
      const candidate = `${f.fixed.title}\n${f.fixed.description}\nTags: ${f.fixed.tags.join(", ")}`;
      const [b, l] = await Promise.all([
        post<{ evalId: string }>("/api/evaluate", { original, candidate: machine, marketKey: "de" }),
        post<{ evalId: string }>("/api/evaluate", { original, candidate, marketKey: "de" }),
      ]);
      const [bv, lv] = await Promise.all([pollVerdict(b.evalId, setBaseline), pollVerdict(l.evalId, setLokvane)]);
      if (bv.status !== "COMPLETED" || lv.status !== "COMPLETED") throw new Error("FAILED");
      setPhase("learning");
      const res = await post<{ added: Rule[]; playbook: Rule[]; rounds: Round[] }>("/api/learn", {
        marketKey: "de", listingTitle: original.split("\n")[0], baselineEvalId: bv.evalId, fixEvalId: lv.evalId, rulesUsed: f.rulesUsed,
      });
      setAdded(res.added); setPlaybook(res.playbook); setRounds(res.rounds);
      setPhase("done");
    } catch (e) {
      setError(friendly((e as Error).message));
      setPhase("idle");
    }
  }

  const busy = phase === "fixing" || phase === "reviewing" || phase === "learning";
  const addedIds = new Set(added.map((r) => r.id));
  const delta = baseline?.score != null && lokvane?.score != null && baseline.status === "COMPLETED" && lokvane.status === "COMPLETED" ? lokvane.score - baseline.score : null;
  const enter = (i = 0) => (reduce ? {} : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: i * 0.06, ease: EASE } });

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1200px] px-6 pb-24 pt-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs text-muted">Market: Germany</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Check a listing</h1>
            <p className="mt-2 max-w-xl leading-relaxed text-muted">Paste the English listing and the German version Etsy shows buyers. Lokvane finds the errors, fixes them, and gets both versions scored by Reppo.</p>
          </div>
          <MarketStamp accepted={lokvane?.decision === "accept" && lokvane.status === "COMPLETED"} />
        </div>

        <Stepper phase={phase} elapsed={elapsed} />

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="space-y-5 rounded-2xl border border-line bg-panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label htmlFor="example" className="text-sm font-medium">Example listing</label>
              <select id="example" value={sampleId} onChange={(e) => pickSample(e.target.value)} disabled={busy}
                className="rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm outline-none transition focus:border-line-2">
                {SAMPLES.map((s) => <option key={s.id} value={s.id}>{s.original.split("|")[0].trim()}</option>)}
              </select>
            </div>
            <Field label="English listing" value={original} onChange={setOriginal} disabled={busy} />
            <Field label="Etsy auto-translation, German" value={machine} onChange={setMachine} disabled={busy} />
            <button onClick={run} disabled={busy} aria-live="polite"
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-btn px-5 py-3.5 text-sm font-medium text-btn-text transition hover:bg-white disabled:cursor-wait disabled:opacity-80">
              {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {phase === "fixing" && "Finding errors"}
              {phase === "reviewing" && `Reppo panel reviewing · ${elapsed}s`}
              {phase === "learning" && "Learning from Reppo's critiques"}
              {(phase === "idle" || phase === "done") && <>Check and fix for Germany <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></>}
            </button>
            <AnimatePresence>
              {error && (
                <motion.p {...enter()} exit={{ opacity: 0 }} role="alert" className="rounded-lg border border-err/25 bg-err-soft px-4 py-3 text-sm text-err">{error}</motion.p>
              )}
            </AnimatePresence>
            <p className="text-xs leading-relaxed text-faint">The examples are written listings, not real shops. Reppo evaluations are public, so only paste text that is already public.</p>
          </section>

          <section className="rounded-2xl border border-line bg-panel p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">What the translation got wrong</h2>
              {fix && <span className="rounded-full border border-err/25 bg-err-soft px-2.5 py-0.5 font-mono text-[11px] text-err">{fix.errors.length} errors</span>}
            </div>
            {!fix && (
              <div className="mt-5 flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-line text-center">
                {phase === "fixing" ? <LoaderCircle className="h-5 w-5 animate-spin text-muted" /> : <ScanSearch className="h-5 w-5 text-faint" strokeWidth={1.75} />}
                <p className="mt-3 max-w-xs text-sm text-muted">{phase === "fixing" ? "Reading both versions" : "Each error appears here with what a German buyer would read and the fix."}</p>
              </div>
            )}
            {fix && (
              <>
                <ul className="mt-5 space-y-2">
                  {fix.errors.map((e, i) => (
                    <motion.li key={i} {...enter(i)} className="rounded-xl border border-line bg-panel-2 p-4">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[15px]">
                        <span className="text-err line-through decoration-err/50">{e.machine}</span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 self-center text-faint" />
                        <span className="font-medium text-ok">{e.fix}</span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">{e.problem}</p>
                    </motion.li>
                  ))}
                </ul>
                <motion.div {...enter(fix.errors.length)} className="mt-5 rounded-xl border border-line p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-xs text-muted">Corrected listing</p>
                    <CopyButton text={`${fix.fixed.title}\n\n${fix.fixed.description}\n\n${fix.fixed.tags.join(", ")}`} />
                  </div>
                  <p className="mt-3 font-medium leading-snug">{fix.fixed.title}</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text/80">{fix.fixed.description}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {fix.fixed.tags.map((t) => <span key={t} className="rounded-md border border-line bg-panel-2 px-2 py-0.5 text-xs">{t}</span>)}
                  </div>
                  <p className="mt-4 font-mono text-[11px] text-faint">{fix.rulesUsed} playbook rules applied · SERV Reasoning · {fix.model}</p>
                </motion.div>
              </>
            )}
          </section>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <ScoreCard title="Etsy auto-translation" v={baseline} />
          <ScoreCard title="Lokvane fix" v={lokvane} delta={delta} highlight />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <section className="rounded-2xl border border-line bg-panel p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-medium">Germany playbook</h2>
              <span className="font-mono text-xs text-muted">{playbook.length} rules</span>
            </div>
            <p className="mt-1 text-xs text-muted">Every rule came from a Reppo evaluator critique. The ID is the verdict that taught it.</p>
            {playbook.length === 0 && <Empty icon={BookOpen} text="Run a check to start the Germany playbook" />}
            <ol className="mt-4 space-y-2">
              <AnimatePresence initial={false}>
                {playbook.map((r) => (
                  <motion.li key={r.id} layout={!reduce} initial={reduce ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: EASE }}
                    className={`rounded-xl border p-4 text-sm leading-relaxed transition-colors ${addedIds.has(r.id) ? "border-ok/30 bg-ok-soft" : "border-line bg-panel-2"}`}>
                    <p>{r.text}</p>
                    <p className="mt-2 flex items-center gap-2 font-mono text-[11px] text-faint">
                      Reppo {r.sourceEvalId}
                      {addedIds.has(r.id) && <span className="rounded-full bg-ok px-1.5 py-px text-[10px] text-bg">new</span>}
                    </p>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>
          </section>

          <section className="rounded-2xl border border-line bg-panel p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-medium">Rounds</h2>
              <span className="flex items-center gap-4 text-xs text-muted">
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-3 rounded-full bg-[#3f3f46]" />Etsy</span>
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-3 rounded-full bg-text" />Lokvane</span>
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">Reppo score out of 100 for each version of each listing.</p>
            {rounds.length === 0 && <Empty icon={Gavel} text="No rounds yet. Run a check to record the first one" />}
            <div className="mt-4 space-y-2">
              {[...rounds].reverse().map((r) => (
                <div key={r.round} className="rounded-xl border border-line bg-panel-2 p-4">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate"><span className="font-mono text-faint">#{r.round}</span> {r.listingTitle.split("|")[0].trim()}</span>
                    <span className="shrink-0 font-mono text-[11px] text-muted">{r.rulesUsed} rules</span>
                  </div>
                  <Bar value={r.baselineScore} id={r.baselineEvalId} light />
                  <Bar value={r.fixScore} id={r.fixEvalId} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function Stepper({ phase, elapsed }: { phase: Phase; elapsed: number }) {
  const steps = [
    { key: "fixing", label: "Find errors", sub: "SERV Reasoning", icon: ScanSearch },
    { key: "reviewing", label: "Independent verdict", sub: phase === "reviewing" ? `Reppo panel · ${elapsed}s` : "Reppo panel", icon: Gavel },
    { key: "learning", label: "Learn rules", sub: "Germany playbook", icon: BookOpen },
  ];
  const order = ["idle", "fixing", "reviewing", "learning", "done"];
  const at = order.indexOf(phase);
  return (
    <ol className="mt-8 grid gap-1 rounded-2xl border border-line bg-panel p-2 sm:grid-cols-3 sm:gap-2">
      {steps.map((s, i) => {
        const idx = i + 1;
        const state = at > idx ? "done" : at === idx ? "active" : "todo";
        return (
          <li key={s.key} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${state === "active" ? "bg-panel-2" : ""}`}>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${state === "done" ? "border-ok bg-ok text-bg" : state === "active" ? "border-text bg-text text-bg" : "border-line text-faint"}`}>
              {state === "done" ? <Check className="h-4 w-4" /> : state === "active" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <s.icon className="h-4 w-4" strokeWidth={1.75} />}
            </span>
            <span className="min-w-0">
              <span className={`block truncate text-sm font-medium ${state === "todo" ? "text-muted" : ""}`}>{s.label}</span>
              <span className="block truncate font-mono text-[11px] text-faint">{s.sub}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Field({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={6} disabled={disabled}
        className="mt-2 w-full resize-y rounded-xl border border-line bg-panel-2 px-4 py-3 font-mono text-[13px] leading-relaxed outline-none transition focus:border-line-2 disabled:opacity-70" />
    </label>
  );
}

function Empty({ icon: Icon, text }: { icon: typeof Gavel; text: string }) {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-line px-4 py-6 text-sm text-muted">
      <Icon className="h-4 w-4 text-faint" strokeWidth={1.75} />
      {text}
    </div>
  );
}

function CountUp({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) { setN(value); return; }
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 900);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduce]);
  return <>{n}</>;
}

function ScoreCard({ title, v, delta, highlight }: { title: string; v: Verdict | null; delta?: number | null; highlight?: boolean }) {
  const done = v?.status === "COMPLETED" && v.score != null;
  return (
    <section className={`rounded-2xl border p-6 ${highlight && done ? "border-line-2 bg-panel" : "border-line bg-panel"}`}>
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-muted">{title}</p>
        {delta != null && (
          <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-medium ${delta >= 0 ? "bg-ok-soft text-ok" : "bg-err-soft text-err"}`}>
            {delta >= 0 ? "+" : ""}{delta} points
          </motion.span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-mono text-5xl font-semibold tabular-nums tracking-tight">{done ? <CountUp value={v.score!} /> : <span className="text-2xl font-medium tracking-normal text-faint">Not scored yet</span>}</span>
        {done && <span className="text-sm text-muted">/ 100 Reppo score</span>}
      </div>
      {!v && <p className="mt-3 text-sm text-faint">Reppo scores this version after Lokvane fixes it</p>}
      {v && !done && <p className="mt-3 flex items-center gap-2 text-sm text-muted"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />Panel {v.status === "FAILED" ? "could not finish" : "reviewing"}</p>}
      {done && (
        <>
          <p className="mt-3 text-xs text-muted">{v.decision} · {v.confidence} confidence · route {v.route}</p>
          {v.reason && <p className="mt-3 text-sm leading-relaxed text-text/80">{v.reason}</p>}
        </>
      )}
      {v && <p className="mt-4 font-mono text-[11px] text-faint">Reppo eval {v.evalId}</p>}
    </section>
  );
}

function Bar({ value, id, light }: { value: number | null; id: string; light?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="mt-2.5 flex items-center gap-3" title={`Reppo eval ${id}`}>
      <div className="h-1.5 flex-1 rounded-full bg-line">
        <motion.div className={`h-1.5 rounded-full ${light ? "bg-[#3f3f46]" : "bg-text"}`}
          initial={reduce ? false : { width: 0 }} animate={{ width: `${value ?? 0}%` }} transition={{ duration: 0.8, ease: EASE }} />
      </div>
      <span className="w-7 text-right font-mono text-xs tabular-nums">{value ?? "–"}</span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button aria-label="Copy corrected listing" onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1600); }}
      className="flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-xs text-muted transition hover:border-line-2 hover:text-text">
      {copied ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function MarketStamp({ accepted }: { accepted: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={accepted ? "on" : "off"}
      initial={accepted && !reduce ? { scale: 1.25, opacity: 0, rotate: -8 } : false}
      animate={{ scale: 1, opacity: 1, rotate: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 ${accepted ? "border-ok text-ok" : "border-dashed border-line text-faint"}`}
      aria-label={accepted ? "Germany: accepted by Reppo" : "Germany"}
    >
      <span className="font-mono text-lg font-bold leading-none">DE</span>
      <span className="mt-1 text-[10px] font-medium">{accepted ? "Accepted" : "Germany"}</span>
    </motion.div>
  );
}

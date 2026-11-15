"use client";

import { useEffect, useState } from "react";
import { SAMPLES } from "@/lib/samples";

type Err = { machine: string; problem: string; fix: string };
type Fix = { errors: Err[]; fixed: { title: string; description: string; tags: string[] }; rulesUsed: number; model: string };
type Verdict = {
  evalId: string;
  status: string;
  score: number | null;
  route: string | null;
  decision: string | null;
  confidence: string | null;
  reason: string | null;
};
type Rule = { id: string; text: string; sourceEvalId: string; createdAt: string };
type Round = { round: number; listingTitle: string; baselineEvalId: string; fixEvalId: string; baselineScore: number | null; fixScore: number | null; rulesUsed: number; rulesAdded: string[] };

const post = async <T,>(path: string, body: unknown): Promise<T> => {
  const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? `Request failed: ${r.status}`);
  return j;
};

async function pollVerdict(evalId: string, onTick: (v: Verdict) => void): Promise<Verdict> {
  for (let i = 0; i < 120; i++) {
    const v: Verdict = await fetch(`/api/evaluate/${evalId}`).then((r) => r.json());
    onTick(v);
    if (v.status === "COMPLETED" || v.status === "FAILED") return v;
    await new Promise((r) => setTimeout(r, 4000));
  }
  throw new Error("Reppo evaluation timed out");
}

function shortId(id: string) {
  return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-5)}` : id;
}

export default function Page() {
  const [sampleId, setSampleId] = useState<string>(SAMPLES[0].id);
  const [original, setOriginal] = useState<string>(SAMPLES[0].original);
  const [machine, setMachine] = useState<string>(SAMPLES[0].machine);
  const [fix, setFix] = useState<Fix | null>(null);
  const [baseline, setBaseline] = useState<Verdict | null>(null);
  const [lokvane, setLokvane] = useState<Verdict | null>(null);
  const [added, setAdded] = useState<Rule[]>([]);
  const [playbook, setPlaybook] = useState<Rule[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [phase, setPhase] = useState<"idle" | "fixing" | "reviewing" | "learning" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    fetch("/api/state?market=de").then((r) => r.json()).then((s) => { setPlaybook(s.playbook ?? []); setRounds(s.rounds ?? []); });
  }, []);

  useEffect(() => {
    if (phase !== "reviewing") return;
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.round((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [phase]);

  function pickSample(id: string) {
    const s = SAMPLES.find((x) => x.id === id);
    if (!s) return;
    setSampleId(id);
    setOriginal(s.original);
    setMachine(s.machine);
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
      if (bv.status !== "COMPLETED" || lv.status !== "COMPLETED") throw new Error("A Reppo evaluation failed. Failed evaluations are not charged, so run it again.");
      setPhase("learning");
      const res = await post<{ added: Rule[]; playbook: Rule[]; rounds: Round[] }>("/api/learn", {
        marketKey: "de", listingTitle: original.split("\n")[0], baselineEvalId: bv.evalId, fixEvalId: lv.evalId, rulesUsed: f.rulesUsed,
      });
      setAdded(res.added); setPlaybook(res.playbook); setRounds(res.rounds);
      setPhase("done");
    } catch (e) {
      setError((e as Error).message);
      setPhase("idle");
    }
  }

  const busy = phase === "fixing" || phase === "reviewing" || phase === "learning";
  const addedIds = new Set(added.map((r) => r.id));

  return (
    <main className="min-h-screen bg-[#f6f3ee] text-[#1d1b18]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="flex items-end justify-between gap-6 border-b border-[#1d1b18]/15 pb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Lokvane</h1>
            <p className="mt-1 text-sm text-[#1d1b18]/70">
              Finds what Etsy auto-translation got wrong, fixes it, and learns each market from independent Reppo verdicts.
            </p>
          </div>
          <Stamp market="DE" label="Germany" accepted={lokvane?.decision === "accept"} />
        </header>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <label htmlFor="sample" className="text-[#1d1b18]/70">Sample listing</label>
              <select id="sample" value={sampleId} onChange={(e) => pickSample(e.target.value)} className="rounded border border-[#1d1b18]/20 bg-white px-2 py-1">
                {SAMPLES.map((s) => <option key={s.id} value={s.id}>{s.original.split("|")[0].trim()}</option>)}
              </select>
            </div>
            <Field label="English original" value={original} onChange={setOriginal} />
            <Field label="Etsy auto-translation (German)" value={machine} onChange={setMachine} />
            <button onClick={run} disabled={busy} className="w-full rounded bg-[#1d1b18] px-4 py-3 text-sm font-medium text-[#f6f3ee] disabled:opacity-60">
              {phase === "fixing" && "SERV Reasoning is checking the translation…"}
              {phase === "reviewing" && `Reppo panel reviewing both versions · ${elapsed}s`}
              {phase === "learning" && "Turning Reppo critiques into playbook rules…"}
              {(phase === "idle" || phase === "done") && "Check and fix for Germany"}
            </button>
            {error && <p className="rounded border border-[#c2410c]/40 bg-[#c2410c]/5 p-3 text-sm text-[#c2410c]">{error}</p>}
            <p className="text-xs text-[#1d1b18]/50">Sample listings are written for this tool and are not real shops. Reppo evaluations are public, so only paste public listing text.</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#1d1b18]/60">What the translation got wrong</h2>
            {!fix && <Empty text={busy ? "Checking…" : "Run a check to see each error, why it matters to a German buyer, and the fix."} />}
            {fix && (
              <ul className="space-y-2">
                {fix.errors.map((e, i) => (
                  <li key={i} className="rounded border border-[#1d1b18]/10 bg-white p-3 text-sm">
                    <div><span className="text-[#c2410c] line-through">{e.machine}</span> <span className="mx-1 text-[#1d1b18]/40">→</span> <span className="font-medium text-[#15803d]">{e.fix}</span></div>
                    <p className="mt-1 text-[#1d1b18]/70">{e.problem}</p>
                  </li>
                ))}
              </ul>
            )}
            {fix && (
              <div className="rounded border border-[#1d1b18]/10 bg-white p-4 text-sm">
                <p className="text-xs uppercase tracking-wide text-[#1d1b18]/50">Corrected listing</p>
                <p className="mt-2 font-medium">{fix.fixed.title}</p>
                <p className="mt-2 whitespace-pre-line text-[#1d1b18]/80">{fix.fixed.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">{fix.fixed.tags.map((t) => <span key={t} className="rounded bg-[#1d1b18]/5 px-2 py-0.5 text-xs">{t}</span>)}</div>
                <p className="mt-3 text-xs text-[#1d1b18]/50">Applied {fix.rulesUsed} playbook rule{fix.rulesUsed === 1 ? "" : "s"} · SERV Reasoning, {fix.model}</p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <ScoreCard title="Etsy auto-translation" v={baseline} />
          <ScoreCard title="Lokvane fix" v={lokvane} delta={baseline?.score != null && lokvane?.score != null ? lokvane.score - baseline.score : null} />
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#1d1b18]/60">Germany playbook · {playbook.length} rules</h2>
            <p className="mt-1 text-xs text-[#1d1b18]/50">Each rule came from a Reppo evaluator critique. The ID shows which verdict taught it.</p>
            {playbook.length === 0 && <div className="mt-3"><Empty text="No rules yet. The first check will start the playbook." /></div>}
            <ol className="mt-3 space-y-2">
              {playbook.map((r) => (
                <li key={r.id} className={`rounded border p-3 text-sm transition ${addedIds.has(r.id) ? "border-[#15803d]/50 bg-[#15803d]/5" : "border-[#1d1b18]/10 bg-white"}`}>
                  <p>{r.text}</p>
                  <p className="mt-1 font-mono text-xs text-[#1d1b18]/50">Reppo {r.sourceEvalId}{addedIds.has(r.id) ? " · new" : ""}</p>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#1d1b18]/60">Rounds</h2>
            <p className="mt-1 text-xs text-[#1d1b18]/50">Reppo score for the auto-translation (light) and the Lokvane fix (dark), per listing.</p>
            {rounds.length === 0 && <div className="mt-3"><Empty text="No rounds yet." /></div>}
            <div className="mt-3 space-y-3">
              {rounds.map((r) => (
                <div key={r.round} className="rounded border border-[#1d1b18]/10 bg-white p-3 text-sm">
                  <div className="flex justify-between gap-2"><span className="truncate">#{r.round} {r.listingTitle}</span><span className="shrink-0 text-xs text-[#1d1b18]/50">{r.rulesUsed} rules in use</span></div>
                  <Bar value={r.baselineScore} light id={r.baselineEvalId} />
                  <Bar value={r.fixScore} id={r.fixEvalId} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="mt-12 border-t border-[#1d1b18]/15 pt-4 text-xs text-[#1d1b18]/50">
          Fixes by SERV Reasoning (OpenServ). Scores by the Reppo Evaluation API panel, never by Lokvane itself.
        </footer>
      </div>
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="text-[#1d1b18]/70">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={5} className="mt-1 w-full rounded border border-[#1d1b18]/20 bg-white p-3 font-mono text-xs leading-relaxed" />
    </label>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded border border-dashed border-[#1d1b18]/20 p-4 text-sm text-[#1d1b18]/50">{text}</p>;
}

function ScoreCard({ title, v, delta }: { title: string; v: Verdict | null; delta?: number | null }) {
  const done = v?.status === "COMPLETED";
  return (
    <div className="rounded border border-[#1d1b18]/10 bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-[#1d1b18]/50">{title}</p>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-4xl font-semibold tabular-nums">{done ? v.score : "—"}</span>
        <span className="text-sm text-[#1d1b18]/50">/ 100 Reppo score</span>
        {delta != null && <span className={`ml-auto text-sm font-medium ${delta >= 0 ? "text-[#15803d]" : "text-[#c2410c]"}`}>{delta >= 0 ? "+" : ""}{delta}</span>}
      </div>
      {v && <p className="mt-2 text-xs text-[#1d1b18]/60">{done ? `${v.decision} · ${v.confidence} confidence · route ${v.route}` : v.status.toLowerCase()}</p>}
      {done && v.reason && <p className="mt-2 text-sm text-[#1d1b18]/75">{v.reason}</p>}
      {v && <p className="mt-2 font-mono text-xs text-[#1d1b18]/50">Reppo eval {v.evalId}</p>}
    </div>
  );
}

function Bar({ value, light, id }: { value: number | null; light?: boolean; id: string }) {
  return (
    <div className="mt-2 flex items-center gap-2" title={`Reppo eval ${id}`}>
      <div className="h-2 flex-1 rounded bg-[#1d1b18]/5">
        <div className={`h-2 rounded ${light ? "bg-[#1d1b18]/25" : "bg-[#1d1b18]"}`} style={{ width: `${value ?? 0}%` }} />
      </div>
      <span className="w-8 text-right text-xs tabular-nums">{value ?? "—"}</span>
      <span className="w-24 truncate font-mono text-[10px] text-[#1d1b18]/40">{shortId(id)}</span>
    </div>
  );
}

function Stamp({ market, label, accepted }: { market: string; label: string; accepted: boolean }) {
  return (
    <div className={`flex h-20 w-20 rotate-[-6deg] flex-col items-center justify-center rounded-full border-2 text-center transition ${accepted ? "border-[#15803d] text-[#15803d]" : "border-[#1d1b18]/30 text-[#1d1b18]/40"}`}>
      <span className="text-xl font-bold leading-none">{market}</span>
      <span className="mt-1 text-[10px] uppercase tracking-wider">{accepted ? "accepted" : label}</span>
    </div>
  );
}

const BASE = "https://eval.reppo.xyz/api/v1/agents/evals";

function headers() {
  if (!process.env.REPPO_API_KEY) throw new Error("REPPO_API_KEY is not configured");
  return { Authorization: `Bearer ${process.env.REPPO_API_KEY}`, "Content-Type": "application/json" };
}

export type ReppoEval = {
  id: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  score: number | null;
  route: string | null;
  result: null | {
    score: number;
    decision: string;
    confidence: string;
    route: string;
    reason: string;
    rubric_scores: Record<string, number>;
  };
  trace?: { judgments?: { model: string; allocations?: { reason: string; evaluator: string }[] }[] };
  error: unknown;
};

export async function submitEval(input: string): Promise<ReppoEval> {
  const r = await fetch(BASE, { method: "POST", headers: headers(), body: JSON.stringify({ taskType: "response", input }) });
  if (!r.ok) throw new Error(`Reppo submit failed: ${r.status} ${await r.text()}`);
  return r.json();
}

export async function getEval(id: string): Promise<ReppoEval> {
  const r = await fetch(`${BASE}/${encodeURIComponent(id)}`, { headers: headers(), cache: "no-store" });
  if (!r.ok) throw new Error(`Reppo read failed: ${r.status}`);
  return r.json();
}

/** Evaluator reasoning lines from the trace, deduplicated. */
export function critiques(e: ReppoEval): string[] {
  const out = new Set<string>();
  for (const j of e.trace?.judgments ?? []) for (const a of j.allocations ?? []) if (a.reason) out.add(a.reason);
  if (e.result?.reason) out.add(e.result.reason);
  return [...out].slice(0, 20);
}

/** Build the Reppo input for a localized listing. */
export function evalInput(market: string, original: string, candidate: string): string {
  return [
    `User prompt: Localize this Etsy listing for buyers in ${market}. The localized listing must be accurate to the original, natural for native speakers, and use search terms local buyers use.`,
    `Original listing (English):\n"""\n${original}\n"""`,
    `AI response (localized listing):\n"""\n${candidate}\n"""`,
  ].join("\n\n");
}

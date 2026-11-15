import { NextResponse } from "next/server";
import { getEval, critiques } from "@/lib/reppo";
import { servJSON, RULES_SCHEMA } from "@/lib/serv";
import { getPlaybook, savePlaybook, getRounds, saveRounds, type Rule } from "@/lib/store";
import { market } from "@/lib/markets";

const MAX_RULES = 12;

export async function POST(req: Request) {
  try {
    const { marketKey, listingTitle, baselineEvalId, fixEvalId, rulesUsed } = await req.json();
    const m = market(marketKey);
    const [base, fix] = await Promise.all([getEval(baselineEvalId), getEval(fixEvalId)]);
    if (base.status !== "COMPLETED" || fix.status !== "COMPLETED") {
      return NextResponse.json({ error: "Both Reppo evaluations must be COMPLETED" }, { status: 409 });
    }
    const rules = await getPlaybook(marketKey);
    const notes = [
      ...critiques(base).map((c) => `[on machine translation, eval ${base.id}] ${c}`),
      ...critiques(fix).map((c) => `[on Lokvane fix, eval ${fix.id}] ${c}`),
    ];
    const system = `You maintain a localization playbook for Etsy listings sold in ${m.name}. From independent evaluator feedback, extract at most 3 NEW, concrete, reusable rules that would improve future ${m.language} listings. Skip anything already covered by an existing rule, anything generic ("be accurate"), and anything specific to one product only. If nothing new and useful, return an empty list.
Each rule must cite the eval id it came from.
Each rule: "text" is one imperative sentence, "sourceEvalId" is the exact eval id the feedback came from.`;
    const user = `Existing rules:\n${rules.map((r) => `- ${r.text}`).join("\n") || "(none)"}\n\nEvaluator feedback:\n${notes.join("\n")}`;
    const out = await servJSON<{ rules: { text: string; sourceEvalId: string }[] }>("playbook_rules", RULES_SCHEMA, system, user);
    const valid = new Set([base.id, fix.id]);
    const added: Rule[] = (out.rules ?? [])
      .filter((r) => r.text && valid.has(r.sourceEvalId))
      .slice(0, 3)
      .map((r) => ({ id: crypto.randomUUID().slice(0, 8), text: r.text.trim(), sourceEvalId: r.sourceEvalId, createdAt: new Date().toISOString() }));
    const next = [...rules, ...added].slice(-MAX_RULES);
    await savePlaybook(marketKey, next);
    const rounds = await getRounds(marketKey);
    rounds.push({
      round: rounds.length + 1,
      listingTitle: String(listingTitle ?? "").slice(0, 120),
      baselineEvalId: base.id,
      fixEvalId: fix.id,
      baselineScore: base.result?.score ?? null,
      fixScore: fix.result?.score ?? null,
      rulesUsed: Number(rulesUsed ?? 0),
      rulesAdded: added.map((r) => r.text),
      at: new Date().toISOString(),
    });
    await saveRounds(marketKey, rounds);
    return NextResponse.json({ added, playbook: next, rounds });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

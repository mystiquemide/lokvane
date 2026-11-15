import { NextResponse } from "next/server";
import { submitEval, evalInput } from "@/lib/reppo";
import { market } from "@/lib/markets";
import { text, rateLimit, dailyBudget, errorResponse } from "@/lib/guard";

export async function POST(req: Request) {
  try {
    // Each round submits two evaluations, so this allows 3 rounds per IP per hour.
    rateLimit(req, "evaluate", 6, 60 * 60_000);
    const body = await req.json();
    const m = market(body.marketKey);
    const original = text(body.original, "original");
    const candidate = text(body.candidate, "candidate");
    dailyBudget("evaluate");
    const e = await submitEval(evalInput(m.name, original, candidate));
    return NextResponse.json({ evalId: e.id, status: e.status });
  } catch (err) {
    return errorResponse(err, 502);
  }
}

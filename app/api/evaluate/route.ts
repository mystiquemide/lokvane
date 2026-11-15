import { NextResponse } from "next/server";
import { submitEval, evalInput } from "@/lib/reppo";
import { market } from "@/lib/markets";
import { text, rateLimit, errorResponse } from "@/lib/guard";

export async function POST(req: Request) {
  try {
    // Each round submits two evaluations, so this allows 5 rounds per IP every 10 minutes.
    rateLimit(req, "evaluate", 10, 10 * 60_000);
    const body = await req.json();
    const m = market(body.marketKey);
    const e = await submitEval(evalInput(m.name, text(body.original, "original"), text(body.candidate, "candidate")));
    return NextResponse.json({ evalId: e.id, status: e.status });
  } catch (err) {
    return errorResponse(err, 502);
  }
}

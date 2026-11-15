import { NextResponse } from "next/server";
import { submitEval, evalInput } from "@/lib/reppo";
import { market } from "@/lib/markets";

export async function POST(req: Request) {
  try {
    const { original, candidate, marketKey } = await req.json();
    if (!original || !candidate) return NextResponse.json({ error: "original and candidate are required" }, { status: 400 });
    const e = await submitEval(evalInput(market(marketKey).name, original, candidate));
    return NextResponse.json({ evalId: e.id, status: e.status });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}

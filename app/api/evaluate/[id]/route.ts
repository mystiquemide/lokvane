import { NextResponse } from "next/server";
import { getEval, critiques } from "@/lib/reppo";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const e = await getEval(id);
    return NextResponse.json({
      evalId: e.id,
      status: e.status,
      score: e.result?.score ?? e.score,
      route: e.result?.route ?? e.route,
      decision: e.result?.decision ?? null,
      confidence: e.result?.confidence ?? null,
      reason: e.result?.reason ?? null,
      rubric: e.result?.rubric_scores ?? null,
      critiques: e.status === "COMPLETED" ? critiques(e) : [],
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}

import { NextResponse } from "next/server";
import { getEval, critiques } from "@/lib/reppo";
import { HttpError, errorResponse } from "@/lib/guard";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (!/^[a-z0-9]{10,40}$/i.test(id)) throw new HttpError(400, "Invalid eval id");
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
    return errorResponse(err, 502);
  }
}

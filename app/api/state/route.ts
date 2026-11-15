import { NextResponse } from "next/server";
import { getPlaybook, getRounds } from "@/lib/store";
import { market } from "@/lib/markets";
import { errorResponse } from "@/lib/guard";

export async function GET(req: Request) {
  const marketKey = new URL(req.url).searchParams.get("market") ?? "de";
  try {
    market(marketKey);
    const [playbook, rounds] = await Promise.all([getPlaybook(marketKey), getRounds(marketKey)]);
    return NextResponse.json({ playbook, rounds });
  } catch (err) {
    return errorResponse(err);
  }
}

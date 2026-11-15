import { test } from "node:test";
import assert from "node:assert/strict";
import { critiques, evalInput, type ReppoEval } from "../lib/reppo.ts";
import { text, rateLimit, dailyBudget, clientIp, serialized, HttpError } from "../lib/guard.ts";

const verdict = (over: Partial<ReppoEval> = {}): ReppoEval => ({
  id: "cmtest000000000000000001",
  status: "COMPLETED",
  score: 80,
  route: "review",
  result: { score: 80, decision: "accept", confidence: "medium", route: "review", reason: "Overall reason.", rubric_scores: { factual_accuracy: 80 } },
  trace: {
    judgments: [
      { model: "a", allocations: [{ reason: "Imperial units were not converted.", evaluator: "x" }, { reason: "Imperial units were not converted.", evaluator: "y" }] },
      { model: "b", allocations: [{ reason: "Gift means poison in German.", evaluator: "z" }] },
    ],
  },
  error: null,
  ...over,
});

test("critiques: collects evaluator reasoning from the Reppo trace, deduplicated, plus the verdict reason", () => {
  assert.deepEqual(critiques(verdict()), ["Imperial units were not converted.", "Gift means poison in German.", "Overall reason."]);
});

test("critiques: handles a verdict with no trace", () => {
  assert.deepEqual(critiques(verdict({ trace: undefined, result: null })), []);
});

test("evalInput: frames the task for Reppo with market, original and candidate as delimited data", () => {
  const input = evalInput("Germany", "Gift for her", "Geschenk für sie");
  assert.match(input, /buyers in Germany/);
  assert.match(input, /Original listing \(English\):\n"""\nGift for her\n"""/);
  assert.match(input, /AI response \(localized listing\):\n"""\nGeschenk für sie\n"""/);
});

test("text: rejects empty and oversized listing fields", () => {
  assert.equal(text("ok", "f"), "ok");
  assert.throws(() => text("", "original"), (e: HttpError) => e.status === 400);
  assert.throws(() => text(42, "original"), (e: HttpError) => e.status === 400);
  assert.throws(() => text("a".repeat(8001), "original"), (e: HttpError) => e.status === 413);
});

test("rateLimit: allows up to the limit per IP, then returns 429", () => {
  const req = new Request("http://x", { headers: { "x-real-ip": "203.0.113.9" } });
  for (let i = 0; i < 3; i++) rateLimit(req, "t", 3, 60_000);
  assert.throws(() => rateLimit(req, "t", 3, 60_000), (e: HttpError) => e.status === 429);
  const other = new Request("http://x", { headers: { "x-real-ip": "203.0.113.10" } });
  assert.doesNotThrow(() => rateLimit(other, "t", 3, 60_000));
});

test("clientIp: trusts X-Real-IP and the proxy-added last hop, not a spoofed first hop", () => {
  assert.equal(clientIp(new Request("http://x", { headers: { "x-real-ip": "198.51.100.1", "x-forwarded-for": "1.2.3.4" } })), "198.51.100.1");
  assert.equal(clientIp(new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 198.51.100.2" } })), "198.51.100.2");
});

test("dailyBudget: caps total calls across all visitors, then returns 503", () => {
  process.env.DAILY_EVAL_LIMIT = "2";
  dailyBudget("evaluate");
  dailyBudget("evaluate");
  assert.throws(() => dailyBudget("evaluate"), (e: HttpError) => e.status === 503);
});

test("serialized: concurrent writes run one at a time, and a failure doesn't block the queue", async () => {
  const log: string[] = [];
  const slow = (tag: string, ms: number) => serialized(async () => { log.push(`start ${tag}`); await new Promise((r) => setTimeout(r, ms)); log.push(`end ${tag}`); });
  const failing = serialized(async () => { throw new Error("boom"); });
  await Promise.all([slow("a", 20), failing.catch(() => {}), slow("b", 1)]);
  assert.deepEqual(log, ["start a", "end a", "start b", "end b"]);
});

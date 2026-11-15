// Runs one full Lokvane round against a running app: fix -> Reppo eval (baseline + fix) -> learn.
// Usage: node scripts/round.mjs <sampleId> [baseUrl]
import { readFileSync } from "fs";
const [id, base = "http://localhost:3000"] = process.argv.slice(2);
const s = JSON.parse(readFileSync(new URL("../lib/samples.json", import.meta.url))).find((x) => x.id === id);
if (!s) throw new Error(`unknown sample ${id}`);
const post = (p, b) => fetch(base + p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(`${p}: ${j.error}`); return j; });
const poll = async (evalId) => { for (let i = 0; i < 60; i++) { const j = await fetch(`${base}/api/evaluate/${evalId}`).then((r) => r.json()); if (j.status === "COMPLETED" || j.status === "FAILED") return j; await new Promise((r) => setTimeout(r, 5000)); } throw new Error("timeout"); };
const fix = await post("/api/fix", { original: s.original, machine: s.machine, marketKey: "de" });
console.log(`fix: ${fix.errors.length} errors, rules used ${fix.rulesUsed}`);
const candidate = `${fix.fixed.title}\n${fix.fixed.description}\nTags: ${fix.fixed.tags.join(", ")}`;
const [b, f] = await Promise.all([
  post("/api/evaluate", { original: s.original, candidate: s.machine, marketKey: "de" }),
  post("/api/evaluate", { original: s.original, candidate, marketKey: "de" }),
]);
const [be, fe] = await Promise.all([poll(b.evalId), poll(f.evalId)]);
console.log(`baseline ${be.evalId} ${be.status} ${be.score} | fix ${fe.evalId} ${fe.status} ${fe.score}`);
const learn = await post("/api/learn", { marketKey: "de", listingTitle: s.original.split("\n")[0], baselineEvalId: be.evalId, fixEvalId: fe.evalId, rulesUsed: fix.rulesUsed });
console.log("rules added:", learn.added.map((r) => `${r.text} [${r.sourceEvalId}]`));

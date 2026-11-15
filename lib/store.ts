import { promises as fs } from "fs";
import path from "path";

const DIR = path.join(process.cwd(), "data");

export type Rule = { id: string; text: string; sourceEvalId: string; createdAt: string };
export type Round = {
  round: number;
  listingTitle: string;
  baselineEvalId: string;
  fixEvalId: string;
  baselineScore: number | null;
  fixScore: number | null;
  rulesUsed: number;
  rulesAdded: string[];
  at: string;
};

async function read<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(path.join(DIR, file), "utf8")) as T;
  } catch {
    return fallback;
  }
}
async function write(file: string, data: unknown) {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, file), JSON.stringify(data, null, 2));
}

export const getPlaybook = (market: string) => read<Rule[]>(`playbook-${market}.json`, []);
export const savePlaybook = (market: string, rules: Rule[]) => write(`playbook-${market}.json`, rules);
export const getRounds = (market: string) => read<Round[]>(`rounds-${market}.json`, []);
export const saveRounds = (market: string, rounds: Round[]) => write(`rounds-${market}.json`, rounds);

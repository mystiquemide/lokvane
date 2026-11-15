// Request guards for public endpoints that spend SERV and Reppo credits.

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const MAX_TEXT = 8_000; // characters per listing field, well under Reppo's 50 KB limit

export function text(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) throw new HttpError(400, `${field} is required`);
  if (value.length > MAX_TEXT) throw new HttpError(413, `${field} is longer than ${MAX_TEXT} characters`);
  return value;
}

// Fixed-window limiters, in memory. One process serves the app, so this is enough here.
const hits = new Map<string, { n: number; reset: number }>();

function take(key: string, max: number, windowMs: number): number | null {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    return null;
  }
  if (h.n >= max) return Math.ceil((h.reset - now) / 1000);
  h.n++;
  return null;
}

// Traefik sets X-Real-IP to the connecting client. X-Forwarded-For is client-controlled,
// so only its last hop (added by the proxy) is trusted.
export function clientIp(req: Request): string {
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const xff = req.headers.get("x-forwarded-for");
  return xff ? xff.split(",").pop()!.trim() : "local";
}

export function rateLimit(req: Request, bucket: string, max: number, windowMs: number) {
  const wait = take(`${bucket}:${clientIp(req)}`, max, windowMs);
  if (wait !== null) throw new HttpError(429, `Too many requests. Try again in ${wait}s.`);
}

const DAY = 24 * 60 * 60_000;
const envInt = (name: string, fallback: number) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : fallback;
};

// Caps total SERV and Reppo spend across every visitor, per day.
export const DAILY = {
  fix: () => envInt("DAILY_FIX_LIMIT", 60),
  evaluate: () => envInt("DAILY_EVAL_LIMIT", 30),
  learn: () => envInt("DAILY_LEARN_LIMIT", 30),
};

export function dailyBudget(bucket: keyof typeof DAILY) {
  const wait = take(`daily:${bucket}`, DAILY[bucket](), DAY);
  if (wait !== null) throw new HttpError(503, "Daily check limit reached. Try again tomorrow.");
}

export function errorResponse(err: unknown, fallback = 500) {
  const status = err instanceof HttpError ? err.status : fallback;
  return Response.json({ error: (err as Error).message }, { status });
}

// Serializes read-modify-write on the JSON store so concurrent rounds can't overwrite each other.
let chain: Promise<unknown> = Promise.resolve();
export function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => {});
  return run;
}

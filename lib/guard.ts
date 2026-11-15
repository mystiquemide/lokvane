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

// Fixed-window limiter per client IP, in memory. One process serves the app, so this is enough here.
const hits = new Map<string, { n: number; reset: number }>();

export function rateLimit(req: Request, bucket: string, max: number, windowMs: number) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    return;
  }
  if (++h.n > max) {
    throw new HttpError(429, `Too many requests. Try again in ${Math.ceil((h.reset - now) / 1000)}s.`);
  }
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

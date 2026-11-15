import { HttpError } from "./guard";
export const MARKETS = {
  de: { name: "Germany", language: "German" },
  fr: { name: "France", language: "French" },
  jp: { name: "Japan", language: "Japanese" },
} as const;
export type MarketKey = keyof typeof MARKETS;
export function market(key: unknown) {
  const m = MARKETS[key as MarketKey];
  if (!m) throw new HttpError(400, `Unknown market: ${String(key)}`);
  return m;
}

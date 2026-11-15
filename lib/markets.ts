export const MARKETS = {
  de: { name: "Germany", language: "German" },
  fr: { name: "France", language: "French" },
  jp: { name: "Japan", language: "Japanese" },
} as const;
export type MarketKey = keyof typeof MARKETS;
export function market(key: string) {
  const m = MARKETS[key as MarketKey];
  if (!m) throw new Error(`Unknown market: ${key}`);
  return m;
}

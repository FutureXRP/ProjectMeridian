import { clamp } from "../calibration/math";
import { cached, RateLimiter } from "./cache";
import type { NormalizedMarket, PricePoint } from "./types";

/**
 * Polymarket source — public, no-auth REST reads (Gamma for markets, CLOB for
 * price history). On-chain (Polygon): markets are keyed by conditionId, outcomes
 * by clobTokenId, human URLs by slug. Several Gamma fields arrive as stringified
 * JSON arrays (outcomes, outcomePrices) and must be parsed.
 */

const GAMMA_BASE = "https://gamma-api.polymarket.com";
const CLOB_BASE = "https://clob.polymarket.com";

const limiter = new RateLimiter(15, 30);

/** Subset of the Gamma market object we consume. */
export interface GammaMarket {
  id?: string;
  conditionId?: string;
  question?: string;
  slug?: string;
  outcomes?: string | string[]; // e.g. '["Yes","No"]'
  outcomePrices?: string | string[]; // e.g. '["0.62","0.38"]'
  clobTokenIds?: string | string[];
  volumeNum?: number;
  volume?: string | number;
  closed?: boolean;
  active?: boolean;
  umaResolutionStatus?: string;
  endDate?: string;
  startDate?: string;
}

/** Parse a value that may be a JSON-stringified array or an actual array. */
export function parseJsonArray(v?: string | string[]): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v !== "string") return [];
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function polymarketCategory(question?: string): string | undefined {
  const s = (question ?? "").toLowerCase();
  if (/\bfed\b|fomc|interest rate|rate (cut|hike|decision)|fed funds/.test(s)) return "fed";
  if (/\bcpi\b|inflation/.test(s)) return "cpi";
  if (/payroll|unemployment|jobs report|nonfarm|jobless/.test(s)) return "jobs";
  if (/\bgdp\b|gross domestic/.test(s)) return "gdp";
  if (/recession/.test(s)) return "recession";
  return undefined;
}

function polymarketVolume(m: GammaMarket): number | undefined {
  if (typeof m.volumeNum === "number") return m.volumeNum;
  if (typeof m.volume === "number") return m.volume;
  if (typeof m.volume === "string") {
    const n = Number(m.volume);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/** Pure: map a Gamma market to the canonical shape (null if no usable price). */
export function normalizePolymarketMarket(m: GammaMarket): NormalizedMarket | null {
  const outcomes = parseJsonArray(m.outcomes);
  const prices = parseJsonArray(m.outcomePrices).map(Number);
  const yesIdx = outcomes.findIndex((o) => o.toLowerCase() === "yes");
  const idx = yesIdx >= 0 ? yesIdx : 0;
  const yes = prices[idx];
  if (!Number.isFinite(yes)) return null;

  const resolved =
    m.umaResolutionStatus?.toLowerCase() === "resolved" ||
    (m.closed === true && (yes <= 0.001 || yes >= 0.999));
  const status: NormalizedMarket["status"] = resolved
    ? "settled"
    : m.closed
      ? "closed"
      : "open";

  return {
    venue: "polymarket",
    marketId: m.conditionId ?? m.id ?? m.slug ?? "unknown",
    slug: m.slug,
    title: m.question ?? m.slug ?? "unknown",
    category: polymarketCategory(m.question),
    yesProbability: clamp(yes, 0, 1),
    status,
    resolvedOutcome: resolved ? (yes >= 0.5 ? "yes" : "no") : undefined,
    volume: polymarketVolume(m),
    closeTime: m.endDate,
    raw: m,
    fetchedAt: new Date().toISOString(),
  };
}

async function gammaGet<T>(path: string): Promise<T> {
  await limiter.take();
  const res = await fetch(`${GAMMA_BASE}${path}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Polymarket Gamma GET ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

/** Live markets (optionally by tag / closed state), normalized + cached. */
export async function getPolymarketMarkets(
  params: { tag?: string; closed?: boolean; limit?: number } = {},
  ttlMs = 60_000,
): Promise<NormalizedMarket[]> {
  const q = new URLSearchParams();
  if (params.tag) q.set("tag_slug", params.tag);
  if (params.closed !== undefined) q.set("closed", String(params.closed));
  q.set("limit", String(params.limit ?? 100));
  return cached(`pm:markets:${q.toString()}`, ttlMs, async () => {
    const data = await gammaGet<GammaMarket[]>(`/markets?${q.toString()}`);
    return (Array.isArray(data) ? data : [])
      .map(normalizePolymarketMarket)
      .filter((m): m is NormalizedMarket => m !== null);
  });
}

/** CLOB price history for one outcome token → normalized PricePoint[]. */
export async function getPolymarketPriceHistory(
  clobTokenId: string,
  interval = "1d",
  ttlMs = 300_000,
): Promise<PricePoint[]> {
  return cached(`pm:history:${clobTokenId}:${interval}`, ttlMs, async () => {
    await limiter.take();
    const res = await fetch(
      `${CLOB_BASE}/prices-history?market=${encodeURIComponent(clobTokenId)}&interval=${interval}`,
      { headers: { accept: "application/json" } },
    );
    if (!res.ok) throw new Error(`Polymarket CLOB prices-history -> ${res.status}`);
    const data = (await res.json()) as { history?: { t: number; p: number }[] };
    return (data.history ?? []).map((h) => ({ t: h.t, p: clamp(h.p, 0, 1) }));
  });
}

import { clamp } from "../calibration/math";
import { cached, RateLimiter } from "./cache";
import type { NormalizedMarket, PricePoint } from "./types";

/**
 * Kalshi source — public, no-auth REST reads (whitepaper §5, docs/data-sources).
 * Reads require no account; we deliberately stay in the no-auth lane (REST
 * polling, not the authenticated WebSocket).
 */

const KALSHI_BASE = "https://api.elections.kalshi.com/trade-api/v2";

/** Conservative limiter; Kalshi public reads tolerate ~30 req/s, we use less. */
const limiter = new RateLimiter(8, 16);

/** The macro series MERIDIAN tracks (GATE 1 — owner confirms the final list). */
export const TRACKED_KALSHI_SERIES = [
  "KXFEDDECISION",
  "KXFED",
  "KXCPI",
  "KXCPIYOY",
  "KXPAYROLLS",
  "KXU3",
  "KXGDP",
] as const;

/** Subset of the Kalshi v2 market object we consume. */
export interface KalshiMarket {
  ticker: string;
  event_ticker?: string;
  series_ticker?: string;
  title?: string;
  status?: string; // active | closed | settled | finalized | …
  result?: string; // yes | no | ""
  last_price?: number; // cents, 0–100
  yes_bid?: number; // cents
  yes_ask?: number; // cents
  volume?: number;
  open_interest?: number;
  close_time?: string;
  expiration_time?: string;
  settlement_time?: string;
}

function kalshiCategory(seriesTicker?: string, ticker?: string): string | undefined {
  const s = (seriesTicker ?? ticker ?? "").toUpperCase();
  if (s.startsWith("KXFED")) return "fed";
  if (s.startsWith("KXCPI")) return "cpi";
  if (s.startsWith("KXPAYROLLS") || s.startsWith("KXU3")) return "jobs";
  if (s.startsWith("KXGDP")) return "gdp";
  return undefined;
}

function kalshiStatus(status?: string): NormalizedMarket["status"] {
  const s = (status ?? "").toLowerCase();
  if (s === "settled" || s === "finalized") return "settled";
  if (s === "closed" || s === "inactive") return "closed";
  return "open";
}

/** YES probability from cents fields (prefer last trade, else bid/ask midpoint). */
function kalshiYesProbability(m: KalshiMarket): number | undefined {
  if (typeof m.last_price === "number") return clamp(m.last_price / 100, 0, 1);
  if (typeof m.yes_bid === "number" && typeof m.yes_ask === "number")
    return clamp((m.yes_bid + m.yes_ask) / 200, 0, 1);
  if (typeof m.yes_bid === "number") return clamp(m.yes_bid / 100, 0, 1);
  return undefined;
}

/** Pure: map a Kalshi market to the canonical shape (null if no usable price). */
export function normalizeKalshiMarket(m: KalshiMarket): NormalizedMarket | null {
  const yes = kalshiYesProbability(m);
  if (yes === undefined) return null;
  const status = kalshiStatus(m.status);
  const resolvedOutcome =
    m.result === "yes" ? "yes" : m.result === "no" ? "no" : undefined;
  return {
    venue: "kalshi",
    marketId: m.ticker,
    eventId: m.event_ticker,
    seriesId: m.series_ticker,
    title: m.title ?? m.ticker,
    category: kalshiCategory(m.series_ticker, m.ticker),
    yesProbability: yes,
    status,
    resolvedOutcome,
    volume: m.volume,
    openInterest: m.open_interest,
    closeTime: m.close_time,
    resolveTime: m.settlement_time ?? m.expiration_time,
    raw: m,
    fetchedAt: new Date().toISOString(),
  };
}

async function kalshiGet<T>(path: string): Promise<T> {
  await limiter.take();
  const res = await fetch(`${KALSHI_BASE}${path}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Kalshi GET ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

/** Live markets for one series, normalized + cached. */
export async function getKalshiMarketsBySeries(
  series: string,
  ttlMs = 60_000,
): Promise<NormalizedMarket[]> {
  return cached(`kalshi:series:${series}`, ttlMs, async () => {
    const data = await kalshiGet<{ markets?: KalshiMarket[] }>(
      `/markets?series_ticker=${encodeURIComponent(series)}&limit=200`,
    );
    return (data.markets ?? [])
      .map(normalizeKalshiMarket)
      .filter((m): m is NormalizedMarket => m !== null);
  });
}

/** All tracked macro markets across the seed series. */
export async function getTrackedKalshiMarkets(): Promise<NormalizedMarket[]> {
  const all = await Promise.all(
    TRACKED_KALSHI_SERIES.map((s) => getKalshiMarketsBySeries(s)),
  );
  return all.flat();
}

/** Candlestick price history → normalized PricePoint[] (cents → 0..1). */
export async function getKalshiCandlesticks(
  series: string,
  ticker: string,
  periodInterval = 60,
  ttlMs = 300_000,
): Promise<PricePoint[]> {
  return cached(`kalshi:candles:${ticker}:${periodInterval}`, ttlMs, async () => {
    const data = await kalshiGet<{
      candlesticks?: { end_period_ts: number; price?: { mean?: number; close?: number } }[];
    }>(`/series/${series}/markets/${ticker}/candlesticks?period_interval=${periodInterval}`);
    return (data.candlesticks ?? []).map((c) => ({
      t: c.end_period_ts,
      p: clamp((c.price?.mean ?? c.price?.close ?? 0) / 100, 0, 1),
    }));
  });
}

import type { PricePoint, Venue } from "../calibration/types";

export type { PricePoint, Venue };

/**
 * The one canonical internal market shape. Every source (Kalshi, Polymarket,
 * …) normalizes into this; the Desk and the Calibration Model only ever see
 * NormalizedMarket, never a venue-specific payload.
 */
export interface NormalizedMarket {
  venue: Venue;
  /** Venue-native unique id: Kalshi ticker, Polymarket conditionId. */
  marketId: string;
  /** Grouping id where available: Kalshi event_ticker, etc. */
  eventId?: string;
  /** Series id where available: Kalshi series_ticker. */
  seriesId?: string;
  /** Human URL slug where available (Polymarket). */
  slug?: string;
  /** The market question / title. */
  title: string;
  /** Macro category we map to: "fed" | "cpi" | "jobs" | "gdp" | … */
  category?: string;

  /** Market-implied P(YES), normalized to 0..1. */
  yesProbability: number;
  status: "open" | "closed" | "settled";
  /** Set once settled. */
  resolvedOutcome?: "yes" | "no";

  /** Liquidity / concentration signals consumed by the Calibration Model. */
  volume?: number;
  openInterest?: number;
  topHolderConcentration?: number;

  closeTime?: string; // ISO
  resolveTime?: string; // ISO

  /** Original payload, for audit/debug. */
  raw?: unknown;
  fetchedAt: string; // ISO
}

/** A time-series of a single market's YES probability. */
export interface MarketHistory {
  venue: Venue;
  marketId: string;
  points: PricePoint[];
}

/**
 * Canonical types for the Calibration Model.
 *
 * The module is standalone by design (zero UI, AI, or data-source deps), so the
 * input it consumes — `CalibrationInput` — is deliberately NOT the full
 * normalized market object from /lib/sources. It carries only the numeric
 * signals the deterministic corrections actually use, which keeps the model
 * portable into every later stage.
 */

export type Venue = "kalshi" | "polymarket";

export type Grade = "A" | "B" | "C" | "D";

/** A single point in a market's recent price path (unix seconds, probability 0..1). */
export interface PricePoint {
  t: number;
  p: number;
}

/**
 * The focused, numeric input the Calibration Model operates on. Every field
 * beyond `rawProbability` is optional: a correction that lacks its signal
 * records itself as `applied: false` rather than guessing.
 */
export interface CalibrationInput {
  marketId: string;
  question: string;
  venue: Venue;
  /** Market-implied probability of YES, in [0,1] (e.g. Kalshi yes-price / 100). */
  rawProbability: number;

  /** Liquidity / concentration signals (→ liquidity discount). */
  volume?: number; // traded volume, venue-native units
  openInterest?: number; // open interest, venue-native units
  topHolderConcentration?: number; // share of the book held by top wallets, 0..1

  /** Recent price path, oldest → newest (→ momentum-regime flag). */
  priceHistory?: readonly PricePoint[];

  /** External anchors (→ base-rate anchor). */
  baseRate?: number; // historical base rate for this class of event, 0..1
  externalReference?: number; // e.g. CME FedWatch implied prob / consensus, 0..1
  externalReferenceLabel?: string;

  /** Same event on the other venue, if listed (→ cross-venue check). */
  crossVenueProbability?: number;
  crossVenueVenue?: Venue;
}

/**
 * One correction's contribution to the result — the unit the Desk renders when
 * a user clicks a number to "show the work". Every correction returns one of
 * these whether or not it fired, so the breakdown is always complete.
 */
export interface Adjustment {
  key: string; // stable id, e.g. "favorite_longshot"
  label: string; // human label for the UI
  applied: boolean; // did this correction have its inputs and act?
  /** Probability entering this correction. */
  inputProbability: number;
  /** Probability leaving this correction (== input for confidence-only corrections). */
  outputProbability: number;
  /** outputProbability - inputProbability (0 for confidence-only corrections). */
  delta: number;
  /**
   * How much this correction lowers confidence in the calibrated number, 0..1
   * (0 = no concern). Drives the Confidence Grade. Probability-only corrections
   * (favorite–longshot) contribute 0 here; flagging corrections contribute here
   * and leave the probability untouched — per the whitepaper, we surface signal
   * quality, we never silently override the number.
   */
  confidencePenalty: number;
  /** Plain-language explanation of what this correction saw and did. */
  detail: string;
  /** Machine-readable flags this correction raised, e.g. "whale_dominated". */
  flags?: readonly string[];
  /** Raw signal values behind the correction, for full auditability. */
  data?: Record<string, number | string | boolean | null>;
}

/**
 * The complete, auditable output for one market. `adjustments` is the full
 * ordered breakdown, so the UI can show every step that produced
 * `calibratedProbability` and `grade`.
 */
export interface CalibrationResult {
  marketId: string;
  venue: Venue;
  rawProbability: number;
  calibratedProbability: number;
  grade: Grade;
  /** Internal 0..1 confidence aggregate that maps to `grade`. */
  confidenceScore: number;
  /** Ordered, complete per-correction breakdown. */
  adjustments: readonly Adjustment[];
  /** Short machine-readable flags raised, e.g. "whale_dominated". */
  flags: readonly string[];
}

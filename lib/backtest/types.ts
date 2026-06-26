import type { ResolvedSample } from "../calibration/fit";

export type { ResolvedSample };

export interface BacktestParams {
  /** Fraction of (ordered) data used to FIT the curve; the rest is the held-out test set. */
  trainFraction: number;
  /** Minimum |calibrated - raw| disagreement required to place a bet. */
  edgeThreshold: number;
  /**
   * Kalshi-style fee coefficient: fee per $1 contract ≈ feeRate · p · (1−p).
   * 0.07 is Kalshi's general trading-fee coefficient. Set 0 for a frictionless run.
   */
  feeRate: number;
  /** Half-spread paid on entry (price worsens by this). 0 = trade at mid. */
  spread: number;
}

export const DEFAULT_BACKTEST_PARAMS: BacktestParams = {
  trainFraction: 0.7,
  edgeThreshold: 0.02,
  feeRate: 0.07,
  spread: 0.0,
};

export interface BettingResult {
  bets: number;
  skipped: number;
  /** Total capital deployed (sum of entry prices). */
  staked: number;
  /** Profit/loss under the given cost params. */
  pnl: number;
  /** pnl / staked. */
  roi: number;
  /** Fraction of placed bets whose side won. */
  winRate: number;
}

export interface BacktestReport {
  nTotal: number;
  nTrain: number;
  nTest: number;
  /** Favorite–longshot fit on the TRAIN set. b≈1 ⇒ the crowd is already calibrated (no bias to exploit). */
  fit: { a: number; b: number };
  /** Brier score of the raw market price on the TEST set (lower = better). */
  rawBrier: number;
  /** Brier score of the calibrated probability on the TEST set. */
  calibratedBrier: number;
  /** rawBrier − calibratedBrier. Positive ⇒ calibration improved accuracy out-of-sample. */
  brierImprovement: number;
  /** Betting the edge on the TEST set, net of fees + spread. */
  betting: BettingResult;
  /** Same bets with zero fees and zero spread — isolates how much friction costs. */
  bettingGross: BettingResult;
}

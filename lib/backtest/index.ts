/**
 * /lib/backtest — does the calibration actually have edge?
 *
 * Out-of-sample: fit the favorite–longshot curve on a training slice, then on
 * held-out resolved markets measure both accuracy (Brier) and the P&L of betting
 * the edge net of fees + spread. The decisive test of whether this is a money
 * tool or just a tidy framework.
 */
export { runBacktest } from "./backtest";
export { simulateBetting } from "./simulate";
export { brierScore, logLoss } from "./metrics";
export { DEFAULT_BACKTEST_PARAMS } from "./types";
export type { BacktestParams, BacktestReport, BettingResult, ResolvedSample } from "./types";

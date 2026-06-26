import { clampProbability } from "../calibration/math";
import type { ResolvedSample } from "../calibration/fit";
import type { BacktestParams, BettingResult } from "./types";

/**
 * Simulate betting the model's edge over resolved markets.
 *
 * For each market: if the calibrated probability disagrees with the raw price by
 * more than `edgeThreshold`, buy the side the model thinks is underpriced — YES
 * if calibrated > raw, NO otherwise. You pay the contract's price (worsened by
 * `spread`) and a Kalshi-style fee (feeRate · p · (1−p)); a winning contract
 * pays $1. ROI is profit per dollar of capital deployed.
 *
 * This is the money question: across many resolved markets, does betting where
 * the model disagrees with the crowd actually profit after costs?
 */
export function simulateBetting(
  samples: readonly ResolvedSample[],
  calibrated: (rawProbability: number) => number,
  params: BacktestParams,
): BettingResult {
  let bets = 0;
  let skipped = 0;
  let staked = 0;
  let pnl = 0;
  let wins = 0;

  for (const s of samples) {
    const r = clampProbability(s.rawProbability);
    const edge = calibrated(r) - r;
    if (Math.abs(edge) < params.edgeThreshold) {
      skipped++;
      continue;
    }

    const side: "yes" | "no" = edge > 0 ? "yes" : "no";
    const baseCost = side === "yes" ? r : 1 - r; // mid price of the contract bought
    const entry = Math.min(0.99, baseCost + params.spread);
    const won = side === "yes" ? s.outcome === 1 : s.outcome === 0;
    const payoff = won ? 1 : 0;
    const fee = params.feeRate * r * (1 - r);
    const profit = payoff - entry - fee;

    bets++;
    staked += entry;
    pnl += profit;
    if (won) wins++;
  }

  return {
    bets,
    skipped,
    staked,
    pnl,
    roi: staked > 0 ? pnl / staked : 0,
    winRate: bets > 0 ? wins / bets : 0,
  };
}

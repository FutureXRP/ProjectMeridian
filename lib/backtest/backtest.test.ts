import { describe, expect, it } from "vitest";
import { clampProbability, logit, sigmoid } from "../calibration/math";
import type { ResolvedSample } from "../calibration/fit";
import { runBacktest } from "./backtest";

/**
 * Build resolved markets where the market price is `r` but the TRUE win
 * probability is `trueProbOf(r)`. Ones are spread evenly across each price bin
 * (Bresenham) and bins are interleaved, so any contiguous train/test split is
 * unbiased. This validates the harness machinery — not real-market edge.
 */
function makeSamples(trueProbOf: (r: number) => number, perBin = 400): ResolvedSample[] {
  const bins: number[] = [];
  for (let r = 0.05; r <= 0.95 + 1e-9; r += 0.05) bins.push(Number(r.toFixed(2)));
  const out: ResolvedSample[] = [];
  for (let i = 0; i < perBin; i++) {
    for (const r of bins) {
      const ones = Math.round(clampProbability(trueProbOf(r)) * perBin);
      const outcome =
        Math.floor(((i + 1) * ones) / perBin) - Math.floor((i * ones) / perBin) > 0 ? 1 : 0;
      out.push({ rawProbability: r, outcome: outcome as 0 | 1 });
    }
  }
  return out;
}

describe("runBacktest (machinery validation on synthetic data)", () => {
  it("finds NO edge when the market is already efficient (price == true prob)", () => {
    const report = runBacktest(makeSamples((r) => r));
    // No favorite-longshot bias => fit ~ identity, no accuracy gain, ~no bets.
    expect(report.fit.b).toBeGreaterThan(0.85);
    expect(report.fit.b).toBeLessThan(1.15);
    expect(Math.abs(report.brierImprovement)).toBeLessThan(0.005);
    expect(report.bettingGross.roi).toBeLessThan(0.02);
  });

  it("finds edge when a real favorite-longshot bias is present", () => {
    // True prob is more extreme than the price (favorites win more, longshots less).
    const report = runBacktest(makeSamples((r) => sigmoid(1.3 * logit(r))));
    expect(report.fit.b).toBeGreaterThan(1.15); // recovers the bias
    expect(report.brierImprovement).toBeGreaterThan(0); // calibration improves accuracy
    expect(report.bettingGross.bets).toBeGreaterThan(0);
    expect(report.bettingGross.roi).toBeGreaterThan(0); // and it's profitable before fees
  });
});

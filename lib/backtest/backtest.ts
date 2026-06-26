import { refitFavoriteLongshot, type ResolvedSample } from "../calibration/fit";
import { clampProbability, logit, sigmoid } from "../calibration/math";
import { brierScore } from "./metrics";
import { simulateBetting } from "./simulate";
import {
  DEFAULT_BACKTEST_PARAMS,
  type BacktestParams,
  type BacktestReport,
} from "./types";

function holdoutSplit(
  samples: readonly ResolvedSample[],
  fraction: number,
): { train: ResolvedSample[]; test: ResolvedSample[] } {
  const k = Math.floor(samples.length * fraction);
  return { train: samples.slice(0, k), test: samples.slice(k) };
}

/**
 * Out-of-sample backtest of the favorite–longshot calibration.
 *
 * Fits the curve on the first `trainFraction` of the (caller-ordered) samples,
 * then measures — on the held-out remainder only — (a) whether calibration
 * improves probability accuracy (Brier) and (b) whether betting the resulting
 * edge profits net of fees + spread. The caller is responsible for ordering the
 * samples (chronological for a true out-of-sample test; otherwise shuffle).
 */
export function runBacktest(
  samples: readonly ResolvedSample[],
  opts: Partial<BacktestParams> = {},
): BacktestReport {
  const params = { ...DEFAULT_BACKTEST_PARAMS, ...opts };
  const { train, test } = holdoutSplit(samples, params.trainFraction);

  const fit = refitFavoriteLongshot(train);
  const calibrated = (r: number) => clampProbability(sigmoid(fit.a + fit.b * logit(r)));
  const identity = (r: number) => r;

  const rawBrier = brierScore(test, identity);
  const calibratedBrier = brierScore(test, calibrated);

  return {
    nTotal: samples.length,
    nTrain: train.length,
    nTest: test.length,
    fit: { a: fit.a, b: fit.b },
    rawBrier,
    calibratedBrier,
    brierImprovement: rawBrier - calibratedBrier,
    betting: simulateBetting(test, calibrated, params),
    bettingGross: simulateBetting(test, calibrated, { ...params, feeRate: 0, spread: 0 }),
  };
}

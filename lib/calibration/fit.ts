import { clampProbability, logit, sigmoid } from "./math";

/** One resolved market: its market-implied price and what actually happened. */
export interface ResolvedSample {
  /** Market-implied P(YES) at the chosen pre-resolution horizon, 0..1. */
  rawProbability: number;
  /** Realized outcome: 1 = YES occurred, 0 = NO. */
  outcome: 0 | 1;
}

export interface FavoriteLongshotFit {
  a: number;
  b: number;
  n: number;
  logLik: number;
  iterations: number;
}

/**
 * Re-fit the favorite–longshot transform  calibrated = sigmoid(a + b·logit(raw))
 * by maximum likelihood — a logistic regression of realized outcomes on each
 * market's log-odds — via gradient ascent. This recovers the calibration curve
 * from resolved markets; scripts/refit.ts persists it to data/calibration.json,
 * which overrides the cold-start seed at runtime.
 *
 * b > 1 means the crowd is under-confident at the extremes (classic
 * favorite–longshot bias); b ≈ 1 means the crowd is already well-calibrated.
 */
export function refitFavoriteLongshot(
  samples: readonly ResolvedSample[],
  opts: { lr?: number; iterations?: number } = {},
): FavoriteLongshotFit {
  const n = samples.length;
  if (n === 0) throw new Error("refitFavoriteLongshot: no samples");
  const lr = opts.lr ?? 0.3;
  const iterations = opts.iterations ?? 5000;

  const xs = samples.map((s) => logit(clampProbability(s.rawProbability)));
  const ys = samples.map((s) => s.outcome);

  let a = 0;
  let b = 1;
  for (let it = 0; it < iterations; it++) {
    let ga = 0;
    let gb = 0;
    for (let i = 0; i < n; i++) {
      const err = ys[i] - sigmoid(a + b * xs[i]);
      ga += err;
      gb += err * xs[i];
    }
    a += (lr * ga) / n;
    b += (lr * gb) / n;
  }

  let logLik = 0;
  for (let i = 0; i < n; i++) {
    const p = clampProbability(sigmoid(a + b * xs[i]));
    logLik += ys[i] * Math.log(p) + (1 - ys[i]) * Math.log(1 - p);
  }

  return { a, b, n, logLik, iterations };
}

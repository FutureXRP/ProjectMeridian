import { clampProbability } from "../calibration/math";
import type { ResolvedSample } from "../calibration/fit";

/** Mean squared error between predicted probability and realized 0/1 outcome. Lower is better. */
export function brierScore(
  samples: readonly ResolvedSample[],
  predict: (rawProbability: number) => number,
): number {
  if (samples.length === 0) return NaN;
  let sum = 0;
  for (const s of samples) {
    const p = predict(s.rawProbability);
    sum += (p - s.outcome) ** 2;
  }
  return sum / samples.length;
}

/** Mean log loss (cross-entropy). Lower is better. */
export function logLoss(
  samples: readonly ResolvedSample[],
  predict: (rawProbability: number) => number,
): number {
  if (samples.length === 0) return NaN;
  let sum = 0;
  for (const s of samples) {
    const p = clampProbability(predict(s.rawProbability));
    sum += -(s.outcome * Math.log(p) + (1 - s.outcome) * Math.log(1 - p));
  }
  return sum / samples.length;
}

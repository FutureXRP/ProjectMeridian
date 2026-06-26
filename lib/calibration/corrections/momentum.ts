import { rescale } from "../math";
import type { CalibrationParams } from "../params";
import type { Adjustment, CalibrationInput } from "../types";

/** Lag-1 autocorrelation of a series; 0 if undefined (too short / no variance). */
export function lag1Autocorr(xs: readonly number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const mean = xs.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) den += (xs[i] - mean) ** 2;
  for (let i = 0; i < n - 1; i++) num += (xs[i] - mean) * (xs[i + 1] - mean);
  return den === 0 ? 0 : num / den;
}

/**
 * Momentum-regime flag.
 *
 * Confidence-only. When a market's price increments are positively
 * autocorrelated, the price is tracking its own momentum (documented herd
 * behavior) rather than reacting to external news — a lower-signal regime. We
 * flag it and discount confidence; we never change the number. Only POSITIVE
 * autocorrelation (trending/herding) is treated as a concern; mean reversion is
 * not penalized.
 */
export function momentum(
  input: CalibrationInput,
  params: CalibrationParams,
  currentProbability: number,
): Adjustment {
  const cfg = params.momentum;
  const hist = input.priceHistory ?? [];
  const enough = hist.length >= cfg.minPoints;

  let r1 = 0;
  if (enough) {
    const incr: number[] = [];
    for (let i = 1; i < hist.length; i++) incr.push(hist[i].p - hist[i - 1].p);
    r1 = lag1Autocorr(incr);
  }

  const penalty = enough ? rescale(r1, cfg.autocorrFlag, 1, 0, cfg.maxPenalty) : 0;
  const flags = enough && r1 > cfg.autocorrFlag ? ["momentum_regime"] : [];

  const detail = !enough
    ? `Insufficient price history (${hist.length} points; need ${cfg.minPoints}); confidence not adjusted.`
    : r1 > cfg.autocorrFlag
      ? `Price increments positively autocorrelated (lag-1 r=${r1.toFixed(
          2,
        )}); trending on own momentum → confidence penalty ${(penalty * 100).toFixed(0)}%.`
      : `No momentum regime detected (lag-1 r=${r1.toFixed(2)}).`;

  return {
    key: "momentum",
    label: "Momentum-regime flag",
    applied: penalty > 0 || flags.length > 0,
    inputProbability: currentProbability,
    outputProbability: currentProbability,
    delta: 0,
    confidencePenalty: penalty,
    detail,
    flags,
    data: { points: hist.length, lag1Autocorr: enough ? r1 : null },
  };
}

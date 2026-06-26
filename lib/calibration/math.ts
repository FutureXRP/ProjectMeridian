/**
 * Small, dependency-free numeric helpers shared by the calibration corrections.
 * Kept in one place so every correction uses the same clamped, well-behaved
 * logit / sigmoid and never has to special-case 0 or 1.
 */

/** Clamp a probability into the open interval (0,1) so logit() never sees 0 or 1. */
export function clampProbability(p: number, eps = 1e-6): number {
  if (Number.isNaN(p)) throw new Error("clampProbability: received NaN");
  return Math.min(Math.max(p, eps), 1 - eps);
}

/** Clamp any number into [lo, hi]. */
export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(Math.max(x, lo), hi);
}

/** Log-odds. Input is clamped into (0,1) first so the result is always finite. */
export function logit(p: number): number {
  const c = clampProbability(p);
  return Math.log(c / (1 - c));
}

/** Inverse of logit(): maps the real line back into (0,1). */
export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/**
 * Linearly map `x` from [inLo, inHi] onto [outLo, outHi], clamped to the output
 * range. Used by the flagging corrections to turn a raw signal (volume, a
 * divergence, an autocorrelation) into a bounded confidence penalty.
 */
export function rescale(
  x: number,
  inLo: number,
  inHi: number,
  outLo: number,
  outHi: number,
): number {
  if (inHi === inLo) return outLo;
  const t = clamp((x - inLo) / (inHi - inLo), 0, 1);
  return outLo + t * (outHi - outLo);
}

/** Round to a fixed number of decimal places (default 4) for display/snapshots. */
export function round(x: number, dp = 4): number {
  const f = 10 ** dp;
  return Math.round(x * f) / f;
}

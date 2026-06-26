import { clamp } from "./math";
import type { CalibrationParams } from "./params";
import type { Grade } from "./types";

/**
 * Combine per-correction confidence penalties (each 0..1) into a single 0..1
 * confidence score. Penalties combine multiplicatively so independent concerns
 * compound without ever pushing the score below 0:
 *
 *     score = Π (1 - penalty_i)
 */
export function confidenceScore(penalties: readonly number[]): number {
  return penalties.reduce<number>(
    (acc, p) => acc * (1 - clamp(p, 0, 1)),
    1,
  );
}

/**
 * Map a 0..1 confidence score to a letter grade using the configured
 * thresholds (higher score = higher confidence in the calibrated number).
 */
export function gradeFromScore(
  score: number,
  thresholds: CalibrationParams["gradeThresholds"],
): Grade {
  const s = clamp(score, 0, 1);
  if (s >= thresholds.A) return "A";
  if (s >= thresholds.B) return "B";
  if (s >= thresholds.C) return "C";
  return "D";
}

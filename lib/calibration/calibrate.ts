import { baseRate } from "./corrections/baseRate";
import { crossVenue } from "./corrections/crossVenue";
import { favoriteLongshot } from "./corrections/favoriteLongshot";
import { liquidity } from "./corrections/liquidity";
import { momentum } from "./corrections/momentum";
import { confidenceScore, gradeFromScore } from "./grade";
import { DEFAULT_PARAMS, type CalibrationParams } from "./params";
import type { Adjustment, CalibrationInput, CalibrationResult } from "./types";

/**
 * Run the full Calibration Model over one market.
 *
 * Pipeline:
 *   1. favorite–longshot transform — the ONLY step that moves the number,
 *      producing the Calibrated Probability from the raw price.
 *   2. liquidity, momentum, base-rate, cross-venue — confidence-only checks that
 *      pass the number through untouched and contribute penalties + flags.
 *
 * The result carries the Calibrated Probability, an A–D Confidence Grade, the
 * aggregate confidence score, the full ordered per-correction breakdown (so the
 * Desk can show the work), and the deduplicated flags raised. Pure and
 * deterministic: same input + params → same result.
 */
export function calibrate(
  input: CalibrationInput,
  params: CalibrationParams = DEFAULT_PARAMS,
): CalibrationResult {
  const fl = favoriteLongshot(input, params);
  const calibratedProbability = fl.outputProbability;

  const confidenceChecks = [liquidity, momentum, baseRate, crossVenue].map((fn) =>
    fn(input, params, calibratedProbability),
  );

  const adjustments: Adjustment[] = [fl, ...confidenceChecks];
  const score = confidenceScore(adjustments.map((a) => a.confidencePenalty));
  const grade = gradeFromScore(score, params.gradeThresholds);
  const flags = [...new Set(adjustments.flatMap((a) => a.flags ?? []))];

  return {
    marketId: input.marketId,
    question: input.question,
    venue: input.venue,
    rawProbability: input.rawProbability,
    calibratedProbability,
    grade,
    confidenceScore: score,
    adjustments,
    flags,
  };
}

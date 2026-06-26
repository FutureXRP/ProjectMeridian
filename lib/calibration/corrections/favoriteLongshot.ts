import { clampProbability, logit, sigmoid } from "../math";
import type { CalibrationParams } from "../params";
import type { Adjustment, CalibrationInput } from "../types";

/** Below this |delta| we treat the price as effectively unchanged. */
const NEGLIGIBLE = 5e-4;

/**
 * Favorite–longshot correction.
 *
 * Empirically, prediction-market crowds overprice longshots and underprice
 * favorites. The calibrated probability is recovered by a logit-linear transform
 * fit on resolved markets:
 *
 *     calibrated = sigmoid(a + b * logit(raw))
 *
 * With a = 0 and b > 1 this leaves a 50/50 untouched, pushes longshots down
 * (toward 0) and favorites up (toward 1) — exactly reversing the bias. `b` is a
 * SEED until refit on resolved history (see params.ts / scripts/refit.ts).
 *
 * This is the ONLY correction that changes the number. It contributes no
 * confidence penalty: it is a point estimate of the true probability, not a
 * signal-quality flag.
 */
export function favoriteLongshot(
  input: CalibrationInput,
  params: CalibrationParams,
): Adjustment {
  const { a, b } = params.favoriteLongshot;
  const raw = clampProbability(input.rawProbability);
  const calibrated = clampProbability(sigmoid(a + b * logit(raw)));
  const delta = calibrated - raw;
  const applied = Math.abs(delta) >= NEGLIGIBLE;

  const direction = !applied
    ? "left effectively unchanged"
    : delta < 0
      ? "revised down (crowd overpricing a longshot)"
      : "revised up (crowd underpricing a favorite)";

  return {
    key: "favorite_longshot",
    label: "Favorite–longshot calibration",
    applied,
    inputProbability: raw,
    outputProbability: calibrated,
    delta,
    confidencePenalty: 0,
    detail: `Raw ${(raw * 100).toFixed(1)}% ${direction} → ${(
      calibrated * 100
    ).toFixed(1)}% (logit slope b=${b}, intercept a=${a}).`,
    data: { a, b, rawProbability: raw, calibratedProbability: calibrated },
  };
}

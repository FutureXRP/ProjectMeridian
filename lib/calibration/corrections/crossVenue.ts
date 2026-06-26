import { rescale } from "../math";
import type { CalibrationParams } from "../params";
import type { Adjustment, CalibrationInput } from "../types";

/**
 * Cross-venue check.
 *
 * Confidence-only. Compares this venue's raw price against the same event on the
 * other venue (Kalshi vs Polymarket). Large disagreement is a signal-quality
 * flag. Partial coverage is expected — when the event isn't listed on the other
 * venue this correction simply doesn't apply.
 */
export function crossVenue(
  input: CalibrationInput,
  params: CalibrationParams,
  currentProbability: number,
): Adjustment {
  const cfg = params.crossVenue;
  const other = input.crossVenueProbability;

  const passthrough = {
    key: "cross_venue",
    label: "Cross-venue check",
    inputProbability: currentProbability,
    outputProbability: currentProbability,
    delta: 0,
  } as const;

  if (typeof other !== "number") {
    return {
      ...passthrough,
      applied: false,
      confidencePenalty: 0,
      detail: "Event not listed on the other venue; no cross-venue check.",
      flags: [],
      data: {},
    };
  }

  const divergence = Math.abs(input.rawProbability - other);
  const penalty = rescale(divergence, cfg.tolerance, cfg.maxDivergence, 0, cfg.maxPenalty);
  const flags = divergence > cfg.tolerance ? ["cross_venue_divergence"] : [];
  const otherVenue = input.crossVenueVenue ?? "other venue";

  const detail =
    divergence > cfg.tolerance
      ? `${input.venue} ${(input.rawProbability * 100).toFixed(0)}% vs ${otherVenue} ${(
          other * 100
        ).toFixed(0)}% → ${(divergence * 100).toFixed(0)}pt cross-venue gap, confidence penalty ${(
          penalty * 100
        ).toFixed(0)}%.`
      : `${input.venue} and ${otherVenue} agree within ${(cfg.tolerance * 100).toFixed(0)}pts.`;

  return {
    ...passthrough,
    applied: penalty > 0 || flags.length > 0,
    confidencePenalty: penalty,
    detail,
    flags,
    data: {
      thisVenue: input.venue,
      thisRaw: input.rawProbability,
      otherVenue,
      otherProbability: other,
      divergence,
    },
  };
}

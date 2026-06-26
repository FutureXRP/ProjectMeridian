import { rescale } from "../math";
import type { CalibrationParams } from "../params";
import type { Adjustment, CalibrationInput } from "../types";

/**
 * Base-rate anchor.
 *
 * Confidence-only and — per the whitepaper — it NEVER overrides the number. It
 * compares the calibrated probability against a historical base rate and/or an
 * external reference (e.g. CME FedWatch, economist consensus), surfaces the
 * divergence, and discounts confidence when the gap is large.
 */
export function baseRate(
  input: CalibrationInput,
  params: CalibrationParams,
  currentProbability: number,
): Adjustment {
  const cfg = params.baseRate;
  const anchors: { label: string; value: number }[] = [];
  if (typeof input.externalReference === "number") {
    anchors.push({
      label: input.externalReferenceLabel ?? "external reference",
      value: input.externalReference,
    });
  }
  if (typeof input.baseRate === "number") {
    anchors.push({ label: "historical base rate", value: input.baseRate });
  }

  const passthrough = {
    key: "base_rate",
    label: "Base-rate anchor",
    inputProbability: currentProbability,
    outputProbability: currentProbability,
    delta: 0,
  } as const;

  if (anchors.length === 0) {
    return {
      ...passthrough,
      applied: false,
      confidencePenalty: 0,
      detail: "No base-rate or external reference available.",
      flags: [],
      data: {},
    };
  }

  // Use the most concerning (largest) divergence among available anchors.
  let worst = anchors[0];
  let worstDiv = Math.abs(currentProbability - worst.value);
  for (const a of anchors) {
    const d = Math.abs(currentProbability - a.value);
    if (d > worstDiv) {
      worst = a;
      worstDiv = d;
    }
  }

  const penalty = rescale(worstDiv, cfg.tolerance, cfg.maxDivergence, 0, cfg.maxPenalty);
  const flags = worstDiv > cfg.tolerance ? ["base_rate_divergence"] : [];
  const detail =
    worstDiv > cfg.tolerance
      ? `Calibrated ${(currentProbability * 100).toFixed(0)}% diverges from ${worst.label} ${(
          worst.value * 100
        ).toFixed(0)}% by ${(worstDiv * 100).toFixed(0)}pts → confidence penalty ${(
          penalty * 100
        ).toFixed(0)}% (number left unchanged).`
      : `Calibrated ${(currentProbability * 100).toFixed(0)}% in line with ${worst.label} ${(
          worst.value * 100
        ).toFixed(0)}%.`;

  return {
    ...passthrough,
    applied: penalty > 0 || flags.length > 0,
    confidencePenalty: penalty,
    detail,
    flags,
    data: { anchor: worst.label, anchorValue: worst.value, divergence: worstDiv },
  };
}

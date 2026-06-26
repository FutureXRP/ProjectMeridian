import { describe, expect, it } from "vitest";
import { calibrate } from "../calibration";
import type { CalibrationInput } from "../calibration/types";
import { buildReadUserContent } from "./prompt";

const input: CalibrationInput = {
  marketId: "KXGDP-26Q2",
  question: "Q2 2026 real GDP growth above 2.0%",
  venue: "kalshi",
  rawProbability: 0.46,
  volume: 28_000,
  externalReference: 0.7,
  externalReferenceLabel: "economist consensus",
};

describe("buildReadUserContent", () => {
  it("includes the figures and the adjustments that fired, grounding the model", () => {
    const result = calibrate(input);
    const content = buildReadUserContent(result);

    expect(content).toContain("Q2 2026 real GDP growth above 2.0%");
    expect(content).toContain("Raw crowd probability:");
    expect(content).toContain("Calibrated probability:");
    expect(content).toContain(`Confidence grade: ${result.grade}`);
    // base-rate divergence vs the 70% consensus should appear as a fired adjustment
    expect(content).toContain("Base-rate anchor");
    expect(content).toContain("Write the one-sentence read now.");
  });

  it("only lists adjustments that actually fired", () => {
    // A coin-flip (favorite-longshot is a no-op at 0.5), liquid and
    // consensus-aligned => nothing fires.
    const clean = calibrate({
      marketId: "m",
      question: "Clean market",
      venue: "kalshi",
      rawProbability: 0.5,
      volume: 1_000_000,
      externalReference: 0.5,
    });
    const content = buildReadUserContent(clean);
    expect(content).toContain("none (raw price already well-calibrated");
  });
});

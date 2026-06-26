import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "../params";
import type { CalibrationInput } from "../types";
import { baseRate } from "./baseRate";

function input(p: Partial<CalibrationInput> & { rawProbability: number }): CalibrationInput {
  return { marketId: "m", question: "q", venue: "kalshi", ...p };
}

describe("baseRate", () => {
  it("does nothing without any anchor", () => {
    const adj = baseRate(input({ rawProbability: 0.6 }), DEFAULT_PARAMS, 0.6);
    expect(adj.applied).toBe(false);
    expect(adj.confidencePenalty).toBe(0);
  });

  it("does not penalize when the number agrees with the anchor", () => {
    const adj = baseRate(
      input({ rawProbability: 0.5, externalReference: 0.52, externalReferenceLabel: "FedWatch" }),
      DEFAULT_PARAMS,
      0.5,
    );
    expect(adj.confidencePenalty).toBe(0);
    expect(adj.flags).toHaveLength(0);
  });

  it("flags and penalizes a large divergence from the anchor", () => {
    const adj = baseRate(
      input({ rawProbability: 0.8, externalReference: 0.5, externalReferenceLabel: "FedWatch" }),
      DEFAULT_PARAMS,
      0.8,
    );
    expect(adj.flags).toContain("base_rate_divergence");
    expect(adj.confidencePenalty).toBeGreaterThan(0);
  });

  it("NEVER overrides the number (surfaces divergence only)", () => {
    const adj = baseRate(
      input({ rawProbability: 0.8, baseRate: 0.4 }),
      DEFAULT_PARAMS,
      0.8,
    );
    expect(adj.outputProbability).toBe(0.8);
    expect(adj.delta).toBe(0);
  });
});

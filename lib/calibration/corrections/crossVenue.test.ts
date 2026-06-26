import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "../params";
import type { CalibrationInput } from "../types";
import { crossVenue } from "./crossVenue";

function input(p: Partial<CalibrationInput> & { rawProbability: number }): CalibrationInput {
  return { marketId: "m", question: "q", venue: "kalshi", ...p };
}

describe("crossVenue", () => {
  it("does not apply when the event is not listed on the other venue", () => {
    const adj = crossVenue(input({ rawProbability: 0.6 }), DEFAULT_PARAMS, 0.6);
    expect(adj.applied).toBe(false);
    expect(adj.confidencePenalty).toBe(0);
  });

  it("does not penalize when venues agree", () => {
    const adj = crossVenue(
      input({ rawProbability: 0.6, crossVenueProbability: 0.59, crossVenueVenue: "polymarket" }),
      DEFAULT_PARAMS,
      0.6,
    );
    expect(adj.confidencePenalty).toBe(0);
    expect(adj.flags).toHaveLength(0);
  });

  it("flags and penalizes cross-venue divergence", () => {
    const adj = crossVenue(
      input({ rawProbability: 0.6, crossVenueProbability: 0.4, crossVenueVenue: "polymarket" }),
      DEFAULT_PARAMS,
      0.6,
    );
    expect(adj.flags).toContain("cross_venue_divergence");
    expect(adj.confidencePenalty).toBeGreaterThan(0);
  });

  it("never changes the probability", () => {
    const adj = crossVenue(
      input({ rawProbability: 0.6, crossVenueProbability: 0.4 }),
      DEFAULT_PARAMS,
      0.6,
    );
    expect(adj.outputProbability).toBe(0.6);
    expect(adj.delta).toBe(0);
  });
});

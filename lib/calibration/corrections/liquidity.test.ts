import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "../params";
import type { CalibrationInput } from "../types";
import { liquidity } from "./liquidity";

function input(p: Partial<CalibrationInput> & { rawProbability: number }): CalibrationInput {
  return { marketId: "m", question: "q", venue: "kalshi", ...p };
}

const P = 0.6;

describe("liquidity", () => {
  it("penalizes a thin book and flags thin_liquidity", () => {
    const adj = liquidity(input({ rawProbability: P, volume: 2_000 }), DEFAULT_PARAMS, P);
    expect(adj.confidencePenalty).toBeGreaterThan(0);
    expect(adj.flags).toContain("thin_liquidity");
    expect(adj.applied).toBe(true);
  });

  it("does not penalize a healthy, liquid book", () => {
    const adj = liquidity(input({ rawProbability: P, volume: 500_000 }), DEFAULT_PARAMS, P);
    expect(adj.confidencePenalty).toBe(0);
    expect(adj.applied).toBe(false);
  });

  it("flags whale-dominated books even when volume is healthy", () => {
    const adj = liquidity(
      input({ rawProbability: P, volume: 500_000, topHolderConcentration: 0.7 }),
      DEFAULT_PARAMS,
      P,
    );
    expect(adj.flags).toContain("whale_dominated");
    expect(adj.confidencePenalty).toBeGreaterThan(0);
  });

  it("does nothing without liquidity data", () => {
    const adj = liquidity(input({ rawProbability: P }), DEFAULT_PARAMS, P);
    expect(adj.applied).toBe(false);
    expect(adj.confidencePenalty).toBe(0);
  });

  it("never changes the probability", () => {
    const adj = liquidity(input({ rawProbability: P, volume: 1_000 }), DEFAULT_PARAMS, P);
    expect(adj.outputProbability).toBe(P);
    expect(adj.delta).toBe(0);
  });
});

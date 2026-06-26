import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "../params";
import type { CalibrationInput, PricePoint } from "../types";
import { lag1Autocorr, momentum } from "./momentum";

function input(p: Partial<CalibrationInput> & { rawProbability: number }): CalibrationInput {
  return { marketId: "m", question: "q", venue: "kalshi", ...p };
}

function series(ps: number[]): PricePoint[] {
  return ps.map((p, i) => ({ t: i, p }));
}

const P = 0.55;

describe("lag1Autocorr", () => {
  it("returns 0 for constant (zero-variance) series", () => {
    expect(lag1Autocorr([1, 1, 1, 1])).toBe(0);
  });
});

describe("momentum", () => {
  it("does nothing with insufficient price history", () => {
    const adj = momentum(input({ rawProbability: P, priceHistory: series([0.5, 0.51]) }), DEFAULT_PARAMS, P);
    expect(adj.applied).toBe(false);
    expect(adj.confidencePenalty).toBe(0);
  });

  it("flags a momentum regime when increments are positively autocorrelated", () => {
    // Rise then fall: increments persist in sign => strong positive autocorrelation.
    const adj = momentum(
      input({ rawProbability: P, priceHistory: series([0.5, 0.53, 0.56, 0.59, 0.62, 0.59, 0.56, 0.53, 0.5]) }),
      DEFAULT_PARAMS,
      P,
    );
    expect(adj.flags).toContain("momentum_regime");
    expect(adj.confidencePenalty).toBeGreaterThan(0);
    expect(adj.applied).toBe(true);
  });

  it("does not penalize a mean-reverting (zigzag) series", () => {
    const adj = momentum(
      input({ rawProbability: P, priceHistory: series([0.5, 0.55, 0.5, 0.55, 0.5, 0.55, 0.5, 0.55, 0.5]) }),
      DEFAULT_PARAMS,
      P,
    );
    expect(adj.flags).toHaveLength(0);
    expect(adj.confidencePenalty).toBe(0);
  });

  it("never changes the probability", () => {
    const adj = momentum(
      input({ rawProbability: P, priceHistory: series([0.5, 0.53, 0.56, 0.59, 0.62, 0.59, 0.56, 0.53, 0.5]) }),
      DEFAULT_PARAMS,
      P,
    );
    expect(adj.outputProbability).toBe(P);
    expect(adj.delta).toBe(0);
  });
});

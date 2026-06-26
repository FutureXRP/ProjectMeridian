import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS, type CalibrationParams } from "../params";
import type { CalibrationInput } from "../types";
import { favoriteLongshot } from "./favoriteLongshot";

function input(rawProbability: number): CalibrationInput {
  return { marketId: "m", question: "q", venue: "kalshi", rawProbability };
}

describe("favoriteLongshot", () => {
  it("leaves a coin-flip (0.5) essentially unchanged with symmetric params", () => {
    const adj = favoriteLongshot(input(0.5), DEFAULT_PARAMS);
    expect(adj.outputProbability).toBeCloseTo(0.5, 6);
    expect(adj.applied).toBe(false);
  });

  it("revises a longshot down (crowd overpriced it)", () => {
    const adj = favoriteLongshot(input(0.05), DEFAULT_PARAMS);
    expect(adj.outputProbability).toBeLessThan(0.05);
    expect(adj.delta).toBeLessThan(0);
    expect(adj.applied).toBe(true);
  });

  it("revises a favorite up (crowd underpriced it)", () => {
    const adj = favoriteLongshot(input(0.95), DEFAULT_PARAMS);
    expect(adj.outputProbability).toBeGreaterThan(0.95);
    expect(adj.delta).toBeGreaterThan(0);
    expect(adj.applied).toBe(true);
  });

  it("is the identity transform when b=1, a=0", () => {
    const identity: CalibrationParams = {
      ...DEFAULT_PARAMS,
      favoriteLongshot: { a: 0, b: 1 },
    };
    for (const p of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const adj = favoriteLongshot(input(p), identity);
      expect(adj.outputProbability).toBeCloseTo(p, 4);
    }
  });

  it("is monotonic increasing in the raw probability", () => {
    const ps = [0.02, 0.1, 0.25, 0.5, 0.75, 0.9, 0.98];
    const outs = ps.map(
      (p) => favoriteLongshot(input(p), DEFAULT_PARAMS).outputProbability,
    );
    for (let i = 1; i < outs.length; i++) {
      expect(outs[i]).toBeGreaterThan(outs[i - 1]);
    }
  });

  it("keeps output strictly within (0,1) for extreme/degenerate inputs", () => {
    for (const p of [0, 0.0001, 0.9999, 1]) {
      const out = favoriteLongshot(input(p), DEFAULT_PARAMS).outputProbability;
      expect(out).toBeGreaterThan(0);
      expect(out).toBeLessThan(1);
    }
  });

  it("contributes no confidence penalty (it estimates, it does not flag)", () => {
    expect(favoriteLongshot(input(0.2), DEFAULT_PARAMS).confidencePenalty).toBe(0);
  });
});

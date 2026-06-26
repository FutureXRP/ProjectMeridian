import { describe, expect, it } from "vitest";
import type { ResolvedSample } from "../calibration/fit";
import { brierScore } from "./metrics";

const samples: ResolvedSample[] = [
  { rawProbability: 1, outcome: 1 },
  { rawProbability: 0, outcome: 0 },
  { rawProbability: 0.5, outcome: 1 },
  { rawProbability: 0.5, outcome: 0 },
];

describe("brierScore", () => {
  it("is 0 for a perfect predictor", () => {
    expect(brierScore(samples, (r) => r)).toBeCloseTo((0 + 0 + 0.25 + 0.25) / 4, 10);
  });

  it("is 0.25 for an always-0.5 predictor on balanced outcomes", () => {
    expect(brierScore(samples, () => 0.5)).toBeCloseTo(0.25, 10);
  });
});

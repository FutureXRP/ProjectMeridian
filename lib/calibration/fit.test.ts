import { describe, expect, it } from "vitest";
import { refitFavoriteLongshot, type ResolvedSample } from "./fit";
import { clampProbability, logit, sigmoid } from "./math";

/**
 * Build a deterministic resolved-market dataset from a known (a,b): for each raw
 * price emit a batch whose YES-rate equals the true calibrated probability, so
 * the MLE should recover (a,b).
 */
function syntheticSamples(a: number, b: number, perBin = 200): ResolvedSample[] {
  const samples: ResolvedSample[] = [];
  for (let raw = 0.05; raw <= 0.95 + 1e-9; raw += 0.05) {
    const p = sigmoid(a + b * logit(clampProbability(raw)));
    const ones = Math.round(p * perBin);
    for (let i = 0; i < perBin; i++) {
      samples.push({ rawProbability: raw, outcome: i < ones ? 1 : 0 });
    }
  }
  return samples;
}

describe("refitFavoriteLongshot", () => {
  it("recovers the slope/intercept of a known calibration curve", () => {
    const fit = refitFavoriteLongshot(syntheticSamples(0, 1.3));
    expect(fit.b).toBeGreaterThan(1.2);
    expect(fit.b).toBeLessThan(1.4);
    expect(Math.abs(fit.a)).toBeLessThan(0.1);
  });

  it("recovers an identity curve (b≈1) from well-calibrated data", () => {
    const fit = refitFavoriteLongshot(syntheticSamples(0, 1.0));
    expect(fit.b).toBeGreaterThan(0.9);
    expect(fit.b).toBeLessThan(1.1);
  });

  it("throws on empty input", () => {
    expect(() => refitFavoriteLongshot([])).toThrow();
  });
});

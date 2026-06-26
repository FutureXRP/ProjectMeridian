import { describe, expect, it } from "vitest";
import { calibrate } from "./calibrate";
import { favoriteLongshot } from "./corrections/favoriteLongshot";
import { DEFAULT_PARAMS } from "./params";
import type { CalibrationInput } from "./types";

function input(p: Partial<CalibrationInput> & { rawProbability: number }): CalibrationInput {
  return { marketId: "m1", question: "Will the Fed cut at the next meeting?", venue: "kalshi", ...p };
}

describe("calibrate", () => {
  it("returns the full ordered per-correction breakdown", () => {
    const r = calibrate(input({ rawProbability: 0.6, volume: 500_000 }));
    expect(r.adjustments.map((a) => a.key)).toEqual([
      "favorite_longshot",
      "liquidity",
      "momentum",
      "base_rate",
      "cross_venue",
    ]);
  });

  it("grades a clean, liquid, consensus-aligned market highly", () => {
    const r = calibrate(
      input({
        rawProbability: 0.6,
        volume: 1_000_000,
        externalReference: 0.61,
        crossVenueProbability: 0.6,
      }),
    );
    expect(r.confidenceScore).toBe(1);
    expect(r.grade).toBe("A");
    expect(r.flags).toHaveLength(0);
  });

  it("downgrades a thin, whale-dominated, divergent market — but keeps the number", () => {
    const raw = 0.85;
    const r = calibrate(
      input({
        rawProbability: raw,
        volume: 1_500,
        topHolderConcentration: 0.8,
        externalReference: 0.5,
        crossVenueProbability: 0.55,
      }),
    );
    expect(r.confidenceScore).toBeLessThan(0.7);
    expect(["C", "D"]).toContain(r.grade);
    expect(r.flags.length).toBeGreaterThan(1);

    // The calibrated number is exactly the favorite–longshot output — the
    // confidence checks never override it.
    const fl = favoriteLongshot(input({ rawProbability: raw }), DEFAULT_PARAMS);
    expect(r.calibratedProbability).toBe(fl.outputProbability);
  });

  it("preserves the raw probability and confines number-moving to favorite–longshot", () => {
    const r = calibrate(input({ rawProbability: 0.2, volume: 1_000 }));
    expect(r.rawProbability).toBe(0.2);
    const moved = r.adjustments.filter((a) => a.delta !== 0);
    expect(moved).toHaveLength(1);
    expect(moved[0].key).toBe("favorite_longshot");
  });
});

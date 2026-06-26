import { describe, expect, it } from "vitest";
import { calibrate } from "../calibration";
import { normalizeKalshiMarket } from "./kalshi";
import { toCalibrationInput } from "./toCalibrationInput";

describe("toCalibrationInput", () => {
  it("bridges a normalized market into the calibration core end-to-end", () => {
    const market = normalizeKalshiMarket({
      ticker: "KXFED-26JUN",
      series_ticker: "KXFED",
      title: "Fed holds at the June meeting?",
      status: "active",
      last_price: 88,
      volume: 2_000, // thin
    })!;

    const input = toCalibrationInput(market, {
      externalReference: 0.6,
      externalReferenceLabel: "CME FedWatch",
    });
    expect(input.rawProbability).toBeCloseTo(0.88, 6);
    expect(input.venue).toBe("kalshi");

    const result = calibrate(input);
    // favorite pushed up by the favorite–longshot transform...
    expect(result.calibratedProbability).toBeGreaterThan(0.88);
    // ...thin book flagged...
    expect(result.flags).toContain("thin_liquidity");
    // ...and a wide gap to the FedWatch anchor flagged (number left unchanged).
    expect(result.flags).toContain("base_rate_divergence");
    expect(["A", "B", "C", "D"]).toContain(result.grade);
  });
});

import { describe, expect, it } from "vitest";
import { normalizeKalshiMarket } from "./kalshi";

describe("normalizeKalshiMarket", () => {
  it("normalizes an open market with a last price (cents → 0..1)", () => {
    const m = normalizeKalshiMarket({
      ticker: "KXFED-26JUN-T4.50",
      series_ticker: "KXFED",
      title: "Fed funds rate 4.50% after June?",
      status: "active",
      last_price: 62,
      volume: 120_000,
      open_interest: 50_000,
    });
    expect(m).not.toBeNull();
    expect(m!.venue).toBe("kalshi");
    expect(m!.yesProbability).toBeCloseTo(0.62, 6);
    expect(m!.status).toBe("open");
    expect(m!.category).toBe("fed");
    expect(m!.volume).toBe(120_000);
    expect(m!.openInterest).toBe(50_000);
  });

  it("maps a settled market's result to a resolved outcome", () => {
    const m = normalizeKalshiMarket({
      ticker: "KXCPI-25APR",
      series_ticker: "KXCPI",
      status: "settled",
      result: "yes",
      last_price: 100,
    });
    expect(m!.status).toBe("settled");
    expect(m!.resolvedOutcome).toBe("yes");
    expect(m!.category).toBe("cpi");
  });

  it("falls back to the bid/ask midpoint when there is no last price", () => {
    const m = normalizeKalshiMarket({
      ticker: "KXGDP-26",
      series_ticker: "KXGDP",
      status: "active",
      yes_bid: 40,
      yes_ask: 44,
    });
    expect(m!.yesProbability).toBeCloseTo(0.42, 6);
    expect(m!.category).toBe("gdp");
  });

  it("returns null when there is no usable price", () => {
    expect(normalizeKalshiMarket({ ticker: "X", status: "active" })).toBeNull();
  });
});

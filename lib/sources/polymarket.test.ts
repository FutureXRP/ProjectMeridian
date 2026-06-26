import { describe, expect, it } from "vitest";
import { normalizePolymarketMarket, parseJsonArray } from "./polymarket";

describe("parseJsonArray", () => {
  it("parses a stringified array, passes through a real array, tolerates junk", () => {
    expect(parseJsonArray('["Yes","No"]')).toEqual(["Yes", "No"]);
    expect(parseJsonArray(["Yes", "No"])).toEqual(["Yes", "No"]);
    expect(parseJsonArray("not json")).toEqual([]);
    expect(parseJsonArray(undefined)).toEqual([]);
  });
});

describe("normalizePolymarketMarket", () => {
  it("parses stringified outcomes/prices and picks the Yes price", () => {
    const m = normalizePolymarketMarket({
      conditionId: "0xabc",
      slug: "fed-cuts-june",
      question: "Will the Fed cut rates in June?",
      outcomes: '["Yes","No"]',
      outcomePrices: '["0.62","0.38"]',
      volumeNum: 49_900_000,
      closed: false,
      active: true,
    });
    expect(m).not.toBeNull();
    expect(m!.venue).toBe("polymarket");
    expect(m!.yesProbability).toBeCloseTo(0.62, 6);
    expect(m!.status).toBe("open");
    expect(m!.category).toBe("fed");
    expect(m!.volume).toBe(49_900_000);
    expect(m!.slug).toBe("fed-cuts-june");
  });

  it("marks a resolved market settled with an outcome", () => {
    const m = normalizePolymarketMarket({
      conditionId: "0xdef",
      question: "CPI above 3% in April?",
      outcomes: '["Yes","No"]',
      outcomePrices: '["1","0"]',
      closed: true,
      umaResolutionStatus: "resolved",
    });
    expect(m!.status).toBe("settled");
    expect(m!.resolvedOutcome).toBe("yes");
    expect(m!.category).toBe("cpi");
  });

  it("returns null when prices can't be parsed", () => {
    expect(
      normalizePolymarketMarket({ conditionId: "x", outcomes: "[]", outcomePrices: "[]" }),
    ).toBeNull();
  });
});

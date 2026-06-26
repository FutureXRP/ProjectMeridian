import { describe, expect, it } from "vitest";
import { checkReadGuardrails } from "./guardrails";

describe("checkReadGuardrails", () => {
  it("passes a clean, descriptive read", () => {
    const r = checkReadGuardrails(
      "The crowd is pricing this as a near-lock and the model agrees after a mild favorite adjustment, with deep liquidity keeping confidence high.",
    );
    expect(r.ok).toBe(true);
    expect(r.violations).toHaveLength(0);
  });

  it("flags explicit advice language", () => {
    expect(checkReadGuardrails("You should buy this before the Fed meeting.").ok).toBe(false);
    expect(checkReadGuardrails("We recommend going long here.").ok).toBe(false);
    expect(checkReadGuardrails("Short this contract.").ok).toBe(false);
  });

  it("does not false-positive on descriptive market language", () => {
    // "betting"/"bets" and a bare "should" (event resolution) are not advice.
    expect(
      checkReadGuardrails("The market is betting heavily that the print should land above 3%.").ok,
    ).toBe(true);
  });

  it("flags an over-long read", () => {
    const long = "The market says ".repeat(40);
    expect(checkReadGuardrails(long).ok).toBe(false);
  });

  it("flags an empty read", () => {
    expect(checkReadGuardrails("   ").ok).toBe(false);
  });
});

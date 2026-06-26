import { afterEach, describe, expect, it } from "vitest";
import { cached, clearCache, RateLimiter } from "./cache";

afterEach(() => clearCache());

describe("cached", () => {
  it("serves from cache within the TTL (fetcher runs once)", async () => {
    let calls = 0;
    const t = 1000;
    const now = () => t;
    const f = async () => {
      calls++;
      return "v";
    };
    expect(await cached("k", 100, f, { now })).toBe("v");
    expect(await cached("k", 100, f, { now })).toBe("v");
    expect(calls).toBe(1);
  });

  it("refetches after the TTL expires", async () => {
    let calls = 0;
    let t = 1000;
    const now = () => t;
    const f = async () => {
      calls++;
      return calls;
    };
    await cached("k2", 100, f, { now });
    t += 101;
    const v = await cached("k2", 100, f, { now });
    expect(calls).toBe(2);
    expect(v).toBe(2);
  });

  it("single-flights concurrent callers into one request", async () => {
    let calls = 0;
    const f = async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 5));
      return "x";
    };
    const [a, b] = await Promise.all([cached("k3", 1000, f), cached("k3", 1000, f)]);
    expect(a).toBe("x");
    expect(b).toBe("x");
    expect(calls).toBe(1);
  });

  it("never caches failures", async () => {
    let calls = 0;
    const f = async () => {
      calls++;
      throw new Error("boom");
    };
    await expect(cached("k4", 1000, f)).rejects.toThrow("boom");
    await expect(cached("k4", 1000, f)).rejects.toThrow("boom");
    expect(calls).toBe(2);
  });
});

describe("RateLimiter", () => {
  it("allows a burst up to capacity, then refills over time", () => {
    let t = 0;
    const now = () => t;
    const rl = new RateLimiter(10, 3, now); // 10 tokens/sec, capacity 3
    expect(rl.tryTake()).toBe(true);
    expect(rl.tryTake()).toBe(true);
    expect(rl.tryTake()).toBe(true);
    expect(rl.tryTake()).toBe(false); // empty
    t += 100; // 0.1s * 10/s = 1 token
    expect(rl.tryTake()).toBe(true);
    expect(rl.tryTake()).toBe(false);
  });
});

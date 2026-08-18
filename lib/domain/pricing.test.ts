import { describe, it, expect } from "vitest";
import { suggestPrices } from "./pricing";

describe("suggestPrices", () => {
  it("applies margins and rounds up to the step", () => {
    const r = suggestPrices(390, {
      minMarginPct: 15,
      targetMarginPct: 25,
      roundingStep: 10,
    });
    // 390*1.15 = 448.5 -> 450 ; 390*1.25 = 487.5 -> 490
    expect(r.minPrice).toBe(450);
    expect(r.recommendedPrice).toBe(490);
  });

  it("leaves exact multiples unchanged", () => {
    const r = suggestPrices(300, {
      minMarginPct: 20,
      targetMarginPct: 40,
      roundingStep: 5,
    });
    // 360 and 420 are already multiples of 5
    expect(r.minPrice).toBe(360);
    expect(r.recommendedPrice).toBe(420);
  });

  it("no rounding when step is 0", () => {
    const r = suggestPrices(390, {
      minMarginPct: 15,
      targetMarginPct: 25,
      roundingStep: 0,
    });
    expect(r.minPrice).toBe(448.5);
    expect(r.recommendedPrice).toBe(487.5);
  });

  it("zero landed cost yields zero", () => {
    const r = suggestPrices(0, {
      minMarginPct: 15,
      targetMarginPct: 25,
      roundingStep: 10,
    });
    expect(r.minPrice).toBe(0);
    expect(r.recommendedPrice).toBe(0);
  });

  it("min price never dips below the margin floor", () => {
    const r = suggestPrices(100, {
      minMarginPct: 15,
      targetMarginPct: 25,
      roundingStep: 10,
    });
    // 115 -> rounds UP to 120 (not down to 110)
    expect(r.minPrice).toBe(120);
    expect(r.minPrice).toBeGreaterThanOrEqual(115);
  });
});

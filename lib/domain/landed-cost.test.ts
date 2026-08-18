import { describe, it, expect } from "vitest";
import { allocateLandedCost } from "./landed-cost";

describe("allocateLandedCost", () => {
  it("allocates proportional to purchase value (blueprint example)", () => {
    const r = allocateLandedCost(
      [
        { id: "a", quantity: 200, unitCost: 100 }, // 20,000 = 20%
        { id: "b", quantity: 100, unitCost: 800 }, // 80,000 = 80%
      ],
      10000,
    );
    expect(r.totalPurchaseValue).toBe(100000);
    const a = r.lines.find((l) => l.id === "a")!;
    const b = r.lines.find((l) => l.id === "b")!;
    expect(a.allocatedExpense).toBe(2000);
    expect(b.allocatedExpense).toBe(8000);
    expect(a.landedUnitCost).toBe(110); // 22000 / 200
    expect(b.landedUnitCost).toBe(880); // 88000 / 100
    expect(r.landedTotal).toBe(110000);
  });

  it("expenses allocated sum exactly to the total (remainder handling)", () => {
    const r = allocateLandedCost(
      [
        { id: "a", quantity: 1, unitCost: 100 },
        { id: "b", quantity: 1, unitCost: 100 },
        { id: "c", quantity: 1, unitCost: 100 },
      ],
      10, // 10 / 3 = 3.33 each -> remainder 0.01
    );
    const sum = r.lines.reduce((s, l) => s + l.allocatedExpense, 0);
    expect(Math.round(sum * 100) / 100).toBe(10);
    // remainder lands on the first (all equal) line
    expect(r.lines[0].allocatedExpense).toBe(3.34);
    expect(r.lines[1].allocatedExpense).toBe(3.33);
    expect(r.lines[2].allocatedExpense).toBe(3.33);
  });

  it("with zero expenses landed cost equals purchase cost", () => {
    const r = allocateLandedCost([{ id: "a", quantity: 10, unitCost: 50 }], 0);
    expect(r.lines[0].allocatedExpense).toBe(0);
    expect(r.lines[0].landedUnitCost).toBe(50);
  });

  it("falls back to quantity when total value is zero", () => {
    const r = allocateLandedCost(
      [
        { id: "a", quantity: 10, unitCost: 0 },
        { id: "b", quantity: 30, unitCost: 0 },
      ],
      40,
    );
    const a = r.lines.find((l) => l.id === "a")!;
    const b = r.lines.find((l) => l.id === "b")!;
    expect(a.allocatedExpense).toBe(10);
    expect(b.allocatedExpense).toBe(30);
    expect(a.landedUnitCost).toBe(1);
    expect(b.landedUnitCost).toBe(1);
  });

  it("single item absorbs all expenses", () => {
    const r = allocateLandedCost([{ id: "a", quantity: 4, unitCost: 25 }], 30);
    expect(r.lines[0].allocatedExpense).toBe(30);
    expect(r.lines[0].landedLineTotal).toBe(130);
    expect(r.lines[0].landedUnitCost).toBe(32.5);
  });
});

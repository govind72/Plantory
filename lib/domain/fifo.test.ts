import { describe, it, expect } from "vitest";
import { consumeFifo, InsufficientStockError } from "./fifo";

const batches = [
  { id: "b1", qtyRemaining: 100, unitCost: 300 }, // oldest
  { id: "b2", qtyRemaining: 100, unitCost: 400 },
];

describe("consumeFifo", () => {
  it("consumes from the oldest batch first", () => {
    const r = consumeFifo(batches, 60);
    expect(r.consumptions).toEqual([
      { batchId: "b1", quantity: 60, unitCost: 300 },
    ]);
    expect(r.totalCost).toBe(18000);
    expect(r.totalQuantity).toBe(60);
  });

  it("spans multiple batches at the boundary", () => {
    const r = consumeFifo(batches, 150);
    expect(r.consumptions).toEqual([
      { batchId: "b1", quantity: 100, unitCost: 300 },
      { batchId: "b2", quantity: 50, unitCost: 400 },
    ]);
    // 100*300 + 50*400 = 50,000
    expect(r.totalCost).toBe(50000);
  });

  it("consumes exactly all stock", () => {
    const r = consumeFifo(batches, 200);
    expect(r.totalCost).toBe(100 * 300 + 100 * 400);
  });

  it("throws InsufficientStockError when short", () => {
    expect(() => consumeFifo(batches, 201)).toThrow(InsufficientStockError);
    try {
      consumeFifo(batches, 201);
    } catch (e) {
      expect((e as InsufficientStockError).available).toBe(200);
      expect((e as InsufficientStockError).requested).toBe(201);
    }
  });

  it("rejects non-positive quantities", () => {
    expect(() => consumeFifo(batches, 0)).toThrow();
    expect(() => consumeFifo(batches, -5)).toThrow();
  });

  it("skips empty batches", () => {
    const r = consumeFifo(
      [
        { id: "b1", qtyRemaining: 0, unitCost: 300 },
        { id: "b2", qtyRemaining: 10, unitCost: 400 },
      ],
      5,
    );
    expect(r.consumptions).toEqual([
      { batchId: "b2", quantity: 5, unitCost: 400 },
    ]);
  });
});

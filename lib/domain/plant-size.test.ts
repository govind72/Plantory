import { describe, it, expect } from "vitest";
import { composeSizeLabel, formatHeight } from "./plant-size";

describe("composeSizeLabel", () => {
  it("combines height and bag", () => {
    expect(composeSizeLabel(6, "12 inch")).toBe("6 ft · 12 inch");
  });
  it("height only", () => {
    expect(composeSizeLabel(6, null)).toBe("6 ft");
    expect(composeSizeLabel(8, "  ")).toBe("8 ft");
  });
  it("bag only", () => {
    expect(composeSizeLabel(null, "10x10")).toBe("10x10");
    expect(composeSizeLabel(0, "10x10")).toBe("10x10");
  });
  it("neither falls back to Standard", () => {
    expect(composeSizeLabel(null, null)).toBe("Standard");
  });
});

describe("formatHeight", () => {
  it("trims trailing zeros", () => {
    expect(formatHeight(6)).toBe("6");
    expect(formatHeight(6.5)).toBe("6.5");
    expect(formatHeight(6.25)).toBe("6.25");
  });
});

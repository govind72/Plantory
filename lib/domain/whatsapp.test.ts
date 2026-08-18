import { describe, it, expect } from "vitest";
import { buildWaLink } from "./whatsapp";

describe("buildWaLink", () => {
  it("strips non-digits from the number", () => {
    expect(buildWaLink("+91 98xxx-12345", "hi")).toBe(
      "https://wa.me/919812345?text=hi",
    );
  });
  it("url-encodes the message", () => {
    expect(buildWaLink("919800000000", "Foxtail Palm 6 ft?")).toBe(
      "https://wa.me/919800000000?text=Foxtail%20Palm%206%20ft%3F",
    );
  });
});

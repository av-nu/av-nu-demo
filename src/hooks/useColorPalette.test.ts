import { describe, expect, it } from "vitest";

import { PALETTE_LIMIT, normalizeColor } from "./useColorPalette";

describe("normalizeColor", () => {
  it("lowercases six-digit hex so the same colour is not saved twice", () => {
    expect(normalizeColor("#FF6361")).toBe("#ff6361");
    expect(normalizeColor("  #AcAb36 ")).toBe("#acab36");
  });

  it("expands shorthand hex", () => {
    expect(normalizeColor("#fff")).toBe("#ffffff");
    expect(normalizeColor("#0A3")).toBe("#00aa33");
  });

  it("rejects values that are not hex colours", () => {
    for (const value of ["transparent", "rgb(0,0,0)", "#12", "#1234567", "red", ""]) {
      expect(normalizeColor(value)).toBeUndefined();
    }
  });

  it("caps the palette so it cannot grow without bound", () => {
    expect(PALETTE_LIMIT).toBeGreaterThan(0);
    expect(PALETTE_LIMIT).toBeLessThanOrEqual(48);
  });
});

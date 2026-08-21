import { describe, expect, it } from "vitest";

import { brandMatchesFilters, type BrandFilterMetadata } from "./brandFilters";

const metadata: BrandFilterMetadata = {
  ownership: ["Women-Owned", "AAPI-Owned"],
  made: ["Handmade", "Small Batch"],
  values: ["Vegan", "Low-Waste"],
  categories: ["Beauty", "Wellness"],
};

describe("brand filters", () => {
  it("uses AND semantics across selected attributes", () => {
    expect(brandMatchesFilters(metadata, { ownership: ["Women-Owned"], categories: ["Beauty"] })).toBe(true);
    expect(brandMatchesFilters(metadata, { ownership: ["Women-Owned", "Black-Owned"] })).toBe(false);
    expect(brandMatchesFilters(metadata, { categories: ["Beauty", "Food"] })).toBe(true);
    expect(brandMatchesFilters(metadata, { categories: ["Food", "Jewelry"] })).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { curatedGuideLooks } from "./curatedGuides";
import { mockProducts } from "./mockProducts";

describe("curated guides", () => {
  it("uses distinct JSON-backed products for thematic guides", () => {
    const productIds = new Set(mockProducts.map((product) => product.id));
    const coverIds = curatedGuideLooks.map((guide) => guide.selectedProductIds[0]);
    const coverUrls = coverIds.map((id) => mockProducts.find((product) => product.id === id)?.images[0]);

    expect(curatedGuideLooks).toHaveLength(8);
    expect(new Set(coverIds).size).toBe(8);
    expect(new Set(coverUrls).size).toBe(8);
    expect(curatedGuideLooks.every((guide) => guide.selectedProductIds.length === 4)).toBe(true);
    expect(curatedGuideLooks.every((guide) => guide.selectedProductIds.every((id) => productIds.has(id)))).toBe(true);
  });
});

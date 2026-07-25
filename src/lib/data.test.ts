import { describe, expect, it } from "vitest";

import { mockBrands } from "@/data/mockBrands";
import { getBrandWindowImages } from "./data";

describe("brand window product assignments", () => {
  it("does not reuse a product image across brands", () => {
    const images = mockBrands.flatMap((brand) => {
      const window = getBrandWindowImages(brand.id);
      return [window.heroImage, ...window.products.map((product) => product.image)].filter(Boolean);
    });

    expect(new Set(images).size).toBe(images.length);
  });
});

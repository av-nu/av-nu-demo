import { describe, expect, it } from "vitest";

import { mockBrands } from "@/data/mockBrands";
import { cloudinaryCategoryProducts } from "@/data/cloudinaryCategoryProducts";
import { mockProducts } from "@/data/mockProducts";
import { getBrandWindowImages } from "./data";

describe("brand window product assignments", () => {
  it("does not reuse a product image across brands", () => {
    const images = mockBrands.flatMap((brand) => {
      const window = getBrandWindowImages(brand.id);
      return [window.heroImage, ...window.products.map((product) => product.image)].filter(Boolean);
    });

    expect(new Set(images).size).toBe(images.length);
  });

  it("keeps the first Cloudinary decor names aligned to their images", () => {
    expect(cloudinaryCategoryProducts.slice(0, 3).map((product) => product.name)).toEqual([
      "Walnut Charcuterie Board",
      "Ruby Red Glass Vase",
      "Textured Stone Table Lamp",
    ]);
  });

  it("includes the mapped home and beauty catalog categories", () => {
    expect(mockProducts.some((product) => product.category === "Home & Living")).toBe(true);
    expect(mockProducts.some((product) => product.category === "Beauty")).toBe(true);
    expect(mockProducts.filter((product) => product.category === "Beauty").every((product) => !/bracelet|bangle|cuff|necklace/i.test(product.name))).toBe(true);
    expect(mockProducts.filter((product) => product.category === "Home & Living" || product.category === "Beauty").every((product) => product.images[0].includes("res.cloudinary.com"))).toBe(true);
    expect(mockProducts.some((product) => product.subcategory === "Electronics" || product.subcategory === "Stationery")).toBe(false);
  });
});

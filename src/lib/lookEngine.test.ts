import { describe, expect, it } from "vitest";

import { mockProducts, type Product } from "@/data/mockProducts";
import { editorialProductIds } from "./editorial";
import { generateLook, normalizeSavedLook, refineLook, swapLookProduct, toggleLookLock } from "./lookEngine";

function productsForLook(productIds: string[]) {
  return productIds
    .map((id) => mockProducts.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product));
}

function searchableMetadata(product: Product) {
  return [
    product.name,
    product.productType,
    product.category,
    product.subcategory,
    product.collection,
    product.leaf,
    product.description,
    ...(product.styleTags ?? []),
    ...(product.occasionTags ?? []),
    ...(product.moodTags ?? []),
    ...(product.searchTags ?? []),
    ...(product.recommendationTags ?? []),
  ].filter(Boolean).join(" ").toLowerCase();
}

describe("look engine", () => {
  it("builds a shoppable draft with rails and selected products", () => {
    const look = generateLook("summer dinner outfit under $150");

    expect(look.title).toBeTruthy();
    expect(look.rails.length).toBeGreaterThanOrEqual(3);
    expect(look.selectedProductIds.length).toBeGreaterThanOrEqual(3);
    expect(new Set(look.selectedProductIds).size).toBe(look.selectedProductIds.length);
  });

  it("ranks products from the structured JSON attributes", () => {
    const look = generateLook("polished office pieces for work");
    const products = productsForLook(look.rails[0].productIds.slice(0, 5));
    const matching = products.filter((product) => /work|workwear|polished|tailored/.test(searchableMetadata(product)));

    expect(products).toHaveLength(5);
    expect(matching.length).toBeGreaterThanOrEqual(4);
  });

  it("uses predefined product considerations without requiring custom text", () => {
    const look = generateLook("", { recommendations: ["Wedding guest", "Under $150"] });
    const products = productsForLook(look.rails.flatMap((rail) => rail.productIds));
    const occasionMatches = products.filter((product) => /celebration|event|occasion wear|elegant/.test(searchableMetadata(product)));

    expect(look.recommendations).toEqual(["Wedding guest", "Under $150"]);
    expect(products.length).toBeGreaterThan(10);
    expect(products.every((product) => product.price <= 150)).toBe(true);
    expect(occasionMatches.length).toBeGreaterThan(5);
  });

  it.each([
    ["Summer dinner", /dinner|warm weather|resort|vacation/],
    ["Wedding guest", /celebration|event|occasion wear|elegant/],
    ["Vacation outfit", /vacation|resort|relaxed|warm weather/],
    ["Work look", /work|workwear|polished|tailored/],
    ["First date", /dinner|elevated|elegant|event ready/],
    ["Brunch", /weekend|elevated|relaxed|warm weather/],
    ["Minimalist", /modern|polished|contemporary|cream|taupe/],
    ["Coastal", /vacation|resort|relaxed|warm weather/],
  ])("maps the %s consideration to matching catalog attributes", (recommendation, expectedAttributes) => {
    const look = generateLook("", { recommendations: [recommendation] });
    const products = productsForLook(look.rails.slice(0, 2).flatMap((rail) => rail.productIds));
    const matching = products.filter((product) => expectedAttributes.test(searchableMetadata(product)));

    expect(products.length).toBeGreaterThan(5);
    expect(matching.length).toBeGreaterThanOrEqual(Math.ceil(products.length / 2));
  });

  it.each([
    ["More casual", /casual wear|everyday|relaxed|weekend/],
    ["Dressier", /evening apparel|occasion wear|elegant|event ready|celebration/],
    ["More colorful", /coral|rose|peach|blue|mustard|burgundy/],
    ["More neutral", /cream|taupe|camel|charcoal|olive/],
    ["More minimalist", /modern|polished|contemporary|cream|taupe/],
  ])("maps the %s refinement to matching catalog attributes", (refinement, expectedAttributes) => {
    const refined = refineLook(generateLook(""), refinement);
    const products = productsForLook(refined.rails.slice(0, 2).flatMap((rail) => rail.productIds));
    const matching = products.filter((product) => expectedAttributes.test(searchableMetadata(product)));

    expect(matching.length).toBeGreaterThanOrEqual(Math.ceil(products.length / 2));
  });

  it("prioritizes footwear and accessories for their predefined refinements", () => {
    const look = generateLook("polished work look");
    const shoes = refineLook(look, "Swap shoes");
    const accessories = refineLook(look, "Add accessories");

    expect(shoes.rails[0].title).toBe("Footwear");
    expect(productsForLook(shoes.rails[0].productIds).every((product) => product.subcategory === "Footwear")).toBe(true);
    expect(["Jewelry", "Footwear"]).toContain(accessories.rails[0].title);
  });

  it("sorts each result rail by price for the lower-price refinement", () => {
    const refined = refineLook(generateLook("vacation outfit"), "Lower price");

    refined.rails.forEach((rail) => {
      const prices = productsForLook(rail.productIds).map((product) => product.price);
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });
  });

  it("keeps locked pieces through refinement", () => {
    const look = generateLook("vacation outfit");
    const locked = toggleLookLock(look, look.selectedProductIds[0]);
    const refined = refineLook(locked, "make it cheaper");

    expect(refined.selectedProductIds).toContain(look.selectedProductIds[0]);
    expect(refined.lockedProductIds).toContain(look.selectedProductIds[0]);
  });

  it("swaps a rail product into the selected look", () => {
    const look = generateLook("casual brunch");
    const rail = look.rails.find((item) => item.productIds.length > 1);
    expect(rail).toBeDefined();

    const replacement = rail!.productIds[1];
    const swapped = swapLookProduct(look, rail!.id, replacement);

    expect(swapped.selectedProductIds).toContain(replacement);
  });

  it("normalizes grid page capacity to the supported one-to-eight range", () => {
    const generated = generateLook("casual weekend layers");
    const normalized = normalizeSavedLook({
      ...generated,
      layout: "grid",
      pages: [{ id: "grid-page", productIds: generated.selectedProductIds, gridItemCount: 12 }],
    });

    expect(normalized.pages?.[0].gridItemCount).toBe(8);
  });

  it("migrates editorial pages and derives persisted products from the document", () => {
    const generated = generateLook("editorial city layers");
    const productIds = generated.selectedProductIds.slice(0, 2);
    const normalized = normalizeSavedLook({
      ...generated,
      layout: "editorial",
      selectedProductIds: [...productIds, productIds[0]],
      pages: [{ id: "page-one", productIds: [...productIds, productIds[0]] }],
    });

    expect(normalized.pages).toHaveLength(1);
    expect(normalized.pages?.[0].editorial).toBeDefined();
    expect(normalized.pages?.[0].productIds).toEqual(editorialProductIds(normalized.pages?.[0].editorial));
    expect(normalized.selectedProductIds).toEqual(normalized.pages?.[0].productIds);
  });
});

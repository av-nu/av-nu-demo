import { describe, expect, it } from "vitest";

import { editorialProductIds } from "./editorial";
import { generateLook, normalizeSavedLook, refineLook, swapLookProduct, toggleLookLock } from "./lookEngine";

describe("look engine", () => {
  it("builds a shoppable draft with rails and selected products", () => {
    const look = generateLook("summer dinner outfit under $150");

    expect(look.title).toBeTruthy();
    expect(look.rails.length).toBeGreaterThanOrEqual(3);
    expect(look.selectedProductIds.length).toBeGreaterThanOrEqual(3);
    expect(new Set(look.selectedProductIds).size).toBe(look.selectedProductIds.length);
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

import { describe, expect, it } from "vitest";

import {
  EDITORIAL_FORMATS,
  EDITORIAL_IMAGE_MASKS,
  EDITORIAL_SHAPES,
  applyEditorialTemplate,
  clampEditorialElement,
  createImageElement,
  createProductElement,
  createShapeElement,
  createTextElement,
  duplicateEditorialElement,
  editorialProductIds,
  normalizeEditorialPage,
  normalizeEditorialRotation,
  removeEditorialElement,
  reorderEditorialElement,
  snapEditorialElement,
  updateEditorialElement,
} from "./editorial";

describe("editorial document", () => {
  it("creates a versioned template with shoppable products", () => {
    const design = applyEditorialTemplate(["p-1", "p-2", "p-1"], "New season", "magazine-spread");

    expect(design.version).toBe(1);
    expect(design.format).toBe("spread");
    expect(design.elements.some((element) => element.type === "text")).toBe(true);
    expect(editorialProductIds(design)).toEqual(["p-1", "p-2"]);
  });

  it("normalizes missing editorial data into an editable page", () => {
    const design = normalizeEditorialPage(undefined, ["p-1"], "Coastal dinner");

    expect(design.version).toBe(1);
    expect(design.elements.some((element) => element.type === "product" && element.productId === "p-1")).toBe(true);
  });

  it("preserves valid document identity so active editor selection is not reset", () => {
    const design = applyEditorialTemplate(["p-1"], "Stable editor", "fashion-cover");

    expect(normalizeEditorialPage(design, ["p-1"], "Stable editor")).toBe(design);
  });

  it("supports classic and expressive shapes, transparent fills, and image masks", () => {
    const heart = { ...createShapeElement("heart"), fill: "transparent", stroke: "#2f2927", strokeWidth: 4 };
    const maskedImage = createImageElement("data:image/webp;base64,test", "clover");

    expect(EDITORIAL_SHAPES.map((shape) => shape.id)).toEqual(expect.arrayContaining(["diamond", "arch", "heart", "star", "clover", "blob"]));
    expect(EDITORIAL_IMAGE_MASKS.map((mask) => mask.id)).toEqual(expect.arrayContaining(["circle", "oval", "heart", "star", "clover"]));
    expect(heart.fill).toBe("transparent");
    expect(maskedImage.mask).toBe("clover");
  });

  it("updates, duplicates, orders, and removes elements without mutating the source", () => {
    const first = createTextElement("Title");
    const second = createProductElement("p-1");
    const source = { version: 1 as const, format: "portrait" as const, backgroundColor: "#fff", backgroundOpacity: 1, showGuides: true, elements: [first, second] };
    const updated = updateEditorialElement(source, first.id, { x: 220 });
    const duplicated = duplicateEditorialElement(updated, first.id);
    const ordered = reorderEditorialElement(duplicated.design, first.id, "front");
    const removed = removeEditorialElement(ordered, second.id);

    expect(source.elements[0].x).not.toBe(220);
    expect(duplicated.design.elements).toHaveLength(3);
    expect(ordered.elements.find((element) => element.id === first.id)?.zIndex).toBe(2);
    expect(editorialProductIds(removed)).toEqual([]);
  });

  it("clamps element dimensions and keeps part of the element on canvas", () => {
    const dimensions = EDITORIAL_FORMATS.square;
    const element = { ...createProductElement("p-1"), x: dimensions.width * 2, y: -2000, width: 4000, height: 4000 };
    const clamped = clampEditorialElement(element, "square");

    expect(clamped.width).toBe(dimensions.width);
    expect(clamped.height).toBe(dimensions.height);
    expect(clamped.x).toBeLessThanOrEqual(dimensions.width - clamped.width * 0.2);
    expect(clamped.y).toBeGreaterThanOrEqual(-clamped.height * 0.8);
  });

  it("snaps element centers to the canvas and edges to visible peers", () => {
    const moving = { ...createProductElement("p-1"), x: 345, y: 80, width: 300, height: 300 };
    const centered = snapEditorialElement(moving, "square", [moving], 8);
    expect(centered.element.x).toBe(350);
    expect(centered.guides.x).toBe(500);

    const peer = { ...createProductElement("p-2"), x: 700, y: 420, width: 200, height: 180 };
    const nearPeer = { ...moving, x: 394, y: 118, width: 300, height: 300 };
    const snapped = snapEditorialElement(nearPeer, "square", [nearPeer, peer], 8);
    expect(snapped.element.x + snapped.element.width).toBe(peer.x);
    expect(snapped.element.y + snapped.element.height).toBe(peer.y);
  });

  it("keeps rotation within the inspector range", () => {
    expect(normalizeEditorialRotation(190)).toBe(-170);
    expect(normalizeEditorialRotation(-540)).toBe(-180);
  });
});

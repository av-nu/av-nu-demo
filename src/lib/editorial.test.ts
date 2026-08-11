import { describe, expect, it } from "vitest";

import {
  EDITORIAL_FORMATS,
  EDITORIAL_IMAGE_MASKS,
  EDITORIAL_SHAPES,
  EDITORIAL_TEMPLATES,
  FONT_CATALOG,
  appendDrawingPath,
  applyEditorialTemplate,
  clampEditorialElement,
  createDrawingElement,
  createImageElement,
  createProductElement,
  createShapeElement,
  createStickerElement,
  createTextElement,
  duplicateEditorialElement,
  editorialFontStack,
  clearSlot,
  fillPlaceholderWithImage,
  fillPlaceholderWithProduct,
  firstPlaceholder,
  isSlotElement,
  eraseDrawingPaths,
  makeEditorialDrawingPath,
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

describe("stickers and drawings", () => {
  it("creates emoji and icon stickers", () => {
    const emoji = createStickerElement("🌿");
    const icon = createStickerElement("leaf", "icon", { color: "#ACAB36" });

    expect(emoji.type).toBe("sticker");
    expect(emoji.kind).toBe("emoji");
    expect(emoji.value).toBe("🌿");
    expect(icon.kind).toBe("icon");
    expect(icon.color).toBe("#ACAB36");
  });

  it("creates a drawing sized to the canvas and appends strokes immutably", () => {
    const drawing = createDrawingElement("square");
    const stroke = makeEditorialDrawingPath("M0 0 L10 10", { tool: "pen", color: "#030125" });
    const withStroke = appendDrawingPath(drawing, stroke);

    expect(drawing.width).toBe(EDITORIAL_FORMATS.square.width);
    expect(drawing.viewBoxHeight).toBe(EDITORIAL_FORMATS.square.height);
    expect(drawing.paths).toHaveLength(0);
    expect(withStroke.paths).toHaveLength(1);
  });

  it("defaults the highlighter to a translucent stroke", () => {
    expect(makeEditorialDrawingPath("M0 0", { tool: "highlighter" }).opacity).toBeLessThan(1);
    expect(makeEditorialDrawingPath("M0 0", { tool: "pen" }).opacity).toBe(1);
  });

  it("erases strokes by id and preserves identity when nothing matches", () => {
    const stroke = makeEditorialDrawingPath("M0 0 L5 5");
    const drawing = appendDrawingPath(createDrawingElement("portrait"), stroke);

    expect(eraseDrawingPaths(drawing, [stroke.id]).paths).toHaveLength(0);
    expect(eraseDrawingPaths(drawing, ["nope"])).toBe(drawing);
    expect(eraseDrawingPaths(drawing, [])).toBe(drawing);
  });

  it("repairs drawings whose stored geometry is unusable", () => {
    const drawing = { ...createDrawingElement("portrait"), viewBoxWidth: 0, viewBoxHeight: Number.NaN, width: 400, height: 500 };
    const design = { version: 1 as const, format: "portrait" as const, backgroundColor: "#fff", backgroundOpacity: 1, showGuides: true, elements: [drawing] };

    const normalized = normalizeEditorialPage(design, [], "");
    const [repaired] = normalized.elements;
    if (repaired.type !== "drawing") throw new Error("expected a drawing element");

    expect(repaired.viewBoxWidth).toBe(400);
    expect(repaired.viewBoxHeight).toBe(500);
  });
});

describe("typography", () => {
  it("gives new text a catalog font and no highlight", () => {
    const text = createTextElement("Title");

    expect(text.fontId).toBe("headline");
    expect(text.highlightStyle).toBe("none");
    expect(createTextElement("Body", "body").fontId).toBe("sans");
  });

  it("backfills fontId from the legacy font slot on older documents", () => {
    const legacy = { ...createTextElement("Old"), fontFamily: "serif" as const };
    // Simulate a document persisted before the catalog existed.
    delete (legacy as { fontId?: string }).fontId;
    const design = { version: 1 as const, format: "portrait" as const, backgroundColor: "#fff", backgroundOpacity: 1, showGuides: true, elements: [legacy] };

    const normalized = normalizeEditorialPage(design, [], "");
    const [text] = normalized.elements;
    if (text.type !== "text") throw new Error("expected a text element");

    expect(text.fontId).toBe("serif");
  });

  it("resolves a font stack for catalog ids and falls back safely", () => {
    expect(editorialFontStack("playfair")).toContain("--font-playfair");
    expect(editorialFontStack(undefined, "headline")).toContain("--font-headline");
    expect(FONT_CATALOG.map((font) => font.id)).toEqual(expect.arrayContaining(["headline", "sans", "serif", "bebas", "caveat"]));
  });
});

describe("layout slots", () => {
  it("reserves a frame for every slot a layout expects, even with no products", () => {
    const design = applyEditorialTemplate([], "Empty", "catalog");
    const placeholders = design.elements.filter((element) => element.type === "placeholder");

    // Without reserved frames an applied layout is indistinguishable from a
    // blank page, which is what made templates look broken.
    expect(placeholders).toHaveLength(6);
    expect(design.elements.some((element) => element.type === "product")).toBe(false);
  });

  it("fills slots in order and reserves the remainder", () => {
    const design = applyEditorialTemplate(["p-1", "p-2"], "Partial", "catalog");

    expect(design.elements.filter((element) => element.type === "product")).toHaveLength(2);
    expect(design.elements.filter((element) => element.type === "placeholder")).toHaveLength(4);
  });

  it("reserves no frames once every slot has a product", () => {
    const design = applyEditorialTemplate(["p-1", "p-2"], "Full", "split-two");

    expect(firstPlaceholder(design)).toBeUndefined();
  });

  it("keeps the frame's geometry when a slot is filled", () => {
    const design = applyEditorialTemplate([], "Featured", "featured");
    const slot = firstPlaceholder(design);
    if (!slot) throw new Error("expected a reserved slot");

    const filled = fillPlaceholderWithProduct(design, slot.id, "p-9");
    const product = filled.elements.find((element) => element.id === slot.id);
    if (!product || product.type !== "product") throw new Error("expected the slot to become a product");

    expect(product.productId).toBe("p-9");
    expect(product.x).toBe(slot.x);
    expect(product.y).toBe(slot.y);
    expect(product.width).toBe(slot.width);
    expect(product.height).toBe(slot.height);
    expect(product.borderWidth).toBe(slot.borderWidth);
    expect(editorialProductIds(filled)).toEqual(["p-9"]);
  });

  it("treats products supplied up front as slots, not loose elements", () => {
    const design = applyEditorialTemplate(["p-1", "p-2"], "Partial", "catalog");
    const products = design.elements.filter((element) => element.type === "product");

    // Otherwise they would show resize handles and delete would destroy the frame.
    expect(products).toHaveLength(2);
    expect(products.every(isSlotElement)).toBe(true);
    expect(clearSlot(design, products[0].id)).not.toBe(design);
  });

  it("remembers that a filled element occupies a slot", () => {
    const design = applyEditorialTemplate([], "Featured", "catalog");
    const slot = firstPlaceholder(design);
    if (!slot) throw new Error("expected a reserved slot");

    const filled = fillPlaceholderWithProduct(design, slot.id, "p-9");
    const element = filled.elements.find((item) => item.id === slot.id);
    if (!element) throw new Error("expected the filled element");

    expect(isSlotElement(element)).toBe(true);
  });

  // Without this a filled layout degrades into loose elements: removing a
  // product would leave a hole with no way back to the frame.
  it("empties a filled slot back to a reserved frame", () => {
    const design = applyEditorialTemplate([], "Catalog", "catalog");
    const slot = firstPlaceholder(design);
    if (!slot) throw new Error("expected a reserved slot");

    const filled = fillPlaceholderWithProduct(design, slot.id, "p-9");
    const emptied = clearSlot(filled, slot.id);
    const restored = emptied.elements.find((item) => item.id === slot.id);
    if (!restored || restored.type !== "placeholder") throw new Error("expected the frame back");

    expect(restored.slot).toBe(slot.slot);
    expect(restored.x).toBe(slot.x);
    expect(restored.width).toBe(slot.width);
    expect(editorialProductIds(emptied)).toEqual([]);
  });

  it("keeps the slot where the author moved it", () => {
    const design = applyEditorialTemplate([], "Catalog", "catalog");
    const slot = firstPlaceholder(design);
    if (!slot) throw new Error("expected a reserved slot");

    const filled = fillPlaceholderWithProduct(design, slot.id, "p-9");
    const moved = updateEditorialElement(filled, slot.id, { x: 500, y: 600 });
    const emptied = clearSlot(moved, slot.id);
    const restored = emptied.elements.find((item) => item.id === slot.id);
    if (!restored || restored.type !== "placeholder") throw new Error("expected the frame back");

    expect(restored.x).toBe(500);
    expect(restored.y).toBe(600);
  });

  it("fills a slot with an uploaded image too", () => {
    const design = applyEditorialTemplate([], "Catalog", "catalog");
    const slot = firstPlaceholder(design);
    if (!slot) throw new Error("expected a reserved slot");

    const filled = fillPlaceholderWithImage(design, slot.id, "idb:image-1");
    const element = filled.elements.find((item) => item.id === slot.id);
    if (!element || element.type !== "image") throw new Error("expected an image element");

    expect(element.src).toBe("idb:image-1");
    expect(element.width).toBe(slot.width);
    expect(isSlotElement(element)).toBe(true);
  });

  it("leaves a loose element alone when asked to clear it", () => {
    const design = applyEditorialTemplate([], "Catalog", "catalog");
    const withLoose = { ...design, elements: [...design.elements, createProductElement("p-loose")] };
    const loose = withLoose.elements[withLoose.elements.length - 1];

    expect(clearSlot(withLoose, loose.id)).toBe(withLoose);
    expect(isSlotElement(loose)).toBe(false);
  });

  it("ignores a fill request for an element that is not a slot", () => {
    const design = applyEditorialTemplate(["p-1"], "Filled", "fashion-cover");
    const product = design.elements.find((element) => element.type === "product");
    if (!product) throw new Error("expected a product element");

    expect(fillPlaceholderWithProduct(design, product.id, "p-2")).toBe(design);
  });
});

describe("layout templates", () => {
  it("keeps the Featured composition: full-bleed hero plus a secondary strip", () => {
    const design = applyEditorialTemplate(["p-1", "p-2", "p-3", "p-4"], "Featured edit", "featured");
    const dimensions = EDITORIAL_FORMATS.portrait;
    const [hero] = design.elements;

    expect(design.format).toBe("portrait");
    expect(hero.type).toBe("product");
    expect(hero.width).toBe(dimensions.width);
    expect(hero.height).toBe(dimensions.height);
    // Hero + scrim + heading + caption + three strip thumbnails.
    expect(design.elements.filter((element) => element.type === "product")).toHaveLength(4);
    expect(design.elements.some((element) => element.type === "text")).toBe(true);
  });

  it("exposes the new templates and still honors the originals", () => {
    expect(EDITORIAL_TEMPLATES.map((template) => template.id)).toEqual(
      expect.arrayContaining(["featured", "hero-stack", "split-two", "triptych", "polaroid-scatter", "fashion-cover"]),
    );
    expect(applyEditorialTemplate(["p-1", "p-2"], "Split", "split-two").format).toBe("square");
    expect(applyEditorialTemplate(["p-1", "p-2", "p-3"], "Three", "triptych").format).toBe("landscape");
  });
});

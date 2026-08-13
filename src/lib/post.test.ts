import { describe, expect, it } from "vitest";

import { EDITORIAL_FORMATS, applyEditorialTemplate, createDrawingElement, createProductElement, createTextElement } from "./editorial";
import {
  addPostPage,
  addPostPin,
  createBlankPage,
  createMediaPage,
  createPostPage,
  duplicatePostPage,
  isMediaPage,
  isMultiPagePost,
  movePostPin,
  normalizePost,
  postCoverPage,
  postProductIds,
  removePostPage,
  removePostPin,
  reorderPostPage,
  scaleDesignToFormat,
  updatePostPageDesign,
  type Post,
} from "./post";

function buildPost(overrides: Partial<Post> = {}): Post {
  return normalizePost({
    id: "post-1",
    authorId: "me",
    pages: [createBlankPage("portrait")],
    format: "portrait",
    coverPageIndex: 0,
    productIds: [],
    caption: "",
    visibility: "public",
    likes: 0,
    comments: [],
    createdAt: 1,
    ...overrides,
  });
}

describe("post model", () => {
  it("derives product ids from placed elements and pins, in page order", () => {
    const first = createPostPage(
      { version: 1, format: "portrait", backgroundColor: "#fff", backgroundOpacity: 1, showGuides: true, elements: [createProductElement("p-1")] },
      [{ id: "pin-1", productId: "p-2", x: 10, y: 10 }],
    );
    const second = createPostPage(
      { version: 1, format: "portrait", backgroundColor: "#fff", backgroundOpacity: 1, showGuides: true, elements: [createProductElement("p-3")] },
    );

    expect(postProductIds([first, second])).toEqual(["p-1", "p-2", "p-3"]);
  });

  it("de-duplicates product ids across pages and pins", () => {
    const page = createPostPage(
      { version: 1, format: "portrait", backgroundColor: "#fff", backgroundOpacity: 1, showGuides: true, elements: [createProductElement("p-1"), createProductElement("p-1")] },
      [{ id: "pin-1", productId: "p-1", x: 5, y: 5 }],
    );

    expect(postProductIds([page, page])).toEqual(["p-1"]);
  });

  it("always keeps at least one page", () => {
    const post = buildPost({ pages: [] });
    expect(post.pages).toHaveLength(1);
  });

  it("forces every page onto the post format so the carousel cannot jump", () => {
    const landscape = createPostPage(applyEditorialTemplate(["p-1"], "Wide", "catalog"));
    expect(landscape.design.format).toBe("landscape");

    const post = buildPost({ format: "portrait", pages: [createBlankPage("portrait"), landscape] });

    expect(post.pages.map((page) => page.design.format)).toEqual(["portrait", "portrait"]);
  });

  // Relabelling the format without rescaling reinterprets coordinates in a
  // canvas of a different size, pushing elements off the edge.
  it("rescales geometry when coercing a page onto the post format", () => {
    const landscape = EDITORIAL_FORMATS.landscape;
    const portrait = EDITORIAL_FORMATS.portrait;
    const element = { ...createProductElement("p-1"), x: 1100, y: 700, width: 100, height: 100 };
    const page = createPostPage({
      version: 1,
      format: "landscape",
      backgroundColor: "#fff",
      backgroundOpacity: 1,
      showGuides: true,
      elements: [element],
    });

    const post = buildPost({ format: "portrait", pages: [page] });
    const [scaled] = post.pages[0].design.elements;

    expect(scaled.x).toBeCloseTo(1100 * (portrait.width / landscape.width), 5);
    expect(scaled.y).toBeCloseTo(700 * (portrait.height / landscape.height), 5);
    // The element that sat flush to the old canvas edge sits flush to the new one
    // rather than overflowing it.
    expect(scaled.x + scaled.width).toBeCloseTo(portrait.width, 5);
    expect(scaled.y + scaled.height).toBeCloseTo(portrait.height * (800 / landscape.height), 5);
  });

  it("clamps pins to the page and drops duplicate products per page", () => {
    const post = buildPost({
      pages: [createPostPage(createBlankPage("portrait").design, [
        { id: "pin-1", productId: "p-1", x: -40, y: 180 },
        { id: "pin-2", productId: "p-1", x: 20, y: 20 },
        { id: "pin-3", productId: "p-2", x: Number.NaN, y: 50 },
      ])],
    });

    expect(post.pages[0].pins).toEqual([
      { id: "pin-1", productId: "p-1", x: 0, y: 100 },
      { id: "pin-3", productId: "p-2", x: 50, y: 50 },
    ]);
  });

  it("keeps coverPageIndex within bounds", () => {
    expect(buildPost({ coverPageIndex: 7 }).coverPageIndex).toBe(0);
    expect(buildPost({ coverPageIndex: -3 }).coverPageIndex).toBe(0);

    const twoPage = addPostPage(buildPost());
    expect(normalizePost({ ...twoPage, coverPageIndex: 1 }).coverPageIndex).toBe(1);
  });

  it("returns the cover page, falling back to the first", () => {
    const post = addPostPage(buildPost());
    const withCover = normalizePost({ ...post, coverPageIndex: 1 });

    expect(postCoverPage(withCover)).toBe(withCover.pages[1]);
    expect(postCoverPage(normalizePost({ ...post, coverPageIndex: 0 }))).toBe(post.pages[0]);
  });

  it("preserves identity when nothing needs normalizing", () => {
    const post = buildPost();
    expect(normalizePost(post)).toBe(post);
  });
});

describe("scaleDesignToFormat", () => {
  it("returns the same design when the format already matches", () => {
    const design = applyEditorialTemplate(["p-1"], "Same", "catalog");
    expect(scaleDesignToFormat(design, "landscape")).toBe(design);
  });

  it("keeps a full-bleed element full-bleed across formats", () => {
    const from = EDITORIAL_FORMATS.landscape;
    const to = EDITORIAL_FORMATS.portrait;
    const design = {
      version: 1 as const,
      format: "landscape" as const,
      backgroundColor: "#fff",
      backgroundOpacity: 1,
      showGuides: true,
      elements: [{ ...createProductElement("p-1"), x: 0, y: 0, width: from.width, height: from.height }],
    };

    const [element] = scaleDesignToFormat(design, "portrait").elements;

    expect(element.width).toBeCloseTo(to.width, 5);
    expect(element.height).toBeCloseTo(to.height, 5);
  });

  it("moves a drawing's coordinate space with the canvas", () => {
    const design = {
      version: 1 as const,
      format: "landscape" as const,
      backgroundColor: "#fff",
      backgroundOpacity: 1,
      showGuides: true,
      elements: [createDrawingElement("landscape")],
    };

    const [element] = scaleDesignToFormat(design, "square").elements;
    if (element.type !== "drawing") throw new Error("expected a drawing element");

    expect(element.viewBoxWidth).toBe(EDITORIAL_FORMATS.square.width);
    expect(element.viewBoxHeight).toBe(EDITORIAL_FORMATS.square.height);
  });
});

describe("post pages", () => {
  it("adds, duplicates, and reorders pages", () => {
    const post = buildPost();
    expect(isMultiPagePost(post)).toBe(false);

    const two = addPostPage(post);
    expect(two.pages).toHaveLength(2);
    expect(isMultiPagePost(two)).toBe(true);

    const duplicated = duplicatePostPage(two, two.pages[0].id);
    expect(duplicated.pages).toHaveLength(3);
    // The copy sits directly after its source and gets a fresh id.
    expect(duplicated.pages[1].id).not.toBe(two.pages[0].id);

    const reordered = reorderPostPage(duplicated, duplicated.pages[0].id, 2);
    expect(reordered.pages[2].id).toBe(duplicated.pages[0].id);
  });

  it("keeps the cover pointing at the same page after a reorder", () => {
    const post = addPostPage(addPostPage(buildPost()));
    const withCover = normalizePost({ ...post, coverPageIndex: 0 });
    const coverId = withCover.pages[0].id;

    const reordered = reorderPostPage(withCover, coverId, 2);

    expect(reordered.pages[reordered.coverPageIndex].id).toBe(coverId);
  });

  it("refuses to remove the final page", () => {
    const post = buildPost();
    expect(removePostPage(post, post.pages[0].id)).toBe(post);
  });

  it("shifts the cover index down when an earlier page is removed", () => {
    const post = addPostPage(addPostPage(buildPost()));
    const withCover = normalizePost({ ...post, coverPageIndex: 2 });

    const removed = removePostPage(withCover, withCover.pages[0].id);

    expect(removed.pages).toHaveLength(2);
    expect(removed.coverPageIndex).toBe(1);
  });

  it("recomputes derived product ids when a page design changes", () => {
    const post = buildPost();
    const design = {
      ...post.pages[0].design,
      elements: [createProductElement("p-9"), createTextElement("Hello")],
    };

    const updated = updatePostPageDesign(post, post.pages[0].id, design);

    expect(updated.productIds).toEqual(["p-9"]);
  });
});

describe("post pins", () => {
  it("adds, moves, and removes pins without duplicating a product", () => {
    const post = buildPost();
    const pageId = post.pages[0].id;

    const pinned = addPostPin(post, pageId, "p-1", 30, 40);
    expect(pinned.pages[0].pins).toHaveLength(1);
    expect(pinned.productIds).toEqual(["p-1"]);

    // Same product twice on one page is a no-op.
    expect(addPostPin(pinned, pageId, "p-1").pages[0].pins).toHaveLength(1);

    const pinId = pinned.pages[0].pins[0].id;
    const moved = movePostPin(pinned, pageId, pinId, 70, 80);
    expect(moved.pages[0].pins[0]).toMatchObject({ x: 70, y: 80 });

    const removed = removePostPin(moved, pageId, pinId);
    expect(removed.pages[0].pins).toHaveLength(0);
    expect(removed.productIds).toEqual([]);
  });
});

describe("media pages", () => {
  it("places the upload as a locked, full-bleed base layer", () => {
    const page = createMediaPage("idb:image-1", "image", "portrait");
    const [base] = page.design.elements;

    expect(page.design.elements).toHaveLength(1);
    expect(base.type).toBe("image");
    expect(base.locked).toBe(true);
    expect(base.x).toBe(0);
    expect(base.y).toBe(0);
    expect(base.width).toBe(1000);
    expect(base.height).toBe(1250);
  });

  it("uses a video element for video uploads", () => {
    const page = createMediaPage("idb:video-1", "video");
    expect(page.design.elements[0].type).toBe("video");
  });
});

describe("isMediaPage", () => {
  it("recognises an uploaded page: one locked, full-bleed media element", () => {
    expect(isMediaPage(createMediaPage("idb:image-1", "image", "portrait"))).toBe(true);
    expect(isMediaPage(createMediaPage("idb:video-1", "video", "portrait"))).toBe(true);
  });

  it("does not treat a collage as a media page", () => {
    expect(isMediaPage(createBlankPage("portrait"))).toBe(false);
    expect(isMediaPage(createPostPage(applyEditorialTemplate(["p-1"], "T", "catalog")))).toBe(false);
  });

  it("stops being a media page once something is layered on it", () => {
    const page = createMediaPage("idb:image-1", "image", "portrait");
    const withText = { ...page, design: { ...page.design, elements: [...page.design.elements, createTextElement("Hi")] } };

    expect(isMediaPage(withText)).toBe(false);
  });
});

describe("linked products", () => {
  it("includes products linked without a position on the artwork", () => {
    const post = buildPost({ pages: [createMediaPage("idb:video-1", "video", "portrait")], linkedProductIds: ["p-1", "p-2"] });

    expect(post.productIds).toEqual(["p-1", "p-2"]);
    expect(post.pages[0].pins).toEqual([]);
  });

  it("does not duplicate a product that is also pinned or placed", () => {
    const page = createPostPage(applyEditorialTemplate(["p-1"], "T", "fashion-cover"));
    const post = buildPost({ pages: [page], linkedProductIds: ["p-1", "p-9"] });

    expect(post.productIds.filter((id) => id === "p-1")).toHaveLength(1);
    expect(post.productIds).toContain("p-9");
  });
});

describe("media page background", () => {
  it("keeps video on black, where letterboxing is expected", () => {
    expect(createMediaPage("idb:video-1", "video", "portrait").design.backgroundColor).toBe("#000000");
  });

  it("puts a photo on the canvas colour, so rounding reads as a shape", () => {
    // On black, a rounded corner or a zoomed-out crop looked like a defect.
    expect(createMediaPage("idb:image-1", "image", "portrait").design.backgroundColor).not.toBe("#000000");
  });
});

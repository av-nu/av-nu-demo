import { describe, expect, it } from "vitest";

import { applyEditorialTemplate, createProductElement, createTextElement } from "./editorial";
import {
  addPostPage,
  addPostPin,
  createBlankPage,
  createMediaPage,
  createPostPage,
  duplicatePostPage,
  isMultiPagePost,
  movePostPin,
  normalizePost,
  postCoverPage,
  postProductIds,
  removePostPage,
  removePostPin,
  reorderPostPage,
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

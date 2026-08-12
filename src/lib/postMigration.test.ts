import { describe, expect, it } from "vitest";

import { communityLists } from "@/data/faves";
import { buildSpotlightRows } from "@/data/spotlight";
import { editorialProductIds } from "./editorial";
import type { SavedLook } from "./lookEngine";
import type { VideoReview } from "./social/types";
import {
  MISSING_MEDIA_REF,
  communityListToPost,
  communityListsToPosts,
  isMissingMediaRef,
  savedLookToPost,
  spotlightRowToPost,
  videoReviewToPost,
} from "./postMigration";

function buildReview(overrides: Partial<VideoReview> = {}): VideoReview {
  return {
    id: "vr-1",
    authorId: "me",
    caption: "Styled three ways",
    visibility: "public",
    likes: 4,
    comments: [],
    createdAt: 1_700_000_000_000,
    ...overrides,
  };
}

describe("videoReviewToPost", () => {
  it("becomes a single-page media post that keeps its engagement", () => {
    const post = videoReviewToPost(buildReview({ mediaUrl: "/videos/clip.mp4", mediaType: "video", likes: 12 }));

    expect(post.pages).toHaveLength(1);
    expect(post.format).toBe("portrait");
    expect(post.caption).toBe("Styled three ways");
    expect(post.likes).toBe(12);
    expect(post.pages[0].design.elements[0].type).toBe("video");
  });

  // Pins need coordinates the author chose. Nothing records where the product
  // appears in seeded footage, so it is linked instead of pinned somewhere
  // arbitrary.
  it("links a tagged product without pinning it to the footage", () => {
    const post = videoReviewToPost(buildReview({ mediaUrl: "/img.jpg", mediaType: "image", productId: "p-7" }));

    expect(post.pages[0].pins).toEqual([]);
    expect(post.productIds).toEqual(["p-7"]);
  });

  it("flags unrecoverable blob media instead of pretending it still exists", () => {
    const post = videoReviewToPost(buildReview({ mediaUrl: "blob:http://localhost/abc", mediaType: "image" }));
    const [base] = post.pages[0].design.elements;

    expect(base.type).toBe("image");
    if (base.type !== "image") throw new Error("expected an image base layer");
    expect(base.src).toBe(MISSING_MEDIA_REF);
    expect(isMissingMediaRef(base.src)).toBe(true);
  });

  it("keeps hosted media refs untouched", () => {
    const post = videoReviewToPost(buildReview({ mediaUrl: "/videos/keep.mp4", mediaType: "video" }));
    const [base] = post.pages[0].design.elements;
    if (base.type !== "video") throw new Error("expected a video base layer");

    expect(base.src).toBe("/videos/keep.mp4");
  });
});

describe("spotlightRowToPost", () => {
  it("links the featured product plus its supporting grid, unpinned", () => {
    const [row] = buildSpotlightRows(1);
    const post = spotlightRowToPost(row, "c-mara");

    expect(post.authorId).toBe("c-mara");
    expect(post.pages).toHaveLength(1);
    // Labels scattered over video at invented positions describe nothing.
    expect(post.pages[0].pins).toEqual([]);
    expect(post.productIds.length).toBeGreaterThan(1);
    // The featured product leads the derived list.
    expect(post.productIds[0]).toBe(row.featured.id);
  });
});

describe("communityListToPost", () => {
  it("preserves multi-page lists as multi-page posts", () => {
    const multiPage = communityLists.find((list) => list.pages.length > 1);
    if (!multiPage) throw new Error("expected a seeded multi-page list");

    const post = communityListToPost(multiPage);

    expect(post.pages).toHaveLength(multiPage.pages.length);
    expect(post.likes).toBe(multiPage.likes);
    expect(post.caption).toBe(multiPage.caption);
  });

  it("maps a featured list onto the Featured template", () => {
    const featured = communityLists.find((list) => list.format === "featured");
    if (!featured) throw new Error("expected a seeded featured list");

    const post = communityListToPost(featured);

    // The Featured template is portrait and leads with a full-bleed hero.
    expect(post.format).toBe("portrait");
    expect(post.pages[0].design.elements.length).toBeGreaterThan(1);
  });

  it("carries the list's products onto the canvas", () => {
    const list = communityLists.find((item) => item.pages[0].productIds.length > 0);
    if (!list) throw new Error("expected a seeded list with products");

    const post = communityListToPost(list);

    expect(post.productIds.length).toBeGreaterThan(0);
    expect(editorialProductIds(post.pages[0].design).length).toBeGreaterThan(0);
  });

  it("reuses an existing editorial design verbatim rather than regenerating it", () => {
    const source = communityLists[0];
    const design = {
      version: 1 as const,
      format: "square" as const,
      backgroundColor: "#ffffff",
      backgroundOpacity: 1,
      showGuides: true,
      elements: [],
    };
    const list = { ...source, format: "standard" as const, pages: [{ ...source.pages[0], editorial: design }] };

    const post = communityListToPost(list);

    expect(post.format).toBe("square");
    expect(post.pages[0].design.elements).toHaveLength(0);
  });

  it("converts a batch newest-first", () => {
    const posts = communityListsToPosts(communityLists.slice(0, 3), 1_000_000_000);

    expect(posts).toHaveLength(3);
    expect(posts[0].createdAt).toBeGreaterThan(posts[1].createdAt);
    expect(posts[1].createdAt).toBeGreaterThan(posts[2].createdAt);
  });
});

describe("savedLookToPost", () => {
  const baseLook: SavedLook = {
    id: "look-1",
    title: "Coastal dinner",
    description: "Linen and warm neutrals",
    prompt: "coastal dinner",
    selectedProductIds: ["p-1", "p-2"],
    lockedProductIds: [],
    rails: [],
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
  };

  it("maps look pages onto post pages", () => {
    const post = savedLookToPost({
      ...baseLook,
      pages: [
        { id: "lp-1", productIds: ["p-1"] },
        { id: "lp-2", productIds: ["p-2"] },
      ],
    });

    expect(post.pages).toHaveLength(2);
    expect(post.caption).toBe("Linen and warm neutrals");
    expect(post.authorId).toBe("me");
    // Migrated drafts should not become public without the author choosing to.
    expect(post.visibility).toBe("private");
  });

  it("falls back to the look's selected products when it has no pages", () => {
    const post = savedLookToPost(baseLook);

    expect(post.pages).toHaveLength(1);
    expect(post.productIds.length).toBeGreaterThan(0);
  });

  it("preserves look media as canvas elements", () => {
    const post = savedLookToPost({
      ...baseLook,
      pages: [{ id: "lp-1", productIds: ["p-1"], media: [{ id: "m-1", type: "image", src: "/uploads/a.jpg", name: "Shot" }] }],
    });

    const images = post.pages[0].design.elements.filter((element) => element.type === "image");
    expect(images).toHaveLength(1);
  });

  it("flags look media that was only a blob URL", () => {
    const post = savedLookToPost({
      ...baseLook,
      pages: [{ id: "lp-1", productIds: [], media: [{ id: "m-1", type: "image", src: "blob:http://localhost/x", name: "Shot" }] }],
    });

    const [image] = post.pages[0].design.elements.filter((element) => element.type === "image");
    if (!image || image.type !== "image") throw new Error("expected an image element");
    expect(image.src).toBe(MISSING_MEDIA_REF);
  });
});

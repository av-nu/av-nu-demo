import { describe, expect, it } from "vitest";

import { seedPosts, getSeedPost } from "./posts";
import { normalizePost, isMediaPage } from "@/lib/post";

describe("seed posts", () => {
  it("authors several posts with unique ids", () => {
    expect(seedPosts.length).toBeGreaterThanOrEqual(4);
    expect(new Set(seedPosts.map((post) => post.id)).size).toBe(seedPosts.length);
  });

  it("is already normalized, so the feed never has to repair it", () => {
    for (const post of seedPosts) expect(normalizePost(post)).toBe(post);
  });

  it("keeps every post shoppable", () => {
    for (const post of seedPosts) expect(post.productIds.length).toBeGreaterThan(0);
  });

  it("holds one format across every page of a post", () => {
    for (const post of seedPosts) {
      for (const page of post.pages) expect(page.design.format).toBe(post.format);
    }
  });

  it("demonstrates the composer's range: multi-page, stickers, drawing, and tags", () => {
    const elementTypes = new Set(seedPosts.flatMap((post) => post.pages.flatMap((page) => page.design.elements.map((element) => element.type))));

    expect(seedPosts.some((post) => post.pages.length > 1)).toBe(true);
    expect(elementTypes.has("sticker")).toBe(true);
    expect(elementTypes.has("drawing")).toBe(true);
    expect(elementTypes.has("text")).toBe(true);
    expect(seedPosts.some((post) => post.pages.some((page) => page.pins.length > 0))).toBe(true);
  });

  it("orders newest first and attributes each post to a real author", () => {
    const times = seedPosts.map((post) => post.createdAt);
    expect([...times].sort((a, b) => b - a)).toEqual(times);
    for (const post of seedPosts) expect(post.authorId).toMatch(/^[cfs]-/);
  });

  it("looks up a post by id", () => {
    expect(getSeedPost(seedPosts[0].id)?.id).toBe(seedPosts[0].id);
    expect(getSeedPost("nope")).toBeUndefined();
  });

  it("does not mistake a collage for a tagged photo", () => {
    const collage = seedPosts.find((post) => post.id === "seed-post-collage");
    expect(collage && isMediaPage(collage.pages[0])).toBe(false);
  });
});

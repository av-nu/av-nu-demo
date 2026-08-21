import { describe, expect, it } from "vitest";

import { createBlankPage, normalizePost, type Post } from "@/lib/post";
import { buildSeedState } from "./seed";
import { canViewPost, resolveSocialUser } from "./selectors";

function post(visibility: Post["visibility"]): Post {
  return normalizePost({
    id: `visibility-${visibility}`,
    authorId: "c-mara",
    pages: [createBlankPage("portrait")],
    format: "portrait",
    coverPageIndex: 0,
    productIds: [],
    caption: "",
    visibility,
    likes: 0,
    comments: [],
    createdAt: 1,
  });
}

describe("social visibility selectors", () => {
  it("resolves seeded profile data without a Member fallback", () => {
    const user = resolveSocialUser("c-mara", buildSeedState());
    expect(user).toMatchObject({ name: "Mara Ellis", handle: "maraellis" });
  });

  it("allows public and connected Friends posts, but not private posts", () => {
    const state = buildSeedState();
    expect(canViewPost(post("public"), "me", state)).toBe(true);
    expect(canViewPost(post("inner-circle"), "me", state)).toBe(true);
    expect(canViewPost(post("private"), "me", state)).toBe(false);
  });
});

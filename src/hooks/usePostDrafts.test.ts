import { describe, expect, it } from "vitest";

import { createBlankPage, normalizePost, type Post } from "@/lib/post";
import { isMeaningfulPostDraft } from "./usePostDrafts";

function emptyPost(): Post {
  return normalizePost({
    id: "draft",
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
  });
}

describe("post drafts", () => {
  it("does not create empty drafts", () => {
    expect(isMeaningfulPostDraft(emptyPost(), "")).toBe(false);
  });

  it("keeps a title, caption, product, or real canvas edit", () => {
    expect(isMeaningfulPostDraft(emptyPost(), "Weekend edit")).toBe(true);
    expect(isMeaningfulPostDraft({ ...emptyPost(), caption: "A note" })).toBe(true);
    expect(isMeaningfulPostDraft({ ...emptyPost(), productIds: ["p-1"] })).toBe(true);
  });
});

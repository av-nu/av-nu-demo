"use client";

import { useCallback } from "react";

import { useLocalStorage } from "./useLocalStorage";
import { normalizePost, type Post } from "@/lib/post";

const DRAFTS_KEY = "avnu-post-drafts";

export type PostDraft = {
  id: string;
  post: Post;
  title: string;
  createdAt: number;
  updatedAt: number;
  activePageIndex: number;
};

export function makePostDraftId() {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function isMeaningfulPostDraft(post: Post, title = "") {
  if (title.trim() || post.caption.trim() || post.productIds.length > 0) return true;
  return post.pages.some((page) => page.pins.length > 0 || page.design.elements.some((element) => element.type !== "placeholder"));
}

export function usePostDrafts() {
  const [drafts, setDrafts, isHydrated] = useLocalStorage<PostDraft[]>(DRAFTS_KEY, []);

  const saveDraft = useCallback((draft: PostDraft) => {
    if (!isMeaningfulPostDraft(draft.post, draft.title)) return;
    const normalized: PostDraft = { ...draft, post: normalizePost(draft.post), updatedAt: draft.updatedAt || Date.now() };
    setDrafts((current) => {
      const existing = current.some((item) => item.id === normalized.id);
      return existing
        ? current.map((item) => (item.id === normalized.id ? normalized : item)).sort((a, b) => b.updatedAt - a.updatedAt)
        : [normalized, ...current].sort((a, b) => b.updatedAt - a.updatedAt);
    });
  }, [setDrafts]);

  const removeDraft = useCallback((id: string) => {
    setDrafts((current) => current.filter((draft) => draft.id !== id));
  }, [setDrafts]);

  const getDraft = useCallback((id: string) => drafts.find((draft) => draft.id === id), [drafts]);

  return { drafts, isHydrated, saveDraft, removeDraft, getDraft };
}

export { DRAFTS_KEY };

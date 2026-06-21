"use client";

import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { type ListComment } from "@/data/faves";
import { currentUser } from "@/data/social";

const SOCIAL_KEY = "avnu-list-social";

type SocialState = {
  liked: string[]; // listIds the current user has liked
  saved: string[]; // community listIds the user has saved (copied)
  comments: Record<string, ListComment[]>; // local comments by listId
};

const EMPTY: SocialState = { liked: [], saved: [], comments: {} };

export function useListSocial() {
  const [state, setState, isHydrated] = useLocalStorage<SocialState>(
    SOCIAL_KEY,
    EMPTY,
  );

  const isLiked = useCallback(
    (listId: string) => state.liked.includes(listId),
    [state.liked],
  );

  const toggleLike = useCallback(
    (listId: string) => {
      setState((prev) => ({
        ...prev,
        liked: prev.liked.includes(listId)
          ? prev.liked.filter((id) => id !== listId)
          : [...prev.liked, listId],
      }));
    },
    [setState],
  );

  const isSaved = useCallback(
    (listId: string) => state.saved.includes(listId),
    [state.saved],
  );

  const markSaved = useCallback(
    (listId: string) => {
      setState((prev) =>
        prev.saved.includes(listId)
          ? prev
          : { ...prev, saved: [...prev.saved, listId] },
      );
    },
    [setState],
  );

  const getLocalComments = useCallback(
    (listId: string) => state.comments[listId] ?? [],
    [state.comments],
  );

  const addComment = useCallback(
    (listId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const comment: ListComment = {
        id: `lc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        authorName: currentUser.name,
        authorInitials: currentUser.initials,
        authorColor: "bg-burgundy",
        text: trimmed,
        createdAt: Date.now(),
      };
      setState((prev) => ({
        ...prev,
        comments: {
          ...prev.comments,
          [listId]: [...(prev.comments[listId] ?? []), comment],
        },
      }));
    },
    [setState],
  );

  return {
    isHydrated,
    isLiked,
    toggleLike,
    isSaved,
    markSaved,
    getLocalComments,
    addComment,
  };
}

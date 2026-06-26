"use client";

import { useCallback, useMemo } from "react";

import { socialService } from "@/lib/social";
import type { NewVideoReview, VideoReview } from "@/lib/social";
import { getCommunityVideoReviewsByAuthor } from "@/data/videoReviews";
import { useSocialStore } from "./useSocialStore";

/**
 * The current user's authored video reviews, plus lookups for any author's
 * reviews (seeded community + the current user's own).
 */
export function useVideoReviews() {
  const { state, isHydrated } = useSocialStore();

  const myReviews = useMemo<VideoReview[]>(
    () => [...state.videoReviews].sort((a, b) => b.createdAt - a.createdAt),
    [state.videoReviews],
  );

  const reviewsByAuthor = useCallback(
    (authorId: string): VideoReview[] => {
      if (authorId === "me") return myReviews;
      return getCommunityVideoReviewsByAuthor(authorId);
    },
    [myReviews],
  );

  const addVideoReview = useCallback(
    (input: NewVideoReview) => socialService.addVideoReview(input),
    [],
  );
  const updateVideoReview = useCallback(
    (id: string, patch: Partial<VideoReview>) =>
      socialService.updateVideoReview(id, patch),
    [],
  );
  const deleteVideoReview = useCallback(
    (id: string) => socialService.deleteVideoReview(id),
    [],
  );

  return {
    isHydrated,
    myReviews,
    reviewsByAuthor,
    addVideoReview,
    updateVideoReview,
    deleteVideoReview,
  };
}

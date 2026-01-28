"use client";

import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

const RATINGS_KEY = "avnu-user-ratings";

type RatingsMap = Record<string, number>;

export function useUserRatings() {
  const [ratings, setRatings] = useLocalStorage<RatingsMap>(RATINGS_KEY, {});

  const getUserRating = useCallback(
    (productId: string): number | null => ratings[productId] ?? null,
    [ratings],
  );

  const setUserRating = useCallback(
    (productId: string, rating: number) => {
      const clampedRating = Math.max(0, Math.min(5, Math.round(rating * 2) / 2));
      setRatings((prev) => ({ ...prev, [productId]: clampedRating }));
    },
    [setRatings],
  );

  return { ratings, getUserRating, setUserRating };
}

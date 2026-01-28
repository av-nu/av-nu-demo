"use client";

import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

const FAVORITES_KEY = "avnu-favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<string[]>(FAVORITES_KEY, []);

  const isFavorite = useCallback(
    (productId: string) => favorites.includes(productId),
    [favorites],
  );

  const toggleFavorite = useCallback(
    (productId: string) => {
      setFavorites((prev) =>
        prev.includes(productId)
          ? prev.filter((id) => id !== productId)
          : [...prev, productId],
      );
    },
    [setFavorites],
  );

  return { favorites, isFavorite, toggleFavorite };
}

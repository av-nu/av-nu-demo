"use client";

import { useCallback, useMemo } from "react";

import { normalizeSavedLook, type SavedLook } from "@/lib/lookEngine";
import { useLocalStorage } from "./useLocalStorage";

const SAVED_LOOKS_KEY = "avnu-saved-looks";

export function useSavedLooks() {
  const [storedLooks, setLooks, isHydrated] = useLocalStorage<SavedLook[]>(SAVED_LOOKS_KEY, []);
  const looks = useMemo(() => storedLooks.map(normalizeSavedLook), [storedLooks]);

  const saveLook = useCallback(
    (look: SavedLook) => {
      setLooks((current) => {
        const next = normalizeSavedLook({ ...look, updatedAt: Date.now() });
        const existing = current.findIndex((item) => item.id === look.id);
        if (existing < 0) return [next, ...current];
        return current.map((item) => (item.id === look.id ? next : item));
      });
    },
    [setLooks],
  );

  const getLook = useCallback(
    (id: string) => looks.find((look) => look.id === id),
    [looks],
  );

  const removeLook = useCallback(
    (id: string) => setLooks((current) => current.filter((look) => look.id !== id)),
    [setLooks],
  );

  const seedLookbook = useCallback(
    (seed: SavedLook[]) => setLooks((current) => {
      const seedPrompts = new Set(seed.map((look) => look.prompt));
      const refreshedSeed = seed.map((look, index) => ({ ...look, id: `seed-look-${index + 1}`, seedVersion: 2 }));
      const userLooks = current.filter((look) => look.seedVersion !== undefined ? look.seedVersion !== 2 : !seedPrompts.has(look.prompt));
      return [...refreshedSeed, ...userLooks];
    }),
    [setLooks],
  );

  return { looks, isHydrated, saveLook, getLook, removeLook, seedLookbook };
}

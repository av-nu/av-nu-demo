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
    (seed: SavedLook[]) => setLooks((current) => (current.length >= seed.length ? current : [...current, ...seed.slice(0, seed.length - current.length)])),
    [setLooks],
  );

  return { looks, isHydrated, saveLook, getLook, removeLook, seedLookbook };
}

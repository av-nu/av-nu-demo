"use client";

import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

const INTERESTS_KEY = "avnu-interests";

export function useInterests() {
  const [selected, setSelected, isHydrated] = useLocalStorage<string[]>(
    INTERESTS_KEY,
    [],
  );

  const isSelected = useCallback(
    (id: string) => selected.includes(id),
    [selected],
  );

  const toggle = useCallback(
    (id: string) => {
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    },
    [setSelected],
  );

  return { selected, setSelected, isSelected, toggle, isHydrated };
}

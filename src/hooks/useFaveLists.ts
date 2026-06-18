"use client";

import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import {
  type FaveList,
  type FaveListType,
  type FaveVisibility,
} from "@/data/faves";

const LISTS_KEY = "avnu-fave-lists";

function makeId() {
  return `list-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useFaveLists() {
  const [lists, setLists, isHydrated] = useLocalStorage<FaveList[]>(LISTS_KEY, []);

  const createList = useCallback(
    (name: string, type: FaveListType, initialProductId?: string): string => {
      const id = makeId();
      const newList: FaveList = {
        id,
        name: name.trim() || "Untitled list",
        type,
        productIds: initialProductId ? [initialProductId] : [],
        createdAt: Date.now(),
        visibility: "private",
        sharedWith: [],
      };
      setLists((prev) => [newList, ...prev]);
      return id;
    },
    [setLists],
  );

  const deleteList = useCallback(
    (id: string) => {
      setLists((prev) => prev.filter((l) => l.id !== id));
    },
    [setLists],
  );

  const updateList = useCallback(
    (id: string, patch: Partial<Omit<FaveList, "id" | "createdAt">>) => {
      setLists((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      );
    },
    [setLists],
  );

  const toggleProductInList = useCallback(
    (listId: string, productId: string) => {
      setLists((prev) =>
        prev.map((l) => {
          if (l.id !== listId) return l;
          const has = l.productIds.includes(productId);
          return {
            ...l,
            productIds: has
              ? l.productIds.filter((p) => p !== productId)
              : [...l.productIds, productId],
          };
        }),
      );
    },
    [setLists],
  );

  const removeProductEverywhere = useCallback(
    (productId: string) => {
      setLists((prev) =>
        prev.map((l) => ({
          ...l,
          productIds: l.productIds.filter((p) => p !== productId),
        })),
      );
    },
    [setLists],
  );

  const setVisibility = useCallback(
    (id: string, visibility: FaveVisibility, sharedWith: string[] = []) => {
      setLists((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, visibility, sharedWith } : l,
        ),
      );
    },
    [setLists],
  );

  const isInList = useCallback(
    (listId: string, productId: string) =>
      lists.find((l) => l.id === listId)?.productIds.includes(productId) ?? false,
    [lists],
  );

  const listsForProduct = useCallback(
    (productId: string) => lists.filter((l) => l.productIds.includes(productId)),
    [lists],
  );

  const getList = useCallback(
    (id: string) => lists.find((l) => l.id === id),
    [lists],
  );

  return {
    lists,
    isHydrated,
    createList,
    deleteList,
    updateList,
    toggleProductInList,
    removeProductEverywhere,
    setVisibility,
    isInList,
    listsForProduct,
    getList,
  };
}

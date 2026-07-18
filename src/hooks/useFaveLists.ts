"use client";

import { useCallback, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { type FaveList, type FaveVisibility, type ListPage } from "@/data/faves";
import { DEFAULT_TEMPLATE, type TemplateId } from "@/data/listTemplates";
import type { SavedLook } from "@/lib/lookEngine";

const LISTS_KEY = "avnu-fave-lists";
export const DEFAULT_PRODUCT_LIST_NAME = "My Favorite Products";

function makeId() {
  return `list-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function makePageId() {
  return `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useFaveLists() {
  const [lists, setLists, isHydrated] = useLocalStorage<FaveList[]>(LISTS_KEY, []);

  useEffect(() => {
    if (!isHydrated) return;
    const legacyFavorites = (() => {
      try {
        return JSON.parse(window.localStorage.getItem("avnu-favorites") ?? "[]") as string[];
      } catch {
        return [];
      }
    })();
    setLists((current) => {
      const existing = current.find((list) => list.name === DEFAULT_PRODUCT_LIST_NAME);
      if (!existing) {
        return [{
          id: "my-favorite-products",
          name: DEFAULT_PRODUCT_LIST_NAME,
          productIds: [...new Set(legacyFavorites)],
          createdAt: Date.now(),
          visibility: "private",
          sharedWith: [],
          template: DEFAULT_TEMPLATE,
        }, ...current];
      }
      const mergedProductIds = [...new Set([...existing.productIds, ...legacyFavorites])];
      if (mergedProductIds.length === existing.productIds.length) return current;
      return current.map((list) => list.id === existing.id ? { ...list, productIds: mergedProductIds } : list);
    });
  }, [isHydrated, setLists]);

  const createList = useCallback(
    (name: string, initialProductId?: string): string => {
      const id = makeId();
      const newList: FaveList = {
        id,
        name: name.trim() || "Untitled list",
        productIds: initialProductId ? [initialProductId] : [],
        createdAt: Date.now(),
        visibility: "private",
        sharedWith: [],
        template: DEFAULT_TEMPLATE,
      };
      setLists((prev) => [newList, ...prev]);
      return id;
    },
    [setLists],
  );

  const createListWithProducts = useCallback(
    (name: string, productIds: string[], template: TemplateId): string => {
      const id = makeId();
      const newList: FaveList = {
        id,
        name: name.trim() || "Untitled list",
        productIds: [...productIds],
        createdAt: Date.now(),
        visibility: "private",
        sharedWith: [],
        template,
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
      setLists((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    },
    [setLists],
  );

  const setTemplate = useCallback(
    (id: string, template: TemplateId) => {
      setLists((prev) => prev.map((l) => (l.id === id ? { ...l, template } : l)));
    },
    [setLists],
  );

  const setProductIds = useCallback(
    (id: string, productIds: string[]) => {
      setLists((prev) => prev.map((l) => (l.id === id ? { ...l, productIds } : l)));
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

  const upsertLookbookPost = useCallback(
    (look: SavedLook, visibility: FaveVisibility, sharedWith: string[] = []) => {
      const id = look.postListId ?? `lookbook-${look.id}`;
      const template: TemplateId = look.layout === "editorial" ? 1 : 4;
      setLists((prev) => {
        const lookPages = look.pages?.length ? look.pages : [{ id: `page-${look.id}`, productIds: look.selectedProductIds }];
        const productIds = [...new Set(lookPages.flatMap((page) => page.productIds))];
        const pages = visibility === "public" ? lookPages.map((page) => ({ id: page.id, template, productIds: page.productIds, editorial: look.layout === "editorial" ? page.editorial : undefined })) : [];
        const post: FaveList = {
          id,
          name: look.title,
          productIds,
          createdAt: look.createdAt,
          visibility,
          sharedWith,
          template,
          caption: look.description,
          lookbookId: look.id,
          pages,
        };
        const exists = prev.some((list) => list.id === id);
        return exists ? prev.map((list) => (list.id === id ? { ...list, ...post } : list)) : [post, ...prev];
      });
      return id;
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
        prev.map((l) => {
          if (l.id !== id) return l;
          let pages = l.pages ?? [];
          // Initialize a first carousel page when publishing publicly.
          if (visibility === "public" && pages.length === 0) {
            pages = [
              {
                id: makePageId(),
                template: l.template,
                productIds: l.productIds.slice(0, Math.max(1, l.productIds.length)),
              },
            ];
          }
          return { ...l, visibility, sharedWith, pages };
        }),
      );
    },
    [setLists],
  );

  const setCaption = useCallback(
    (id: string, caption: string) => {
      setLists((prev) => prev.map((l) => (l.id === id ? { ...l, caption } : l)));
    },
    [setLists],
  );

  // --- Public carousel page operations --------------------------------------

  const addPage = useCallback(
    (id: string) => {
      setLists((prev) =>
        prev.map((l) => {
          if (l.id !== id) return l;
          const pages = l.pages ?? [];
          return {
            ...l,
            pages: [...pages, { id: makePageId(), template: l.template, productIds: [] }],
          };
        }),
      );
    },
    [setLists],
  );

  const removePage = useCallback(
    (id: string, pageId: string) => {
      setLists((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, pages: (l.pages ?? []).filter((p) => p.id !== pageId) } : l,
        ),
      );
    },
    [setLists],
  );

  const updatePage = useCallback(
    (id: string, pageId: string, patch: Partial<Omit<ListPage, "id">>) => {
      setLists((prev) =>
        prev.map((l) =>
          l.id === id
            ? {
                ...l,
                pages: (l.pages ?? []).map((p) =>
                  p.id === pageId ? { ...p, ...patch } : p,
                ),
              }
            : l,
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
    createListWithProducts,
    deleteList,
    updateList,
    setTemplate,
    setProductIds,
    toggleProductInList,
    upsertLookbookPost,
    removeProductEverywhere,
    setVisibility,
    setCaption,
    addPage,
    removePage,
    updatePage,
    isInList,
    listsForProduct,
    getList,
  };
}

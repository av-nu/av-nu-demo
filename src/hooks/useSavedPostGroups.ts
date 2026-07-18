"use client";

import { useCallback, useEffect } from "react";

import { useLocalStorage } from "@/hooks/useLocalStorage";

export type SavedPostGroup = {
  id: string;
  name: string;
  postIds: string[];
};

const GROUPS_KEY = "avnu-saved-post-groups";
export const DEFAULT_SAVED_POST_GROUP_NAME = "Saved Posts";

function makeGroupId() {
  return `saved-posts-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useSavedPostGroups() {
  const [groups, setGroups, isHydrated] = useLocalStorage<SavedPostGroup[]>(GROUPS_KEY, []);

  useEffect(() => {
    if (!isHydrated) return;
    const legacyIds = (() => {
      try {
        return JSON.parse(window.localStorage.getItem("avnu-saved-posts") ?? "[]") as string[];
      } catch {
        return [];
      }
    })();
    setGroups((current) => {
      const defaultGroup = current.find((group) => group.id === "saved-posts-default") ?? current.find((group) => group.name === DEFAULT_SAVED_POST_GROUP_NAME);
      if (!defaultGroup) {
        return [{ id: "saved-posts-default", name: DEFAULT_SAVED_POST_GROUP_NAME, postIds: [...new Set(legacyIds)] }, ...current];
      }
      const merged = [...new Set([...defaultGroup.postIds, ...legacyIds])];
      if (merged.length === defaultGroup.postIds.length) return current;
      return current.map((group) => group.id === defaultGroup.id ? { ...group, postIds: merged } : group);
    });
  }, [isHydrated, setGroups]);

  const createGroup = useCallback((name: string, postId?: string) => {
    const group: SavedPostGroup = { id: makeGroupId(), name: name.trim() || "Untitled group", postIds: postId ? [postId] : [] };
    setGroups((current) => [group, ...current]);
    return group.id;
  }, [setGroups]);

  const addToGroup = useCallback((groupId: string, postId: string) => {
    setGroups((current) => current.map((group) => group.id === groupId && !group.postIds.includes(postId) ? { ...group, postIds: [...group.postIds, postId] } : group));
  }, [setGroups]);

  const removeFromGroup = useCallback((groupId: string, postId: string) => {
    setGroups((current) => current.map((group) => group.id === groupId ? { ...group, postIds: group.postIds.filter((id) => id !== postId) } : group));
  }, [setGroups]);

  const isInGroup = useCallback((groupId: string, postId: string) => Boolean(groups.find((group) => group.id === groupId)?.postIds.includes(postId)), [groups]);

  const saveToDefault = useCallback((postId: string) => {
    const defaultGroup = groups.find((group) => group.name === DEFAULT_SAVED_POST_GROUP_NAME);
    if (defaultGroup) {
      if (defaultGroup.postIds.includes(postId)) return true;
      addToGroup(defaultGroup.id, postId);
      return false;
    }
    createGroup(DEFAULT_SAVED_POST_GROUP_NAME, postId);
    return false;
  }, [addToGroup, createGroup, groups]);

  return { groups, isHydrated, createGroup, addToGroup, removeFromGroup, isInGroup, saveToDefault };
}

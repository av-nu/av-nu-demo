import { makeMediaKey, managedMediaKey, toManagedMediaRef, type MediaKind, type MediaStore } from "./MediaStore";

/**
 * In-memory {@link MediaStore}. Used by tests and as the server-side fallback,
 * where IndexedDB does not exist. Nothing is persisted across a reload.
 */
export function createMemoryMediaStore(): MediaStore & { size(): number } {
  const entries = new Map<string, Blob>();
  const urls = new Set<string>();

  return {
    async put(blob: Blob, kind: MediaKind) {
      const key = makeMediaKey(kind);
      entries.set(key, blob);
      return toManagedMediaRef(key);
    },

    async resolve(ref: string) {
      const key = managedMediaKey(ref);
      if (!key) return undefined;
      const blob = entries.get(key);
      if (!blob) return undefined;
      if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return undefined;
      const url = URL.createObjectURL(blob);
      urls.add(url);
      return url;
    },

    release(url: string) {
      if (!urls.has(url)) return;
      urls.delete(url);
      URL.revokeObjectURL(url);
    },

    async remove(ref: string) {
      const key = managedMediaKey(ref);
      if (key) entries.delete(key);
    },

    size() {
      return entries.size;
    },
  };
}

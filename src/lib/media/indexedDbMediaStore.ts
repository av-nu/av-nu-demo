import { makeMediaKey, managedMediaKey, toManagedMediaRef, type MediaKind, type MediaStore } from "./MediaStore";

// IndexedDB-backed media storage for the demo. Chosen over localStorage data
// URLs for two reasons:
//   1. localStorage caps around 5 MB, and a multi-page collage with photos can
//      approach 1 MB — publishing would throw after a couple of posts.
//   2. It survives a reload, fixing the long-standing bug where uploaded media
//      vanished because it was only held as a `blob:` URL.

const DB_NAME = "avnu-media";
const DB_VERSION = 1;
const STORE_NAME = "media";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB unavailable"));
  });
}

function transact<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDatabase().then((db) => new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const request = run(tx.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
    tx.oncomplete = () => db.close();
  }));
}

export function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

export function createIndexedDbMediaStore(): MediaStore {
  const urls = new Set<string>();

  return {
    async put(blob: Blob, kind: MediaKind) {
      const key = makeMediaKey(kind);
      await transact("readwrite", (store) => store.put(blob, key));
      return toManagedMediaRef(key);
    },

    async resolve(ref: string) {
      const key = managedMediaKey(ref);
      if (!key) return undefined;
      try {
        const blob = await transact<Blob | undefined>("readonly", (store) => store.get(key));
        if (!blob) return undefined;
        const url = URL.createObjectURL(blob);
        urls.add(url);
        return url;
      } catch {
        return undefined;
      }
    },

    release(url: string) {
      if (!urls.has(url)) return;
      urls.delete(url);
      URL.revokeObjectURL(url);
    },

    async remove(ref: string) {
      const key = managedMediaKey(ref);
      if (!key) return;
      try {
        await transact("readwrite", (store) => store.delete(key));
      } catch {
        // Nothing to clean up if the database is unavailable.
      }
    },
  };
}
